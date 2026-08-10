from oqc_60296.core.engine import StandardEngine
from oqc_60296.standards.type_a import TypeAStandard

engine = StandardEngine()
standard = TypeAStandard()

# داده نمونه کاربر - بروزرسانی شده برای Type A جدید (مطابق Table 3)
sample = {
    # ========== 1 – FUNCTION ==========
    "kinematic_viscosity_40": 10,
    "kinematic_viscosity_-30": 1500,
    "pour_point": -45,
    "water_content": 20,
    "breakdown_voltage": 75,
    "density_20": 880,
    "dielectric_dissipation_90": 0.004,

    # ========== 2 – REFINING / STABILITY ==========
    "colour": 0.3,                        # جدید (L0.5)
    "appearance": True,
    "neutralization_number": 0.008,       # همان اسیدیته (Acidity)
    "interfacial_tension": 45,
    "total_sulphur": 0.03,
    "corrosive_sulphur": False,
    "potentially_corrosive_sulphur": False,  # جدید (IEC 62535)
    "dbds": 1,
    "inhibitor_content": 0.2,
    "metal_passivator": 1,                # جدید (< 5 mg/kg)
    "furfural": 0.01,
    # Stray Gassing - جدید (جایگزین gassing_tendency)
    "stray_gassing_h2": 20,
    "stray_gassing_ch4": 15,
    "stray_gassing_c2h6": 10,

    # ========== 3 – PERFORMANCE ==========
    "oxidation_stability_acidity": 0.2,
    "oxidation_stability_sludge": 0.01,
    "oxidation_stability_ddf": 0.02,

    # ========== 4 – HSE ==========
    "flash_point": 140,
    "pcb": 0,
    "pca": 1,

    # ========== پارامترهای حذف‌شده (دیگر در این استاندارد نیستند) ==========
    # "gassing_tendency": 5,     # حذف شد
    # "corrosion_copper": True,  # حذف شد
    # "foaming_tendency": 50,    # حذف شد
    # "air_release": 5,          # حذف شد
    # "viscosity_index": 100,    # حذف شد
    # "poly_aromatic": 1,        # حذف شد
    # "toxicity": False          # حذف شد
}

results = engine.evaluate(sample, standard)
final = engine.final_status(results)

print("\nFINAL STATUS:", final.value)
print("---------------")
for r in results:
    print(r.to_dict())