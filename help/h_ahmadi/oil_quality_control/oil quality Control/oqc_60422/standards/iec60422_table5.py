# standards/iec60422_table5.py
from __future__ import annotations

from typing import Dict, Tuple, Optional, Any
from ..core.equipment import EquipmentCategory

# =====================================================================
# IEC 60422:2024 – Table 5 – Transformers and reactors
# Application and interpretation of tests
# =====================================================================

STATUS_GOOD = "NORMAL"
STATUS_FAIR = "ATTENTION"
STATUS_POOR = "ACTION"

RuleRange = Tuple[Optional[float], Optional[float]]
ParamRule = Dict[str, Dict[str, Any]]

# =====================================================================
# ابتدا قوانین CATEGORY_A را به طور کامل تعریف می‌کنیم
# =====================================================================

CATEGORY_A_RULES = {

    "colour": {
        STATUS_GOOD: {
            "range": (0, 2),
            "recommendation": "No action required, continue normal sampling.",
            "note": "Typically, no action should be taken based on colour. Change, specifically rapid change in colour can indicate ageing and should be investigated utilising other tests. Some oils can be dark in colour but be in good condition therefore colour should not be used as an indicator of health."
        },
        STATUS_FAIR: {
            "range": (2, 6),
            "recommendation": "As dictated by other tests.",
            "note": ""
        },
        STATUS_POOR: {
            "range": (6, 999),
            "recommendation": "As dictated by other tests.",
            "note": ""
        }
    },

    "appearance": {
        STATUS_GOOD: {
            "range": (0, 1.5),
            "recommendation": "No action required, continue normal sampling.",
            "note": "Clear, free from sediment and suspended matter."
        },
        STATUS_FAIR: {
            "range": (1.5, 2.5),
            "recommendation": "As dictated by other tests.",
            "note": "Dull appearance can be a symptom of chemical contamination. Turbidity is a symptom of high water content or indication of material incompatibility or severe contamination from non-soluble materials."
        },
        STATUS_POOR: {
            "range": (2.5, 999),
            "recommendation": "As dictated by other tests.",
            "note": "Severe contamination detected."
        }
    },

    "breakdown_voltage": {
        STATUS_GOOD: {
            "range": (60, 999),
            "recommendation": "No action required, continue normal sampling.",
            "note": "High sampling temperatures (> 50 °C) can lead to poor results when evaluated at ambient temperature in the laboratory. In these cases, repeat samples should be taken at lower temperatures. Alternatively, users can refer to Annex C for guidance on normalization of water content and how it can influence breakdown voltage."
        },
        STATUS_FAIR: {
            "range": (50, 60),
            "recommendation": "More frequent sampling. Check other parameters, e.g. water, particle content.",
            "note": ""
        },
        STATUS_POOR: {
            "range": (0, 50),
            "recommendation": "Check the source of water or particulate contamination, resample. If high water content is confirmed, consider drying the solid insulation or filtering for removal and identification of particles.",
            "note": ""
        }
    },

    "water_content": {
        STATUS_GOOD: {
            "range": (0, 15),
            "recommendation": "No action required, continue normal sampling.",
            "note": "The values of water content shall be always assessed together with the values for breakdown voltage. In case of suspicion of a moisture problem, sampling at different equipment temperatures is recommended."
        },
        STATUS_FAIR: {
            "range": (15, 20),
            "recommendation": "More frequent sampling. Check other parameters, e.g. breakdown voltage, particle content and perhaps DDF or resistivity and acidity.",
            "note": ""
        },
        STATUS_POOR: {
            "range": (20, 999),
            "recommendation": "Check the source of water, resample. Consider monitoring with the transformer online (if possible) using fixed or portable equipment. Where further samples or online monitoring confirms high saturation values (see Annex B), drying of the solid insulation is recommended.",
            "note": ""
        }
    },

    "acidity": {
        STATUS_GOOD: {
            "range": (0, 0.10),
            "recommendation": "No action required, continue normal sampling.",
            "note": ""
        },
        STATUS_FAIR: {
            "range": (0.10, 0.15),
            "recommendation": "More frequent sampling. Check the presence of sediment and sludge. An inhibited oil that reached fair values has possibly lost its oxidation protection.",
            "note": ""
        },
        STATUS_POOR: {
            "range": (0.15, 999),
            "recommendation": "Starting from the limit value shown above, a decision can then be made at which point to reclaim the oil (see 14.4) or, alternatively, if more economical, replace the oil (see Clause 12).",
            "note": "Acidity values are typical for uninhibited oils. Inhibited oils with 'Good' inhibitor content would have lower acidity values which are not expected to reach the 'Poor' condition."
        }
    },

    "dielectric_dissipation_90": {
        STATUS_GOOD: {
            "range": (0, 0.10),
            "recommendation": "No action required, continue normal sampling.",
            "note": ""
        },
        STATUS_FAIR: {
            "range": (0.10, 0.20),
            "recommendation": "More frequent sampling. Check other parameters.",
            "note": ""
        },
        STATUS_POOR: {
            "range": (0.20, 999),
            "recommendation": "Consider reclaiming the oil (see 14.4) or, alternatively, if more economical, replace the oil (see Clause 12).",
            "note": ""
        }
    },

    "volume_resistivity_90": {
        STATUS_GOOD: {
            "range": (10, 999),
            "recommendation": "No action required, continue normal sampling.",
            "note": ""
        },
        STATUS_FAIR: {
            "range": (3, 10),
            "recommendation": "More frequent sampling. Check other parameters.",
            "note": ""
        },
        STATUS_POOR: {
            "range": (0, 3),
            "recommendation": "Consider reclaiming the oil (see 14.4) or, alternatively, if more economical, replace the oil (see Clause 12).",
            "note": ""
        }
    },

    "inhibitor_content": {
        STATUS_GOOD: {
            "range": (60, 100),
            "recommendation": "No action required, continue normal sampling.",
            "note": "This guidance is applicable to originally inhibited oils and applicable to reclaimed uninhibited oils that have had inhibitor added. For further guidance, users can refer to the oil supplier."
        },
        STATUS_FAIR: {
            "range": (40, 60),
            "recommendation": "More frequent sampling. Where acidity is ≤ 0.08 mgKOH/g oil and IFT ≥ 28 mN/m, consider re-inhibition to original base line level based on local experience.",
            "note": ""
        },
        STATUS_POOR: {
            "range": (0, 40),
            "recommendation": "More frequent sampling. Where acidity is ≤ 0.08 mgKOH/g oil and IFT ≥ 28 mN/m, consider re-inhibition to original base line level based on local experience. Where acidity is > 0.08 mgKOH/g oil or IFT < 28 mN/m, re-inhibition is not effective. Consider reclaiming (see 14.4) or change the oil (see Clause 12).",
            "note": ""
        }
    },

    "passivator_content": {
        STATUS_GOOD: {
            "range": (70, 999),
            "recommendation": "No action required, less frequent monitoring acceptable.",
            "note": "Aged oil, especially uninhibited oil, runs a greater risk of rapid depletion of passivator."
        },
        STATUS_FAIR: {
            "range": (50, 70),
            "recommendation": "Maintain regular monitoring.",
            "note": ""
        },
        STATUS_POOR: {
            "range": (0, 50),
            "recommendation": "Remove the source of corrosion by changing the oil (see Clause 12) or by removing corrosive compounds by means of suitable oil treatments, or as a short-term solution, top up with new passivator, to ≤ 100 mg/kg (see Clause 13).",
            "note": ""
        }
    },

    "sediments": {
        STATUS_GOOD: {
            "range": (0, 0.02),
            "recommendation": "No action required.",
            "note": "Not a routine test. Perform only when BDV, acidity and DDF values are near the limits."
        },
        STATUS_FAIR: {
            "range": (0.02, 0.5),
            "recommendation": "Where sediment is detected, recondition oil or reclaim oil or both (14.3). Alternatively, if more economical, replace the oil (see Clause 12).",
            "note": ""
        },
        STATUS_POOR: {
            "range": (0.5, 999),
            "recommendation": "Where sediment is detected, recondition oil or reclaim oil or both (14.3). Alternatively, if more economical, replace the oil (see Clause 12).",
            "note": ""
        }
    },

    "sludge": {
        STATUS_GOOD: {
            "range": (0, 0.02),
            "recommendation": "No action required.",
            "note": "Not a routine test. Perform only when BDV, acidity and DDF values are near the limits."
        },
        STATUS_FAIR: {
            "range": (0.02, 0.5),
            "recommendation": "Where precipitable sludge is detected, reclaim oil (see Clause 14.3). Alternatively, if more economical, replace the oil (see Clause 12).",
            "note": ""
        },
        STATUS_POOR: {
            "range": (0.5, 999),
            "recommendation": "Where precipitable sludge is detected, reclaim oil (see Clause 14.3). Alternatively, if more economical, replace the oil (see Clause 12).",
            "note": ""
        }
    },

    "interfacial_tension": {
        STATUS_GOOD: {
            "range": (28, 999),
            "recommendation": "No action required, continue normal sampling.",
            "note": "This test is most useful during the early life as it can indicate early stage of oxidation or contamination. Can be a routine test for inhibited oil, typically not a routine test for uninhibited oil."
        },
        STATUS_FAIR: {
            "range": (20, 28),
            "recommendation": "More frequent sampling.",
            "note": ""
        },
        STATUS_POOR: {
            "range": (0, 20),
            "recommendation": "When poor results observed, refer to other tests such as acidity and DDF as well as other tests that can confirm ageing of the oil.",
            "note": ""
        }
    },

    "corrosive_sulphur": {
        STATUS_GOOD: {
            "range": (0, 0.5),
            "recommendation": "No action required, continue normal sampling.",
            "note": "The necessity of corrective actions is to be carefully evaluated following completion of a risk assessment study (see 7.19)."
        },
        STATUS_FAIR: {
            "range": (0.5, 0.5),
            "recommendation": "Conduct risk assessment.",
            "note": ""
        },
        STATUS_POOR: {
            "range": (0.5, 999),
            "recommendation": "Conduct risk assessment OR – remove the source of corrosion by changing the oil (see Clause 12) or by removing corrosive compounds by means of suitable oil treatments. Add a metal passivator (e.g. triazole derivatives). After the addition of metal passivator to the oil, regular monitoring of the concentration of passivator is necessary. In case of continuous depletion of concentration of the passivator, remove the cause of corrosion by means of suitable oil treatments. Measure DBDS.",
            "note": "If the oil test for corrosivity is positive and DBDS is present, follow the recommendations of CIGRE Brochures 378:2009 [12] and 625:2015 [13] for the appropriate mitigation actions."
        }
    },

    "potentially_corrosive_sulphur": {
        STATUS_GOOD: {
            "range": (0, 0.5),
            "recommendation": "No action required, continue normal sampling.",
            "note": ""
        },
        STATUS_FAIR: {
            "range": (0.5, 0.5),
            "recommendation": "Conduct risk assessment.",
            "note": ""
        },
        STATUS_POOR: {
            "range": (0.5, 999),
            "recommendation": "Conduct risk assessment OR – remove the source of corrosion by changing the oil (see Clause 12) or by removing corrosive compounds by means of suitable oil treatments.",
            "note": ""
        }
    },

    "dbds": {
        STATUS_GOOD: {
            "range": (0, 5),
            "recommendation": "No action required.",
            "note": ""
        },
        STATUS_FAIR: {
            "range": (5, 20),
            "recommendation": "Conduct risk assessment. Monitor passivator content.",
            "note": ""
        },
        STATUS_POOR: {
            "range": (20, 999),
            "recommendation": "Remove the source of corrosion by changing the oil (see Clause 12) or by removing corrosive compounds by means of suitable oil treatments.",
            "note": "If the oil test for corrosivity is positive and DBDS is present, follow the recommendations of CIGRE Brochures 378:2009 [12] and 625:2015 [13] for the appropriate mitigation actions."
        }
    },

    "flash_point": {
        STATUS_GOOD: {
            "range": (135, 999),
            "recommendation": "No action required.",
            "note": "Not a routine test. Can be required when an unusual odour is noticed, when an internal fault has occurred or when a transformer is refilled. Can be subject to local legislation and regulations."
        },
        STATUS_FAIR: {
            "range": (125, 135),
            "recommendation": "Equipment can require inspection. Investigate.",
            "note": ""
        },
        STATUS_POOR: {
            "range": (0, 125),
            "recommendation": "Equipment can require inspection. Investigate.",
            "note": ""
        }
    },

    "pcb": {
        STATUS_GOOD: {
            "range": (0, 2),
            "recommendation": "No action required.",
            "note": "Can be subject to local legislation and regulations."
        },
        STATUS_FAIR: {
            "range": (2, 5),
            "recommendation": "Can be subject to local regulations.",
            "note": ""
        },
        STATUS_POOR: {
            "range": (5, 999),
            "recommendation": "Can be subject to local regulations.",
            "note": ""
        }
    },
}

# =====================================================================
# CATEGORY_B_RULES و CATEGORY_C_RULES
# فقط پارامترهایی که با CATEGORY_A تفاوت دارند، تعریف می‌شوند
# =====================================================================

CATEGORY_B_RULES = {
    "breakdown_voltage": {
        STATUS_GOOD: {"range": (50, 999), "recommendation": "No action required, continue normal sampling.", "note": ""},
        STATUS_FAIR: {"range": (40, 50), "recommendation": "More frequent sampling. Check other parameters, e.g. water, particle content.", "note": ""},
        STATUS_POOR: {"range": (0, 40), "recommendation": "Check the source of water or particulate contamination, resample. If high water content is confirmed, consider drying the solid insulation or filtering for removal and identification of particles.", "note": ""}
    },
    "water_content": {
        STATUS_GOOD: {"range": (0, 20), "recommendation": "No action required, continue normal sampling.", "note": ""},
        STATUS_FAIR: {"range": (20, 30), "recommendation": "More frequent sampling. Check other parameters, e.g. breakdown voltage, particle content and perhaps DDF or resistivity and acidity.", "note": ""},
        STATUS_POOR: {"range": (30, 999), "recommendation": "Check the source of water, resample. Consider monitoring with the transformer online (if possible) using fixed or portable equipment. Where further samples or online monitoring confirms high saturation values (see Annex B), drying of the solid insulation is recommended.", "note": ""}
    },
    "acidity": {
        STATUS_GOOD: {"range": (0, 0.10), "recommendation": "No action required, continue normal sampling.", "note": ""},
        STATUS_FAIR: {"range": (0.10, 0.20), "recommendation": "More frequent sampling. Check the presence of sediment and sludge. An inhibited oil that reached fair values has possibly lost its oxidation protection.", "note": ""},
        STATUS_POOR: {"range": (0.20, 999), "recommendation": "Starting from the limit value shown above, a decision can then be made at which point to reclaim the oil (see 14.4) or, alternatively, if more economical, replace the oil (see Clause 12).", "note": ""}
    },
    "dielectric_dissipation_90": {
        STATUS_GOOD: {"range": (0, 0.10), "recommendation": "No action required, continue normal sampling.", "note": ""},
        STATUS_FAIR: {"range": (0.10, 0.50), "recommendation": "More frequent sampling. Check other parameters.", "note": ""},
        STATUS_POOR: {"range": (0.50, 999), "recommendation": "Consider reclaiming the oil (see 14.4) or, alternatively, if more economical, replace the oil (see Clause 12).", "note": ""}
    },
    "volume_resistivity_90": {
        STATUS_GOOD: {"range": (3, 999), "recommendation": "No action required, continue normal sampling.", "note": ""},
        STATUS_FAIR: {"range": (0.2, 3), "recommendation": "More frequent sampling. Check other parameters.", "note": ""},
        STATUS_POOR: {"range": (0, 0.2), "recommendation": "Consider reclaiming the oil (see 14.4) or, alternatively, if more economical, replace the oil (see Clause 12).", "note": ""}
    },
}

CATEGORY_C_RULES = {
    "breakdown_voltage": {
        STATUS_GOOD: {"range": (40, 999), "recommendation": "No action required, continue normal sampling.", "note": ""},
        STATUS_FAIR: {"range": (30, 40), "recommendation": "More frequent sampling. Check other parameters, e.g. water, particle content.", "note": ""},
        STATUS_POOR: {"range": (0, 30), "recommendation": "Check the source of water or particulate contamination, resample. If high water content is confirmed, consider drying the solid insulation or filtering for removal and identification of particles.", "note": ""}
    },
    "water_content": {
        STATUS_GOOD: {"range": (0, 30), "recommendation": "No action required, continue normal sampling.", "note": ""},
        STATUS_FAIR: {"range": (30, 40), "recommendation": "More frequent sampling. Check other parameters, e.g. breakdown voltage, particle content and perhaps DDF or resistivity and acidity.", "note": ""},
        STATUS_POOR: {"range": (40, 999), "recommendation": "Check the source of water, resample. Consider monitoring with the transformer online (if possible) using fixed or portable equipment. Where further samples or online monitoring confirms high saturation values (see Annex B), drying of the solid insulation is recommended.", "note": ""}
    },
    "acidity": {
        STATUS_GOOD: {"range": (0, 0.15), "recommendation": "No action required, continue normal sampling.", "note": ""},
        STATUS_FAIR: {"range": (0.15, 0.30), "recommendation": "More frequent sampling. Check the presence of sediment and sludge. An inhibited oil that reached fair values has possibly lost its oxidation protection.", "note": ""},
        STATUS_POOR: {"range": (0.30, 999), "recommendation": "Starting from the limit value shown above, a decision can then be made at which point to reclaim the oil (see 14.4) or, alternatively, if more economical, replace the oil (see Clause 12).", "note": ""}
    },
    "dielectric_dissipation_90": {
        STATUS_GOOD: {"range": (0, 0.10), "recommendation": "No action required, continue normal sampling.", "note": ""},
        STATUS_FAIR: {"range": (0.10, 0.50), "recommendation": "More frequent sampling. Check other parameters.", "note": ""},
        STATUS_POOR: {"range": (0.50, 999), "recommendation": "Consider reclaiming the oil (see 14.4) or, alternatively, if more economical, replace the oil (see Clause 12).", "note": ""}
    },
    "volume_resistivity_90": {
        STATUS_GOOD: {"range": (3, 999), "recommendation": "No action required, continue normal sampling.", "note": ""},
        STATUS_FAIR: {"range": (0.2, 3), "recommendation": "More frequent sampling. Check other parameters.", "note": ""},
        STATUS_POOR: {"range": (0, 0.2), "recommendation": "Consider reclaiming the oil (see 14.4) or, alternatively, if more economical, replace the oil (see Clause 12).", "note": ""}
    },
}

# =====================================================================
# CATEGORY_F (OLTC)
# =====================================================================

CATEGORY_F_RULES = {
    "water_content": {
        STATUS_GOOD: {"range": (0, 50), "recommendation": "No action required, continue normal sampling.", "note": ""},
        STATUS_FAIR: {"range": (50, 70), "recommendation": "More frequent sampling. Check other parameters.", "note": ""},
        STATUS_POOR: {"range": (70, 999), "recommendation": "Check the source of water, resample. Consider drying the solid insulation.", "note": ""}
    },
    "acidity": {
        STATUS_GOOD: {"range": (0, 0.30), "recommendation": "No action required, continue normal sampling.", "note": ""},
        STATUS_FAIR: {"range": (0.30, 0.40), "recommendation": "More frequent sampling. Check the presence of sediment and sludge.", "note": ""},
        STATUS_POOR: {"range": (0.40, 999), "recommendation": "Consider reclaiming the oil or replace the oil.", "note": ""}
    },
    "breakdown_voltage": {
        STATUS_GOOD: {"range": (40, 999), "recommendation": "No action required, continue normal sampling.", "note": ""},
        STATUS_FAIR: {"range": (30, 40), "recommendation": "More frequent sampling. Check other parameters.", "note": ""},
        STATUS_POOR: {"range": (0, 30), "recommendation": "Check the source of contamination, resample. Consider filtering or replacing the oil.", "note": ""}
    },
    "colour": {
        STATUS_GOOD: {"range": (0, 2), "recommendation": "No action required, continue normal sampling.", "note": ""},
        STATUS_FAIR: {"range": (2, 3), "recommendation": "More frequent sampling.", "note": ""},
        STATUS_POOR: {"range": (3, 999), "recommendation": "Check other parameters. Consider reclaiming or replacing the oil.", "note": ""}
    },
}

# =====================================================================
# ساخت TABLE_5 نهایی
# =====================================================================

TABLE_5 = {
    EquipmentCategory.CATEGORY_A: CATEGORY_A_RULES,
    EquipmentCategory.CATEGORY_B: {
        **CATEGORY_A_RULES,  # پارامترهای مشترک
        **CATEGORY_B_RULES,  # پارامترهای متفاوت
    },
    EquipmentCategory.CATEGORY_C: {
        **CATEGORY_A_RULES,
        **CATEGORY_C_RULES,
    },
    EquipmentCategory.CATEGORY_F: CATEGORY_F_RULES,
}

# =====================================================================
# توابع کمکی
# =====================================================================

def get_rules_for_category(category: EquipmentCategory) -> Dict[str, Dict[str, RuleRange]]:
    """دریافت محدوده‌های عددی برای هر پارامتر در یک دسته‌بندی خاص"""
    param_rules: Dict[str, Dict[str, RuleRange]] = {}
    category_data = TABLE_5.get(category, {})
    
    for param_name, status_dict in category_data.items():
        rules: Dict[str, RuleRange] = {}
        for status, data in status_dict.items():
            if "range" in data:
                rules[status] = data["range"]
        if rules:
            param_rules[param_name] = rules
    
    return param_rules

def get_recommendations(category: EquipmentCategory, parameter: str, status: str) -> str:
    """دریافت اقدامات پیشنهادی برای یک پارامتر و وضعیت خاص"""
    category_data = TABLE_5.get(category, {})
    param_data = category_data.get(parameter, {})
    status_data = param_data.get(status, {})
    return status_data.get("recommendation", "")

def get_notes(category: EquipmentCategory, parameter: str, status: str) -> str:
    """دریافت Notes برای یک پارامتر و وضعیت خاص"""
    category_data = TABLE_5.get(category, {})
    param_data = category_data.get(parameter, {})
    status_data = param_data.get(status, {})
    return status_data.get("note", "")

def get_full_parameter_info(category: EquipmentCategory, parameter: str) -> Dict[str, Any]:
    """دریافت اطلاعات کامل یک پارامتر (محدوده‌ها، اقدامات و نکات)"""
    category_data = TABLE_5.get(category, {})
    return category_data.get(parameter, {})

def normalize_rules(raw_param_rules: Dict[str, Dict[str, RuleRange]]) -> Dict[str, Dict[str, RuleRange]]:
    """تابع سازگاری با کد قدیمی"""
    return raw_param_rules