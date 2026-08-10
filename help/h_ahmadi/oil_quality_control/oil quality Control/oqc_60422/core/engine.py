# core/engine.py
from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from .trend import TrendAnalyzer
from ..standards.iec60422_trends import TREND_LIMITS_PER_YEAR


Status = str
RuleRange = Tuple[Optional[float], Optional[float]]   # (min, max)
RulesDict = Dict[str, Dict[Status, RuleRange]]        # param -> {status: (min,max)}


class IEC60422Engine:
    """
    IEC 60422 evaluation engine:
      - evaluate_sample: one sample against normalized rules
      - evaluate_history: aggregate worst status over time
      - evaluate_trends: compute slope and compare to trend limits

    Rules format expected (per parameter):
        rules[param] = {
            "NORMAL": (min, max),
            "ATTENTION": (min, max),
            "ACTION": (min, max)
        }

    Range logic:
        min <= value < max
    """

    # Higher = worse
    SEVERITY_RANK: Dict[str, int] = {
        "NORMAL": 0,
        "ATTENTION": 1,
        "ACTION": 2,
    }

    # Evaluate from worst to best
    STATUS_CHECK_ORDER: List[str] = ["ACTION", "ATTENTION", "NORMAL"]

    @staticmethod
    def _to_float(value: Any) -> Optional[float]:
        try:
            if value is None:
                return None
            return float(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _is_range(x: Any) -> bool:
        return isinstance(x, tuple) and len(x) == 2

    @staticmethod
    def _in_range(v: float, r: RuleRange) -> bool:
        lo, hi = r
        if lo is not None and v < lo:
            return False
        if hi is not None and v >= hi:
            return False
        return True

    @classmethod
    def _worse_of(cls, a: str, b: str) -> str:
        ra = cls.SEVERITY_RANK.get(a, -1)
        rb = cls.SEVERITY_RANK.get(b, -1)
        return a if ra >= rb else b

    @classmethod
    def evaluate_sample(cls, sample: Dict[str, Any], rules: RulesDict) -> Dict[str, str]:
        """
        Evaluate a single sample (record["values"]) against rules.
        Returns: {param: "NORMAL"|"ATTENTION"|"ACTION"}
        """
        results: Dict[str, str] = {}

        for param, raw_value in sample.items():
            param_rules = rules.get(param)
            if not isinstance(param_rules, dict) or not param_rules:
                continue

            v = cls._to_float(raw_value)
            if v is None:
                continue

            chosen: Optional[str] = None
            for status in cls.STATUS_CHECK_ORDER:
                bounds = param_rules.get(status)
                if bounds is None or not cls._is_range(bounds):
                    continue
                if cls._in_range(v, bounds):
                    chosen = status
                    break

            if chosen:
                results[param] = chosen

        return results

    @classmethod
    def evaluate_history(cls, history: List[Dict[str, Any]], rules: RulesDict) -> Dict[str, str]:
        """
        Aggregate multiple samples (history) to worst-case per parameter.

        Expected history format:
            history = [
              {"date": "YYYY-MM-DD", "values": {...}},
              ...
            ]
        """
        final_result: Dict[str, str] = {}

        for record in history:
            values = record.get("values") or {}
            if not isinstance(values, dict):
                continue

            sample_result = cls.evaluate_sample(values, rules)

            for param, status in sample_result.items():
                if param not in final_result:
                    final_result[param] = status
                else:
                    final_result[param] = cls._worse_of(final_result[param], status)

        return final_result

    @staticmethod
    def _limit_per_day(param: str) -> Optional[float]:
        """
        Trend limits are defined PER YEAR. Convert to PER DAY for comparison
        with TrendAnalyzer.calculate_slope() which returns per day if dates exist.
        """
        v = TREND_LIMITS_PER_YEAR.get(param)
        return None if v is None else (float(v) / 365.0)

    @classmethod
    def evaluate_trends(cls, history: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        """
        Compute trend slope for each parameter in history and compare to limits.

        Returns:
            {
              "param": {
                  "slope": <float|None>,
                  "limit_per_day": <float|None>,
                  "trend_status": "DANGEROUS"|"STABLE"|"UNKNOWN"
              }
            }
        """
        trend_result: Dict[str, Dict[str, Any]] = {}
        if not history:
            return trend_result

        # union of all params across all records
        params = set()
        for record in history:
            values = record.get("values") or {}
            if isinstance(values, dict):
                params.update(values.keys())

        for param in sorted(params):
            slope = TrendAnalyzer.calculate_slope(history, param)  # per day (if dates exist)
            limit_day = cls._limit_per_day(param)

            if slope is None:
                trend_result[param] = {
                    "slope": None,
                    "limit_per_day": limit_day,
                    "trend_status": "UNKNOWN",
                }
                continue

            if limit_day is None:
                trend_result[param] = {
                    "slope": slope,
                    "limit_per_day": None,
                    "trend_status": "UNKNOWN",
                }
                continue

            # Positive limit: increase dangerous if slope > limit
            # Negative limit: decrease dangerous if slope < limit (more negative)
            dangerous = (limit_day >= 0 and slope > limit_day) or (limit_day < 0 and slope < limit_day)

            trend_result[param] = {
                "slope": slope,
                "limit_per_day": limit_day,
                "trend_status": "DANGEROUS" if dangerous else "STABLE",
            }

        return trend_result
