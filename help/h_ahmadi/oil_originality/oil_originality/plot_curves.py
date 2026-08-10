# plot_curves.py
import matplotlib.pyplot as plt
from data_loader import load_curve_from_files, align_curves

# مسیر فایل‌های مرجع و نمونه
ref_dsc_x = "data/reference/DSC-x.txt"
ref_dsc_y = "data/reference/DSC-y.txt"
ref_dta_x = "data/reference/DTA-x.txt"
ref_dta_y = "data/reference/DTA-y.txt"

sample_dsc_x = "data/sample/DSC-x.txt"
sample_dsc_y = "data/sample/DSC-y.txt"
sample_dta_x = "data/sample/DTA-x.txt"
sample_dta_y = "data/sample/DTA-y.txt"

# بارگذاری داده‌ها
ref_dsc = load_curve_from_files(ref_dsc_x, ref_dsc_y)
sample_dsc = load_curve_from_files(sample_dsc_x, sample_dsc_y)
ref_dta = load_curve_from_files(ref_dta_x, ref_dta_y)
sample_dta = load_curve_from_files(sample_dta_x, sample_dta_y)

# هم‌تراز کردن دماها (برای رسم راحت‌تر)
sample_dsc = align_curves(sample_dsc, ref_dsc)
sample_dta = align_curves(sample_dta, ref_dta)

# ==========================================
# رسم نمودار DSC
# ==========================================
plt.figure(figsize=(12, 5))

plt.subplot(1, 2, 1)
plt.plot(ref_dsc["temperature"], ref_dsc["signal"], label="Reference (Original Oil)", color="blue", linewidth=2)
plt.plot(sample_dsc["temperature"], sample_dsc["signal"], label="Sample (Test Oil)", color="red", linestyle="--", linewidth=2)
plt.xlabel("Temperature (°C)")
plt.ylabel("Heat Flow (mW)")
plt.title("DSC Curve Comparison")
plt.legend()
plt.grid(True)

# ==========================================
# رسم نمودار DTA
# ==========================================
plt.subplot(1, 2, 2)
plt.plot(ref_dta["temperature"], ref_dta["signal"], label="Reference (Original Oil)", color="blue", linewidth=2)
plt.plot(sample_dta["temperature"], sample_dta["signal"], label="Sample (Test Oil)", color="red", linestyle="--", linewidth=2)
plt.xlabel("Temperature (°C)")
plt.ylabel("ΔT (Difference Temperature)")
plt.title("DTA Curve Comparison")
plt.legend()
plt.grid(True)

plt.tight_layout()

# ذخیره نمودار در فایل
plt.savefig("comparison_curves.png", dpi=300, bbox_inches="tight")
print("✅ نمودار با نام 'comparison_curves.png' ذخیره شد.")

# نمایش نمودار (اختیاری)
plt.show()