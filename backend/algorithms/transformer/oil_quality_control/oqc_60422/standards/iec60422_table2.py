# standards/iec60422_table2.py
# IEC 60422:2024 Table 2 - test groups for in-service oil, with the sub-clause
# and reference test method for each parameter.

TABLE_2 = {
    "routine": [
        {"parameter": "colour", "subclause": "7.2", "method": "ISO 2049"},
        {"parameter": "appearance", "subclause": "7.3", "method": "IEC 60422 (visual)"},
        {"parameter": "breakdown_voltage", "subclause": "7.4", "method": "IEC 60156"},
        {"parameter": "water_content", "subclause": "7.5", "method": "IEC 60814"},
        {"parameter": "acidity", "subclause": "7.6", "method": "IEC 62021"},
        {"parameter": "dielectric_dissipation_90", "subclause": "7.7", "method": "IEC 60247"},
        {"parameter": "inhibitor_content", "subclause": "7.8", "method": "IEC 60666"},
    ],
    "complementary": [
        {"parameter": "sediments", "subclause": "7.9", "method": "IEC 62961"},
        {"parameter": "interfacial_tension", "subclause": "7.11", "method": "ISO 6295"},
        {"parameter": "particles", "subclause": "7.12", "method": "IEC 60970"},
    ],
    "special": [
        {"parameter": "sludge", "subclause": "7.10", "method": "IEC 62961"},
        {"parameter": "flash_point", "subclause": "7.13", "method": "ISO 2719"},
        {"parameter": "compatibility", "subclause": "7.14", "method": "IEC 60422 Annex"},
        {"parameter": "pour_point", "subclause": "7.15", "method": "ISO 3016"},
        {"parameter": "density_20", "subclause": "7.16", "method": "ISO 3675 / ISO 12185"},
        {"parameter": "viscosity_40", "subclause": "7.17", "method": "ISO 3104"},
        {"parameter": "pcb", "subclause": "7.18", "method": "IEC 61619"},
        {"parameter": "corrosive_sulphur", "subclause": "7.19.2", "method": "DIN 51353 / ASTM D1275"},
        {"parameter": "potentially_corrosive_sulphur", "subclause": "7.19.3", "method": "IEC 62535"},
        {"parameter": "dbds", "subclause": "7.19.4", "method": "IEC 62697"},
        {"parameter": "passivator_content", "subclause": "7.20", "method": "IEC 60666"},
    ],
}


def get_parameters_by_group(group):
    """Return the list of parameter-info dicts for a group name."""
    return TABLE_2.get(group, [])


def get_all_parameters():
    """Return a flat list of all Table 2 parameter-info dicts."""
    out = []
    for group in TABLE_2.values():
        out.extend(group)
    return out


def get_parameter_info(param):
    """Return {parameter, subclause, method, group} for a parameter, or None."""
    for group_name, params in TABLE_2.items():
        for info in params:
            if info["parameter"] == param:
                return {**info, "group": group_name}
    return None
