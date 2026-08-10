# core/equipment.py
from __future__ import annotations

from enum import Enum


class EquipmentCategory(str, Enum):
    """
    IEC 60422 (Table 1) equipment categories.
    Using (str, Enum) makes JSON serialization and comparisons easier.
    """

    # Transformers and reactors
    CATEGORY_A = "A"  # Power transformers >170 kV, critical supply
    CATEGORY_B = "B"  # Power transformers 72.5–170 kV
    CATEGORY_C = "C"  # Distribution transformers ≤72.5 kV

    # Instrument and protection transformers
    CATEGORY_D = "D"  # Instrument transformers >170 kV
    CATEGORY_E = "E"  # Instrument transformers ≤170 kV

    # Tap changers
    CATEGORY_F = "F"  # OLTC diverter tanks

    # Circuit breakers and switchgear
    CATEGORY_G = "G"  # Oil CBs >72.5 kV
    CATEGORY_H = "H"  # Oil CBs ≤72.5 kV

    # Bushings
    CATEGORY_K = "K"  # Bushings >170 kV
    CATEGORY_L = "L"  # Bushings ≤72.5/≤170 kV (per IEC table)

    # Optional short aliases (nice to have; doesn't break existing code)
    A = "A"
    B = "B"
    C = "C"
    D = "D"
    E = "E"
    F = "F"
    G = "G"
    H = "H"
    K = "K"
    L = "L"

    @classmethod
    def from_code(cls, code: str) -> "EquipmentCategory":
        """Accepts 'A'...'L' or 'CATEGORY_A'... and returns enum."""
        c = code.strip().upper()
        if c.startswith("CATEGORY_"):
            c = c.replace("CATEGORY_", "")
        return cls(c)

    def __str__(self) -> str:
        return self.value
