# core/states.py
# IEC 60422:2024 operating states.
from enum import Enum


class OperatingState(Enum):
    """Whether the oil sample is taken before energization or in service.

    Drives which table is used: before energization -> Table 3 (commissioning
    limits); in service -> Table 5 (condition assessment limits).
    """
    BEFORE_ENERGIZATION = "before_energization"
    IN_SERVICE = "in_service"

    @classmethod
    def from_value(cls, value):
        if value is None:
            return cls.IN_SERVICE
        value = str(value).strip().lower()
        for member in cls:
            if member.value == value:
                return member
        return cls.IN_SERVICE
