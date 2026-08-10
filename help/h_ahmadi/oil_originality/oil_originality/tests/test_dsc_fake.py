# tests/test_dsc_fake.py
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from DSC.core.engine import run_dsc_analysis

# داده مرجع (روغن اصیل استاندارد)
reference_curve = {
    "temperature": [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150],
    "signal": [0.1, 0.1, 0.1, 0.15, 0.3, 0.6, 0.9, 0.7, 0.3, 0.15, 0.1]
}

# =====================================================
# سناریو 1: روغن تقلبی (اختلاف زیاد در هر سه پارامتر)
# =====================================================
fake_curve = {
    "temperature": [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150],
    "signal": [0.1, 0.1, 0.2, 0.4, 0.8, 1.2, 1.1, 0.8, 0.4, 0.2, 0.1]  
    # Tonset دیرتر، Tmax بالاتر، مساحت بیشتر
}

print("=" * 50)
print("سناریو 1: روغن تقلبی")
print("=" * 50)

result1 = run_dsc_analysis(fake_curve, reference_curve)

print(f"وضعیت: {result1['evaluation']['status']}")
print(f"جزئیات:")
print(f"  اختلاف Tonset: {result1['evaluation']['details']['delta_tonset']:.2f}")
print(f"  اختلاف Tmax: {result1['evaluation']['details']['delta_tmax']:.2f}")
print(f"  اختلاف مساحت: {result1['evaluation']['details']['delta_area']:.2f}%")


# =====================================================
# سناریو 2: روغن مشکوک (یک پارامتر مشکل دارد)
# =====================================================
suspicious_curve = {
    "temperature": [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150],
    "signal": [0.1, 0.1, 0.1, 0.15, 0.3, 0.6, 1.3, 1.0, 0.4, 0.15, 0.1]
    # فقط Tmax خیلی بالا رفته
}

print("\n" + "=" * 50)
print("سناریو 2: روغن مشکوک")
print("=" * 50)

result2 = run_dsc_analysis(suspicious_curve, reference_curve)

print(f"وضعیت: {result2['evaluation']['status']}")
print(f"جزئیات:")
print(f"  اختلاف Tonset: {result2['evaluation']['details']['delta_tonset']:.2f}")
print(f"  اختلاف Tmax: {result2['evaluation']['details']['delta_tmax']:.2f}")
print(f"  اختلاف مساحت: {result2['evaluation']['details']['delta_area']:.2f}%")


# =====================================================
# سناریو 3: روغن تقلبی شدید (همه پارامترها خیلی دور)
# =====================================================
very_fake_curve = {
    "temperature": [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150],
    "signal": [0.1, 0.2, 0.5, 0.9, 1.1, 1.0, 0.7, 0.4, 0.2, 0.1, 0.05]
    # Tonset زودتر، Tmax پایین‌تر، مساحت متفاوت
}

print("\n" + "=" * 50)
print("سناریو 3: روغن تقلبی شدید")
print("=" * 50)

result3 = run_dsc_analysis(very_fake_curve, reference_curve)

print(f"وضعیت: {result3['evaluation']['status']}")
print(f"جزئیات:")
print(f"  اختلاف Tonset: {result3['evaluation']['details']['delta_tonset']:.2f}")
print(f"  اختلاف Tmax: {result3['evaluation']['details']['delta_tmax']:.2f}")
print(f"  اختلاف مساحت: {result3['evaluation']['details']['delta_area']:.2f}%")