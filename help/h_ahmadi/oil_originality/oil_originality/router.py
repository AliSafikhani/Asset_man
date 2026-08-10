# oil_originality/router.py

from .DSC.core.engine import run_dsc_analysis
from .DTA.core.engine import run_dta_analysis


def analyze_oil_originality(method, sample, reference):
    if method == "DSC":
        return run_dsc_analysis(sample, reference)
    elif method == "DTA":
        return run_dta_analysis(sample, reference)
    else:
        raise ValueError("Unknown method")