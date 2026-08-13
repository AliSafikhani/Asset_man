# standards/type_a.py
# IEC 60296 Type A (Table 3) - fully inhibited high grade oils.
from ..core.rule import Rule
from ..core.parameter import Parameter
from .base_standard import BaseStandard


class TypeAStandard(BaseStandard):
    """Type A specification (Table 3 – General specifications)."""

    def build(self):
        self.categories = {

            # ======================== 1 - FUNCTION ========================
            "Function": [
                Parameter("kinematic_viscosity_40", Rule(max_value=12)),        # Max. 12 mm2/s
                Parameter("kinematic_viscosity_-30", Rule(max_value=1800)),     # Max. 1 800 mm2/s
                Parameter("pour_point", Rule(max_value=-40)),                   # Max. -40 C
                Parameter("water_content", Rule(max_value=30)),                 # Max. 30 mg/kg
                Parameter("breakdown_voltage", Rule(min_value=70)),             # Min. 70 kV
                Parameter("density_20", Rule(max_value=895)),                   # Max. 895 kg/m3
                Parameter("dielectric_dissipation_90", Rule(max_value=0.005)),  # Max. 0.005
            ],

            # ================== 2 - REFINING / STABILITY ==================
            "Refining": [
                Parameter("colour", Rule(max_value=0.5)),                       # L0.5
                Parameter("appearance", Rule(boolean=True)),                    # Clear, free from sediment
                Parameter("neutralization_number", Rule(max_value=0.01)),       # Max. 0.01 mg KOH/g
                Parameter("interfacial_tension", Rule(min_value=43)),           # Min. 43 mN/m
                Parameter("total_sulphur", Rule(max_value=0.05)),               # Max. 0.05 %
                Parameter("corrosive_sulphur", Rule(boolean=False)),            # Not corrosive (DIN 51353)
                Parameter("potentially_corrosive_sulphur", Rule(boolean=False)),  # Not corrosive (IEC 62535)
                Parameter("dbds", Rule(max_value=5)),                           # Not detectable (< 5 mg/kg)
                Parameter("inhibitor_content", Rule(min_value=0.08, max_value=0.4)),  # 0.08% to 0.40%
                Parameter("metal_passivator", Rule(max_value=5)),               # Not detectable (< 5 mg/kg)
                Parameter("furfural", Rule(max_value=0.05)),                    # Not detectable (< 0.05 mg/kg)
                Parameter("stray_gassing_h2", Rule(max_value=50)),              # H2 < 50 ul/l
                Parameter("stray_gassing_ch4", Rule(max_value=50)),             # CH4 < 50 ul/l
                Parameter("stray_gassing_c2h6", Rule(max_value=50)),            # C2H6 < 50 ul/l
            ],

            # ==================== 3 - PERFORMANCE ====================
            "Performance": [
                Parameter("oxidation_stability_acidity", Rule(max_value=0.3)),   # Max. 0.3 mg KOH/g
                Parameter("oxidation_stability_sludge", Rule(max_value=0.05)),   # Max. 0.05 %
                Parameter("oxidation_stability_ddf", Rule(max_value=0.05)),      # Max. 0.050
            ],

            # ========== 4 - HEALTH, SAFETY & ENVIRONMENT (HSE) ==========
            "HSE": [
                Parameter("flash_point", Rule(min_value=135)),                  # Min. 135 C
                Parameter("pca", Rule(max_value=3)),                            # < 3 %
                Parameter("pcb", Rule(max_value=2)),                            # Not detectable (< 2 mg/kg)
            ],
        }
