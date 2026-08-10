class EvaluationResult:
    def __init__(self, category, parameter, value, status, reason):
        self.category = category
        self.parameter = parameter
        self.value = value
        self.status = status
        self.reason = reason

    def to_dict(self):
        return {
            "category": self.category,
            "parameter": self.parameter,
            "value": self.value,
            "status": self.status.value,
            "reason": self.reason
        }