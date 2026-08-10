# standards/type_a.py
from ..core.rule import Rule
from ..core.parameter import Parameter
from .base_standard import BaseStandard

class TypeAStandard(BaseStandard):
    """
    استاندارد Type A مطابق با Table 3 – General specifications
    (روغن‌های با درجه بالا و کاملاً مهارشده - Fully Inhibited High Grade Oils)
    """

    def build(self):
        self.categories = {

            # ======================== 1 – FUNCTION ========================
            "Function": [
                Parameter("kinematic_viscosity_40", Rule(max_value=12)),      # Max. 12 mm²/s
                Parameter("kinematic_viscosity_-30", Rule(max_value=1800)),   # Max. 1 800 mm²/s
                Parameter("pour_point", Rule(max_value=-40)),                 # Max. -40 °C
                # نکته: استاندارد عدد 40 mg/kg را هم برای موارد خاص مجاز دانسته، اما حد سخت‌گیرانه‌تر 30 است.
                Parameter("water_content", Rule(max_value=30)),               # Max. 30 mg/kg
                # نکته: استاندارد عدد 30 kV را هم مجاز دانسته، اما حد سخت‌گیرانه‌تر 70 است.
                Parameter("breakdown_voltage", Rule(min_value=70)),           # Min. 70 kV
                Parameter("density_20", Rule(max_value=895)),                 # Max. 895 kg/m³
                Parameter("dielectric_dissipation_90", Rule(max_value=0.005)),# Max. 0.005
            ],

            # ================== 2 – REFINING / STABILITY ==================
            "Refining": [
                Parameter("colour", Rule(max_value=0.5)),                     # L0.5 (کمتر از 0.5)
                Parameter("appearance", Rule(boolean=True)),                  # Clear, free from sediment
                Parameter("neutralization_number", Rule(max_value=0.01)),     # Max. 0.01 mg KOH/g
                Parameter("interfacial_tension", Rule(min_value=43)),         # Min. 43 mN/m
                Parameter("total_sulphur", Rule(max_value=0.05)),             # Max. 0.05 %
                Parameter("corrosive_sulphur", Rule(boolean=False)),          # Not corrosive (DIN 51353)
                Parameter("potentially_corrosive_sulphur", Rule(boolean=False)), # Not corrosive (IEC 62535) - اضافه شد
                Parameter("dbds", Rule(max_value=5)),                         # Not detectable (< 5 mg/kg) - DBS
                Parameter("inhibitor_content", Rule(min_value=0.08, max_value=0.4)), # 0.08% to 0.40%
                Parameter("metal_passivator", Rule(max_value=5)),             # Not detectable (< 5 mg/kg) - اضافه شد
                Parameter("furfural", Rule(max_value=0.05)),                  # Not detectable (< 0.05 mg/kg)
                # ===== Stray Gassing (اضافه شد با ۳ مقدار مجزا) =====
                Parameter("stray_gassing_h2", Rule(max_value=50)),            # H₂ < 50 µl/l
                Parameter("stray_gassing_ch4", Rule(max_value=50)),           # CH₄ < 50 µl/l
                Parameter("stray_gassing_c2h6", Rule(max_value=50)),          # C₂H₆ < 50 µl/l
            ],

            # ==================== 3 – PERFORMANCE ====================
            "Performance": [
                # Oxidation stability (500 h) - IEC 61125
                Parameter("oxidation_stability_acidity", Rule(max_value=0.3)),   # Max. 0.3 mg KOH/g
                Parameter("oxidation_stability_sludge", Rule(max_value=0.05)),   # Max. 0.05 %
                Parameter("oxidation_stability_ddf", Rule(max_value=0.05)),      # Max. 0.050 %
            ],

            # ========== 4 – HEALTH, SAFETY & ENVIRONMENT (HSE) ==========
            "HSE": [
                Parameter("flash_point", Rule(min_value=135)),                # Min. 135 °C
                Parameter("pca", Rule(max_value=3)),                          # < 3 %
                Parameter("pcb", Rule(max_value=2)),                          # Not detectable (< 2 mg/kg)
            ]
        }