# core/result.py
class EvaluationResult:
    def __init__(self, category: str, parameter_result: dict):
        self.category = category
        self.parameter = parameter_result["parameter"]
        self.value = parameter_result["value"]
        self.status = parameter_result["status"]
        self.reason = parameter_result["reason"]

    def to_dict(self):
        return {
            "category": self.category,
            "parameter": self.parameter,
            "value": self.value,
            "status": self.status,
            "reason": self.reason
        }