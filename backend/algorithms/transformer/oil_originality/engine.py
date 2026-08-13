# backend/algorithms/transformer/oil_originality/engine.py
# Top-level oil-originality engine: runs the DSC and DTA methods against the
# built-in reference curves and combines them into a final verdict.
#
# Ported from the reference algorithm's main.combine_results + main.main.
# The final verdict maps ORIGINAL/SUSPICIOUS/FAKE to 0/1/2, sums the two method
# scores, and thresholds: total >= 3 -> fake, >= 2 -> suspicious, else original.

from .status import ORIGINAL, SUSPICIOUS, FAKE, SCORE_MAP
from .curves import load_curve, align_curves
from .reference import DSC_REFERENCE_CURVE, DTA_REFERENCE_CURVE
from . import dsc as dsc_method
from . import dta as dta_method


def combine_results(dsc_result, dta_result):
    """Combine DSC + DTA verdicts into a final authenticity status."""
    dsc_status = dsc_result["evaluation"]["status"]
    dta_status = dta_result["evaluation"]["status"]

    total_score = SCORE_MAP[dsc_status] + SCORE_MAP[dta_status]

    if total_score >= 3:
        final_status = FAKE
    elif total_score >= 2:
        final_status = SUSPICIOUS
    else:
        final_status = ORIGINAL

    return {
        "final_status": final_status,
        "dsc_status": dsc_status,
        "dta_status": dta_status,
        "total_score": total_score,
        "dsc_details": dsc_result["evaluation"]["details"],
        "dta_details": dta_result["evaluation"]["details"],
    }


def analyze(dsc_sample, dta_sample, dsc_reference=None, dta_reference=None):
    """Run the full oil-originality analysis.

    Parameters
    ----------
    dsc_sample : dict
        The submitted DSC sample curve {"temperature": [...], "signal": [...]}.
    dta_sample : dict
        The submitted DTA sample curve {"temperature": [...], "signal": [...]}.
    dsc_reference : dict, optional
        A caller-supplied DSC reference curve. When None, the built-in verified
        reference (DSC_REFERENCE_CURVE) is used.
    dta_reference : dict, optional
        A caller-supplied DTA reference curve. When None, the built-in verified
        reference (DTA_REFERENCE_CURVE) is used.

    Each method (DSC, DTA) compares its sample against its reference, so a full
    analysis uses four curves in total. Every sample is aligned onto its own
    reference temperature grid (np.interp) first, matching the reference
    run_analysis.py pipeline.

    Returns
    -------
    dict
        {
          "final_status", "dsc_status", "dta_status", "total_score",
          "dsc_details", "dta_details",   # delta metrics per method
          "dsc": {sample, reference, evaluation},
          "dta": {sample, reference, evaluation},
          "curves": {                     # curves used, for charting
            "dsc": {"sample": {...}, "reference": {...}},
            "dta": {"sample": {...aligned...}, "reference": {...}},
          },
        }
    """
    dsc_curve = load_curve(dsc_sample["temperature"], dsc_sample["signal"])
    dta_curve = load_curve(dta_sample["temperature"], dta_sample["signal"])

    # Reference curves: use the caller-supplied curves when provided, otherwise
    # fall back to the built-in verified references.
    dsc_ref = (
        load_curve(dsc_reference["temperature"], dsc_reference["signal"])
        if dsc_reference is not None
        else DSC_REFERENCE_CURVE
    )
    dta_ref = (
        load_curve(dta_reference["temperature"], dta_reference["signal"])
        if dta_reference is not None
        else DTA_REFERENCE_CURVE
    )

    # Both samples are aligned onto their reference temperature grids before
    # analysis. Alignment resamples the sample signal (np.interp) onto the
    # reference axis, so DSC features (tonset/tmax/area) and the DTA point-wise
    # delta_t are both computed on the same grid as the reference.
    dsc_aligned = align_curves(dsc_curve, dsc_ref)
    dta_aligned = align_curves(dta_curve, dta_ref)

    dsc_result = dsc_method.run_dsc_analysis(dsc_aligned, dsc_ref)
    dta_result = dta_method.run_dta_analysis(dta_aligned, dta_ref)

    final = combine_results(dsc_result, dta_result)

    final["dsc"] = dsc_result
    final["dta"] = dta_result
    final["curves"] = {
        "dsc": {"sample": dsc_aligned, "reference": dsc_ref},
        "dta": {"sample": dta_aligned, "reference": dta_ref},
    }
    return final
