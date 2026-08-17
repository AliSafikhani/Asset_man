"""
Professional module for estimating the remaining life of power transformers.
Based on CIGRE Technical Brochure 323 (2007).

Main methods:
- Furan (2-FAL) -> DP estimation (empirical models)
- Ekenstam kinetic model for paper aging
- Optional historical A-factor calibration
- Condition classification
- Remaining-life estimation

Important distinctions:
1. Furan-to-DP relationships are empirical (CIGRE TF 15.01.03).
2. Kinetic aging calculation uses Ekenstam/Arrhenius.
3. Historical A-factor calibration is an assumed method, not a measured constant.
4. 98°C reference temperature is a design scenario, not a real-time prediction.

References:
- DP thresholds: CIGRE 323, Section 7.4.1
- DP=200 end-of-life: CIGRE 323, Section 4.2, Figure 16
- Default A=1e8: CIGRE 323, Section 4.6.1 (dry, oxygen-free conditions)
- 98°C design hot-spot: CIGRE 323, Section 1.3 and 4.1
"""

import numpy as np
import warnings
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any, List, Callable, Tuple


# ===========================================================================
# Configuration
# ===========================================================================

@dataclass
class CIGREConfig:
    """
    Configuration for transformer insulation-life estimation.

    Default values are based on CIGRE Brochure 323 (2007):
        - dp_initial: 1100 (average of 1200 new paper and 1000 after factory drying)
        - dp_end_of_life: 200 (Section 4.2, Figure 16)
        - reference_temperature: 98°C (Section 1.3, 4.1)
        - a_factor: None (default 1e8 from Section 4.6.1 if use_historical_a is False)
        - activation_energy: 111,000 J/mol (average of hydrolysis 115-130 kJ/mol)
        - threshold_new, moderate, extensive: from Section 7.4.1
    """

    # Initial DP after manufacture / drying
    dp_initial: float = 1100.0

    # End-of-life DP (CIGRE 323, Section 4.2, Figure 16)
    dp_end_of_life: float = 200.0

    # Reference hot-spot temperature (CIGRE 323, Section 1.3, 4.1)
    reference_temperature: float = 98.0  # °C

    # Pre-exponential factor A [h^-1] (default 1e8 from Section 4.6.1)
    # If None and use_historical_a=False, 1e8 is used as fallback.
    a_factor: Optional[float] = None

    # Activation energy [J/mol] (111 kJ/mol average)
    activation_energy: float = 111000.0

    # Assumed historical average temperature (for calibration, if no data)
    historical_avg_temp: float = 90.0  # °C

    # Use historical DP + age to calibrate A (assumption, not measurement)
    use_historical_a: bool = True

    # DP condition thresholds (CIGRE 323, Section 7.4.1)
    threshold_new: float = 900.0
    threshold_moderate: float = 350.0
    threshold_extensive: float = 250.0


# ============================================================================
# Main Estimator
# ============================================================================

class CIGRETransformerLifeEstimator:
    """
    Main class for transformer remaining-life estimation.

    This class separates:
        1. Empirical Furan → DP conversion (4 models)
        2. Kinetic aging calculation (Ekenstam/Arrhenius)
        3. Condition assessment (CIGRE 323, Section 7.4.1)

    The historical A-factor calibration is an assumption based on the
    transformer's age and current DP. It should not be interpreted as
    a directly measured material constant.
    """

    # ------------------------------------------------------------------------
    # Furan -> DP lookup tables (CIGRE TF 15.01.03)
    # ------------------------------------------------------------------------

    _CHENDONG_TABLE = np.array([
        [0.01, 1003],
        [0.10, 717],
        [0.50, 517],
        [1.00, 431],
        [2.50, 318],
        [5.00, 232],
        [10.00, 146],
        [15.00, 95]
    ], dtype=float)

    _STEBBINS_TABLE = np.array([
        [0.01, 1316],
        [0.10, 1031],
        [0.50, 831],
        [1.00, 745],
        [2.50, 631],
        [5.00, 545],
        [10.00, 459],
        [15.00, 409]
    ], dtype=float)

    _DEPABLO_TABLE = np.array([
        [0.01, 806],
        [0.10, 798],
        [0.50, 763],
        [1.00, 724],
        [2.50, 628],
        [5.00, 514],
        [10.00, 378],
        [15.00, 298]
    ], dtype=float)

    # Pre-calculated logarithms for faster interpolation
    _CHENDONG_LOG_FURAN = np.log(_CHENDONG_TABLE[:, 0])
    _CHENDONG_LOG_DP = np.log(_CHENDONG_TABLE[:, 1])

    _STEBBINS_LOG_FURAN = np.log(_STEBBINS_TABLE[:, 0])
    _STEBBINS_LOG_DP = np.log(_STEBBINS_TABLE[:, 1])

    _DEPABLO_LOG_FURAN = np.log(_DEPABLO_TABLE[:, 0])
    _DEPABLO_LOG_DP = np.log(_DEPABLO_TABLE[:, 1])

    # ------------------------------------------------------------------------
    # Initialization
    # ------------------------------------------------------------------------

    def __init__(self, config: Optional[CIGREConfig] = None):

        self.config = config or CIGREConfig()

        self._dp0 = float(self.config.dp_initial)
        self._dp_eol = float(self.config.dp_end_of_life)

        self._T_ref = (
            float(self.config.reference_temperature) + 273.15
        )

        self._T_hist = (
            float(self.config.historical_avg_temp) + 273.15
        )

        self._Ea = float(self.config.activation_energy)

        self._R = 8.314462618  # J/mol/K

        self._use_historical_a = bool(
            self.config.use_historical_a
        )

        self._a_factor = self.config.a_factor

        self._thresholds = {
            "new": float(self.config.threshold_new),
            "moderate": float(self.config.threshold_moderate),
            "extensive": float(self.config.threshold_extensive),
            "end_of_life": self._dp_eol
        }

        # Basic validation
        if self._dp0 <= self._dp_eol:
            raise ValueError(
                "dp_initial must be greater than dp_end_of_life."
            )

        if self._Ea <= 0:
            raise ValueError(
                "activation_energy must be greater than zero."
            )

        if self._T_ref <= 0 or self._T_hist <= 0:
            raise ValueError(
                "Temperatures must be above absolute zero."
            )

    # =========================================================================
    # 1. Furan Models (CIGRE TF 15.01.03)
    # =========================================================================

    @staticmethod
    def _log_interpolate(
        ffa_ppm: float,
        table: np.ndarray,
        log_furan: np.ndarray,
        log_dp: np.ndarray
    ) -> float:
        """
        Log-log interpolation for empirical furan-to-DP tables.

        Issues warnings for concentrations outside the calibration range.
        """

        if ffa_ppm < 0:
            raise ValueError(
                "2-FAL concentration must be non-negative."
            )

        furan = table[:, 0]
        dp = table[:, 1]

        # Below table range (calibration minimum)
        if ffa_ppm <= furan[0]:
            warnings.warn(
                f"2-FAL concentration ({ffa_ppm:.3f} ppm) is below the "
                "calibration range (0.01 ppm). Clamping to table minimum.",
                UserWarning
            )
            return float(dp[0])

        # Above table range (calibration maximum)
        if ffa_ppm >= furan[-1]:
            warnings.warn(
                f"2-FAL concentration ({ffa_ppm:.3f} ppm) is above the "
                "calibration range (15 ppm). Clamping to table maximum.",
                UserWarning
            )
            return float(dp[-1])

        # Log-log interpolation (preserves power-law relationship)
        log_dp_value = np.interp(
            np.log(ffa_ppm),
            log_furan,
            log_dp
        )

        return float(np.exp(log_dp_value))

    # ------------------------------------------------------------------------

    @classmethod
    def dp_from_furan_chendong(
        cls,
        ffa_ppm: float
    ) -> float:
        """
        Chendong model - recommended by CIGRE (best performer).
        Reference: CIGRE TF 15.01.03, TB 323.
        """
        return cls._log_interpolate(
            ffa_ppm,
            cls._CHENDONG_TABLE,
            cls._CHENDONG_LOG_FURAN,
            cls._CHENDONG_LOG_DP
        )

    # ------------------------------------------------------------------------

    @classmethod
    def dp_from_furan_stebbins(
        cls,
        ffa_ppm: float
    ) -> float:
        """Stebbins empirical model."""
        return cls._log_interpolate(
            ffa_ppm,
            cls._STEBBINS_TABLE,
            cls._STEBBINS_LOG_FURAN,
            cls._STEBBINS_LOG_DP
        )

    # ------------------------------------------------------------------------

    @classmethod
    def dp_from_furan_depablo(
        cls,
        ffa_ppm: float
    ) -> float:
        """De Pablo empirical model."""
        return cls._log_interpolate(
            ffa_ppm,
            cls._DEPABLO_TABLE,
            cls._DEPABLO_LOG_FURAN,
            cls._DEPABLO_LOG_DP
        )

    # ------------------------------------------------------------------------

    @staticmethod
    def dp_from_furan_pahlavanpour(
        ffa_ppm: float
    ) -> float:
        """
        Pahlavanpour analytical formula:
            DP = 800 / (0.186 * FFA + 1)
        Reference: Pahlavanpour et al., CIGRE TF 15.01.03, 1997.
        """
        if ffa_ppm < 0:
            raise ValueError(
                "2-FAL concentration must be non-negative."
            )

        return 800.0 / (
            0.186 * ffa_ppm + 1.0
        )

    # =========================================================================
    # 2. Arrhenius / Ekenstam Rate
    # =========================================================================

    def _rate_constant(
        self,
        temperature_kelvin: float,
        a_factor: float
    ) -> float:
        """
        k(T) = A * exp(-Ea / (R*T))

        Units:
            A : 1/h
            k : 1/h

        Reference: Ekenstam equation, CIGRE 323, Section 4.3.
        """
        if temperature_kelvin <= 0:
            raise ValueError(
                "Temperature must be greater than absolute zero."
            )

        if a_factor <= 0:
            raise ValueError(
                "A-factor must be greater than zero."
            )

        exponent = -self._Ea / (
            self._R * temperature_kelvin
        )

        return a_factor * np.exp(exponent)

    # =========================================================================
    # 3. Historical A-factor Calibration (Assumption, not measurement)
    # =========================================================================

    def _extract_a_from_history(
        self,
        dp_current: float,
        age_hours: float
    ) -> Tuple[float, float]:
        """
        Estimate A from historical age and current DP.

        Ekenstam:

            1/DP(t) - 1/DP0 = A * exp(-Ea/(R*T)) * t

        Therefore:

            A =
            [1/DP(t) - 1/DP0]
            --------------------------------
            [t * exp(-Ea/(R*T_hist))]

        IMPORTANT:
        This is a calibration based on an assumed historical temperature.
        It is NOT a directly measured A-factor. The result should be
        interpreted with caution and validated against actual operating
        conditions or direct measurement when possible.

        Reference: CIGRE 323, Section 4.3 and 4.6.1.
        """

        if age_hours <= 0:
            return (
                self._a_factor if self._a_factor is not None else 1e8,
                0.0
            )

        if dp_current <= 0:
            raise ValueError(
                "Current DP must be greater than zero."
            )

        # Dimensionless Arrhenius term at historical temperature
        arrhenius_hist = np.exp(
            -self._Ea / (
                self._R * self._T_hist
            )
        )

        delta_inv_dp = (
            1.0 / dp_current
            - 1.0 / self._dp0
        )

        # No degradation observed
        if delta_inv_dp <= 0:
            return (
                self._a_factor if self._a_factor is not None else 1e8,
                arrhenius_hist
            )

        a_extracted = (
            delta_inv_dp
            / (age_hours * arrhenius_hist)
        )

        # Soft limits with warnings (instead of hard clipping)
        if a_extracted < 1e6:
            warnings.warn(
                f"Extracted A-factor is very low ({a_extracted:.2e} < 1e6). "
                "Check input data (DP, age, temperature) or consider using fixed A.",
                UserWarning
            )
            a_extracted = 1e6

        elif a_extracted > 1e12:
            warnings.warn(
                f"Extracted A-factor is very high ({a_extracted:.2e} > 1e12). "
                "Check input data (DP, age, temperature) or consider using fixed A.",
                UserWarning
            )
            a_extracted = 1e12

        return (
            float(a_extracted),
            float(arrhenius_hist)
        )

    # =========================================================================
    # 4. Remaining Life Calculation
    # =========================================================================

    def _compute_remaining_life(
        self,
        dp_current: float,
        age_hours: float
    ) -> Dict[str, Any]:
        """
        Calculate consumed and remaining life using Ekenstam equation.

        Ekenstam equation (CIGRE 323, Section 4.3):

            1/DP_t - 1/DP_0 = k(T) * t

        where:

            k(T) = A * exp(-Ea/(R*T))

        Remaining time:

            t_remaining =
            [1/DP_EOL - 1/DP_current] / k(T_ref)

        Note: T_ref = 98°C is a design scenario (CIGRE 323, Section 1.3, 4.1).
        In reality, temperature varies over time. This is a simplified
        engineering model, not a precise real-time prediction.
        """

        # ---------------------------------------------------------------------
        # Determine A
        #
        # Done before EOL check so that end-of-life results still include
        # A-factor and k_reference for reporting.
        # ---------------------------------------------------------------------

        a_extracted = None
        historical_arrhenius = None

        if (
            self._use_historical_a
            and age_hours > 0
            and dp_current > 0
        ):

            (
                a_extracted,
                historical_arrhenius
            ) = self._extract_a_from_history(
                dp_current,
                age_hours
            )

            a_used = a_extracted

        else:

            if self._a_factor is not None:
                a_used = float(self._a_factor)
            else:
                # Default from CIGRE 323, Section 4.6.1 (dry, oxygen-free)
                a_used = 1e8

        # ---------------------------------------------------------------------
        # Rate at reference temperature (98°C design scenario)
        # ---------------------------------------------------------------------

        k_reference = self._rate_constant(
            self._T_ref,
            a_used
        )

        # ---------------------------------------------------------------------
        # End-of-Life check
        # ---------------------------------------------------------------------

        if dp_current <= self._dp_eol:

            consumed_years = (
                age_hours / (365.25 * 24.0)
            )

            return {
                "dp": round(float(dp_current), 1),
                "consumed_life_fraction": 1.0,
                "remaining_life_years": 0.0,
                "remaining_life_percent": 0.0,
                "consumed_years": round(consumed_years, 2),
                "a_used": round(a_used, 4),
                "a_extracted": (
                    round(a_extracted, 4)
                    if a_extracted is not None
                    else None
                ),
                "historical_arrhenius": historical_arrhenius,
                "k_reference": round(k_reference, 12),
                "age_hours": round(age_hours, 0)
            }

        # ---------------------------------------------------------------------
        # DP terms
        # ---------------------------------------------------------------------

        inv_dp_initial = 1.0 / self._dp0
        inv_dp_current = 1.0 / dp_current
        inv_dp_eol = 1.0 / self._dp_eol

        # Total degradation from DP0 to EOL
        total_degradation = (
            inv_dp_eol
            - inv_dp_initial
        )

        # Degradation already consumed
        consumed_degradation = (
            inv_dp_current
            - inv_dp_initial
        )

        # ---------------------------------------------------------------------
        # Life consumed
        # ---------------------------------------------------------------------

        if total_degradation > 0:

            consumed_fraction = (
                consumed_degradation
                / total_degradation
            )

        else:

            consumed_fraction = 1.0

        consumed_fraction = float(
            np.clip(
                consumed_fraction,
                0.0,
                1.0
            )
        )

        # ---------------------------------------------------------------------
        # Remaining life
        # ---------------------------------------------------------------------

        remaining_inverse_dp = (
            inv_dp_eol
            - inv_dp_current
        )

        if remaining_inverse_dp <= 0:

            remaining_hours = 0.0

        else:

            remaining_hours = (
                remaining_inverse_dp
                / k_reference
            )

        remaining_years = (
            remaining_hours
            / (365.25 * 24.0)
        )

        consumed_years = (
            age_hours
            / (365.25 * 24.0)
        )

        remaining_percent = (
            1.0 - consumed_fraction
        ) * 100.0

        return {
            "dp": round(float(dp_current), 1),

            "consumed_life_fraction":
                round(consumed_fraction, 4),

            "remaining_life_years":
                round(max(remaining_years, 0.0), 2),

            "remaining_life_percent":
                round(max(remaining_percent, 0.0), 1),

            "consumed_years":
                round(consumed_years, 2),

            "a_used":
                round(a_used, 4),

            "a_extracted":
                (
                    round(a_extracted, 4)
                    if a_extracted is not None
                    else None
                ),

            "historical_arrhenius":
                historical_arrhenius,

            "k_reference":
                round(k_reference, 12),

            "age_hours":
                round(age_hours, 0)
        }

    # =========================================================================
    # 5. Condition Assessment (CIGRE 323, Section 7.4.1)
    # =========================================================================

    def _assess_condition(
        self,
        dp: float
    ) -> Dict[str, Any]:
        """
        Assess insulation condition based on CIGRE 323, Section 7.4.1.

        Classification:
            - New / Healthy: DP > 900
            - Moderate Aging: 350 < DP ≤ 900
            - Aged / Extensive: 250 < DP ≤ 350
            - End-of-Life Approaching: DP ≤ 250 (with 200 as final EOL)

        Reference: CIGRE 323, Section 7.4.1 (page 64-65).
        End-of-life: Section 4.2, Figure 16.
        """

        t = self._thresholds

        if dp > t["new"]:

            return {
                "status": "New / Healthy",
                "alert_level": "Normal",
                "recommendations": [
                    "Continue regular oil and DGA monitoring.",
                    "Monitor moisture and acidity of insulating oil.",
                    "Continue normal transformer loading and thermal monitoring."
                ]
            }

        elif dp > t["moderate"]:

            return {
                "status": "Moderate Aging",
                "alert_level": "Warning",
                "recommendations": [
                    "Increase monitoring frequency.",
                    "Check moisture and oil quality.",
                    "Review transformer loading and hot-spot temperature.",
                    "Trend 2-FAL concentration over time."
                ]
            }

        elif dp > t["extensive"]:

            return {
                "status": "Aged / Extensive Deterioration",
                "alert_level": "Critical",
                "recommendations": [
                    "Perform detailed oil and DGA analysis.",
                    "Check moisture and acidity.",
                    "Review loading and cooling conditions.",
                    "Trend furan concentration and DP."
                ]
            }

        else:

            return {
                "status": "End-of-Life Approaching",
                "alert_level": "Critical",
                "recommendations": [
                    "Perform detailed transformer life assessment.",
                    "Consider direct insulation DP measurement if practical.",
                    "Review transformer replacement strategy.",
                    "Reduce thermal and mechanical stresses where possible."
                ]
            }

    # =========================================================================
    # 6. Warnings
    # =========================================================================

    def _generate_warnings(
        self,
        dp: float
    ) -> List[str]:

        warnings_list = []

        t = self._thresholds

        if dp <= t["end_of_life"]:

            warnings_list.append(
                "DP is at or below the configured "
                "end-of-life threshold (200)."
            )

        elif dp <= t["extensive"]:

            warnings_list.append(
                "DP is in the extensive deterioration range (≤250)."
            )

        elif dp <= t["moderate"]:

            warnings_list.append(
                "DP is in the moderate aging range (≤350)."
            )

        elif dp <= t["new"]:

            warnings_list.append(
                "DP is below the configured healthy/new threshold (900)."
            )

        return warnings_list

    # =========================================================================
    # 7. Main Estimate Method
    # =========================================================================

    def estimate(
        self,
        furan_ppm: float,
        installation_date: datetime,
        model: str = "Pahlavanpour"
    ) -> Dict[str, Any]:

        # ---------------------------------------------------------------------
        # Validate input
        # ---------------------------------------------------------------------

        if furan_ppm < 0:
            raise ValueError(
                "furan_ppm must be non-negative."
            )

        if not isinstance(
            installation_date,
            datetime
        ):
            raise TypeError(
                "installation_date must be a datetime object."
            )

        # ---------------------------------------------------------------------
        # Available models (CIGRE TF 15.01.03)
        # ---------------------------------------------------------------------

        model_map: Dict[
            str,
            Callable[[float], float]
        ] = {

            "Chendong":
                self.dp_from_furan_chendong,

            "Stebbins":
                self.dp_from_furan_stebbins,

            "DePablo":
                self.dp_from_furan_depablo,

            "Pahlavanpour":
                self.dp_from_furan_pahlavanpour
        }

        if model not in model_map:

            raise ValueError(
                f"Unknown model: {model}. "
                f"Choose from {list(model_map.keys())}"
            )

        # ---------------------------------------------------------------------
        # Transformer age
        # ---------------------------------------------------------------------

        now = datetime.now()

        age_hours = (
            now - installation_date
        ).total_seconds() / 3600.0

        age_hours = max(
            age_hours,
            0.0
        )

        age_years = (
            age_hours
            / (365.25 * 24.0)
        )

        # ---------------------------------------------------------------------
        # DP from Furan (empirical, with uncertainty)
        # ---------------------------------------------------------------------

        dp_raw = model_map[model](
            furan_ppm
        )

        # Limit DP to physical/configured range
        dp = float(
            np.clip(
                dp_raw,
                self._dp_eol,
                self._dp0
            )
        )

        # ---------------------------------------------------------------------
        # Life calculation (kinetic model)
        # ---------------------------------------------------------------------

        life_data = self._compute_remaining_life(
            dp,
            age_hours
        )

        # ---------------------------------------------------------------------
        # Condition (CIGRE 323, Section 7.4.1)
        # ---------------------------------------------------------------------

        condition = self._assess_condition(dp)

        warnings_list = self._generate_warnings(dp)

        # ---------------------------------------------------------------------
        # DP comparison
        # ---------------------------------------------------------------------

        comparison = {

            "DP_initial":
                self._dp0,

            "DP_current":
                dp,

            "DP_end_of_life":
                self._dp_eol,

            "threshold_new":
                self._thresholds["new"],

            "threshold_moderate":
                self._thresholds["moderate"],

            "threshold_extensive":
                self._thresholds["extensive"],

            "remaining_to_eol":
                max(
                    dp - self._dp_eol,
                    0.0
                )
        }

        # ---------------------------------------------------------------------
        # A-factor description
        # ---------------------------------------------------------------------

        if (
            self._use_historical_a
            and life_data["a_extracted"] is not None
        ):

            a_description = (
                "Historically calibrated A-factor (assumption): "
                f"{life_data['a_extracted']:.3e} h^-1"
            )

        else:

            a_description = (
                "Fixed A-factor (CIGRE 323, Section 4.6.1): "
                f"{life_data['a_used']:.3e} h^-1"
            )

        # ---------------------------------------------------------------------
        # Final result
        # ---------------------------------------------------------------------

        return {

            "input_summary": {

                "furan_ppm":
                    float(furan_ppm),

                "model":
                    model,

                "installation_date":
                    installation_date.strftime(
                        "%Y-%m-%d"
                    ),

                "age_years":
                    round(age_years, 2)
            },

            "estimated_dp":
                life_data["dp"],

            "consumed_life_fraction":
                life_data[
                    "consumed_life_fraction"
                ],

            "remaining_life_years":
                life_data[
                    "remaining_life_years"
                ],

            "remaining_life_percent":
                life_data[
                    "remaining_life_percent"
                ],

            "consumed_years":
                life_data[
                    "consumed_years"
                ],

            "a_used":
                life_data["a_used"],

            "a_extracted":
                life_data["a_extracted"],

            "historical_arrhenius":
                life_data[
                    "historical_arrhenius"
                ],

            "k_reference":
                life_data[
                    "k_reference"
                ],

            "status":
                condition["status"],

            "alert_level":
                condition["alert_level"],

            "recommendations":
                condition[
                    "recommendations"
                ],

            "warnings":
                warnings_list,

            "comparison_with_limits":
                comparison,

            "method_used":
                (
                    "Furan -> DP + Ekenstam/Arrhenius "
                    f"kinetic model ({model}); "
                    f"{a_description}"
                ),

            "config_parameters": {

                "dp_initial":
                    self._dp0,

                "dp_end_of_life":
                    self._dp_eol,

                "A_factor_configured":
                    self._a_factor,

                "A_factor_used":
                    life_data["a_used"],

                "activation_energy_J_mol":
                    self._Ea,

                "reference_temperature_C":
                    self.config.reference_temperature,

                "historical_average_temperature_C":
                    self.config.historical_avg_temp,

                "use_historical_a":
                    self._use_historical_a
            },

            "reference_note": (
                "SOURCES AND ASSUMPTIONS:\n"
                "1. Furan-to-DP models: CIGRE TF 15.01.03 (empirical).\n"
                "2. DP thresholds: CIGRE 323, Section 7.4.1.\n"
                "3. DP=200 end-of-life: CIGRE 323, Section 4.2, Figure 16.\n"
                "4. Default A=1e8: CIGRE 323, Section 4.6.1 (dry/O2-free).\n"
                "5. 98°C reference temperature: CIGRE 323, Section 1.3 and 4.1 "
                "(design scenario).\n"
                "6. Historical A-factor calibration is an assumed method, "
                "not a measured material constant.\n"
                "7. This is a simplified engineering model, not a precise "
                "real-time prediction."
            )
        }


# ============================================================================
# Convenience Function
# ============================================================================

def quick_estimate(
    furan_ppm: float,
    installation_date: datetime,
    model: str = "Pahlavanpour",
    use_historical_a: bool = True
) -> Dict[str, Any]:

    config = CIGREConfig(
        use_historical_a=use_historical_a
    )

    estimator = CIGRETransformerLifeEstimator(
        config
    )

    return estimator.estimate(
        furan_ppm=furan_ppm,
        installation_date=installation_date,
        model=model
    )


