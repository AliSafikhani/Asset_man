# tests/test_dsc.py
import sys
import os

# اضافه کردن مسیر اصلی پروژه به sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from DSC.core.engine import run_dsc_analysis

# داده‌های ساختگی
reference_curve = {
    "temperature": [50, 60, 70, 80, 90, 100, 110, 120, 130],
    "signal": [0.1, 0.1, 0.1, 0.2, 0.5, 0.8, 0.6, 0.2, 0.1]
}

sample_curve = {
    "temperature": [50, 60, 70, 80, 90, 100, 110, 120, 130],
    "signal": [0.1, 0.1, 0.1, 0.25, 0.55, 0.85, 0.65, 0.25, 0.1]
}

result = run_dsc_analysis(sample_curve, reference_curve)

print("=== نتیجه تحلیل DSC ===")
print(f"وضعیت: {result['evaluation']['status']}")
print(f"جزئیات: {result['evaluation']['details']}")