# oil_originality/DSC/core/result.py

def build_result(sample, ref, evaluation):
    return {
        "sample": sample,
        "reference": ref,
        "evaluation": evaluation
    }