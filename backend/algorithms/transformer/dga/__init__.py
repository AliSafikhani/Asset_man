# DGA algorithms for transformer
from .duval_triangle import DuvalTriangle11
from .duval_pentagon import DuvalPentagon
from .rogers_ratio import RogersRatio
from .key_gas import KeyGas
from .iec_ratio import IECRatio

__all__ = ['DuvalTriangle11', 'DuvalPentagon', 'RogersRatio', 'KeyGas', 'IECRatio']

# DGA algorithms for transformer
from .duval_triangle_1 import DuvalTriangle1
from .duval_triangle_1 import DuvalTriangle1Zones
from .duval_triangle_1 import calculate_duval_triangle1_for_sample
from .duval_triangle_1 import run_duval_analysis

__all__ = [
    'DuvalTriangle1',
    'DuvalTriangle1Zones',
    'calculate_duval_triangle1_for_sample',
    'run_duval_analysis'
]