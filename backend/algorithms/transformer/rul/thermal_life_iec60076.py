"""
Transformer Life Estimator Module (numpy-only port)
====================================================
Based on IEC 60076-7 standard for thermal life estimation of oil-immersed power
transformers. This is a numpy-only port of hpjd/2_le/thermal_life_IEC60076.py:
the pandas dependency has been removed and the public API now takes parallel
arrays (hourly time series already resampled by the caller) instead of a
DataFrame.

Two complementary methods:
1. Dynamic gradient from measured oil temperature (Primary method)
2. Load current based estimation (Validation method)

Usage:
    estimator = TransformerLifeEstimator(
        transformer_id="TR-101", installation_date="2015-06-15",
        insulation_type="STANDARD", cooling_type="ONAF",
        rated_power_mva=40, rated_voltage_kv=230, loss_ratio=7.0,
    )
    result = estimator.estimate_life(timestamps, top_oil, ambient, current)
"""

import numpy as np
from datetime import datetime
from typing import Optional, Union, Dict, Any, List, Sequence


def _to_datetime(value: Union[str, datetime, Any]) -> datetime:
    """Coerce a timestamp (datetime / ISO string / other) to a *naive* datetime.

    DCS timestamps and DB dates can be timezone-aware; the estimator mixes them
    with ``datetime.now()`` (naive), so we strip tzinfo to keep all arithmetic
    consistent (all series share the same local wall-clock reference).
    """
    if isinstance(value, datetime):
        dt = value
    elif isinstance(value, str):
        try:
            dt = datetime.fromisoformat(value)
        except ValueError:
            dt = datetime.strptime(value[:10], "%Y-%m-%d")
    else:
        # numpy datetime64 or similar
        dt = datetime.fromisoformat(str(value)[:19])
    if dt.tzinfo is not None:
        dt = dt.replace(tzinfo=None)
    return dt


def _interpolate_nan(arr: np.ndarray) -> np.ndarray:
    """Linearly interpolate NaN gaps over the integer index (both directions)."""
    arr = np.asarray(arr, dtype=float)
    n = len(arr)
    if n == 0:
        return arr
    mask = np.isnan(arr)
    if mask.all() or not mask.any():
        return arr
    idx = np.arange(n)
    arr[mask] = np.interp(idx[mask], idx[~mask], arr[~mask])
    return arr


class TransformerLifeEstimator:
    """
    Transformer thermal life estimator based on IEC 60076-7 (numpy-only).

    Calculates consumed/remaining life of oil-immersed power transformers using
    two complementary methods, selecting thermal parameters by cooling type.
    """

    # Insulation constants per IEC 60076-7
    INSULATION_CONSTANTS: Dict[str, Dict[str, float]] = {
        "STANDARD": {"ref_temp": 98.0, "Ea": 124710},
        "TUP": {"ref_temp": 110.0, "Ea": 124710},
        "ESTER_NATURAL": {"ref_temp": 120.0, "Ea": 103000},
    }

    # Thermal parameters per cooling type
    THERMAL_PARAMS: Dict[str, Dict[str, Union[float, int]]] = {
        "ONAN": {"x": 0.8, "y": 1.3, "d_to_r": 27.5, "d_hs_r": 25, "R_default": 6.0},
        "ONAN_restricted": {"x": 0.8, "y": 1.3, "d_to_r": 27.5, "d_hs_r": 25, "R_default": 6.0},
        "ONAF": {"x": 0.9, "y": 1.6, "d_to_r": 60, "d_hs_r": 25, "R_default": 7.0},
        "ONAF_restricted": {"x": 0.9, "y": 1.6, "d_to_r": 60, "d_hs_r": 25, "R_default": 7.0},
        "OFAF": {"x": 1.0, "y": 1.3, "d_to_r": 55, "d_hs_r": 25, "R_default": 8.0},
        "OF_restricted": {"x": 1.0, "y": 1.3, "d_to_r": 55, "d_hs_r": 25, "R_default": 8.0},
        "ODAF": {"x": 1.0, "y": 2.0, "d_to_r": 50, "d_hs_r": 25, "R_default": 8.0},
    }

    # Transformer classification by MVA
    TRANSFORMER_CLASS_BY_MVA: Dict[tuple, str] = {
        (0, 2.5): "Distribution",
        (2.5, 100): "PowerMedium",
        (100, float("inf")): "PowerLarge",
    }

    def __init__(
        self,
        transformer_id: str,
        installation_date: Union[str, datetime],
        insulation_type: str,
        design_life_years: float = 30.0,
        cooling_type: Optional[str] = None,
        rated_power_mva: Optional[float] = None,
        rated_voltage_kv: Optional[float] = None,
        loss_ratio: Optional[float] = None,
        manufacturer: Optional[str] = None,
    ) -> None:
        self.transformer_id = transformer_id
        self.installation_date = _to_datetime(installation_date)
        self.design_life_years = float(design_life_years)
        self.manufacturer = manufacturer

        if insulation_type.upper() not in self.INSULATION_CONSTANTS:
            raise ValueError(
                f"Invalid insulation_type: {insulation_type}. "
                f"Must be one of: {list(self.INSULATION_CONSTANTS.keys())}"
            )
        self.insulation_type = insulation_type.upper()

        self.cooling_type = cooling_type.upper() if cooling_type else None
        self.rated_power_mva = float(rated_power_mva) if rated_power_mva is not None else None
        self.rated_voltage_kv = float(rated_voltage_kv) if rated_voltage_kv is not None else None
        self.loss_ratio = loss_ratio

        const = self.INSULATION_CONSTANTS[self.insulation_type]
        self.ref_temp = const["ref_temp"]
        self.Ea = const["Ea"]

        if self.rated_power_mva and self.rated_voltage_kv:
            self.rated_current = (self.rated_power_mva * 1e6) / (
                np.sqrt(3) * self.rated_voltage_kv * 1e3
            )
        else:
            self.rated_current = None

        params = self.THERMAL_PARAMS.get(
            self.cooling_type,
            {"x": 0.8, "y": 1.3, "d_to_r": 27.5, "d_hs_r": 25, "R_default": 7.0},
        )
        self.x = params["x"]
        self.y = params["y"]
        self.d_to_r = params["d_to_r"]
        self.d_hs_r = params["d_hs_r"]
        self.R = loss_ratio if loss_ratio is not None else params["R_default"]

        self.transformer_class = self._get_transformer_class(self.rated_power_mva)
        self.age_years = (datetime.now() - self.installation_date).days / 365.25

    # ========================
    # Static Helper Methods
    # ========================

    @staticmethod
    def _get_transformer_class(rated_mva: Optional[float]) -> str:
        if rated_mva is None:
            return "PowerMedium"
        mva = float(rated_mva)
        for (low, high), cls in TransformerLifeEstimator.TRANSFORMER_CLASS_BY_MVA.items():
            if low < mva <= high:
                return cls
        return "PowerMedium"

    @staticmethod
    def estimate_missing_faa_from_avg_ambient(
        avg_ambient_temp: float, insulation_type: str = "STANDARD"
    ) -> float:
        """Estimate missing_data_faa from average ambient temperature (clamped 0.5-2.0)."""
        ref_hotspot = {
            "STANDARD": 98.0,
            "TUP": 110.0,
            "ESTER_NATURAL": 120.0,
        }.get(insulation_type.upper(), 98.0)
        estimated_hotspot = avg_ambient_temp + 30.0
        faa = np.power(2.0, (estimated_hotspot - ref_hotspot) / 6.0)
        return max(0.5, min(2.0, faa))

    # ========================
    # Private Calculation Methods
    # ========================

    def _faa(self, theta_hs: Union[float, np.ndarray]) -> np.ndarray:
        """Relative Aging Acceleration Factor (FAA), Arrhenius model per IEC 60076-7."""
        theta_hs = np.asarray(theta_hs, dtype=float)
        T_ref = self.ref_temp + 273.15
        T_hs = theta_hs + 273.15
        R_g = 8.314
        return np.exp((self.Ea / R_g) * (1.0 / T_ref - 1.0 / T_hs))

    def _generate_recommendations(self, result: Dict[str, Any]) -> List[str]:
        recommendations = []

        remaining = result["overall_remaining_life"]["remaining_life_years"]
        if remaining < 5:
            recommendations.append(
                "⚠️ Remaining life is less than 5 years. "
                "Plan for replacement or major maintenance."
            )
        elif remaining < 10:
            recommendations.append(
                "⚡ Remaining life is moderate. "
                "Increase monitoring frequency and consider maintenance planning."
            )
        else:
            recommendations.append(
                "✅ Transformer is operating within acceptable thermal limits."
            )

        max_hs = result["life_estimation"]["dynamic_gradient"]["max_hotspot_temp"]
        if max_hs > 120:
            recommendations.append(
                "🚨 Hot-spot temperature exceeded 120°C. "
                "Investigate immediately and reduce load if necessary!"
            )
        elif max_hs > 110:
            recommendations.append(
                "⚠️ Hot-spot temperature near limit (110°C). "
                "Review cooling system and load profile."
            )
        else:
            recommendations.append(
                "✅ No accelerated ageing detected based on hot-spot temperature."
            )

        max_faa = result["life_estimation"]["dynamic_gradient"].get("max_faa", 1)
        if max_faa > 10:
            recommendations.append(
                "🚨 Extreme ageing rate detected (FAA > 10). Immediate action required!"
            )
        elif max_faa > 5:
            recommendations.append(
                "⚠️ High ageing rate detected (FAA > 5). "
                "Check load profile and cooling system."
            )
        else:
            recommendations.append("✅ Ageing rate is within acceptable limits.")

        max_load = result["life_estimation"]["dynamic_gradient"].get("max_load_factor", 0)
        if max_load and max_load > 1.3:
            recommendations.append(
                "🚨 Overload detected (Load Factor > 1.3 pu). Reduce load immediately!"
            )
        elif max_load and max_load > 1.0:
            recommendations.append(
                "⚠️ Transformer is operating above rated load. "
                "Monitor closely and consider load management."
            )

        max_oil = result["life_estimation"]["dynamic_gradient"].get("max_top_oil_temp", 0)
        if max_oil > 95:
            recommendations.append(
                "🚨 Top oil temperature exceeded 95°C. Check cooling system immediately!"
            )

        if max_hs <= 110 and max_faa <= 5 and remaining >= 10:
            recommendations.append(
                "🔧 Continue routine monitoring and ensure cooling system is fully operational."
            )

        return recommendations

    def _check_alerts(self, result: Dict[str, Any]) -> Dict[str, bool]:
        alerts = {
            "hot_spot_exceeded_120": False,
            "faa_exceeded_10": False,
            "remaining_life_less_than_5": False,
            "load_factor_exceeded_1_3": False,
            "top_oil_exceeded_95": False,
        }

        max_hs = result["life_estimation"]["dynamic_gradient"]["max_hotspot_temp"]
        if max_hs > 120:
            alerts["hot_spot_exceeded_120"] = True

        max_faa = result["life_estimation"]["dynamic_gradient"].get("max_faa", 0)
        if max_faa > 10:
            alerts["faa_exceeded_10"] = True

        remaining = result["overall_remaining_life"]["remaining_life_years"]
        if remaining < 5:
            alerts["remaining_life_less_than_5"] = True

        max_load = result["life_estimation"]["dynamic_gradient"].get("max_load_factor", 0)
        if max_load and max_load > 1.3:
            alerts["load_factor_exceeded_1_3"] = True

        max_oil = result["life_estimation"]["dynamic_gradient"].get("max_top_oil_temp", 0)
        if max_oil > 95:
            alerts["top_oil_exceeded_95"] = True

        return alerts

    # ========================
    # Main Public Methods
    # ========================

    def estimate_life(
        self,
        timestamps: Sequence[Union[str, datetime]],
        top_oil: Sequence[float],
        ambient: Sequence[float],
        current: Optional[Sequence[float]] = None,
        missing_data_faa: Optional[float] = None,
        auto_estimate_missing: bool = False,
    ) -> Dict[str, Any]:
        """
        Estimate consumed transformer life from parallel hourly arrays.

        Args:
            timestamps: hourly timestamps (datetime or ISO strings), sorted or not
            top_oil:    top oil temperature (°C), same length as timestamps
            ambient:    ambient temperature (°C), same length
            current:    load current (A), same length (optional; enables Method 2)
            missing_data_faa: aging factor for pre-monitoring period
            auto_estimate_missing: estimate missing_data_faa from mean ambient

        Returns dict with keys: transformer_info, overall_remaining_life,
            current_thermal_state, life_estimation, comparison, time_series,
            pre_monitoring_penalty, iec_thermal_params, recommendations, alerts.
        """
        # ---- Coerce + align inputs ----
        ts = [_to_datetime(t) for t in timestamps]
        top_oil = np.asarray(top_oil, dtype=float)
        ambient = np.asarray(ambient, dtype=float)
        has_current = current is not None
        current_arr = np.asarray(current, dtype=float) if has_current else None

        n = len(ts)
        if n == 0 or len(top_oil) != n or len(ambient) != n:
            raise ValueError("timestamps, top_oil and ambient must be non-empty and equal length")
        if has_current and len(current_arr) != n:
            raise ValueError("current must match the length of timestamps")

        # Sort chronologically by timestamp
        order = np.argsort(np.array([t.timestamp() for t in ts]))
        ts = [ts[i] for i in order]
        top_oil = _interpolate_nan(top_oil[order])
        ambient = _interpolate_nan(ambient[order])
        if has_current:
            current_arr = _interpolate_nan(current_arr[order])

        first_ts = ts[0]
        last_ts = ts[-1]
        total_hours = n

        # Pre-monitoring (missing) period
        missing_days = max((first_ts - self.installation_date).days, 0)
        missing_years = missing_days / 365.25
        mission_period_years = (last_ts - self.installation_date).days / 365.25

        if missing_data_faa is None:
            if auto_estimate_missing:
                missing_data_faa = self.estimate_missing_faa_from_avg_ambient(
                    float(np.nanmean(ambient)), self.insulation_type
                )
            else:
                missing_data_faa = 1.15

        equivalent_aging_missing = missing_years * missing_data_faa
        initial_remaining = max(self.design_life_years - equivalent_aging_missing, 0)

        # ---- Method 1: Dynamic gradient from oil temperature (Primary) ----
        delta_to = top_oil - ambient
        delta_h = self.d_hs_r * (np.maximum(delta_to, 0) / self.d_to_r) ** self.y
        theta_hs = top_oil + delta_h
        faa_series = self._faa(theta_hs)
        aging_total = float(faa_series.sum())
        consumed_years = aging_total / 8760.0

        total_elapsed_life = equivalent_aging_missing + consumed_years
        remaining_years = max(self.design_life_years - total_elapsed_life, 0)
        life_used_percent = (total_elapsed_life / self.design_life_years) * 100

        load_factor_series = (current_arr / self.rated_current) if (has_current and self.rated_current) else None

        dynamic_gradient_result = {
            "method": "Dynamic Gradient from Oil Temperature",
            "consumed_life_years": round(consumed_years, 4),
            "remaining_life_years": round(remaining_years, 4),
            "life_used_percent": round(life_used_percent, 1),
            "average_faa": round(aging_total / total_hours, 4),
            "max_hotspot_temp": round(float(theta_hs.max()), 2),
            "avg_hotspot_temp": round(float(theta_hs.mean()), 2),
            "max_top_oil_temp": round(float(top_oil.max()), 2),
            "max_load_factor": round(float(load_factor_series.max()), 3) if load_factor_series is not None else None,
            "max_faa": round(float(faa_series.max()), 4),
            "equivalent_aging_hours": round(aging_total, 2),
        }

        # ---- Current Thermal State (Last Record) ----
        current_load_factor = float(load_factor_series[-1]) if load_factor_series is not None else None
        current_thermal_state = {
            "hot_spot_current": round(float(theta_hs[-1]), 2),
            "top_oil_current": round(float(top_oil[-1]), 2),
            "ambient_current": round(float(ambient[-1]), 2),
            "faa_current": round(float(faa_series[-1]), 4),
            "load_factor_current": round(current_load_factor, 3) if current_load_factor is not None else None,
        }

        # ---- Method 2: Load current based estimation (Validation) ----
        if self.rated_current is not None and has_current:
            K = np.clip(current_arr / self.rated_current, 0, None)
            delta_to_load = self.d_to_r * ((K ** 2 * self.R + 1) / (self.R + 1)) ** self.x
            delta_hs_load = self.d_hs_r * (K ** self.y)
            theta_hs_load = ambient + delta_to_load + delta_hs_load
            aging_load = float(self._faa(theta_hs_load).sum())
            consumed_load = aging_load / 8760.0
            remaining_load = max(self.design_life_years - (equivalent_aging_missing + consumed_load), 0)

            load_current_result = {
                "method": "Load Current Based (without H-factor)",
                "loss_ratio_R_used": round(self.R, 2),
                "oil_exponent_x_used": self.x,
                "winding_exponent_y_used": self.y,
                "consumed_life_years": round(consumed_load, 4),
                "remaining_life_years": round(remaining_load, 4),
                "average_faa": round(aging_load / total_hours, 4),
                "max_hotspot_temp": round(float(theta_hs_load.max()), 2),
                "avg_hotspot_temp": round(float(theta_hs_load.mean()), 2),
            }
        else:
            load_current_result = {
                "skipped": "Rated current or current signal not available "
                "(provide rated_power_mva, rated_voltage_kv and a current signal)"
            }

        # ---- Comparison between methods ----
        comparison = {}
        if "error" not in load_current_result and "skipped" not in load_current_result:
            diff_years = abs(
                dynamic_gradient_result["consumed_life_years"]
                - load_current_result["consumed_life_years"]
            )
            diff_percent = round(
                diff_years / max(dynamic_gradient_result["consumed_life_years"], 0.001) * 100, 2
            )
            status = "Excellent Agreement"
            if diff_percent > 20:
                status = "Critical: Significant discrepancy"
            elif diff_percent > 10:
                status = "Warning: Parameters may need calibration"
            comparison = {
                "difference_years": round(diff_years, 4),
                "difference_percent": diff_percent,
                "status": status,
                "note": "Difference < 10% indicates good thermal parameter calibration",
            }

        # ---- Time Series Data for Trends ----
        time_series = {
            "timestamps": [t.isoformat() for t in ts],
            "hot_spot_temperature": theta_hs.tolist(),
            "top_oil_temperature": top_oil.tolist(),
            "ambient_temperature": ambient.tolist(),
            "faa": faa_series.tolist(),
            "load_factor": load_factor_series.tolist() if load_factor_series is not None else None,
        }

        results: Dict[str, Any] = {
            "transformer_info": self.get_transformer_info(),
            "overall_remaining_life": {
                "design_life_years": self.design_life_years,
                "total_elapsed_life_years": round(total_elapsed_life, 1),
                "remaining_life_years": round(remaining_years, 1),
                "life_used_percent": round(life_used_percent, 1),
            },
            "current_thermal_state": current_thermal_state,
            "life_estimation": {
                "dynamic_gradient": dynamic_gradient_result,
                "load_current": load_current_result,
            },
            "comparison": comparison,
            "time_series": time_series,
            "pre_monitoring_penalty": {
                "mission_period_years": round(mission_period_years, 2),
                "missing_years": round(missing_years, 2),
                "missing_data_faa_used": round(missing_data_faa, 3),
                "equivalent_aging_missing": round(equivalent_aging_missing, 4),
                "remaining_life_before_monitoring": round(initial_remaining, 4),
            },
            "iec_thermal_params": {
                "R_loss_ratio": self.R,
                "x_oil_exponent": self.x,
                "y_winding_exponent": self.y,
                "d_to_r": self.d_to_r,
                "d_hs_r": self.d_hs_r,
                "ref_temp": self.ref_temp,
            },
        }

        results["recommendations"] = self._generate_recommendations(results)
        results["alerts"] = self._check_alerts(results)
        return results

    def get_transformer_info(self) -> Dict[str, Any]:
        return {
            "transformer_id": self.transformer_id,
            "installation_date": self.installation_date.strftime("%Y-%m-%d"),
            "age_years": round(self.age_years, 1),
            "design_life_years": self.design_life_years,
            "insulation_type": self.insulation_type,
            "cooling_type": self.cooling_type,
            "rated_power_mva": self.rated_power_mva,
            "rated_voltage_kv": self.rated_voltage_kv,
            "rated_current_a": round(self.rated_current, 2) if self.rated_current else None,
            "transformer_class": self.transformer_class,
            "manufacturer": self.manufacturer,
            "thermal_params": {
                "R_loss_ratio": self.R,
                "x_oil_exponent": self.x,
                "y_winding_exponent": self.y,
                "d_to_r": self.d_to_r,
                "d_hs_r": self.d_hs_r,
            },
        }

