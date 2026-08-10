# core/parameter.py


class Parameter:
    def __init__(self, name: str, rule: "Rule"):
        self.name = name
        self.rule = rule

    def evaluate(self, sample: dict):
        value = sample.get(self.name)
        status, reason = self.rule.check(value)

        return {
            "parameter": self.name,
            "value": value,
            "status": status,
            "reason": reason
        }