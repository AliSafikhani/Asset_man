# standards/iec60422_trends.py
# IEC 60422:2024 - rate-of-change (trend) limits for in-service oil.
#
# Each parameter defines an annual limit and the direction that is considered
# adverse.  Trend evaluation converts a per-day slope into an annual figure and
# compares it to the limit.

# direction values:
#   "increase"            -> dangerous when slope rises faster than the limit
#   "decrease"            -> dangerous when slope falls faster than the limit
#   "decrease_percentage" -> dangerous when the annual % drop exceeds the limit
#                            (needs the initial value to compute a percentage)
#   "boolean_change"      -> dangerous on any change (proxy booleans)

TREND_CONFIG = {
    "water_content": {
        "unit": "mg/kg",
        "limit_per_year": 5.0,
        "direction": "increase",
        "description": "Moisture ingress rate",
        "reference": "IEC 60422:2024",
    },
    "acidity": {
        "unit": "mg KOH/g",
        "limit_per_year": 0.05,
        "direction": "increase",
        "description": "Acidity (neutralization number) growth",
        "reference": "IEC 60422:2024",
    },
    "breakdown_voltage": {
        "unit": "kV",
        "limit_per_year": -3.0,
        "direction": "decrease",
        "description": "Dielectric strength decline",
        "reference": "IEC 60422:2024",
    },
    "dielectric_dissipation_90": {
        "unit": "tan delta",
        "limit_per_year": 0.005,
        "direction": "increase",
        "description": "Dissipation factor growth",
        "reference": "IEC 60422:2024",
    },
    "interfacial_tension": {
        "unit": "mN/m",
        "limit_per_year": -2.0,
        "direction": "decrease",
        "description": "Interfacial tension decline",
        "reference": "IEC 60422:2024",
    },
    "colour": {
        "unit": "ISO",
        "limit_per_year": 0.5,
        "direction": "increase",
        "description": "Colour darkening",
        "reference": "IEC 60422:2024",
    },
    "appearance": {
        "unit": "index",
        "limit_per_year": 0.5,
        "direction": "increase",
        "description": "Appearance degradation",
        "reference": "IEC 60422:2024",
    },
    "sediments": {
        "unit": "%",
        "limit_per_year": 0.1,
        "direction": "increase",
        "description": "Sediment accumulation",
        "reference": "IEC 60422:2024",
    },
    "sludge": {
        "unit": "%",
        "limit_per_year": 0.1,
        "direction": "increase",
        "description": "Sludge accumulation",
        "reference": "IEC 60422:2024",
    },
    "inhibitor_content": {
        "unit": "%",
        "limit_per_year": -5.0,
        "direction": "decrease_percentage",
        "description": "Inhibitor (antioxidant) depletion",
        "reference": "IEC 60422:2024",
        "requires_initial_value": True,
    },
    "passivator_content": {
        "unit": "mg/kg",
        "limit_per_year": -10.0,
        "direction": "decrease",
        "description": "Metal passivator depletion",
        "reference": "IEC 60422:2024",
    },
    "corrosive_sulphur": {
        "unit": "",
        "limit_per_year": None,
        "direction": "boolean_change",
        "description": "Onset of corrosive sulphur",
        "reference": "IEC 60422:2024",
    },
    "potentially_corrosive_sulphur": {
        "unit": "",
        "limit_per_year": None,
        "direction": "boolean_change",
        "description": "Onset of potentially corrosive sulphur",
        "reference": "IEC 60422:2024",
    },
    "dbds": {
        "unit": "mg/kg",
        "limit_per_year": 2.0,
        "direction": "increase",
        "description": "DBDS growth",
        "reference": "IEC 60422:2024",
    },
    "pcb": {
        "unit": "mg/kg",
        "limit_per_year": 1.0,
        "direction": "increase",
        "description": "PCB contamination increase",
        "reference": "IEC 60422:2024",
    },
    "flash_point": {
        "unit": "C",
        "limit_per_year": -5.0,
        "direction": "decrease",
        "description": "Flash point decline",
        "reference": "IEC 60422:2024",
    },
}

# Legacy dict: annual limits only for parameters with a numeric limit.
TREND_LIMITS_PER_YEAR = {
    param: cfg["limit_per_year"]
    for param, cfg in TREND_CONFIG.items()
    if cfg["limit_per_year"] is not None
}


def is_trend_dangerous(param, slope_per_day, initial_value=None):
    """Return True when the per-day slope of `param` exceeds its adverse limit.

    Faithful port of the reference logic:
      limit_per_day = limit_per_year / 365
      increase            -> slope_per_day > limit_per_day
      decrease            -> slope_per_day < limit_per_day
      decrease_percentage -> (slope_per_day * 365 / initial * 100) < limit_per_year
      boolean_change      -> abs(slope_per_day) > 0.001
    """
    cfg = TREND_CONFIG.get(param)
    if cfg is None or slope_per_day is None:
        return False

    direction = cfg["direction"]

    if direction == "boolean_change":
        return abs(slope_per_day) > 0.001

    limit_per_year = cfg["limit_per_year"]
    if limit_per_year is None:
        return False

    if direction == "decrease_percentage":
        if not initial_value:
            return False
        annual_pct = (slope_per_day * 365.0 / initial_value) * 100.0
        return annual_pct < limit_per_year

    limit_per_day = limit_per_year / 365.0
    if direction == "increase":
        return slope_per_day > limit_per_day
    if direction == "decrease":
        return slope_per_day < limit_per_day
    return False
