# standards/iec60422_table3.py
from __future__ import annotations

from ..core.equipment import EquipmentCategory

TABLE_3 = {
    # ============================================================
    # CATEGORY A: Power transformers >170 kV
    # ============================================================
    EquipmentCategory.CATEGORY_A: {
        "appearance": {"value": True},  # Clear, free from sediment
        "colour": {"max": 2.0},
        "breakdown_voltage": {"min": 60},
        "water_content": {"max": 10},
        "acidity": {"max": 0.03},
        "dielectric_dissipation_90": {"max": 0.010},
        "corrosive_sulphur": {"value": False},
        "potentially_corrosive_sulphur": {"value": False},
        "dbds": {"max": 5},  # Not detectable (<5 mg/kg)
        "interfacial_tension": {"min": 35},
        "pcb": {"max": 2},  # Not detectable (<2 mg/kg)
        # "particles": اختیاری - در صورت نیاز اضافه شود
    },

    # ============================================================
    # CATEGORY B: Power transformers 72.5–170 kV
    # ============================================================
    EquipmentCategory.CATEGORY_B: {
        "appearance": {"value": True},
        "colour": {"max": 2.0},
        "breakdown_voltage": {"min": 60},
        "water_content": {"max": 10},
        "acidity": {"max": 0.03},
        "dielectric_dissipation_90": {"max": 0.015},
        "corrosive_sulphur": {"value": False},
        "potentially_corrosive_sulphur": {"value": False},
        "dbds": {"max": 5},
        "interfacial_tension": {"min": 35},
        "pcb": {"max": 2},
    },

    # ============================================================
    # CATEGORY C: Distribution transformers ≤72.5 kV
    # ============================================================
    EquipmentCategory.CATEGORY_C: {
        "appearance": {"value": True},
        "colour": {"max": 2.0},
        "breakdown_voltage": {"min": 55},
        "water_content": {"max": 20},  # با توجه به تبصره (agreed between supplier and user)
        "acidity": {"max": 0.03},
        "dielectric_dissipation_90": {"max": 0.015},
        "corrosive_sulphur": {"value": False},
        "potentially_corrosive_sulphur": {"value": False},
        "dbds": {"max": 5},
        "interfacial_tension": {"min": 35},
        "pcb": {"max": 2},
    },

    # ============================================================
    # توجه: CATEGORY_F (OLTC) در جدول ۳ وجود ندارد
    # در صورت نیاز به OLTC، باید از Table 5 استفاده شود
    # ============================================================
}