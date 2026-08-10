# %%
import pandas as pd
import numpy as np

class Family(str):
    GSU = "GSU"
    NETWORK = "Network"
    LARGE_DIST = "LargeDist"
    INDUSTRIAL = "Industrial"
    LVDC = "LVDC"

class Breathing(str, Enum):
    OPEN = "Open"
    SEALED = "Sealed"