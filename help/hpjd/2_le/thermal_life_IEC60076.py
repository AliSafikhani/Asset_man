"""
Transformer Life Estimator Module
=================================
Based on IEC 60076-7 standard for thermal life estimation of oil-immersed power transformers.

This module provides a complete implementation for estimating remaining life of transformers
using two complementary methods:
1. Dynamic gradient from measured oil temperature (Primary method)
2. Load current based estimation (Validation method)

The output is fully compatible with the dashboard design (Report-style, Light Theme).

Usage Example:
--------------
    from thermal_life_IEC60076 import TransformerLifeEstimator
    
    # Load data from CSV
    df = TransformerLifeEstimator.load_from_csv("data.csv", timestamp_col="Timestamp")
    
    # Initialize estimator
    estimator = TransformerLifeEstimator(
        transformer_id="TR-101",
        installation_date="2015-06-15",
        insulation_type="STANDARD",
        design_life_years=30,
        cooling_type="ONAF",
        rated_power_mva=40,
        rated_voltage_kv=230,
        loss_ratio=7.0
    )
    
    # Calculate life consumption
    result = estimator.estimate_life(
        df=df,
        top_oil_col="Top_Oil_Temperature",
        ambient_col="Ambient_Temperature",
        current_col="Current",
        timestamp_col="Timestamp"
    )
    
    # Access results
    print(result["overall_remaining_life"])
    print(result["life_estimation"]["dynamic_gradient"])
    print(result["comparison"])
    print(result["recommendations"])
    print(result["alerts"])
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Optional, Union, Dict, Any, List, Tuple
import sqlite3


class TransformerLifeEstimator:
    """
    Transformer thermal life estimator based on IEC 60076-7.
    
    This class calculates the consumed and remaining life of oil-immersed power
    transformers using two complementary methods. It automatically selects the
    appropriate thermal parameters based on the transformer's cooling type.
    
    The output includes:
    - Transformer information
    - Overall remaining life (gauge-ready format)
    - Current thermal state (last record values)
    - Maximum thermal stress since installation
    - Life estimation results from both methods
    - Method comparison with status
    - Time series data for trends
    - IEC thermal parameters
    - Pre-monitoring assessment
    - Recommendations
    - Alerts
    """
    
    # Insulation constants per IEC 60076-7
    INSULATION_CONSTANTS: Dict[str, Dict[str, float]] = {
        "STANDARD": {"ref_temp": 98.0, "Ea": 124710},
        "TUP": {"ref_temp": 110.0, "Ea": 124710},
        "ESTER_NATURAL": {"ref_temp": 120.0, "Ea": 103000}
    }
    
    # Thermal parameters per cooling type
    # d_to_r values calibrated based on real data (average oil rise ~27.5°C for ONAN)
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
        (100, float('inf')): "PowerLarge"
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
        manufacturer: Optional[str] = None
    ) -> None:
        """
        Initialize the transformer life estimator.
        
        Args:
            transformer_id: Unique transformer identifier
            installation_date: Transformer installation date (YYYY-MM-DD or datetime)
            insulation_type: "STANDARD", "TUP", or "ESTER_NATURAL"
            design_life_years: Design life in years (default: 30)
            cooling_type: Cooling type (e.g., "ONAN", "ONAF", "OFAF", "ODAF")
            rated_power_mva: Rated power in MVA
            rated_voltage_kv: Rated voltage in kV
            loss_ratio: Load loss / no-load loss ratio (optional, uses default if None)
            manufacturer: Transformer manufacturer (optional)
            
        Raises:
            ValueError: If insulation_type is invalid or cooling_type is not supported
        """
        self.transformer_id = transformer_id
        self.installation_date = self._validate_date(installation_date)
        self.design_life_years = float(design_life_years)
        self.manufacturer = manufacturer
        
        # Validate insulation type
        if insulation_type.upper() not in self.INSULATION_CONSTANTS:
            raise ValueError(
                f"Invalid insulation_type: {insulation_type}. "
                f"Must be one of: {list(self.INSULATION_CONSTANTS.keys())}"
            )
        self.insulation_type = insulation_type.upper()
        
        # Store power and voltage parameters
        self.cooling_type = cooling_type.upper() if cooling_type else None
        self.rated_power_mva = float(rated_power_mva) if rated_power_mva is not None else None
        self.rated_voltage_kv = float(rated_voltage_kv) if rated_voltage_kv is not None else None
        self.loss_ratio = loss_ratio
        
        # Set insulation constants
        const = self.INSULATION_CONSTANTS[self.insulation_type]
        self.ref_temp = const["ref_temp"]
        self.Ea = const["Ea"]
        
        # Calculate rated current if both power and voltage are provided
        if self.rated_power_mva and self.rated_voltage_kv:
            self.rated_current = (self.rated_power_mva * 1e6) / (
                np.sqrt(3) * self.rated_voltage_kv * 1e3
            )
        else:
            self.rated_current = None
        
        # Select thermal parameters based on cooling type
        params = self.THERMAL_PARAMS.get(
            self.cooling_type,
            {"x": 0.8, "y": 1.3, "d_to_r": 27.5, "d_hs_r": 25, "R_default": 7.0}
        )
        self.x = params["x"]
        self.y = params["y"]
        self.d_to_r = params["d_to_r"]
        self.d_hs_r = params["d_hs_r"]
        self.R = loss_ratio if loss_ratio is not None else params["R_default"]
        
        # Determine transformer class
        self.transformer_class = self._get_transformer_class(self.rated_power_mva)
        
        # Calculate transformer age
        self.age_years = (datetime.now() - self.installation_date).days / 365.25
    
    # ========================
    # Static Helper Methods
    # ========================
    
    @staticmethod
    def _validate_date(date_input: Union[str, datetime]) -> datetime:
        """Convert string date to datetime object."""
        if isinstance(date_input, str):
            return datetime.strptime(date_input, "%Y-%m-%d")
        return date_input
    
    @staticmethod
    def _get_transformer_class(rated_mva: Optional[float]) -> str:
        """Determine transformer class based on rated MVA."""
        if rated_mva is None:
            return "PowerMedium"
        mva = float(rated_mva)
        for (low, high), cls in TransformerLifeEstimator.TRANSFORMER_CLASS_BY_MVA.items():
            if low < mva <= high:
                return cls
        return "PowerMedium"
    
    @staticmethod
    def estimate_missing_faa_from_avg_ambient(
        avg_ambient_temp: float,
        insulation_type: str = "STANDARD"
    ) -> float:
        """
        Estimate missing_data_faa based on average ambient temperature.
        
        This is a helper method for cases where no load data is available
        for the missing period.
        
        Args:
            avg_ambient_temp: Average ambient temperature during missing period (°C)
            insulation_type: "STANDARD", "TUP", or "ESTER_NATURAL"
            
        Returns:
            Estimated missing_data_faa factor (clamped between 0.5 and 2.0)
        """
        ref_hotspot = {
            "STANDARD": 98.0,
            "TUP": 110.0,
            "ESTER_NATURAL": 120.0
        }.get(insulation_type.upper(), 98.0)
        
        # Estimate typical hot-spot temperature from ambient (conservative estimate)
        estimated_hotspot = avg_ambient_temp + 30.0
        faa = np.power(2.0, (estimated_hotspot - ref_hotspot) / 6.0)
        return max(0.5, min(2.0, faa))
    
    # ========================
    # Data Loaders
    # ========================
    
    @staticmethod
    def load_from_csv(
        file_path: str,
        timestamp_col: str = "Timestamp",
        datetime_format: Optional[str] = None,
        dayfirst: bool = False,
        **csv_kwargs: Any
    ) -> pd.DataFrame:
        """
        Load transformer measurement data from CSV file.
        
        Args:
            file_path: Path to CSV file
            timestamp_col: Name of the timestamp column
            datetime_format: Format string for datetime parsing (optional)
            dayfirst: If True, parse dates with day first (e.g., 01/12/2023 -> 1 Dec)
            **csv_kwargs: Additional arguments passed to pandas.read_csv
            
        Returns:
            DataFrame with parsed timestamps
            
        Raises:
            FileNotFoundError: If file_path does not exist
            ValueError: If timestamp column cannot be parsed
        """
        df = pd.read_csv(file_path, **csv_kwargs)
        
        # Parse timestamp column
        if datetime_format:
            df[timestamp_col] = pd.to_datetime(
                df[timestamp_col],
                format=datetime_format,
                dayfirst=dayfirst
            )
        else:
            # Try different parsing strategies
            try:
                df[timestamp_col] = pd.to_datetime(
                    df[timestamp_col],
                    infer_datetime_format=True,
                    dayfirst=dayfirst
                )
            except (ValueError, TypeError):
                try:
                    df[timestamp_col] = pd.to_datetime(
                        df[timestamp_col],
                        format='mixed',
                        dayfirst=dayfirst
                    )
                except (ValueError, TypeError):
                    df[timestamp_col] = pd.to_datetime(df[timestamp_col])
        
        return df
    
    @staticmethod
    def load_from_sqlite(
        db_path: str,
        query: str,
        timestamp_col: str = "Timestamp"
    ) -> pd.DataFrame:
        """
        Load transformer measurement data from SQLite database.
        
        Args:
            db_path: Path to SQLite database file
            query: SQL query to execute
            timestamp_col: Name of the timestamp column for parsing
            
        Returns:
            DataFrame with parsed timestamps
        """
        conn = sqlite3.connect(db_path)
        df = pd.read_sql_query(query, conn, parse_dates=[timestamp_col])
        conn.close()
        return df
    
    @staticmethod
    def load_from_postgresql(
        connection_string: str,
        query: str,
        timestamp_col: str = "Timestamp"
    ) -> pd.DataFrame:
        """
        Load transformer measurement data from PostgreSQL database.
        
        Args:
            connection_string: SQLAlchemy connection string
            query: SQL query to execute
            timestamp_col: Name of the timestamp column for parsing
            
        Returns:
            DataFrame with parsed timestamps
            
        Raises:
            ImportError: If sqlalchemy is not installed
        """
        try:
            from sqlalchemy import create_engine
        except ImportError:
            raise ImportError(
                "SQLAlchemy is required for PostgreSQL support. "
                "Install it with: pip install sqlalchemy psycopg2-binary"
            )
        
        engine = create_engine(connection_string)
        df = pd.read_sql_query(query, engine, parse_dates=[timestamp_col])
        engine.dispose()
        return df
    
    # ========================
    # Private Calculation Methods
    # ========================
    
    def _resample_to_hourly(self, df: pd.DataFrame, time_col: str) -> pd.DataFrame:
        """Resample data to hourly frequency using interpolation."""
        df_hourly = df.copy()
        df_hourly[time_col] = pd.to_datetime(df_hourly[time_col])
        df_hourly = df_hourly.set_index(time_col).sort_index()
        # Use 'h' instead of deprecated 'H'
        df_hourly = df_hourly.resample('h').mean().interpolate(limit_direction='both')
        return df_hourly.reset_index()
    
    def _faa(self, theta_hs: Union[float, np.ndarray]) -> np.ndarray:
        """
        Calculate the Relative Aging Acceleration Factor (FAA).
        
        Uses the Arrhenius equation for all insulation types
        as per IEC 60076-7 for better accuracy at all temperatures.
        
        Args:
            theta_hs: Hot-spot temperature in Celsius
            
        Returns:
            FAA array (same shape as input)
        """
        theta_hs = np.asarray(theta_hs, dtype=float)
        
        # Arrhenius model for all insulation types
        T_ref = self.ref_temp + 273.15
        T_hs = theta_hs + 273.15
        R_g = 8.314
        return np.exp((self.Ea / R_g) * (1.0 / T_ref - 1.0 / T_hs))
    
    def _generate_recommendations(self, result: Dict[str, Any]) -> List[str]:
        """
        Generate recommendations based on estimation results.
        
        Args:
            result: Estimation results dictionary
            
        Returns:
            List of recommendation strings
        """
        recommendations = []
        
        # Check remaining life
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
        
        # Check hot-spot temperature
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
        
        # Check FAA
        max_faa = result["life_estimation"]["dynamic_gradient"].get("max_faa", 1)
        if max_faa > 10:
            recommendations.append(
                "🚨 Extreme ageing rate detected (FAA > 10). "
                "Immediate action required!"
            )
        elif max_faa > 5:
            recommendations.append(
                "⚠️ High ageing rate detected (FAA > 5). "
                "Check load profile and cooling system."
            )
        else:
            recommendations.append(
                "✅ Ageing rate is within acceptable limits."
            )
        
        # Check load factor
        max_load = result["life_estimation"]["dynamic_gradient"].get("max_load_factor", 0)
        if max_load > 1.3:
            recommendations.append(
                "🚨 Overload detected (Load Factor > 1.3 pu). "
                "Reduce load immediately!"
            )
        elif max_load > 1.0:
            recommendations.append(
                "⚠️ Transformer is operating above rated load. "
                "Monitor closely and consider load management."
            )
        
        # Check top oil temperature
        max_oil = result["life_estimation"]["dynamic_gradient"].get("max_top_oil_temp", 0)
        if max_oil > 95:
            recommendations.append(
                "🚨 Top oil temperature exceeded 95°C. "
                "Check cooling system immediately!"
            )
        
        # General recommendation
        if max_hs <= 110 and max_faa <= 5 and remaining >= 10:
            recommendations.append(
                "🔧 Continue routine monitoring and ensure cooling system is fully operational."
            )
        
        return recommendations
    
    def _check_alerts(self, result: Dict[str, Any]) -> Dict[str, bool]:
        """
        Check for alerts based on estimation results.
        
        Args:
            result: Estimation results dictionary
            
        Returns:
            Dictionary with alert flags
        """
        alerts = {
            "hot_spot_exceeded_120": False,
            "faa_exceeded_10": False,
            "remaining_life_less_than_5": False,
            "load_factor_exceeded_1_3": False,
            "top_oil_exceeded_95": False
        }
        
        # Check hot-spot temperature
        max_hs = result["life_estimation"]["dynamic_gradient"]["max_hotspot_temp"]
        if max_hs > 120:
            alerts["hot_spot_exceeded_120"] = True
        
        # Check FAA
        max_faa = result["life_estimation"]["dynamic_gradient"].get("max_faa", 0)
        if max_faa > 10:
            alerts["faa_exceeded_10"] = True
        
        # Check remaining life
        remaining = result["overall_remaining_life"]["remaining_life_years"]
        if remaining < 5:
            alerts["remaining_life_less_than_5"] = True
        
        # Check load factor
        max_load = result["life_estimation"]["dynamic_gradient"].get("max_load_factor", 0)
        if max_load > 1.3:
            alerts["load_factor_exceeded_1_3"] = True
        
        # Check top oil temperature
        max_oil = result["life_estimation"]["dynamic_gradient"].get("max_top_oil_temp", 0)
        if max_oil > 95:
            alerts["top_oil_exceeded_95"] = True
        
        return alerts
    
    # ========================
    # Main Public Methods
    # ========================
    
    def estimate_life(
        self,
        df: pd.DataFrame,
        top_oil_col: str,
        ambient_col: str = "Ambient_Temperature",
        current_col: str = "Current",
        timestamp_col: str = "Timestamp",
        missing_data_faa: Optional[float] = None,
        auto_estimate_missing: bool = False
    ) -> Dict[str, Any]:
        """
        Estimate consumed transformer life using two methods.
        
        Method 1: Dynamic gradient based on oil temperature (Primary)
        Method 2: Load current based estimation (Validation)
        
        Args:
            df: DataFrame with measurement data
            top_oil_col: Column name for top oil temperature
            ambient_col: Column name for ambient temperature
            current_col: Column name for load current (Amperes)
            timestamp_col: Column name for timestamps
            missing_data_faa: Aging factor for pre-monitoring period.
                              If None and auto_estimate_missing=True, it will be estimated.
            auto_estimate_missing: If True, estimate missing_data_faa from ambient temp
            
        Returns:
            Dictionary containing:
            - transformer_info: Transformer specifications
            - overall_remaining_life: For gauge display (includes total_elapsed_life_years)
            - current_thermal_state: Last record values
            - life_estimation: Results from both methods
            - comparison: Difference between the two methods
            - time_series: Data for trends
            - pre_monitoring_penalty: Missing data period info
            - iec_thermal_params: IEC thermal parameters
            - recommendations: List of recommendations
            - alerts: Alert flags
            
        Raises:
            ValueError: If required columns are missing from DataFrame
        """
        # Validate required columns
        required_cols = [top_oil_col, ambient_col, current_col, timestamp_col]
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise ValueError(f"Missing required columns: {missing_cols}")
        
        # Resample to hourly intervals
        df_hourly = self._resample_to_hourly(df, timestamp_col)
        first_ts = df_hourly[timestamp_col].min()
        last_ts = df_hourly[timestamp_col].max()
        total_hours = len(df_hourly)
        
        # Calculate missing years before data collection
        missing_days = max((first_ts - self.installation_date).days, 0)
        missing_years = missing_days / 365.25
        mission_period_years = (last_ts - self.installation_date).days / 365.25
        
        # Determine missing_data_faa
        if missing_data_faa is None:
            if auto_estimate_missing:
                avg_ambient = df_hourly[ambient_col].mean()
                missing_data_faa = self.estimate_missing_faa_from_avg_ambient(
                    avg_ambient, self.insulation_type
                )
            else:
                missing_data_faa = 1.15  # Default conservative value
        
        # Calculate equivalent aging for missing period
        equivalent_aging_missing = missing_years * missing_data_faa
        initial_remaining = max(self.design_life_years - equivalent_aging_missing, 0)
        
        # ---- Method 1: Dynamic gradient from oil temperature (Primary) ----
        delta_to = df_hourly[top_oil_col] - df_hourly[ambient_col]
        delta_h = self.d_hs_r * (np.maximum(delta_to, 0) / self.d_to_r) ** self.y
        theta_hs = df_hourly[top_oil_col] + delta_h
        faa_series = self._faa(theta_hs)
        aging_total = faa_series.sum()
        consumed_years = aging_total / 8760.0
        
        # Calculate total elapsed life (missing period + monitoring period)
        total_elapsed_life = equivalent_aging_missing + consumed_years
        remaining_years = max(self.design_life_years - total_elapsed_life, 0)
        life_used_percent = (total_elapsed_life / self.design_life_years) * 100
        
        dynamic_gradient_result = {
            "method": "Dynamic Gradient from Oil Temperature",
            "consumed_life_years": round(consumed_years, 4),
            "remaining_life_years": round(remaining_years, 4),
            "life_used_percent": round(life_used_percent, 1),
            "average_faa": round(aging_total / total_hours, 4),
            "max_hotspot_temp": round(theta_hs.max(), 2),
            "avg_hotspot_temp": round(theta_hs.mean(), 2),
            "max_top_oil_temp": round(df_hourly[top_oil_col].max(), 2),
            "max_load_factor": round((df_hourly[current_col] / self.rated_current).max(), 3) if self.rated_current else None,
            "max_faa": round(faa_series.max(), 4),
            "equivalent_aging_hours": round(aging_total, 2)
        }
        
        # ---- Current Thermal State (Last Record) ----
        last_idx = -1
        current_load_factor = (df_hourly[current_col].iloc[last_idx] / self.rated_current) if self.rated_current else None
        # faa_series is a numpy array, use direct indexing
        current_faa = faa_series[last_idx]
        
        current_thermal_state = {
            "hot_spot_current": round(theta_hs.iloc[last_idx], 2),
            "top_oil_current": round(df_hourly[top_oil_col].iloc[last_idx], 2),
            "ambient_current": round(df_hourly[ambient_col].iloc[last_idx], 2),
            "faa_current": round(float(current_faa), 4),
            "load_factor_current": round(float(current_load_factor), 3) if current_load_factor is not None else None
        }
        
        # ---- Method 2: Load current based estimation (Validation) ----
        load_current_result = {}
        if self.rated_current is not None:
            K = (df_hourly[current_col] / self.rated_current).clip(lower=0)
            delta_to_load = self.d_to_r * ((K**2 * self.R + 1) / (self.R + 1)) ** self.x
            delta_hs_load = self.d_hs_r * (K ** self.y)
            theta_hs_load = df_hourly[ambient_col] + delta_to_load + delta_hs_load
            aging_load = self._faa(theta_hs_load).sum()
            consumed_load = aging_load / 8760.0
            
            # Calculate remaining life based on validation method
            remaining_load = max(self.design_life_years - (equivalent_aging_missing + consumed_load), 0)
            
            load_current_result = {
                "method": "Load Current Based (without H-factor)",
                "loss_ratio_R_used": round(self.R, 2),
                "oil_exponent_x_used": self.x,
                "winding_exponent_y_used": self.y,
                "consumed_life_years": round(consumed_load, 4),
                "remaining_life_years": round(remaining_load, 4),
                "average_faa": round(aging_load / total_hours, 4),
                "max_hotspot_temp": round(theta_hs_load.max(), 2),
                "avg_hotspot_temp": round(theta_hs_load.mean(), 2)
            }
        else:
            load_current_result = {
                "skipped": "Rated current not available (provide rated_power_mva and rated_voltage_kv)"
            }
        
        # ---- Comparison between methods ----
        comparison = {}
        if "error" not in load_current_result and "skipped" not in load_current_result:
            diff_years = abs(
                dynamic_gradient_result["consumed_life_years"] -
                load_current_result["consumed_life_years"]
            )
            diff_percent = round(
                diff_years / max(dynamic_gradient_result["consumed_life_years"], 0.001) * 100, 2
            )
            
            status = "Excellent Agreement"
            if diff_percent > 10:
                status = "Warning: Parameters may need calibration"
            elif diff_percent > 20:
                status = "Critical: Significant discrepancy"
            
            comparison = {
                "difference_years": round(diff_years, 4),
                "difference_percent": diff_percent,
                "status": status,
                "note": "Difference < 10% indicates good thermal parameter calibration"
            }
        
        # ---- Time Series Data for Trends ----
        time_series = {
            "timestamps": df_hourly[timestamp_col].astype(str).tolist(),
            "hot_spot_temperature": theta_hs.tolist(),
            "top_oil_temperature": df_hourly[top_oil_col].tolist(),
            "ambient_temperature": df_hourly[ambient_col].tolist(),
            "faa": faa_series.tolist(),
            "load_factor": (df_hourly[current_col] / self.rated_current).tolist() if self.rated_current else None
        }
        
        # ---- Results Dictionary ----
        results: Dict[str, Any] = {
            "transformer_info": self.get_transformer_info(),
            "overall_remaining_life": {
                "design_life_years": self.design_life_years,
                "total_elapsed_life_years": round(total_elapsed_life, 1),
                "remaining_life_years": round(remaining_years, 1),
                "life_used_percent": round(life_used_percent, 1)
            },
            "current_thermal_state": current_thermal_state,
            "life_estimation": {
                "dynamic_gradient": dynamic_gradient_result,
                "load_current": load_current_result
            },
            "comparison": comparison,
            "time_series": time_series,
            "pre_monitoring_penalty": {
                "mission_period_years": round(mission_period_years, 2),
                "missing_years": round(missing_years, 2),
                "missing_data_faa_used": round(missing_data_faa, 3),
                "equivalent_aging_missing": round(equivalent_aging_missing, 4),
                "remaining_life_before_monitoring": round(initial_remaining, 4)
            },
            "iec_thermal_params": {
                "R_loss_ratio": self.R,
                "x_oil_exponent": self.x,
                "y_winding_exponent": self.y,
                "d_to_r": self.d_to_r,
                "d_hs_r": self.d_hs_r,
                "ref_temp": self.ref_temp
            }
        }
        
        # Generate recommendations
        results["recommendations"] = self._generate_recommendations(results)
        
        # Check alerts
        results["alerts"] = self._check_alerts(results)
        
        return results
    
    def get_transformer_info(self) -> Dict[str, Any]:
        """
        Get transformer specifications summary.
        
        Returns:
            Dictionary with transformer specifications
        """
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
                "d_hs_r": self.d_hs_r
            }
        }