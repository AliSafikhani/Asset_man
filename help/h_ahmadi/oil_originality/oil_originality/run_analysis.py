# run_analysis.py
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from data_loader import load_curve_from_files, align_curves
from DSC.core.engine import run_dsc_analysis
from DTA.core.engine import run_dta_analysis

# مسیر فایل‌های مرجع و نمونه (بر اساس ساختار فعلی)
ref_dsc_x = "data/reference/DSC-x.txt"
ref_dsc_y = "data/reference/DSC-y.txt"
ref_dta_x = "data/reference/DTA-x.txt"
ref_dta_y = "data/reference/DTA-y.txt"

sample_dsc_x = "data/sample/DSC-x.txt"
sample_dsc_y = "data/sample/DSC-y.txt"
sample_dta_x = "data/sample/DTA-x.txt"
sample_dta_y = "data/sample/DTA-y.txt"

print("📂 در حال بارگذاری داده‌ها...")

ref_dsc = load_curve_from_files(ref_dsc_x, ref_dsc_y)
sample_dsc = load_curve_from_files(sample_dsc_x, sample_dsc_y)
ref_dta = load_curve_from_files(ref_dta_x, ref_dta_y)
sample_dta = load_curve_from_files(sample_dta_x, sample_dta_y)

if ref_dsc is None or sample_dsc is None or ref_dta is None or sample_dta is None:
    print("❌ خطا در بارگذاری یک یا چند فایل. برنامه متوقف شد.")
    sys.exit(1)

print("✅ داده‌ها با موفقیت بارگذاری شدند.")

# هم‌تراز کردن دماها (در صورت نیاز)
sample_dsc = align_curves(sample_dsc, ref_dsc)
sample_dta = align_curves(sample_dta, ref_dta)

print("\n" + "="*50)
print("📊 تحلیل DSC")
print("="*50)
dsc_result = run_dsc_analysis(sample_dsc, ref_dsc)
print(f"✅ وضعیت DSC: {dsc_result['evaluation']['status']}")
print(f"📋 جزئیات: {dsc_result['evaluation']['details']}")

print("\n" + "="*50)
print("📊 تحلیل DTA")
print("="*50)
dta_result = run_dta_analysis(sample_dta, ref_dta)
print(f"✅ وضعیت DTA: {dta_result['evaluation']['status']}")
print(f"📋 جزئیات: {dta_result['evaluation']['details']}")