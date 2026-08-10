from .features import extract_features
from .rules import evaluate_rules
from .result import build_result


def run_dta_analysis(sample_curve, reference_curve):
    """
    اجرای کامل تحلیل DTA
    sample_curve: منحنی نمونه {'temperature': [...], 'signal': [...]}
    reference_curve: منحنی مرجع {'temperature': [...], 'signal': [...]}
    """
    sample_features = extract_features(sample_curve, reference_curve)
    ref_features = extract_features(reference_curve, reference_curve)
    
    evaluation = evaluate_rules(sample_features, ref_features)
    
    return build_result(sample_features, ref_features, evaluation)