from .result import EvaluationResult
from .status import Status

class StandardEngine:

    def evaluate(self, sample: dict, standard):
        standard.build()
        results = []

        for category, parameters in standard.categories.items():
            for param in parameters:
                res = param.evaluate(sample)
                results.append(
                    EvaluationResult(
                        category,
                        res["parameter"],
                        res["value"],
                        res["status"],
                        res["reason"]
                    )
                )
        return results

    def final_status(self, results):
        if any(r.status == Status.NOT_OK for r in results):
            return Status.NOT_OK
        if any(r.status == Status.FAIR for r in results):
            return Status.FAIR
        return Status.OK