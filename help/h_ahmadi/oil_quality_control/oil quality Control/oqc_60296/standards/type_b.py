# standards/type_b.py
from ..core.rule import Rule
from ..core.parameter import Parameter
from .base_standard import BaseStandard

class TypeBStandard(BaseStandard):
    """
    استاندارد Type B مطابق با Table 4 – General specifications
    (روغن‌های گرید استاندارد - مهارشده و مهارنشده - Uninhibited and Inhibited Standard Grade)
    """

    def build(self):
        self.categories = {

            # ======================== 1 – FUNCTION ========================
            # (تمامی مقادیر این بخش دقیقاً مشابه Type A است)
            "Function": [
                Parameter("kinematic_viscosity_40", Rule(max_value=12)),      # Max. 12 mm²/s
                Parameter("kinematic_viscosity_-30", Rule(max_value=1800)),   # Max. 1 800 mm²/s (OCR اشتباه 1.8 خوانده)
                Parameter("pour_point", Rule(max_value=-40)),                 # Max. -40 °C
                Parameter("water_content", Rule(max_value=30)),               # Max. 30 mg/kg (حد سخت‌گیرانه)
                Parameter("breakdown_voltage", Rule(min_value=70)),           # Min. 70 kV (حد سخت‌گیرانه)
                Parameter("density_20", Rule(max_value=895)),                 # Max. 895 kg/m³
                Parameter("dielectric_dissipation_90", Rule(max_value=0.005)),# Max. 0.005
            ],

            # ================== 2 – REFINING / STABILITY ==================
            # (ساختار کامل شد، ولی مقادیر عددی اختصاصی Type B حفظ شد)
            "Refining": [
                Parameter("colour", Rule(max_value=0.5)),                     # L0.5 (اضافه شد)
                Parameter("appearance", Rule(boolean=True)),                  # Clear & bright (اضافه شد)
                Parameter("neutralization_number", Rule(max_value=0.01)),     # Max. 0.01 mg KOH/g
                Parameter("interfacial_tension", Rule(min_value=40)),         # **فرق Type B**: Min. 40 mN/m (Type A=43)
                Parameter("total_sulphur", Rule(max_value=0.05)),             # Max. 0.05 % (اضافه شد)
                Parameter("corrosive_sulphur", Rule(boolean=False)),          # Not corrosive
                Parameter("potentially_corrosive_sulphur", Rule(boolean=False)), # Not corrosive (اضافه شد)
                Parameter("dbds", Rule(max_value=5)),                         # Not detectable (< 5 mg/kg)
                # (Inhibitor_content در Type B وابسته به نوع خریدار است، اما برای تکمیل ساختار اضافه شد)
                Parameter("inhibitor_content", Rule(min_value=0, max_value=0.4)), # بنا به درخواست مشتری (اختیاری)
                Parameter("metal_passivator", Rule(max_value=5)),             # < 5 mg/kg (اضافه شد)
                Parameter("furfural", Rule(max_value=0.05)),                  # Not detectable (< 0.05 mg/kg)
                # (Stray Gassing در این جدول نیست، بنابراین اضافه نمی‌شود)
            ],

            # ==================== 3 – PERFORMANCE ====================
            # (مقادیر این بخش کاملاً با کد قبلی شما هماهنگ است و برای گرید استاندارد مناسب است)
            "Performance": [
                # Oxidation stability (مدت زمان تست ممکن است کمتر باشد، لذا محدودیت‌ها بالاتر است)
                Parameter("oxidation_stability_acidity", Rule(max_value=1.2)),   # **فرق Type B**: Max. 1.2 mg KOH/g
                Parameter("oxidation_stability_sludge", Rule(max_value=0.8)),    # **فرق Type B**: Max. 0.8 %
                Parameter("oxidation_stability_ddf", Rule(max_value=0.5)),       # **فرق Type B**: Max. 0.5 %
                # Gassing tendency (طبق کد قدیمی شما، عدد ۲۰ برای Type B معتبر است)
                Parameter("gassing_tendency", Rule(max_value=20)),               # Max. 20 µl/min
            ],

            # ========== 4 – HEALTH, SAFETY & ENVIRONMENT (HSE) ==========
            # (دقیقاً مشابه Type A)
            "HSE": [
                Parameter("flash_point", Rule(min_value=135)),                # Min. 135 °C
                Parameter("pca", Rule(max_value=3)),                          # < 3 %
                Parameter("pcb", Rule(max_value=2)),                          # Not detectable (< 2 mg/kg)
            ]
        }