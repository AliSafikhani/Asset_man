# backend/algorithms/transformer/oil_originality/curves.py
# Curve loading + alignment helpers, ported from the reference algorithm's
# data_loader.py. A "curve" is a dict {"temperature": [...], "signal": [...]}.

import numpy as np


def load_curve(temperature, signal):
    """Build a validated curve dict from two equal-length numeric sequences.

    Raises ValueError if the two sequences differ in length or are empty.
    """
    temp = [float(v) for v in temperature]
    sig = [float(v) for v in signal]

    if len(temp) != len(sig):
        raise ValueError(
            f"Temperature and signal must have equal length: "
            f"x={len(temp)}, y={len(sig)}"
        )
    if len(temp) == 0:
        raise ValueError("Curve is empty.")

    return {"temperature": temp, "signal": sig}


def align_curves(sample_curve, ref_curve):
    """Interpolate the sample signal onto the reference temperature grid.

    Mirrors data_loader.align_curves: the sample is resampled with np.interp so
    that both curves share the reference temperature axis before comparison.
    """
    temp_ref = np.array(ref_curve["temperature"], dtype=float)
    temp_sample = np.array(sample_curve["temperature"], dtype=float)
    signal_sample = np.array(sample_curve["signal"], dtype=float)

    aligned_signal = np.interp(temp_ref, temp_sample, signal_sample)

    return {
        "temperature": temp_ref.tolist(),
        "signal": aligned_signal.tolist(),
    }
