# backend/algorithms/transformer/oil_originality/dsc.py
# DSC (Differential Scanning Calorimetry) method, ported verbatim from the
# reference algorithm (help/h_ahmadi/oil_originality/DSC).
#
# Features per curve: onset temperature, peak temperature, area under curve.
# The sample is compared to a verified reference; deltas beyond fixed thresholds
# count as failures. 2+ failures = fake, 1 = suspicious, else original.

import numpy as np

from .status import ORIGINAL, SUSPICIOUS, FAKE

# Rule thresholds (verbatim from DSC/core/rules.py).
DSC_DELTA_TONSET_MAX = 10.0     # deg C
DSC_DELTA_TMAX_MAX = 5.0        # deg C
DSC_DELTA_AREA_MAX_PCT = 20.0   # percent


def _find_tmax(temperature, signal):
    idx = int(np.argmax(signal))
    return float(temperature[idx])


def _find_area(temperature, signal):
    """Area under the curve via the manual trapezoidal rule."""
    x = np.asarray(temperature, dtype=float)
    y = np.asarray(signal, dtype=float)
    area = 0.0
    for i in range(len(x) - 1):
        dx = x[i + 1] - x[i]
        dy = (y[i + 1] + y[i]) / 2.0
        area += dx * dy
    return float(area)


def _find_tonset(temperature, signal):
    """Onset temperature: first point exceeding 110% of the initial baseline."""
    baseline = float(np.asarray(signal[:10], dtype=float).mean())
    for i in range(len(signal)):
        if signal[i] > baseline * 1.1:
            return float(temperature[i])
    return float(temperature[0])


def extract_features(curve):
    """Return {tonset, tmax, area} for a DSC curve."""
    temperature = np.array(curve["temperature"], dtype=float)
    signal = np.array(curve["signal"], dtype=float)
    return {
        "tonset": _find_tonset(temperature, signal),
        "tmax": _find_tmax(temperature, signal),
        "area": _find_area(temperature, signal),
    }


def evaluate_rules(sample, ref):
    """Compare sample vs reference DSC features and return a status verdict."""
    delta_tonset = abs(sample["tonset"] - ref["tonset"])
    delta_tmax = abs(sample["tmax"] - ref["tmax"])
    ref_area = ref["area"] if ref["area"] != 0 else 1e-9
    delta_area = abs(sample["area"] - ref["area"]) / ref_area * 100.0

    fail_count = 0
    if delta_tonset > DSC_DELTA_TONSET_MAX:
        fail_count += 1
    if delta_tmax > DSC_DELTA_TMAX_MAX:
        fail_count += 1
    if delta_area > DSC_DELTA_AREA_MAX_PCT:
        fail_count += 1

    if fail_count >= 2:
        status = FAKE
    elif fail_count == 1:
        status = SUSPICIOUS
    else:
        status = ORIGINAL

    return {
        "status": status,
        "fail_count": fail_count,
        "details": {
            "delta_tonset": delta_tonset,
            "delta_tmax": delta_tmax,
            "delta_area": delta_area,
        },
    }


def run_dsc_analysis(sample_curve, reference_curve):
    """Full DSC analysis: extract features for both curves, then evaluate."""
    sample_features = extract_features(sample_curve)
    ref_features = extract_features(reference_curve)
    evaluation = evaluate_rules(sample_features, ref_features)
    return {
        "sample": sample_features,
        "reference": ref_features,
        "evaluation": evaluation,
    }
