"""Oil Quality Control algorithms (IEC 60296 + IEC 60422:2024).

Public API consumed by the backend service layer:

    from algorithms.transformer.oil_quality_control import (
        assess_60296, assess_60422, analyze_trend,
        derive_category, PARAM_META, OPERATING_STATE_FIELD,
    )
"""
from .engine import assess_60296, assess_60422, analyze_trend
from .metadata import (
    PARAM_META,
    PARAM_BY_NAME,
    OPERATING_STATE_FIELD,
    GROUPS,
    derive_category,
    good_range_label,
    build_60296_sample,
    build_60422_sample,
    display_for,
    unit_for,
)

__all__ = [
    "assess_60296",
    "assess_60422",
    "analyze_trend",
    "derive_category",
    "good_range_label",
    "build_60296_sample",
    "build_60422_sample",
    "display_for",
    "unit_for",
    "PARAM_META",
    "PARAM_BY_NAME",
    "OPERATING_STATE_FIELD",
    "GROUPS",
]
