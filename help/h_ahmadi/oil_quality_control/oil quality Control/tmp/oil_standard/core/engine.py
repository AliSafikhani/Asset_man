# core/engine.py
from oil_standard.core.result import EvaluationResult
from oil_standard.core.status import Status


class StandardEngine:

    def evaluate(self, sample: dict, standard):
        standard.build()
        results = []

        for category, parameters in standard.categories.items():
            for param in parameters:
                res = param.evaluate(sample)
                results.append(EvaluationResult(category, res))

        return results

    def final_status(self, results):
        if any(r.status == Status.NOT_OK for r in results):
            return Status.NOT_OK
        return Status.OK