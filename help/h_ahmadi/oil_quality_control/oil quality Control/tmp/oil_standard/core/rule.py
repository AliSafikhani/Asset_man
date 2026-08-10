# core/rule.py
from oil_standard.core.status import Status

class Rule:
    def __init__(self, min_value=None, max_value=None, boolean=None, tolerance=0.1):
        self.min = min_value
        self.max = max_value
        self.boolean = boolean
        self.tolerance = tolerance

    def check(self, value):
        if value is None:
            return Status.NOT_OK, "Missing value"

        # Boolean rule
        if self.boolean is not None:
            if value != self.boolean:
                return Status.NOT_OK, f"Expected {self.boolean}"
            return Status.OK, ""

        # Numeric rules
        if self.min is not None and value < self.min:
            if value >= self.min * (1 - self.tolerance):
                return Status.FAIR, f"Slightly below min ({self.min})"
            return Status.NOT_OK, f"< min ({self.min})"

        if self.max is not None and value > self.max:
            if value <= self.max * (1 + self.tolerance):
                return Status.FAIR, f"Slightly above max ({self.max})"
            return Status.NOT_OK, f"> max ({self.max})"

        return Status.OK, ""