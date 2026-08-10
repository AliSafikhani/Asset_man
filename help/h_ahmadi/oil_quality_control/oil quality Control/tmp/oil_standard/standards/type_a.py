# standards/type_a.py
from oil_standard.core.rule import Rule
from oil_standard.core.parameter import Parameter
from oil_standard.standards.base_standard import BaseStandard

class TypeAStandard(BaseStandard):

    def build(self):
        self.categories = {
            "Function": [
                Parameter("viscosity40", Rule(max_value=12)),
                Parameter("viscosityMinus30", Rule(max_value=1800)),
                Parameter("pourPoint", Rule(max_value=-40)),
                Parameter("waterContent", Rule(max_value=30)),
                Parameter("breakdownVoltage", Rule(min_value=70)),
                Parameter("density20", Rule(max_value=895)),
                Parameter("ddf90", Rule(max_value=0.005)),
            ],

            "Refining": [
                Parameter("acidity", Rule(max_value=0.01)),
                Parameter("interfacialTension", Rule(min_value=43)),
                Parameter("totalSulphur", Rule(max_value=0.05)),
                Parameter("corrosiveSulphur", Rule(boolean=False)),
                Parameter("dbds", Rule(max_value=5)),
                Parameter("furfural", Rule(max_value=0.05)),
            ],

            "Performance": [
                Parameter("oxidationAcidity", Rule(max_value=0.3)),
                Parameter("sludge", Rule(max_value=0.05)),
                Parameter("oxidationDDF", Rule(max_value=0.05)),
            ],

            "HSE": [
                Parameter("flashPoint", Rule(min_value=135)),
                Parameter("pcb", Rule(max_value=2)),
                Parameter("pca", Rule(max_value=3)),
            ]
        }