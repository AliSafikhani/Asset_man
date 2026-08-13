# standards/iec60422_table3.py
# IEC 60422:2024 Table 3 - limits for oil in new equipment before energization
# (after filling / commissioning).  Each parameter carries a single bound:
#   {"min": x}  -> value must be >= x
#   {"max": y}  -> value must be <= y
#   {"value": v, "bool": True} -> value must equal v (proxy booleans)
# A value satisfying its bound is NORMAL, otherwise ACTION.

STATUS_GOOD = "NORMAL"
STATUS_POOR = "ACTION"

CATEGORY_A_TABLE3 = {
    "breakdown_voltage": {"min": 60},
    "water_content": {"max": 10},
    "acidity": {"max": 0.03},
    "dielectric_dissipation_90": {"max": 0.015},
    "interfacial_tension": {"min": 35},
    "colour": {"max": 2},
    "appearance": {"max": 1.5},
    "flash_point": {"min": 135},
}

CATEGORY_B_TABLE3 = {
    "breakdown_voltage": {"min": 50},
    "water_content": {"max": 15},
    "acidity": {"max": 0.03},
    "dielectric_dissipation_90": {"max": 0.10},
    "interfacial_tension": {"min": 35},
    "colour": {"max": 2},
    "appearance": {"max": 1.5},
    "flash_point": {"min": 135},
}

CATEGORY_C_TABLE3 = {
    "breakdown_voltage": {"min": 40},
    "water_content": {"max": 20},
    "acidity": {"max": 0.03},
    "dielectric_dissipation_90": {"max": 0.10},
    "interfacial_tension": {"min": 35},
    "colour": {"max": 2},
    "appearance": {"max": 1.5},
    "flash_point": {"min": 135},
}

TABLE_3 = {
    "A": CATEGORY_A_TABLE3,
    "B": CATEGORY_B_TABLE3,
    "C": CATEGORY_C_TABLE3,
}


def get_table3_for_category(category):
    """Return {param: {bound}} commissioning limits, default Category A."""
    code = str(category).strip().upper() if category is not None else "A"
    return TABLE_3.get(code, CATEGORY_A_TABLE3)


def classify_table3(param, value, category):
    """Return NORMAL/ACTION for a before-energization measurement, or None if
    the parameter is not covered by Table 3."""
    rules = get_table3_for_category(category)
    bound = rules.get(param)
    if bound is None or value is None:
        return None
    if "min" in bound:
        return STATUS_GOOD if value >= bound["min"] else STATUS_POOR
    if "max" in bound:
        return STATUS_GOOD if value <= bound["max"] else STATUS_POOR
    if "value" in bound:
        return STATUS_GOOD if value == bound["value"] else STATUS_POOR
    return None
