import numpy as np
from .parameters import DSCFeatures


def find_tmax(temperature, signal):
    idx = np.argmax(signal)
    return temperature[idx]


def find_area(temperature, signal):
    """محاسبه سطح زیر منحنی با روش ذوزنقه‌ای (مستقل از نسخه numpy)"""
    x = np.asarray(temperature)
    y = np.asarray(signal)
    
    # روش ذوزنقه‌ای دستی
    area = 0.0
    for i in range(len(x) - 1):
        dx = x[i+1] - x[i]
        dy = (y[i+1] + y[i]) / 2
        area += dx * dy
    
    return area


def find_tonset(temperature, signal):
    baseline = signal[:10].mean()

    for i in range(len(signal)):
        if signal[i] > baseline * 1.1:
            return temperature[i]

    return temperature[0]


def extract_features(curve):
    temperature = np.array(curve["temperature"])
    signal = np.array(curve["signal"])

    tonset = find_tonset(temperature, signal)
    tmax = find_tmax(temperature, signal)
    area = find_area(temperature, signal)

    return DSCFeatures(
        tonset=tonset,
        tmax=tmax,
        area=area
    )