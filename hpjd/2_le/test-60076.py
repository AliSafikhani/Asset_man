"""
Test Script for TransformerLifeEstimator with Real CSV Data
===========================================================

This script reads a CSV file containing transformer measurement data
and runs the complete life estimation using the IEC 60076-7 standard.

The output format is fully compatible with the first dashboard design
(Report-style, Light Theme) and includes the new "Total Elapsed Life" parameter.

Usage:
    python test-60076.py

The script will look for a CSV file named "transformer_hourly_data_2025.csv"
in the current directory. You can change the filename in the code below.

Required CSV columns:
    - Timestamp: Date and time (any parsable format)
    - Top_Oil_Temperature: Top oil temperature in °C
    - Ambient_Temperature: Ambient temperature in °C
    - Current: Load current in Amperes
"""

import pandas as pd
import numpy as np
from datetime import datetime
import json
from thermal_life_IEC60076 import TransformerLifeEstimator


# ================================
# CONFIGURATION - EDIT THIS SECTION
# ================================

# CSV file path
CSV_FILE = "transformer_hourly_data_2025.csv"

# Transformer specifications (adjust according to your transformer)
TRANSFORMER_CONFIG = {
    "transformer_id": "TR-101",
    "installation_date": "2015-01-01",  # When the transformer was installed
    "insulation_type": "STANDARD",       # STANDARD, TUP, or ESTER_NATURAL
    "design_life_years": 30,             # Design life in years
    "cooling_type": "ONAN",              # ONAN, ONAF, OFAF, ODAF
    "rated_power_mva": 10,               # Rated power in MVA
    "rated_voltage_kv": 132,             # Rated voltage in kV
    "loss_ratio": 6.0,                   # Load loss / no-load loss ratio
    "manufacturer": "Unknown"
}

# Column names in CSV (modify if your CSV has different column names)
COLUMN_MAPPING = {
    "timestamp": "Timestamp",
    "top_oil": "Top_Oil_Temperature",
    "ambient": "Ambient_Temperature",
    "current": "Current"
}

# Estimation parameters
ESTIMATION_CONFIG = {
    "missing_data_faa": 1.15,      # Aging factor for missing data period
    "auto_estimate_missing": False # Set True to auto-estimate from ambient temp
}


# ================================
# HELPER FUNCTIONS
# ================================

def print_section(title: str, char: str = "=", length: int = 70) -> None:
    """Print a formatted section header."""
    print("\n" + char * length)
    print(f" {title}")
    print(char * length)


def print_dict(data: dict, indent: int = 4, max_depth: int = 2) -> None:
    """Pretty print a dictionary with indentation."""
    for key, value in data.items():
        if isinstance(value, dict) and max_depth > 0:
            print(" " * indent + f"{key}:")
            print_dict(value, indent + 4, max_depth - 1)
        elif isinstance(value, list):
            if len(value) > 10:
                print(" " * indent + f"{key}: [{len(value)} items] (truncated)")
                if len(value) > 0:
                    print(" " * indent + f"  First 3 items: {value[:3]}")
            else:
                print(" " * indent + f"{key}: {value}")
        else:
            print(" " * indent + f"{key}: {value}")


def load_and_prepare_data(csv_path: str, column_map: dict) -> pd.DataFrame:
    """
    Load CSV data and prepare it for the estimator.
    
    Args:
        csv_path: Path to CSV file
        column_map: Dictionary mapping column names
        
    Returns:
        DataFrame with renamed columns
    """
    print(f"\n[1] Loading data from: {csv_path}")
    
    try:
        # Load CSV with automatic date parsing
        df = pd.read_csv(csv_path)
        print(f"    Loaded {len(df):,} records")
        print(f"    Columns: {list(df.columns)}")
        
        # Rename columns if needed
        rename_map = {
            column_map["timestamp"]: "Timestamp",
            column_map["top_oil"]: "Top_Oil_Temperature",
            column_map["ambient"]: "Ambient_Temperature",
            column_map["current"]: "Current"
        }
        
        # Only rename columns that exist
        rename_map = {k: v for k, v in rename_map.items() if k in df.columns}
        if rename_map:
            df = df.rename(columns=rename_map)
        
        # Ensure Timestamp is datetime
        df["Timestamp"] = pd.to_datetime(df["Timestamp"])
        
        print(f"    Date range: {df['Timestamp'].min()} to {df['Timestamp'].max()}")
        print(f"    Records: {len(df):,}")
        
        # Data statistics
        print(f"\n    Data Statistics:")
        print(f"        Top Oil Temp: {df['Top_Oil_Temperature'].min():.1f}°C to {df['Top_Oil_Temperature'].max():.1f}°C (avg: {df['Top_Oil_Temperature'].mean():.1f}°C)")
        print(f"        Ambient Temp: {df['Ambient_Temperature'].min():.1f}°C to {df['Ambient_Temperature'].max():.1f}°C (avg: {df['Ambient_Temperature'].mean():.1f}°C)")
        print(f"        Current: {df['Current'].min():.1f}A to {df['Current'].max():.1f}A (avg: {df['Current'].mean():.1f}A)")
        
        return df
        
    except FileNotFoundError:
        print(f"❌ ERROR: File not found: {csv_path}")
        print("   Please check the file path and try again.")
        raise
    except Exception as e:
        print(f"❌ ERROR loading CSV: {e}")
        raise


def display_results(result: dict) -> None:
    """Display estimation results in a readable format."""
    
    # ---- Overall Remaining Life ----
    print_section("1. OVERALL REMAINING LIFE")
    print(f"    Design Life: {result['overall_remaining_life']['design_life_years']} years")
    print(f"    Total Elapsed Life: {result['overall_remaining_life']['total_elapsed_life_years']} years  ← عمر رفته‌ی کل (جمع دوره‌های بدون داده و داده‌ها)")
    print(f"    Remaining Life: {result['overall_remaining_life']['remaining_life_years']} years")
    print(f"    Life Used: {result['overall_remaining_life']['life_used_percent']}%  ← درصد عمر مصرف‌شده نسبت به کل عمر طراحی")
    
    # ---- Current Thermal State ----
    print_section("2. CURRENT THERMAL STATE")
    cts = result["current_thermal_state"]
    print(f"    Hot-Spot Temperature: {cts['hot_spot_current']} °C")
    print(f"    Top-Oil Temperature: {cts['top_oil_current']} °C")
    print(f"    Ambient Temperature: {cts['ambient_current']} °C")
    print(f"    FAA (Current): {cts['faa_current']}")
    print(f"    Load Factor (Current): {cts['load_factor_current']} pu")
    
    # ---- Primary Method ----
    print_section("3. PRIMARY METHOD: Dynamic Gradient from Oil Temperature")
    dg = result["life_estimation"]["dynamic_gradient"]
    print(f"    Consumed Life (Monitoring Period): {dg['consumed_life_years']} years")
    print(f"    Remaining Life (Total): {dg['remaining_life_years']} years")
    print(f"    Life Used (Total): {dg['life_used_percent']}%")
    print(f"    Average FAA: {dg['average_faa']}")
    print(f"    Max FAA: {dg['max_faa']}")
    print(f"    Max Hot-Spot Temp: {dg['max_hotspot_temp']} °C")
    print(f"    Avg Hot-Spot Temp: {dg['avg_hotspot_temp']} °C")
    print(f"    Max Top-Oil Temp: {dg['max_top_oil_temp']} °C")
    print(f"    Max Load Factor: {dg['max_load_factor']} pu")
    print(f"    Equivalent Aging Hours: {dg['equivalent_aging_hours']:,.2f} hours")
    
    # ---- Validation Method ----
    print_section("4. VALIDATION METHOD: Load Current Based")
    lc = result["life_estimation"]["load_current"]
    if "skipped" in lc:
        print(f"    ⚠️ {lc['skipped']}")
    elif "error" in lc:
        print(f"    ❌ Error: {lc['error']}")
    else:
        print(f"    Consumed Life (Monitoring Period): {lc['consumed_life_years']} years")
        print(f"    Remaining Life (Total): {lc['remaining_life_years']} years")
        print(f"    Average FAA: {lc['average_faa']}")
        print(f"    Max Hot-Spot Temp: {lc['max_hotspot_temp']} °C")
        print(f"    Loss Ratio R: {lc['loss_ratio_R_used']}")
        print(f"    Oil Exponent x: {lc['oil_exponent_x_used']}")
        print(f"    Winding Exponent y: {lc['winding_exponent_y_used']}")
    
    # ---- Comparison ----
    if result["comparison"]:
        print_section("5. METHODS COMPARISON")
        print(f"    Difference: {result['comparison']['difference_percent']}%")
        print(f"    Difference (Years): {result['comparison']['difference_years']} years")
        print(f"    Status: {result['comparison']['status']}")
        print(f"    Note: {result['comparison']['note']}")
    
    # ---- Pre-Monitoring ----
    print_section("6. PRE-MONITORING ASSESSMENT")
    pmp = result["pre_monitoring_penalty"]
    print(f"    Mission Period: {pmp['mission_period_years']} years")
    print(f"    Missing Years (No Data): {pmp['missing_years']} years")
    print(f"    Missing Data FAA Used: {pmp['missing_data_faa_used']}")
    print(f"    Equivalent Aging Missing: {pmp['equivalent_aging_missing']} years")
    print(f"    Remaining Life Before Monitoring: {pmp['remaining_life_before_monitoring']} years")
    
    # ---- IEC Parameters ----
    print_section("7. IEC THERMAL PARAMETERS (Steady-State)")
    iec = result["iec_thermal_params"]
    print(f"    R (Loss Ratio): {iec['R_loss_ratio']}")
    print(f"    x (Oil Exponent): {iec['x_oil_exponent']}")
    print(f"    y (Winding Exponent): {iec['y_winding_exponent']}")
    print(f"    d_to_r (Rated Oil Rise): {iec['d_to_r']} °C")
    print(f"    d_hs_r (Rated Hot-Spot Rise): {iec['d_hs_r']} °C")
    print(f"    Reference Temperature: {iec['ref_temp']} °C")
    
    # ---- Recommendations ----
    print_section("8. RECOMMENDATIONS")
    for i, rec in enumerate(result["recommendations"], 1):
        print(f"    {i}. {rec}")
    
    # ---- Alerts ----
    print_section("9. ALERTS")
    for key, value in result["alerts"].items():
        status = "⚠️ ACTIVE" if value else "✅ OK"
        # Convert key to readable format
        readable_key = key.replace("_", " ").title()
        print(f"    {readable_key}: {status}")
    
    # ---- Time Series Summary ----
    print_section("10. TIME SERIES DATA SUMMARY")
    ts = result["time_series"]
    print(f"    Total Records: {len(ts['timestamps']):,}")
    print(f"    Hot-spot Temperature: {min(ts['hot_spot_temperature']):.1f}°C to {max(ts['hot_spot_temperature']):.1f}°C")
    print(f"    Top-oil Temperature: {min(ts['top_oil_temperature']):.1f}°C to {max(ts['top_oil_temperature']):.1f}°C")
    print(f"    FAA: {min(ts['faa']):.3f} to {max(ts['faa']):.3f}")
    if ts['load_factor']:
        print(f"    Load Factor: {min(ts['load_factor']):.3f} to {max(ts['load_factor']):.3f}")


def save_results_to_json(result: dict, filename: str = "estimation_results.json") -> None:
    """Save results to a JSON file for dashboard integration."""
    
    def convert_to_serializable(obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, datetime):
            return obj.isoformat()
        return obj
    
    # Remove time_series to keep file size small
    result_for_json = result.copy()
    if "time_series" in result_for_json:
        result_for_json["time_series"] = {
            "records": len(result["time_series"]["timestamps"]),
            "note": "Full time series data omitted for file size. Available in result['time_series']"
        }
    
    with open(filename, 'w') as f:
        json.dump(result_for_json, f, indent=2, default=convert_to_serializable)
    print(f"\n✅ Results saved to: {filename}")


# ================================
# MAIN
# ================================

def main():
    """Main function to run the estimation with CSV data."""
    
    print("=" * 70)
    print(" TRANSFORMER LIFE ESTIMATOR - IEC 60076-7")
    print(" Real CSV Data Test (with Total Elapsed Life)")
    print("=" * 70)
    
    # 1. Load data from CSV
    df = load_and_prepare_data(CSV_FILE, COLUMN_MAPPING)
    
    # 2. Initialize estimator
    print("\n[2] Initializing estimator...")
    
    estimator = TransformerLifeEstimator(
        transformer_id=TRANSFORMER_CONFIG["transformer_id"],
        installation_date=TRANSFORMER_CONFIG["installation_date"],
        insulation_type=TRANSFORMER_CONFIG["insulation_type"],
        design_life_years=TRANSFORMER_CONFIG["design_life_years"],
        cooling_type=TRANSFORMER_CONFIG["cooling_type"],
        rated_power_mva=TRANSFORMER_CONFIG["rated_power_mva"],
        rated_voltage_kv=TRANSFORMER_CONFIG["rated_voltage_kv"],
        loss_ratio=TRANSFORMER_CONFIG["loss_ratio"],
        manufacturer=TRANSFORMER_CONFIG.get("manufacturer")
    )
    
    # Display transformer info
    info = estimator.get_transformer_info()
    print("\n    Transformer Specifications:")
    for key, value in info.items():
        if key != "thermal_params":
            print(f"        {key}: {value}")
    print("\n    Thermal Parameters:")
    for key, value in info["thermal_params"].items():
        print(f"        {key}: {value}")
    
    # 3. Run life estimation
    print("\n[3] Running life estimation...")
    
    result = estimator.estimate_life(
        df=df,
        top_oil_col="Top_Oil_Temperature",
        ambient_col="Ambient_Temperature",
        current_col="Current",
        timestamp_col="Timestamp",
        missing_data_faa=ESTIMATION_CONFIG["missing_data_faa"],
        auto_estimate_missing=ESTIMATION_CONFIG["auto_estimate_missing"]
    )
    
    # 4. Display results
    print_section("ESTIMATION RESULTS", "=")
    display_results(result)
    
    # 5. Save results to JSON
    save_results_to_json(result)
    
    print_section("TEST COMPLETED SUCCESSFULLY", "=")


if __name__ == "__main__":
    main()