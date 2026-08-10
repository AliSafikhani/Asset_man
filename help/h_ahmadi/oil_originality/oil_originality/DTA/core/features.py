import numpy as np
from .parameters import DTAFeatures


def find_tmax(temperature, signal):
    """پیدا کردن دمای پیک"""
    idx = np.argmax(signal)
    return temperature[idx]


def find_tonset(temperature, signal):
    """پیدا کردن دمای شروع پیک (روش آستانه)"""
    baseline = signal[:10].mean()
    
    for i in range(len(signal)):
        if signal[i] > baseline * 1.1:
            return temperature[i]
    
    return temperature[0]


def find_delta_t(sample_signal, ref_signal):
    """حداکثر اختلاف دما بین نمونه و مرجع"""
    diff = np.abs(np.array(sample_signal) - np.array(ref_signal))
    return float(np.max(diff))


def extract_features(sample_curve, reference_curve):
    """استخراج ویژگی‌های DTA از منحنی نمونه و مرجع"""
    temperature = np.array(sample_curve["temperature"])
    sample_signal = np.array(sample_curve["signal"])
    ref_signal = np.array(reference_curve["signal"])
    
    tonset = find_tonset(temperature, sample_signal)
    tmax = find_tmax(temperature, sample_signal)
    delta_t = find_delta_t(sample_signal, ref_signal)
    
    return DTAFeatures(
        tonset=tonset,
        tmax=tmax,
        delta_t=delta_t
    )