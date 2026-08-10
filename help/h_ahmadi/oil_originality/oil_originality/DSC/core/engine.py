# oil_originality/DSC/core/engine.py

from .features import extract_features
from .rules import evaluate_rules
from .result import build_result


def run_dsc_analysis(sample_curve, reference_curve):
    sample_features = extract_features(sample_curve)
    ref_features = extract_features(reference_curve)

    evaluation = evaluate_rules(sample_features, ref_features)

    return build_result(sample_features, ref_features, evaluation)