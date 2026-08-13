"""IEC 60422:2024 (in-service mineral insulating oils) condition + trend engine."""
from .core.equipment import EquipmentCategory
from .core.states import OperatingState
from .core.trend import TrendAnalyzer
from .core.history import HistorySample
from .standards.iec60422_table2 import (
    TABLE_2,
    get_parameters_by_group,
    get_all_parameters,
    get_parameter_info,
)
from .standards.iec60422_table3 import get_table3_for_category, classify_table3
from .standards.iec60422_table5 import (
    STATUS_GOOD,
    STATUS_FAIR,
    STATUS_POOR,
    SENTINEL_MAX,
    get_rules_for_category,
)
from .standards.iec60422_trends import (
    TREND_CONFIG,
    TREND_LIMITS_PER_YEAR,
    is_trend_dangerous,
)
from .standards.iec60422_recommendations import RECOMMENDATIONS, get_recommendation

__all__ = [
    "EquipmentCategory",
    "OperatingState",
    "TrendAnalyzer",
    "HistorySample",
    "TABLE_2",
    "get_parameters_by_group",
    "get_all_parameters",
    "get_parameter_info",
    "get_table3_for_category",
    "classify_table3",
    "STATUS_GOOD",
    "STATUS_FAIR",
    "STATUS_POOR",
    "SENTINEL_MAX",
    "get_rules_for_category",
    "TREND_CONFIG",
    "TREND_LIMITS_PER_YEAR",
    "is_trend_dangerous",
    "RECOMMENDATIONS",
    "get_recommendation",
]
