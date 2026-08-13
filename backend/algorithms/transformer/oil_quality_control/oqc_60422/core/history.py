# core/history.py
class HistorySample:
    """A single oil sample in a chronological history."""

    def __init__(self, date, values):
        self.date = date
        self.values = values or {}

    def get(self, param, default=None):
        return self.values.get(param, default)

    def to_dict(self):
        return {"date": self.date, "values": dict(self.values)}
