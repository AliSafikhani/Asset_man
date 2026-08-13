# backend/algorithms/transformer/oil_originality/__init__.py
#
# Oil-originality (اصالت روغن) algorithm for transformers. Compares a submitted
# oil sample's DSC and DTA thermal curves against verified reference curves and
# returns a combined authenticity verdict (original / suspicious / fake).

from .engine import analyze, combine_results
from .status import ORIGINAL, SUSPICIOUS, FAKE, SCORE_MAP
from .reference import DSC_REFERENCE_CURVE, DTA_REFERENCE_CURVE
from .curves import load_curve, align_curves
from . import dsc, dta

__all__ = [
    "analyze",
    "combine_results",
    "ORIGINAL",
    "SUSPICIOUS",
    "FAKE",
    "SCORE_MAP",
    "DSC_REFERENCE_CURVE",
    "DTA_REFERENCE_CURVE",
    "load_curve",
    "align_curves",
    "dsc",
    "dta",
]
