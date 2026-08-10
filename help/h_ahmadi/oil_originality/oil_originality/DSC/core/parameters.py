# oil_originality/DSC/core/parameters.py

from dataclasses import dataclass


@dataclass
class DSCFeatures:
    tonset: float
    tmax: float
    area: float