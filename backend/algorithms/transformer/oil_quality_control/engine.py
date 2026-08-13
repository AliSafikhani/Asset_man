# engine.py
# High-level wrappers over the IEC 60296 / IEC 60422 ports, consumed by
# OilQualityService.  These adapt a "canonical sample" (canonical field_name ->
# value) into each standard's expected shape and return JSON-friendly payloads.

from datetime import date, datetime

from .metadata import (
    PARAM_BY_NAME,
    REMAP_60296,
    build_60296_sample,
    build_60422_sample,
    good_range_label,
    display_for,
    unit_for,
)
from .oqc_60296 import StandardEngine, TypeAStandard, TypeBStandard
from .oqc_60422.standards.iec60422_table5 import (
    get_rules_for_category,
    STATUS_GOOD,
    STATUS_FAIR,
    STATUS_POOR,
    SENTINEL_MAX,
)
from .oqc_60422.standards.iec60422_table2 import TABLE_2, get_parameter_info
from .oqc_60422.standards.iec60422_table3 import classify_table3
from .oqc_60422.standards.iec60422_trends import TREND_CONFIG, is_trend_dangerous
from .oqc_60422.standards.iec60422_recommendations import get_recommendation
from .oqc_60422.core.trend import TrendAnalyzer

# Reverse map: IEC 60296 key -> canonical field_name (for display).
_INV_REMAP_60296 = {v: k for k, v in REMAP_60296.items()}

# Severity ordering (worst first) for rolling up an overall status.
_SEVERITY = {STATUS_GOOD: 0, STATUS_FAIR: 1, STATUS_POOR: 2}
_CHECK_ORDER = [STATUS_GOOD, STATUS_FAIR, STATUS_POOR]


def _iso(d):
    if isinstance(d, (date, datetime)):
        return d.isoformat()
    return str(d) if d is not None else None


# =========================================================================== #
# IEC 60296 - new / unused oil acceptance                                     #
# =========================================================================== #
def assess_60296(canonical_sample, oil_type="A"):
    """Evaluate a sample against IEC 60296 (Type A default, else Type B)."""
    sample = build_60296_sample(canonical_sample)
    standard = TypeBStandard() if str(oil_type).upper() == "B" else TypeAStandard()
    engine = StandardEngine()
    raw = engine.evaluate(sample, standard)
    final = engine.final_status(raw)

    results = []
    counts = {"total": 0, "ok": 0, "fair": 0, "not_ok": 0}
    for r in raw:
        canonical = _INV_REMAP_60296.get(r.parameter, r.parameter)
        status = r.status.value  # "OK" | "FAIR" | "NOT_OK"
        results.append({
            "category": r.category,
            "parameter": canonical,
            "display": display_for(canonical),
            "value": r.value,
            "unit": unit_for(canonical),
            "status": status,
            "reason": r.reason,
        })
        counts["total"] += 1
        if status == "OK":
            counts["ok"] += 1
        elif status == "FAIR":
            counts["fair"] += 1
        else:
            counts["not_ok"] += 1

    return {
        "standard": "IEC 60296",
        "oil_type": "B" if str(oil_type).upper() == "B" else "A",
        "final_status": final.value,
        "counts": counts,
        "results": results,
    }


# =========================================================================== #
# IEC 60422:2024 - in-service oil condition                                   #
# =========================================================================== #
def _classify_table5(param_rules, value):
    """Classify a value using the main1.py convention: inclusive bounds,
    first match in NORMAL -> ATTENTION -> ACTION order. Defaults to ACTION when
    the value falls outside every band."""
    for status in _CHECK_ORDER:
        band = param_rules.get(status)
        if not band:
            continue
        lo, hi = band
        lo_ok = lo is None or value >= lo
        hi_ok = hi is None or hi >= SENTINEL_MAX or value <= hi
        if lo_ok and hi_ok:
            return status
    return STATUS_POOR


def assess_60422(canonical_sample, category, operating_state="in_service"):
    """Evaluate a sample against IEC 60422:2024.

    in_service        -> Table 5 (condition limits for the equipment category)
    before_energization -> Table 3 (commissioning limits)
    """
    proxy = build_60422_sample(canonical_sample)
    before = str(operating_state).strip().lower() == "before_energization"
    rules = get_rules_for_category(category)

    results = []
    counts = {"evaluated": 0, "good": 0, "fair": 0, "poor": 0}
    recommendations = []

    # The set of parameters we can classify = those with a rule (Table 5) and a
    # measured value; before energization we classify via Table 3 instead.
    ruled_params = list(rules.keys()) if not before else [
        p["parameter"] for grp in TABLE_2.values() for p in grp
    ]

    for param in ruled_params:
        if param not in proxy:
            continue
        value = proxy[param]

        if before:
            status = classify_table3(param, value, category)
            if status is None:
                continue
        else:
            if param not in rules:
                continue
            status = _classify_table5(rules[param], value)

        info = get_parameter_info(param) or {}
        original = canonical_sample.get(param)
        rec = get_recommendation(param, status)
        results.append({
            "parameter": param,
            "group": info.get("group", PARAM_BY_NAME.get(param, {}).get("group", "")),
            "display": display_for(param),
            "value": original,
            "unit": unit_for(param),
            "good_range": good_range_label(param, category),
            "status": status,
            "recommendation": rec,
        })
        counts["evaluated"] += 1
        if status == STATUS_GOOD:
            counts["good"] += 1
        elif status == STATUS_FAIR:
            counts["fair"] += 1
            recommendations.append({"parameter": param, "display": display_for(param),
                                     "status": status, "recommendation": rec})
        else:
            counts["poor"] += 1
            recommendations.append({"parameter": param, "display": display_for(param),
                                    "status": status, "recommendation": rec})

    if counts["evaluated"] == 0:
        final = "UNKNOWN"
    elif counts["poor"] > 0:
        final = STATUS_POOR
    elif counts["fair"] > 0:
        final = STATUS_FAIR
    else:
        final = STATUS_GOOD

    # Coverage per Table 2 group (evaluated / total defined in the group).
    coverage = {}
    for group_name, params in TABLE_2.items():
        total = len(params)
        evaluated = sum(1 for p in params if any(r["parameter"] == p["parameter"] for r in results))
        coverage[group_name] = {"evaluated": evaluated, "total": total}

    total_table = sum(len(p) for p in TABLE_2.values())
    confidence = round(100.0 * counts["evaluated"] / total_table) if total_table else 0

    return {
        "standard": "IEC 60422:2024",
        "category": str(category).upper(),
        "operating_state": operating_state,
        "ruleset": "Table 3" if before else "Table 5",
        "final_status": final,
        "counts": counts,
        "confidence": confidence,
        "coverage": coverage,
        "results": results,
        "recommendations": recommendations,
    }


# =========================================================================== #
# IEC 60422:2024 - trend analysis over a chronological sample history          #
# =========================================================================== #
def analyze_trend(history):
    """Analyze rate-of-change trends across an asset's oil test history.

    `history` = [{"date": <date>, "values": {canonical: value}}] sorted by date.
    """
    # Build a proxy history (numeric selects) once, keep dates.
    proxy_history = []
    for item in history:
        values = item.get("values", {}) if isinstance(item, dict) else {}
        proxy_history.append({
            "date": item.get("date") if isinstance(item, dict) else None,
            "values": build_60422_sample(values),
        })

    parameters = []
    dangerous_trends = []
    recommendations = []

    for param, cfg in TREND_CONFIG.items():
        series = [
            {"date": _iso(s["date"]), "value": s["values"][param]}
            for s in proxy_history if param in s["values"]
        ]
        if len(series) < 2:
            continue

        slope_per_day = TrendAnalyzer.calculate_slope(proxy_history, param)
        if slope_per_day is None:
            continue

        initial_value = series[0]["value"]
        dangerous = is_trend_dangerous(param, slope_per_day, initial_value)
        slope_per_year = slope_per_day * 365.0

        entry = {
            "parameter": param,
            "display": display_for(param),
            "unit": cfg.get("unit", unit_for(param)),
            "direction": cfg.get("direction"),
            "limit_per_year": cfg.get("limit_per_year"),
            "slope_per_day": round(slope_per_day, 6),
            "slope_per_year": round(slope_per_year, 4),
            "annual_limit_value": cfg.get("limit_per_year"),
            "description": cfg.get("description", ""),
            "reference": cfg.get("reference", ""),
            "dangerous": dangerous,
            "trend_status": "DANGEROUS" if dangerous else "STABLE",
            "series": series,
        }
        parameters.append(entry)

        if dangerous:
            sign = "+" if slope_per_year >= 0 else ""
            unit = cfg.get("unit", "")
            rate = f"{sign}{round(slope_per_year, 3)} {unit}/year".strip()
            dangerous_trends.append({
                "parameter": param,
                "display": display_for(param),
                "rate_of_change": rate,
                "slope_per_year": round(slope_per_year, 4),
                "unit": unit,
                "direction": cfg.get("direction"),
            })
            rec = get_recommendation(param, "DANGEROUS_TREND")
            if rec:
                recommendations.append({
                    "parameter": param,
                    "display": display_for(param),
                    "recommendation": rec,
                })

    return {
        "standard": "IEC 60422:2024 (trend)",
        "parameters": parameters,
        "dangerous_trends": dangerous_trends,
        "trend_risk": "DANGEROUS" if dangerous_trends else "NORMAL",
        "recommendations": recommendations,
        "sample_count": len(history),
    }
