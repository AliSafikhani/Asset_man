# backend/algorithms/transformer/oil_originality/dta.py
# DTA (Differential Thermal Analysis) method, ported verbatim from the
# reference algorithm (help/h_ahmadi/oil_originality/DTA).
#
# Features: onset temperature, peak temperature, and delta_t — the maximum
# point-wise difference between the sample and reference signals. Because
# delta_t compares the two signals element-wise, the sample MUST be aligned onto
# the reference temperature grid (see curves.align_curves) before analysis.
# The reference compared against itself gives delta_t = 0.

import numpy as np

from .status import ORIGINAL, SUSPICIOUS, FAKE

# Rule thresholds (verbatim from DTA/core/rules.py — note >= comparisons).
DTA_DELTA_TONSET_MAX = 10.0    # deg C
DTA_DELTA_TMAX_MAX = 8.0       # deg C
DTA_DELTA_DELTA_T_MAX = 2.0    # signal units


def _find_tmax(temperature, signal):
    idx = int(np.argmax(signal))
    return float(temperature[idx])


def _find_tonset(temperature, signal):
    """Onset temperature: first point exceeding 110% of the initial baseline."""
    baseline = float(np.asarray(signal[:10], dtype=float).mean())
    for i in range(len(signal)):
        if signal[i] > baseline * 1.1:
            return float(temperature[i])
    return float(temperature[0])


def _find_delta_t(sample_signal, ref_signal):
    """Maximum absolute point-wise difference between sample and reference."""
    diff = np.abs(np.array(sample_signal, dtype=float) - np.array(ref_signal, dtype=float))
    return float(np.max(diff))


def extract_features(sample_curve, reference_curve):
    """Return {tonset, tmax, delta_t} for a DTA sample vs its reference."""
    temperature = np.array(sample_curve["temperature"], dtype=float)
    sample_signal = np.array(sample_curve["signal"], dtype=float)
    ref_signal = np.array(reference_curve["signal"], dtype=float)
    return {
        "tonset": _find_tonset(temperature, sample_signal),
        "tmax": _find_tmax(temperature, sample_signal),
        "delta_t": _find_delta_t(sample_signal, ref_signal),
    }


def evaluate_rules(sample, ref):
    """Compare sample vs reference DTA features and return a status verdict."""
    delta_tonset = abs(sample["tonset"] - ref["tonset"])
    delta_tmax = abs(sample["tmax"] - ref["tmax"])
    delta_delta_t = abs(sample["delta_t"] - ref["delta_t"])

    fail_count = 0
    if delta_tonset >= DTA_DELTA_TONSET_MAX:
        fail_count += 1
    if delta_tmax >= DTA_DELTA_TMAX_MAX:
        fail_count += 1
    if delta_delta_t >= DTA_DELTA_DELTA_T_MAX:
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
            "delta_delta_t": delta_delta_t,
        },
    }


def run_dta_analysis(sample_curve, reference_curve):
    """Full DTA analysis: extract features for both curves, then evaluate.

    The reference features use delta_t=0 (reference vs itself), matching the
    reference engine.
    """
    sample_features = extract_features(sample_curve, reference_curve)
    ref_features = extract_features(reference_curve, reference_curve)
    evaluation = evaluate_rules(sample_features, ref_features)
    return {
        "sample": sample_features,
        "reference": ref_features,
        "evaluation": evaluation,
    }
