# standards/iec60422_table2.py
from __future__ import annotations

# =====================================================================
# IEC 60422:2024 – Table 2 – Tests for in-service mineral insulating oils
# =====================================================================
# مطابق با استاندارد، جدول ۲ به سه گروه زیر تقسیم می‌شود:
# Group 1: Routine tests (تست‌های روتین)
# Group 2: Complementary tests (تست‌های تکمیلی)
# Group 3: Special investigative tests (تست‌های ویژه)
# =====================================================================

TABLE_2 = {
    # ========== Group 1 – Routine tests ==========
    "routine": [
        {"parameter": "colour", "subclause": "7.2", "method": "ISO 2049 or ASTM D1500"},
        {"parameter": "appearance", "subclause": "7.3", "method": "Visual test"},
        {"parameter": "breakdown_voltage", "subclause": "7.4", "method": "IEC 60156"},
        {"parameter": "water_content", "subclause": "7.5", "method": "IEC 60814"},
        {"parameter": "acidity", "subclause": "7.6", "method": "IEC 62021-2 or IEC 62021-1"},
        {"parameter": "dielectric_dissipation_90", "subclause": "7.7", "method": "IEC 60247"},
        {"parameter": "inhibitor_content", "subclause": "7.8", "method": "IEC 60666"},
    ],

    # ========== Group 2 – Complementary tests ==========
    "complementary": [
        {"parameter": "sediments", "subclause": "7.9", "method": "Annex E of this document"},
        {"parameter": "interfacial_tension", "subclause": "7.11", "method": "IEC 62961 or ASTM D971"},  # برای روغن‌های مهارشده می‌تواند Group 1 باشد
        {"parameter": "particles", "subclause": "7.12", "method": "IEC 60970"},
    ],

    # ========== Group 3 – Special investigative tests ==========
    "special": [
        {"parameter": "sludge", "subclause": "7.10", "method": "Annex E of this document"},
        {"parameter": "flash_point", "subclause": "7.13", "method": "ISO 2719"},
        {"parameter": "compatibility", "subclause": "7.14", "method": "See 7.14"},
        {"parameter": "pour_point", "subclause": "7.15", "method": "ISO 3016"},
        {"parameter": "density_20", "subclause": "7.16", "method": "ISO 12185 or ISO 3675 or ASTM D7042"},
        {"parameter": "viscosity_40", "subclause": "7.17", "method": "ISO 3104 or ASTM D7042"},
        {"parameter": "pcb", "subclause": "7.18", "method": "IEC 61619"},
        {"parameter": "corrosive_sulphur", "subclause": "7.19.2", "method": "DIN 51353"},
        {"parameter": "potentially_corrosive_sulphur", "subclause": "7.19.3", "method": "IEC 62535"},
        {"parameter": "dbds", "subclause": "7.19.4", "method": "IEC 62697-1"},
        {"parameter": "passivator_content", "subclause": "7.20", "method": "Annex B of IEC 60666:2010"},
    ],
}

# =====================================================================
# توابع کمکی برای دسترسی آسان
# =====================================================================

def get_parameters_by_group(group: str) -> list[str]:
    """
    دریافت لیست نام پارامترهای یک گروه خاص
    Example: get_parameters_by_group("routine")
    """
    return [item["parameter"] for item in TABLE_2.get(group, [])]

def get_all_parameters() -> list[str]:
    """دریافت لیست تمام پارامترهای موجود در جدول ۲"""
    all_params = []
    for group in TABLE_2.values():
        for item in group:
            all_params.append(item["parameter"])
    return all_params

def get_parameter_info(parameter_name: str) -> dict | None:
    """
    دریافت اطلاعات کامل یک پارامتر (زیربند و روش تست)
    """
    for group in TABLE_2.values():
        for item in group:
            if item["parameter"] == parameter_name:
                return {"group": group, **item}
    return None