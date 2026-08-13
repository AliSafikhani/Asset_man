# metadata.py
# Canonical parameter definitions for the Oil Quality Control module.
#
# This is the SINGLE SOURCE OF TRUTH for parameter field names, groups, units,
# and how canonical values are adapted to each standard's expected sample shape.
# The canonical field_name for every parameter MUST stay identical here, in
# migration 049, and in the frontend oilQualityConstants.js.

from .oqc_60422.standards.iec60422_table5 import (
    get_rules_for_category,
    SENTINEL_MAX,
    STATUS_GOOD,
)

# --------------------------------------------------------------------------- #
# Groups (drive the form subsections and dashboard tabs)                       #
# --------------------------------------------------------------------------- #
GROUPS = [
    ("routine", "Routine"),
    ("complementary", "Complementary"),
    ("special", "Special"),
    ("new_oil", "New-oil (IEC 60296)"),
]

# --------------------------------------------------------------------------- #
# Canonical parameter metadata                                                 #
#   name       - canonical field_name (must match migration 049 + frontend)    #
#   group      - one of GROUPS keys                                            #
#   display    - human label                                                   #
#   unit       - measurement unit                                             #
#   data_type  - number | select | text                                       #
#   options    - select choices (data_type == select)                         #
#   subclause  - IEC 60422 sub-clause reference                               #
#   method     - reference test method                                        #
#   required   - required on the add-test form                                #
#   info_only  - measured but not scored by either standard                   #
# --------------------------------------------------------------------------- #
PARAM_META = [
    # ---- Group 1: Routine (IEC 60422 SS7.2-7.8) ----
    {"name": "colour", "group": "routine", "display": "Colour", "unit": "ISO",
     "data_type": "number", "subclause": "7.2", "method": "ISO 2049", "required": True},
    {"name": "appearance", "group": "routine", "display": "Appearance", "unit": "",
     "data_type": "select", "options": ["Clear", "Cloudy", "Sediment"],
     "subclause": "7.3", "method": "IEC 60422 (visual)", "required": True},
    {"name": "breakdown_voltage", "group": "routine", "display": "Breakdown Voltage", "unit": "kV",
     "data_type": "number", "subclause": "7.4", "method": "IEC 60156", "required": True},
    {"name": "water_content", "group": "routine", "display": "Water Content", "unit": "mg/kg",
     "data_type": "number", "subclause": "7.5", "method": "IEC 60814", "required": True},
    {"name": "acidity", "group": "routine", "display": "Acidity (Neutralization No.)", "unit": "mg KOH/g",
     "data_type": "number", "subclause": "7.6", "method": "IEC 62021", "required": True},
    {"name": "dielectric_dissipation_90", "group": "routine", "display": "Dissipation Factor (tan d, 90C)",
     "unit": "tan d", "data_type": "number", "subclause": "7.7", "method": "IEC 60247", "required": True},
    {"name": "inhibitor_content", "group": "routine", "display": "Inhibitor Content", "unit": "%",
     "data_type": "number", "subclause": "7.8", "method": "IEC 60666", "required": True},

    # ---- Group 2: Complementary (IEC 60422 SS7.9-7.12) ----
    {"name": "sediments", "group": "complementary", "display": "Sediments", "unit": "%",
     "data_type": "number", "subclause": "7.9", "method": "IEC 62961", "required": False},
    {"name": "interfacial_tension", "group": "complementary", "display": "Interfacial Tension", "unit": "mN/m",
     "data_type": "number", "subclause": "7.11", "method": "ISO 6295", "required": False},
    {"name": "particles", "group": "complementary", "display": "Particle Count", "unit": "count",
     "data_type": "number", "subclause": "7.12", "method": "IEC 60970", "required": False, "info_only": True},

    # ---- Group 3: Special (IEC 60422 SS7.10-7.20) ----
    {"name": "sludge", "group": "special", "display": "Sludge", "unit": "%",
     "data_type": "number", "subclause": "7.10", "method": "IEC 62961", "required": False},
    {"name": "flash_point", "group": "special", "display": "Flash Point", "unit": "C",
     "data_type": "number", "subclause": "7.13", "method": "ISO 2719", "required": False},
    {"name": "compatibility", "group": "special", "display": "Compatibility", "unit": "",
     "data_type": "text", "subclause": "7.14", "method": "IEC 60422 Annex", "required": False, "info_only": True},
    {"name": "pour_point", "group": "special", "display": "Pour Point", "unit": "C",
     "data_type": "number", "subclause": "7.15", "method": "ISO 3016", "required": False},
    {"name": "density_20", "group": "special", "display": "Density (20C)", "unit": "kg/m3",
     "data_type": "number", "subclause": "7.16", "method": "ISO 3675 / ISO 12185", "required": False},
    {"name": "viscosity_40", "group": "special", "display": "Kinematic Viscosity (40C)", "unit": "mm2/s",
     "data_type": "number", "subclause": "7.17", "method": "ISO 3104", "required": False},
    {"name": "pcb", "group": "special", "display": "PCB Content", "unit": "mg/kg",
     "data_type": "number", "subclause": "7.18", "method": "IEC 61619", "required": False},
    {"name": "corrosive_sulphur", "group": "special", "display": "Corrosive Sulphur", "unit": "",
     "data_type": "select", "options": ["Non-corrosive", "Corrosive"],
     "subclause": "7.19.2", "method": "DIN 51353 / ASTM D1275", "required": False},
    {"name": "potentially_corrosive_sulphur", "group": "special", "display": "Potentially Corrosive Sulphur",
     "unit": "", "data_type": "select", "options": ["Non-corrosive", "Corrosive"],
     "subclause": "7.19.3", "method": "IEC 62535", "required": False},
    {"name": "dbds", "group": "special", "display": "DBDS", "unit": "mg/kg",
     "data_type": "number", "subclause": "7.19.4", "method": "IEC 62697", "required": False},
    {"name": "passivator_content", "group": "special", "display": "Passivator Content", "unit": "mg/kg",
     "data_type": "number", "subclause": "7.20", "method": "IEC 60666", "required": False},

    # ---- Group 4: New-oil additional (IEC 60296 only) ----
    {"name": "kinematic_viscosity_low", "group": "new_oil", "display": "Kinematic Viscosity (-30C)",
     "unit": "mm2/s", "data_type": "number", "method": "ISO 3104", "required": False},
    {"name": "total_sulphur", "group": "new_oil", "display": "Total Sulphur", "unit": "%",
     "data_type": "number", "method": "ISO 14596", "required": False},
    {"name": "furfural", "group": "new_oil", "display": "Furfural (2-FAL)", "unit": "mg/kg",
     "data_type": "number", "method": "IEC 61198", "required": False},
    {"name": "stray_gassing_h2", "group": "new_oil", "display": "Stray Gassing H2", "unit": "ul/l",
     "data_type": "number", "method": "IEC 60296 Annex", "required": False},
    {"name": "stray_gassing_ch4", "group": "new_oil", "display": "Stray Gassing CH4", "unit": "ul/l",
     "data_type": "number", "method": "IEC 60296 Annex", "required": False},
    {"name": "stray_gassing_c2h6", "group": "new_oil", "display": "Stray Gassing C2H6", "unit": "ul/l",
     "data_type": "number", "method": "IEC 60296 Annex", "required": False},
    {"name": "oxidation_stability_acidity", "group": "new_oil", "display": "Oxidation Stability - Acidity",
     "unit": "mg KOH/g", "data_type": "number", "method": "IEC 61125", "required": False},
    {"name": "oxidation_stability_sludge", "group": "new_oil", "display": "Oxidation Stability - Sludge",
     "unit": "%", "data_type": "number", "method": "IEC 61125", "required": False},
    {"name": "oxidation_stability_ddf", "group": "new_oil", "display": "Oxidation Stability - DDF",
     "unit": "tan d", "data_type": "number", "method": "IEC 61125", "required": False},
    {"name": "pca", "group": "new_oil", "display": "PCA Content", "unit": "%",
     "data_type": "number", "method": "IP 346", "required": False},
    {"name": "gassing_tendency", "group": "new_oil", "display": "Gassing Tendency", "unit": "ul/min",
     "data_type": "number", "method": "IEC 60628 A", "required": False},
]

# Meta (non-scored) field carried alongside the parameters.
OPERATING_STATE_FIELD = {
    "name": "operating_state", "display": "Operating State", "unit": "",
    "data_type": "select", "options": ["before_energization", "in_service"], "required": True,
}

PARAM_BY_NAME = {p["name"]: p for p in PARAM_META}

# --------------------------------------------------------------------------- #
# Standard adapters                                                            #
# --------------------------------------------------------------------------- #

# Canonical field_name -> IEC 60296 parameter key.
REMAP_60296 = {
    "acidity": "neutralization_number",
    "viscosity_40": "kinematic_viscosity_40",
    "passivator_content": "metal_passivator",
    "kinematic_viscosity_low": "kinematic_viscosity_-30",
}

# Select-field coercion for IEC 60296 (boolean rules).
def _coerce_60296(name, value):
    if name == "appearance":
        return str(value).strip().lower() == "clear"
    if name in ("corrosive_sulphur", "potentially_corrosive_sulphur"):
        return str(value).strip().lower() == "corrosive"
    return value

# Select-field coercion for IEC 60422 (numeric proxy for Table 5 ranges).
_APPEARANCE_PROXY = {"clear": 1, "cloudy": 2, "sediment": 3}
_SULPHUR_PROXY = {"non-corrosive": 0, "corrosive": 1}

def _coerce_60422(name, value):
    if name == "appearance":
        return _APPEARANCE_PROXY.get(str(value).strip().lower())
    if name in ("corrosive_sulphur", "potentially_corrosive_sulphur"):
        return _SULPHUR_PROXY.get(str(value).strip().lower())
    return value


def build_60296_sample(canonical):
    """Map a canonical sample dict to the IEC 60296 sample shape (remapped keys,
    boolean-coerced selects). Non-numeric / text info fields are skipped."""
    out = {}
    for name, value in canonical.items():
        if value is None or name == "operating_state":
            continue
        meta = PARAM_BY_NAME.get(name)
        if meta and meta.get("data_type") == "text":
            continue
        key = REMAP_60296.get(name, name)
        if meta and meta.get("data_type") == "select":
            out[key] = _coerce_60296(name, value)
        else:
            try:
                out[key] = float(value)
            except (TypeError, ValueError):
                continue
    return out


def build_60422_sample(canonical):
    """Map a canonical sample dict to the IEC 60422 sample shape (numeric-proxy
    selects). Keys already match canonical field names."""
    out = {}
    for name, value in canonical.items():
        if value is None or name == "operating_state":
            continue
        meta = PARAM_BY_NAME.get(name)
        if meta and meta.get("data_type") == "text":
            continue
        if meta and meta.get("data_type") == "select":
            proxy = _coerce_60422(name, value)
            if proxy is not None:
                out[name] = proxy
        else:
            try:
                out[name] = float(value)
            except (TypeError, ValueError):
                continue
    return out


# --------------------------------------------------------------------------- #
# Equipment category derivation                                                #
# --------------------------------------------------------------------------- #
def derive_category(hv_voltage_kv):
    """Derive IEC 60422 equipment category from the transformer HV rating.

      > 170 kV          -> A
      72.5 - 170 kV     -> B
      <= 72.5 kV        -> C
      unknown / null    -> B (default)
    """
    if hv_voltage_kv is None:
        return "B"
    try:
        v = float(hv_voltage_kv)
    except (TypeError, ValueError):
        return "B"
    if v > 170:
        return "A"
    if v > 72.5:
        return "B"
    return "C"


# --------------------------------------------------------------------------- #
# "Good range" label helpers (dashboard display)                               #
# --------------------------------------------------------------------------- #
_SELECT_GOOD_LABEL = {
    "appearance": "Clear",
    "corrosive_sulphur": "Non-corrosive",
    "potentially_corrosive_sulphur": "Non-corrosive",
}


def good_range_label(param, category):
    """Return a human-readable acceptable-range label for the NORMAL band of a
    parameter under the given equipment category (IEC 60422 Table 5)."""
    if param in _SELECT_GOOD_LABEL:
        return _SELECT_GOOD_LABEL[param]

    rules = get_rules_for_category(category)
    band = rules.get(param, {}).get(STATUS_GOOD)
    if not band:
        return "-"
    lo, hi = band
    if hi >= SENTINEL_MAX and lo <= 0:
        return "any"
    if hi >= SENTINEL_MAX:
        return f">= {_fmt(lo)}"
    if lo <= 0:
        return f"<= {_fmt(hi)}"
    return f"{_fmt(lo)} - {_fmt(hi)}"


def _fmt(x):
    if isinstance(x, float) and x.is_integer():
        return str(int(x))
    return str(x)


def display_for(param):
    meta = PARAM_BY_NAME.get(param)
    return meta["display"] if meta else param


def unit_for(param):
    meta = PARAM_BY_NAME.get(param)
    return meta["unit"] if meta else ""
