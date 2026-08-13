# core/trend.py
# IEC 60422:2024 - slope (rate-of-change) computation over a sample history.
from datetime import date, datetime


def _to_date(value):
    """Coerce a date/datetime/ISO-string into a date, or None."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00")).date()
        except ValueError:
            try:
                return datetime.strptime(value[:10], "%Y-%m-%d").date()
            except ValueError:
                return None
    return None


class TrendAnalyzer:
    """Computes the per-day slope of a parameter across a chronological history.

    Each history item may be:
      - {"date"/"sample_date": <date>, "values": {param: value, ...}}
      - {"date"/"sample_date": <date>, param: value, ...}
    """

    @staticmethod
    def _extract(item, param):
        values = item.get("values") if isinstance(item, dict) else None
        if isinstance(values, dict) and param in values:
            return values.get(param)
        return item.get(param) if isinstance(item, dict) else None

    @classmethod
    def calculate_slope(cls, history, param):
        """Return slope per day, or per-sample if dates are unavailable.

        Faithful port: (last - first) / days when dates exist and span > 0,
        otherwise (last - first) / (n - 1).  None when fewer than two points.
        """
        points = []
        for item in history:
            val = cls._extract(item, param)
            if val is None:
                continue
            d = _to_date(item.get("date") or item.get("sample_date")) if isinstance(item, dict) else None
            try:
                points.append((d, float(val)))
            except (TypeError, ValueError):
                continue

        if len(points) < 2:
            return None

        first_date, first_val = points[0]
        last_date, last_val = points[-1]

        if first_date and last_date:
            days = (last_date - first_date).days
            if days > 0:
                return (last_val - first_val) / days

        return (last_val - first_val) / (len(points) - 1)
