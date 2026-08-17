#!/usr/bin/env python
"""
Transformer Life Estimation from CSV Data
IEEE C57.91-2011 compliant.

Usage:
    python run_estimation.py path/to/data.csv

If no argument is provided, the script will look for 'data.csv' in the current directory.
"""

import sys
import os
import pandas as pd
from datetime import datetime

# Import the estimator class and data models
from thermal_life_IEEEC57 import TransformerLifeEstimator, TransformerSpecs, HourlyData


def load_data_from_csv(filepath: str) -> HourlyData:
    """
    Load hourly transformer data from CSV file.

    Expected CSV columns (case-sensitive):
        - Timestamp                  : datetime (e.g., '2023-01-01 00:00:00')
        - Ambient_Temperature        : float [°C]
        - Current                    : float [A]
        - Top_Oil_Temperature        : float [°C]  (optional)
        - Winding_Temperature        : float [°C]  (optional)

    At least one of Top_Oil_Temperature or Winding_Temperature must be present.
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"CSV file not found: {filepath}")

    df = pd.read_csv(filepath)

    # Validate required columns
    required = ["Ambient_Temperature", "Current"]
    for col in required:
        if col not in df.columns:
            raise ValueError(f"Required column '{col}' missing. Available: {df.columns.tolist()}")

    # Timestamp column (can be named differently)
    if "Timestamp" not in df.columns:
        # Try to guess: first column might be timestamp
        df = df.rename(columns={df.columns[0]: "Timestamp"})
    df["Timestamp"] = pd.to_datetime(df["Timestamp"])

    # Optional columns
    top_oil = df["Top_Oil_Temperature"].tolist() if "Top_Oil_Temperature" in df.columns else None
    winding = df["Winding_Temperature"].tolist() if "Winding_Temperature" in df.columns else None

    if top_oil is None and winding is None:
        raise ValueError("At least one of 'Top_Oil_Temperature' or 'Winding_Temperature' must be provided.")

    data = HourlyData(
        timestamps=df["Timestamp"].tolist(),
        ambient_temperature=df["Ambient_Temperature"].tolist(),
        current=df["Current"].tolist(),
        top_oil_temperature=top_oil,
        winding_temperature=winding
    )

    print(f"✅ Loaded {len(data.timestamps)} records from {filepath}")
    return data


def main():
    # Determine CSV file path
    if len(sys.argv) > 1:
        csv_path = sys.argv[1]
    elif os.path.exists("transformer_hourly_data_2025.csv"):
        csv_path = "transformer_hourly_data_2025.csv"
    else:
        print("❌ No CSV file provided.")
        print("Usage: python run_estimation.py path/to/data.csv")
        print("Or place a file named 'data.csv' in the current directory.")
        sys.exit(1)

    try:
        data = load_data_from_csv(csv_path)
    except Exception as e:
        print(f"❌ Error loading CSV: {e}")
        sys.exit(1)

    # ------------------------------------------------------------
    # Define transformer specifications (MUST BE ADAPTED TO YOUR UNIT)
    # ------------------------------------------------------------
    specs = TransformerSpecs(
        installation_date=datetime(2010, 6, 15),   # ← change to actual commissioning date
        cooling_type="ONAF",                        # ← change to actual cooling (ONAN, ONAF, OFAF, ODAF)
        loss_ratio=7.0,                             # ← change if known (R = load loss / no‑load loss)
        top_oil_rise_rated=60.0,                    # ← change if known (top‑oil rise at rated load [°C])
        hot_spot_rise_rated=25.0,                   # ← change if known (hot‑spot rise over top‑oil [°C])
        hotspot_delta=15.0,                         # difference between hot‑spot and average winding temp
        missing_data_faa=1.15                       # average FAA for periods without data
    )

    # Create estimator and run
    estimator = TransformerLifeEstimator(specs)
    report = estimator.estimate(data)

    # ------------------------------------------------------------
    # Print results in a clear, structured format
    # ------------------------------------------------------------
    print("\n" + "=" * 70)
    print("📊 TRANSFORMER LIFE ESTIMATION REPORT")
    print("=" * 70)
    print(f"📅 Design life: {estimator.design_life_years:.1f} years")
    print(f"⏳ Pre‑monitoring remaining life: {report['pre_monitoring_penalty']['remaining_life_before_monitoring']:.2f} years\n")

    for method, res in report["life_estimation_methods"].items():
        print(f"--- Method: {method} ---")
        if "error" in res:
            print(f"  ❌ Error: {res['error']}")
        elif "skipped" in res:
            print(f"  ⏭️ Skipped: {res['skipped']}")
        else:
            print(f"  📉 Consumed life: {res['consumed_life_years']:.4f} years")
            print(f"  📈 Remaining life: {res['remaining_life_years']:.4f} years")
            print(f"  📊 Average FAA: {res['average_faa']:.4f}")
            print(f"  🌡️ Max hot‑spot: {res['max_hotspot_temp']:.1f} °C")
            if res.get("max_top_oil_temp"):
                print(f"  🌡️ Max top‑oil: {res['max_top_oil_temp']:.1f} °C")
            if res.get("warnings"):
                print(f"  ⚠️ Warnings: {res['warnings']}")

    if report["warnings"]:
        print(f"\n⚠️ All warnings: {set(report['warnings'])}")

    print("\n✅ Estimation complete.")


if __name__ == "__main__":
    main()