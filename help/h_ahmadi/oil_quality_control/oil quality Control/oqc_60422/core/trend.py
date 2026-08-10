from __future__ import annotations

from datetime import date, datetime
from typing import Any, Dict, List, Optional, Tuple


class TrendAnalyzer:
    @staticmethod
    def _to_float(x: Any) -> Optional[float]:
        try:
            if x is None:
                return None
            return float(x)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _parse_date(d: Any) -> Optional[date]:
        if d is None:
            return None
        if isinstance(d, date):
            return d
        if isinstance(d, str):
            # expects YYYY-MM-DD
            try:
                return datetime.fromisoformat(d).date()
            except Exception:
                return None
        return None

    @classmethod
    def _extract_points(cls, history: List[Dict[str, Any]], parameter: str) -> List[Tuple[Optional[date], float]]:
        """
        Returns list of (date|None, value_float) sorted by record order.
        Accepts record date keys: 'date' or 'sample_date'.
        """
        points: List[Tuple[Optional[date], float]] = []
        for record in history:
            values = record.get("values") or {}
            if not isinstance(values, dict):
                continue
            if parameter not in values:
                continue

            v = cls._to_float(values.get(parameter))
            if v is None:
                continue

            d = cls._parse_date(record.get("date") or record.get("sample_date"))
            points.append((d, v))

        return points

    @classmethod
    def calculate_slope(cls, history: List[Dict[str, Any]], parameter: str) -> Optional[float]:
        """
        Trend slope:
        - Prefer slope per day if dates exist:
            (last_value - first_value) / days_between
        - Fallback to per-interval slope if dates missing:
            (last_value - first_value) / (n-1)
        Returns None if not enough valid points.
        """
        points = cls._extract_points(history, parameter)
        if len(points) < 2:
            return None

        (d1, v1) = points[0]
        (d2, v2) = points[-1]

        # if both dates are present and different -> slope per day
        if d1 is not None and d2 is not None:
            days = (d2 - d1).days
            if days > 0:
                return (v2 - v1) / days
            # same day samples -> fallback to interval slope
        intervals = len(points) - 1
        if intervals <= 0:
            return None
        return (v2 - v1) / intervals
