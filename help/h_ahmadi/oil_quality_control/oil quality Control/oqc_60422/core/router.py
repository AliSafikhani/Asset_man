# core/router.py
from __future__ import annotations

from ..standards.iec60422_table3 import TABLE_3
from ..standards.iec60422_table5 import TABLE_5, normalize_rules

from .states import OperatingState


class IEC60422Router:
    """
    Selects the correct IEC 60422 limits table based on operating state,
    and returns rules in a normalized format expected by the engine:

        {param: {"NORMAL": (min,max), "ATTENTION": (min,max), "ACTION": (min,max)}}
    """

    @staticmethod
    def get_table(equipment_category, operating_state):
        if operating_state == OperatingState.BEFORE_ENERGIZATION:
            raw = TABLE_3.get(equipment_category)
            if raw is None:
                raise KeyError(f"No TABLE_3 rules for category: {equipment_category}")
            return normalize_rules(raw)

        if operating_state == OperatingState.IN_SERVICE:
            raw = TABLE_5.get(equipment_category)
            if raw is None:
                raise KeyError(f"No TABLE_5 rules for category: {equipment_category}")
            return normalize_rules(raw)

        raise ValueError("Invalid operating state")
