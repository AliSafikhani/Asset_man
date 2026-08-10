# tests/test_dta.py
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from DTA.core.engine import run_dta_analysis

# داده مرجع (روغن اصیل)
reference_curve = {
    "temperature": [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150],
    "signal": [0.0, 0.0, 0.1, 0.3, 0.6, 0.9, 0.7, 0.4, 0.2, 0.1, 0.0]
}

# روغن اصیل (بسیار نزدیک به مرجع)
original_curve = {
    "temperature": [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150],
    "signal": [0.0, 0.0, 0.11, 0.31, 0.61, 0.89, 0.71, 0.41, 0.19, 0.1, 0.0]
}

# روغن تقلبی - پیک به دمای بالاتر رفته (مشکل در Tmax و Tonset)
fake_curve_1 = {
    "temperature": [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150],
    "signal": [0.0, 0.0, 0.0, 0.05, 0.2, 0.5, 0.8, 0.6, 0.3, 0.1, 0.0]
    # Tonset از 70 به 90 رسیده، Tmax از 100 به 110 رسیده
}

# روغن تقلبی - پیک زودتر آمده و شدیدتر است
fake_curve_2 = {
    "temperature": [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150],
    "signal": [0.0, 0.05, 0.3, 0.7, 1.1, 0.8, 0.4, 0.2, 0.1, 0.0, 0.0]
    # Tonset زودتر (60 به جای 70)، Tmax زودتر (90 به جای 100)
}

print("=" * 50)
print("تست DTA - روغن اصیل (باید original)")
print("=" * 50)
result_original = run_dta_analysis(original_curve, reference_curve)
print(f"وضعیت: {result_original['evaluation']['status']}")
print(f"جزئیات: delta_tonset={result_original['evaluation']['details']['delta_tonset']}, delta_tmax={result_original['evaluation']['details']['delta_tmax']}, delta_delta_t={result_original['evaluation']['details']['delta_delta_t']:.2f}")

print("\n" + "=" * 50)
print("تست DTA - روغن تقلبی نوع 1 (باید fake یا suspicious)")
print("=" * 50)
result_fake1 = run_dta_analysis(fake_curve_1, reference_curve)
print(f"وضعیت: {result_fake1['evaluation']['status']}")
print(f"جزئیات: delta_tonset={result_fake1['evaluation']['details']['delta_tonset']}, delta_tmax={result_fake1['evaluation']['details']['delta_tmax']}, delta_delta_t={result_fake1['evaluation']['details']['delta_delta_t']:.2f}")

print("\n" + "=" * 50)
print("تست DTA - روغن تقلبی نوع 2 (باید fake یا suspicious)")
print("=" * 50)
result_fake2 = run_dta_analysis(fake_curve_2, reference_curve)
print(f"وضعیت: {result_fake2['evaluation']['status']}")
print(f"جزئیات: delta_tonset={result_fake2['evaluation']['details']['delta_tonset']}, delta_tmax={result_fake2['evaluation']['details']['delta_tmax']}, delta_delta_t={result_fake2['evaluation']['details']['delta_delta_t']:.2f}")