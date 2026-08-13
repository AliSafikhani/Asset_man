# standards/iec60422_table5.py
# IEC 60422:2024 Table 5 - limits for continued use of oil in service.
#
# Each parameter maps status -> (low, high) with lower bound INCLUSIVE and the
# range interpreted best-first (NORMAL -> ATTENTION -> ACTION) by the evaluator.
# The sentinel SENTINEL_MAX (999) represents an open upper bound.

STATUS_GOOD = "NORMAL"
STATUS_FAIR = "ATTENTION"
STATUS_POOR = "ACTION"

SENTINEL_MAX = 999

# ---------------------------------------------------------------------------
# Category A  (highest voltage for equipment > 170 kV)
# ---------------------------------------------------------------------------
CATEGORY_A_RULES = {
    "breakdown_voltage": {
        STATUS_GOOD: (60, SENTINEL_MAX),
        STATUS_FAIR: (50, 60),
        STATUS_POOR: (0, 50),
    },
    "water_content": {
        STATUS_GOOD: (0, 15),
        STATUS_FAIR: (15, 20),
        STATUS_POOR: (20, SENTINEL_MAX),
    },
    "acidity": {
        STATUS_GOOD: (0, 0.10),
        STATUS_FAIR: (0.10, 0.15),
        STATUS_POOR: (0.15, SENTINEL_MAX),
    },
    "dielectric_dissipation_90": {
        STATUS_GOOD: (0, 0.10),
        STATUS_FAIR: (0.10, 0.20),
        STATUS_POOR: (0.20, SENTINEL_MAX),
    },
    "interfacial_tension": {
        STATUS_GOOD: (28, SENTINEL_MAX),
        STATUS_FAIR: (20, 28),
        STATUS_POOR: (0, 20),
    },
    "inhibitor_content": {
        STATUS_GOOD: (60, 100),
        STATUS_FAIR: (40, 60),
        STATUS_POOR: (0, 40),
    },
    "passivator_content": {
        STATUS_GOOD: (70, SENTINEL_MAX),
        STATUS_FAIR: (50, 70),
        STATUS_POOR: (0, 50),
    },
    "colour": {
        STATUS_GOOD: (0, 2),
        STATUS_FAIR: (2, 6),
        STATUS_POOR: (6, SENTINEL_MAX),
    },
    "appearance": {
        STATUS_GOOD: (0, 1.5),
        STATUS_FAIR: (1.5, 2.5),
        STATUS_POOR: (2.5, SENTINEL_MAX),
    },
    "sediments": {
        STATUS_GOOD: (0, 0.02),
        STATUS_FAIR: (0.02, 0.5),
        STATUS_POOR: (0.5, SENTINEL_MAX),
    },
    "sludge": {
        STATUS_GOOD: (0, 0.02),
        STATUS_FAIR: (0.02, 0.5),
        STATUS_POOR: (0.5, SENTINEL_MAX),
    },
    "flash_point": {
        STATUS_GOOD: (135, SENTINEL_MAX),
        STATUS_FAIR: (125, 135),
        STATUS_POOR: (0, 125),
    },
    "pcb": {
        STATUS_GOOD: (0, 2),
        STATUS_FAIR: (2, 5),
        STATUS_POOR: (5, SENTINEL_MAX),
    },
    "dbds": {
        STATUS_GOOD: (0, 5),
        STATUS_FAIR: (5, 20),
        STATUS_POOR: (20, SENTINEL_MAX),
    },
    # Corrosive-sulphur parameters use a numeric proxy: Non-corrosive -> 0,
    # Corrosive -> 1.  The degenerate FAIR range never matches (by design).
    "corrosive_sulphur": {
        STATUS_GOOD: (0, 0.5),
        STATUS_FAIR: (0.5, 0.5),
        STATUS_POOR: (0.5, SENTINEL_MAX),
    },
    "potentially_corrosive_sulphur": {
        STATUS_GOOD: (0, 0.5),
        STATUS_FAIR: (0.5, 0.5),
        STATUS_POOR: (0.5, SENTINEL_MAX),
    },
}

# ---------------------------------------------------------------------------
# Category B  (72.5 kV < highest voltage for equipment <= 170 kV) overrides
# ---------------------------------------------------------------------------
CATEGORY_B_RULES = {
    "breakdown_voltage": {
        STATUS_GOOD: (50, SENTINEL_MAX),
        STATUS_FAIR: (40, 50),
        STATUS_POOR: (0, 40),
    },
    "water_content": {
        STATUS_GOOD: (0, 20),
        STATUS_FAIR: (20, 30),
        STATUS_POOR: (30, SENTINEL_MAX),
    },
    "acidity": {
        STATUS_GOOD: (0, 0.10),
        STATUS_FAIR: (0.10, 0.20),
        STATUS_POOR: (0.20, SENTINEL_MAX),
    },
    "dielectric_dissipation_90": {
        STATUS_GOOD: (0, 0.10),
        STATUS_FAIR: (0.10, 0.50),
        STATUS_POOR: (0.50, SENTINEL_MAX),
    },
}

# ---------------------------------------------------------------------------
# Category C  (highest voltage for equipment <= 72.5 kV) overrides
# ---------------------------------------------------------------------------
CATEGORY_C_RULES = {
    "breakdown_voltage": {
        STATUS_GOOD: (40, SENTINEL_MAX),
        STATUS_FAIR: (30, 40),
        STATUS_POOR: (0, 30),
    },
    "water_content": {
        STATUS_GOOD: (0, 30),
        STATUS_FAIR: (30, 40),
        STATUS_POOR: (40, SENTINEL_MAX),
    },
    "acidity": {
        STATUS_GOOD: (0, 0.15),
        STATUS_FAIR: (0.15, 0.30),
        STATUS_POOR: (0.30, SENTINEL_MAX),
    },
}

# ---------------------------------------------------------------------------
# Category F  (on-load tap-changer diverter compartments) - approximate OLTC
# limits.  Not reachable via HV-voltage category derivation (A/B/C only);
# retained so TABLE_5 is complete.
# ---------------------------------------------------------------------------
CATEGORY_F_RULES = {
    "breakdown_voltage": {
        STATUS_GOOD: (30, SENTINEL_MAX),
        STATUS_FAIR: (20, 30),
        STATUS_POOR: (0, 20),
    },
    "water_content": {
        STATUS_GOOD: (0, 40),
        STATUS_FAIR: (40, 50),
        STATUS_POOR: (50, SENTINEL_MAX),
    },
}

# Category B/C inherit Category A and override the parameters above.
TABLE_5 = {
    "A": CATEGORY_A_RULES,
    "B": {**CATEGORY_A_RULES, **CATEGORY_B_RULES},
    "C": {**CATEGORY_A_RULES, **CATEGORY_C_RULES},
    "F": CATEGORY_F_RULES,
}


def normalize_rules(rules):
    """Return a shallow copy where SENTINEL_MAX upper bounds are kept as-is.

    Provided for parity with the reference API; the evaluator already treats
    SENTINEL_MAX as an open bound, so this simply returns a defensive copy.
    """
    return {param: dict(statuses) for param, statuses in rules.items()}


def get_rules_for_category(category):
    """Return {param: {STATUS: (lo, hi)}} for an equipment category code.

    Unknown categories fall back to Category A.
    """
    code = str(category).strip().upper() if category is not None else "A"
    return normalize_rules(TABLE_5.get(code, CATEGORY_A_RULES))
