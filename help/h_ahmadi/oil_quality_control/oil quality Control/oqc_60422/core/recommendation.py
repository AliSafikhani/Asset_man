from ..standards.iec60422_recommendations import RECOMMENDATIONS

class RecommendationEngine:

    @staticmethod
    def generate(condition_result: dict, trend_result: dict):
        actions = {}

        for param, status in condition_result.items():
            param_actions = []

            # وضعیت فعلی
            if param in RECOMMENDATIONS:
                if status in RECOMMENDATIONS[param]:
                    param_actions.append(
                        RECOMMENDATIONS[param][status]
                    )

            # وضعیت روند
            trend_status = trend_result.get(param, {}).get("trend_status")
            if trend_status == "DANGEROUS":
                key = "DANGEROUS_TREND"
                if key in RECOMMENDATIONS.get(param, {}):
                    param_actions.append(
                        RECOMMENDATIONS[param][key]
                    )

            if param_actions:
                actions[param] = param_actions

        return actions