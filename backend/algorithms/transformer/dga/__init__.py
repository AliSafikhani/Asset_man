# backend/algorithms/transformer/dga/__init__.py

# DGA algorithms for transformer

from .zones import (
    DGA_GASES,
    DGA_GAS_NAMES,
    DuvalTriangle1Zones,
    DuvalTriangle2Zones,
    DuvalTriangle4Zones,
    DuvalTriangle5Zones,
    DuvalTriangle6Zones,
    DuvalPentagon1Zones,
    DuvalPentagon2Zones,
    RogersStatus,
    DoernenburgStatus,
    IEC60599Status,
    MLDGAFaultStatus,
    IEEEStatus,
    IECStatus,  # ADD THIS
)

from .duval_triangle_1 import DuvalTriangle1
from .duval_triangle_2 import DuvalTriangle2
from .duval_triangle_4 import DuvalTriangle4
from .duval_triangle_5 import DuvalTriangle5
from .duval_triangle_6 import DuvalTriangle6
from .duval_pentagon_1 import DuvalPentagon1
from .duval_pentagon_2 import DuvalPentagon2
from .rogers_ratio import RogersRatio
from .doernenburg_ratio import DoernenburgRatio
from .iec60599_ratio import IEC60599Ratio
from .ml_dga_algorithm import MLDGA1
from .IEEE_processor import IEEEProcessor
from .ieee_algorithm import IEEEAlgorithm
from .IEC_processor import IECProcessor  # ADD THIS
from .iec_algorithm import IECAlgorithm  # ADD THIS


__all__ = [
    'DGA_GASES',
    'DGA_GAS_NAMES',
    'DuvalTriangle1Zones',
    'DuvalTriangle2Zones',
    'DuvalTriangle4Zones',
    'DuvalTriangle5Zones',
    'DuvalTriangle6Zones',
    'DuvalPentagon1Zones',
    'DuvalPentagon2Zones',
    'RogersStatus',
    'DoernenburgStatus',
    'IEC60599Status',
    'MLDGAFaultStatus',
    'IEEEStatus',
    'IECStatus',  # ADD THIS
    'DuvalTriangle1',
    'DuvalTriangle2',
    'DuvalTriangle4',
    'DuvalTriangle5',
    'DuvalTriangle6',
    'DuvalPentagon1',
    'DuvalPentagon2',
    'RogersRatio',
    'DoernenburgRatio',
    'IEC60599Ratio',
    'MLDGA1',
    'IEEEProcessor',
    'IEEEAlgorithm',
    'IECProcessor',  # ADD THIS
    'IECAlgorithm',  # ADD THIS
]