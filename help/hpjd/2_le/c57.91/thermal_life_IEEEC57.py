"""
IEEE C57.91-2011 Compliant Transformer Thermal Life Estimator
Design Life = 30 years (262,980 hours at reference temperature of 110°C)
All equations strictly follow the standard clauses 5, 7, and Annex I.

This module provides a clean API for estimating remaining life of
mineral-oil-immersed transformers using hourly measured data.

Two estimation methods are provided:
    1. top_oil_based  : Uses measured top-oil temperature + current
    2. fixed_hotspot  : Uses measured winding temperature + hotspot_delta
"""

import pandas as pd
import numpy as np
from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from dataclasses import dataclass


# ============================================================================
# Data Models (for clean input/output)
# ============================================================================

@dataclass
class TransformerSpecs:
    """Transformer specifications required for life estimation."""
    installation_date: datetime          # Date of commissioning
    cooling_type: str                    # 'ONAN', 'ONAF', 'OFAF', 'ODAF'
    loss_ratio: Optional[float] = None   # R = load_loss / no_load_loss
    top_oil_rise_rated: Optional[float] = None  # Top-oil rise at rated load [°C]
    hot_spot_rise_rated: Optional[float] = None # Hot-spot rise over top-oil [°C]
    hotspot_delta: float = 15.0          # Hot-spot minus average winding temp [°C]
    missing_data_faa: float = 1.15       # Average FAA for missing periods


@dataclass
class HourlyData:
    """Hourly measured data for one transformer."""
    timestamps: List[datetime]
    ambient_temperature: List[float]     # [°C]
    current: List[float]                 # [A]
    top_oil_temperature: Optional[List[float]] = None   # [°C]
    winding_temperature: Optional[List[float]] = None   # [°C]


# ============================================================================
# Main Estimator Class
# ============================================================================

class TransformerLifeEstimator:
    """
    Estimate remaining life of transformers per IEEE C57.91-2011.

    Example:
        >>> specs = TransformerSpecs(
        ...     installation_date=datetime(2020, 1, 1),
        ...     cooling_type='ONAF'
        ... )
        >>> data = HourlyData(
        ...     timestamps=[...],
        ...     ambient_temperature=[...],
        ...     current=[...],
        ...     top_oil_temperature=[...],
        ...     winding_temperature=[...]
        ... )
        >>> estimator = TransformerLifeEstimator(specs)
        >>> report = estimator.estimate(data)
        >>> print(report['life_estimation_methods']['top_oil_based'])
    """

    # ------------------------------------------------------------------
    # Standard constants (from IEEE C57.91-2011)
    # ------------------------------------------------------------------
    REF_TEMP = 110.0                     # Reference hot-spot temp for 65°C rise systems [°C]
    B_CONST = 15000.0                    # Arrhenius constant (dimensionless) from Eq. (2)
    DESIGN_LIFE_HOURS = 30 * 365.25 * 24 # 262,980 hours (30 years)
    DESIGN_LIFE_YEARS = DESIGN_LIFE_HOURS / (365.25 * 24)

    # Thermal parameters per cooling mode (Table 4)
    THERMAL_PARAMS = {
        "ONAN": {"n": 0.8, "m": 0.8, "d_to_r": 55, "d_hs_r": 25, "R_default": 6.0},
        "ONAF": {"n": 0.9, "m": 0.8, "d_to_r": 60, "d_hs_r": 25, "R_default": 7.0},
        "OFAF": {"n": 0.9, "m": 0.8, "d_to_r": 55, "d_hs_r": 25, "R_default": 8.0},
        "ODAF": {"n": 1.0, "m": 1.0, "d_to_r": 50, "d_hs_r": 25, "R_default": 8.0},
    }

    # Temperature limits for different loading types (Table 9)
    TEMP_LIMITS = {
        "normal": 120,
        "planned": 130,
        "long_emergency": 140,
        "short_emergency": 180
    }

    def __init__(self, specs: TransformerSpecs):
        """
        Initialize estimator with transformer specifications.

        Args:
            specs: TransformerSpecs object containing all required parameters.
        """
        self.specs = specs
        self.installation_date = specs.installation_date
        self.cooling_type = specs.cooling_type.upper()
        self.hotspot_delta = specs.hotspot_delta
        self.missing_data_faa = specs.missing_data_faa

        # Load thermal parameters from Table 4
        params = self.THERMAL_PARAMS.get(self.cooling_type, self.THERMAL_PARAMS["ONAF"])
        self.n = params["n"]          # oil exponent
        self.m = params["m"]          # winding gradient exponent
        self.d_to_r = specs.top_oil_rise_rated if specs.top_oil_rise_rated is not None else params["d_to_r"]
        self.d_hs_r = specs.hot_spot_rise_rated if specs.hot_spot_rise_rated is not None else params["d_hs_r"]
        self.R = specs.loss_ratio if specs.loss_ratio is not None else params["R_default"]

        # Design life (30 years)
        self.design_life_years = self.DESIGN_LIFE_YEARS

    # ------------------------------------------------------------------
    # Core calculation methods
    # ------------------------------------------------------------------
    def _faa(self, theta_hs: Union[float, np.ndarray]) -> Union[float, np.ndarray]:
        """
        Compute aging acceleration factor FAA (Eq. 2 of IEEE C57.91-2011).

        Args:
            theta_hs: Hot-spot temperature [°C] (scalar or array)

        Returns:
            FAA factor (dimensionless)
        """
        theta_hs = np.asarray(theta_hs, dtype=float)
        T_ref = self.REF_TEMP + 273.15
        T_hs = theta_hs + 273.15
        return np.exp(self.B_CONST * (1.0 / T_ref - 1.0 / T_hs))

    def _check_limits(self, theta_hs: float, theta_to: float) -> List[str]:
        """
        Check if temperatures exceed recommended limits (Table 9).

        Returns:
            List of warning messages.
        """
        warnings = []
        limits = self.TEMP_LIMITS
        if theta_hs > limits["short_emergency"]:
            warnings.append(f"Hot-spot {theta_hs:.1f}°C exceeds short-term emergency limit {limits['short_emergency']}°C")
        elif theta_hs > limits["long_emergency"]:
            warnings.append(f"Hot-spot {theta_hs:.1f}°C exceeds long-term emergency limit {limits['long_emergency']}°C")
        elif theta_hs > limits["planned"]:
            warnings.append(f"Hot-spot {theta_hs:.1f}°C exceeds planned loading limit {limits['planned']}°C")
        elif theta_hs > limits["normal"]:
            warnings.append(f"Hot-spot {theta_hs:.1f}°C exceeds normal loading limit {limits['normal']}°C")
        if theta_to > 110:
            warnings.append(f"Top-oil {theta_to:.1f}°C exceeds 110°C limit")
        return warnings

    def _resample_to_hourly(self, data: HourlyData) -> pd.DataFrame:
        """Convert HourlyData to a resampled hourly DataFrame."""
        df = pd.DataFrame({
            "Timestamp": data.timestamps,
            "Ambient_Temperature": data.ambient_temperature,
            "Current": data.current,
            "Top_Oil_Temperature": data.top_oil_temperature if data.top_oil_temperature else None,
            "Winding_Temperature": data.winding_temperature if data.winding_temperature else None
        })
        # Drop rows where essential columns are missing
        df = df.dropna(subset=["Timestamp", "Ambient_Temperature", "Current"])
        df["Timestamp"] = pd.to_datetime(df["Timestamp"])
        df = df.set_index("Timestamp").sort_index()
        # Resample to hourly and interpolate missing values
        df = df.resample('H').mean().interpolate(limit_direction='both')
        return df.reset_index()

    def _compute_initial_remaining(self, first_timestamp: datetime) -> float:
        """
        Compute remaining life before monitoring started.
        Accounts for aging during missing data periods.
        """
        missing_days = max((first_timestamp - self.installation_date).days, 0)
        missing_years = missing_days / 365.25
        consumed_est = missing_years * self.missing_data_faa
        return max(self.design_life_years - consumed_est, 0)

    def _estimate_fixed_hotspot(self, df: pd.DataFrame, initial_remaining: float) -> Dict[str, Any]:
        """Method 1: Use winding temperature + hotspot_delta."""
        if "Winding_Temperature" not in df.columns or df["Winding_Temperature"].isnull().all():
            return {"skipped": "Winding_Temperature column missing or all null"}

        try:
            theta_hs = df["Winding_Temperature"] + self.hotspot_delta
            aging_hours = self._faa(theta_hs).sum()
            consumed_years = aging_hours / 8760.0
            max_hs = theta_hs.max()
            max_to = df["Top_Oil_Temperature"].max() if "Top_Oil_Temperature" in df.columns else None
            warnings = self._check_limits(max_hs, max_to) if max_to is not None else []

            return {
                "consumed_life_years": round(consumed_years, 4),
                "remaining_life_years": round(max(initial_remaining - consumed_years, 0), 4),
                "average_faa": round(aging_hours / len(df), 4),
                "max_hotspot_temp": round(max_hs, 2),
                "max_top_oil_temp": round(max_to, 2) if max_to is not None else None,
                "warnings": warnings
            }
        except Exception as e:
            return {"error": str(e)}

    def _estimate_top_oil_based(self, df: pd.DataFrame, initial_remaining: float) -> Dict[str, Any]:
        """
        Method 2: Use top-oil temperature to derive load factor K via Eq. (11).

        IMPORTANT FIX: This method now correctly solves Eq. (11) by using
        (delta_to / d_to_r)^(1/n) to account for the oil exponent n.

        Original incorrect code:
            K_est = ((ratio * (R + 1) - 1) / R) ** (1.0 / (2 * n))

        Correct code (based on Eq. 11):
            delta_to = d_to_r * [ (K^2*R + 1) / (R+1) ]^n
            => K = [ (1/R) * ( (delta_to/d_to_r)^(1/n) * (R+1) - 1 ) ]^(0.5)
        """
        required = ["Top_Oil_Temperature", "Ambient_Temperature"]
        if not all(col in df.columns for col in required):
            return {"skipped": f"Missing required columns: {required}"}

        try:
            delta_to = df["Top_Oil_Temperature"] - df["Ambient_Temperature"]
            ratio = delta_to / self.d_to_r

            # ----- CORRECT IMPLEMENTATION of Eq. (11) -----
            # Step 1: Apply the 1/n power to the ratio
            ratio_power = ratio ** (1.0 / self.n)
            
            # Step 2: Solve for K^2
            k_sq = (ratio_power * (self.R + 1) - 1) / self.R
            
            # Step 3: Take square root to get K (ensure non-negative)
            K_est = np.sqrt(np.maximum(k_sq, 0))
            # -------------------------------------------------

            # Eq. (18): hot-spot rise over top-oil
            delta_hs = self.d_hs_r * (K_est ** (2 * self.m))
            theta_hs = df["Top_Oil_Temperature"] + delta_hs

            aging_hours = self._faa(theta_hs).sum()
            consumed_years = aging_hours / 8760.0
            max_hs = theta_hs.max()
            max_to = df["Top_Oil_Temperature"].max()
            warnings = self._check_limits(max_hs, max_to)

            return {
                "consumed_life_years": round(consumed_years, 4),
                "remaining_life_years": round(max(initial_remaining - consumed_years, 0), 4),
                "average_faa": round(aging_hours / len(df), 4),
                "max_hotspot_temp": round(max_hs, 2),
                "max_top_oil_temp": round(max_to, 2),
                "warnings": warnings
            }
        except Exception as e:
            return {"error": str(e)}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def estimate(self, data: HourlyData) -> Dict[str, Any]:
        """
        Main estimation method. Computes remaining life using both suitable methods.

        Args:
            data: HourlyData object containing measured time-series.

        Returns:
            Dictionary with:
                - pre_monitoring_penalty: dict with remaining life before monitoring
                - life_estimation_methods: dict with results from 'fixed_hotspot' and 'top_oil_based'
                - warnings: list of all warning messages

        Raises:
            ValueError: If input data is invalid or insufficient.
        """
        if not data.timestamps or len(data.timestamps) == 0:
            raise ValueError("No timestamps provided in input data.")

        df = self._resample_to_hourly(data)
        first_ts = df["Timestamp"].min()
        total_hours = len(df)

        if total_hours == 0:
            raise ValueError("No valid hourly data after resampling.")

        initial_remaining = self._compute_initial_remaining(first_ts)

        results = {
            "pre_monitoring_penalty": {
                "remaining_life_before_monitoring": round(initial_remaining, 4)
            },
            "life_estimation_methods": {},
            "warnings": []
        }

        # Method 1: fixed_hotspot
        res1 = self._estimate_fixed_hotspot(df, initial_remaining)
        results["life_estimation_methods"]["fixed_hotspot"] = res1
        if "warnings" in res1:
            results["warnings"].extend(res1["warnings"])

        # Method 2: top_oil_based (FIXED)
        res2 = self._estimate_top_oil_based(df, initial_remaining)
        results["life_estimation_methods"]["top_oil_based"] = res2
        if "warnings" in res2:
            results["warnings"].extend(res2["warnings"])

        return results

    # ------------------------------------------------------------------
    # Convenience method for direct DataFrame input
    # ------------------------------------------------------------------
    def estimate_from_dataframe(
        self,
        df: pd.DataFrame,
        timestamp_col: str = "Timestamp",
        ambient_col: str = "Ambient_Temperature",
        current_col: str = "Current",
        top_oil_col: Optional[str] = None,
        winding_col: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Alternative entry point that accepts a pandas DataFrame.

        Args:
            df: DataFrame with hourly data.
            timestamp_col, ambient_col, current_col: Required column names.
            top_oil_col, winding_col: Optional column names.

        Returns:
            Same dictionary as estimate() method.
        """
        # Build HourlyData from DataFrame
        data = HourlyData(
            timestamps=df[timestamp_col].tolist(),
            ambient_temperature=df[ambient_col].tolist(),
            current=df[current_col].tolist(),
            top_oil_temperature=df[top_oil_col].tolist() if top_oil_col and top_oil_col in df.columns else None,
            winding_temperature=df[winding_col].tolist() if winding_col and winding_col in df.columns else None
        )
        return self.estimate(data)