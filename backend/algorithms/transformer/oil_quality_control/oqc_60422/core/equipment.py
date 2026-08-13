# core/equipment.py
# IEC 60422:2024 equipment categories.
from enum import Enum


class EquipmentCategory(str, Enum):
    """Equipment categories used to select the applicable Table 5 limits.

    Only A / B / C / F carry rule sets in this implementation; the remaining
    codes are kept for completeness / forward compatibility with the standard.
    """
    CATEGORY_A = "A"
    CATEGORY_B = "B"
    CATEGORY_C = "C"
    CATEGORY_D = "D"
    CATEGORY_E = "E"
    CATEGORY_F = "F"
    CATEGORY_G = "G"
    CATEGORY_H = "H"
    CATEGORY_I = "I"
    CATEGORY_J = "J"
    CATEGORY_K = "K"
    CATEGORY_L = "L"

    @classmethod
    def from_code(cls, code):
        """Return the EquipmentCategory for a short code ('A'..'L'), default A."""
        if code is None:
            return cls.CATEGORY_A
        code = str(code).strip().upper()
        for member in cls:
            if member.value == code:
                return member
        return cls.CATEGORY_A
