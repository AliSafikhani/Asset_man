# iec_tr_62874_2015_final.py
"""
IEC TR 62874:2015 — Final Production-Ready Implementation
- Fully compliant with IEC TR 62874:2015 (including Annex A tables)
- CO2 unit: μl/l (ppm v/v)
- LargeDist CO2 references split into Open/Sealed
- RoI rounded to 3 decimal places
- Conservative (worst-case) decision logic per Clause 6.2
"""

from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Literal, List, Dict, Any
import pandas as pd
import numpy as np

AgeCategory = Literal["<1Y", "1-10Y", "10-30Y", ">30Y"]

class Family(str, Enum):
    GSU = "GSU"
    NETWORK = "Network"
    LARGE_DIST = "LargeDist"
    INDUSTRIAL = "Industrial"
    LVDC = "LVDC"

class Breathing(str, Enum):
    OPEN = "Open"
    SEALED = "Sealed"

class OilType(str, Enum):
    UNINHIBITED = "uninhibited"
    INHIBITED = "inhibited"

class MaintenanceType(str, Enum):
    RECONDITIONING = "reconditioning"
    RECLAMATION = "reclamation"
    OIL_CHANGE = "oil_change"

@dataclass(frozen=True)
class FALRef:
    C90: float
    C98: float
    R90: Optional[float] = None
    R98: Optional[float] = None

@dataclass(frozen=True)
class CO2Ref:
    C90: int
    C98: int

class IEC62874Reference:
    FAL = {
        "GSU_uninhibited": {
            "<1Y":    FALRef(0.05, 0.05, 0.01, 0.01),
            "1-10Y":  FALRef(0.3,  1.0,  0.04, 0.10),
            "10-30Y": FALRef(2.0,  4.0,  0.30, 0.70),
            ">30Y":   FALRef(3.0,  6.0)
        },
        "GSU_inhibited": {
            "1-10Y":  FALRef(0.1,  0.15),
            "10-30Y": FALRef(0.8,  1.5,  0.25, 0.60)
        },
        "Network": {
            "<1Y":    FALRef(0.1,  0.2,  0.01, 0.02),
            "1-10Y":  FALRef(0.3,  1.1,  0.06, 0.60),
            "10-30Y": FALRef(1.6,  3.5,  0.25, 0.80),
            ">30Y":   FALRef(2.0,  4.5,  0.3,  1.1)
        },
        "LargeDist_Open": {
            "<1Y":    FALRef(0.05, 0.2,  0.01, 0.03),
            "1-10Y":  FALRef(0.7,  3.0,  0.20, 0.50),
            "10-30Y": FALRef(1.8,  4.2,  0.25, 0.65),
            ">30Y":   FALRef(3.0,  6.0,  0.30, 0.80)
        },
        "LargeDist_Sealed": {
            "<1Y":    FALRef(0.05, 0.15),
            "1-10Y":  FALRef(0.15, 0.85, 0.02, 0.04),
            "10-30Y": FALRef(1.6,  5.0,  0.40, 0.70)
        },
        "Industrial": {
            "<1Y":    FALRef(0.6,  1.5,  0.02, 0.20),
            "1-10Y":  FALRef(0.7,  2.7,  0.10, 0.70),
            "10-30Y": FALRef(1.3,  4.5,  0.30, 1.1)
        },
        "LVDC": {
            "1-10Y":  FALRef(0.8,  1.4,  0.30, 0.80),
            "10-30Y": FALRef(1.0,  3.0,  0.30, 0.80)
        }
    }

    CO2 = {
        "GSU":           {"<1Y": CO2Ref(2000,2500), "1-10Y": CO2Ref(5000,7000),
                          "10-30Y": CO2Ref(6000,11000), ">30Y": CO2Ref(8000,15000)},
        "Network":       {"<1Y": CO2Ref(3000,5000), "1-10Y": CO2Ref(5000,8000),
                          "10-30Y": CO2Ref(8000,11000), ">30Y": CO2Ref(8000,13000)},
        "LargeDist_Open": {"<1Y": CO2Ref(2000,3500), "1-10Y": CO2Ref(4000,8000),
                          "10-30Y": CO2Ref(8500,13000), ">30Y": CO2Ref(9000,14000)},
        "LargeDist_Sealed": {"<1Y": CO2Ref(2000,3000), "1-10Y": CO2Ref(3500,6500),
                          "10-30Y": CO2Ref(7000,11000), ">30Y": CO2Ref(8000,12000)},
        "Industrial":    {"<1Y": CO2Ref(1500,3500), "1-10Y": CO2Ref(3500,5500),
                          "10-30Y": CO2Ref(4500,7000), ">30Y": CO2Ref(5000,9000)},
        "LVDC":          {"1-10Y": CO2Ref(3000,4500), "10-30Y": CO2Ref(4500,7500)}
    }

@dataclass
class MaintenanceRecord:
    date: pd.Timestamp
    mtype: MaintenanceType

class Transformer:
    def __init__(
        self,
        name: str,
        commissioning_date: str,
        family: Family,
        breathing: Optional[Breathing] = None,
        oil_type: OilType = OilType.UNINHIBITED
    ):
        self.name = name
        self.commissioning_date = pd.to_datetime(commissioning_date)
        self.family = family
        self.breathing = breathing
        self.oil_type = oil_type

        self.tests = pd.DataFrame(columns=["Date", "Age_Years", "2FAL", "CO2"])
        self.maintenance: List[MaintenanceRecord] = []

        self.fal_key = self._get_fal_key()
        self.co2_key = self._get_co2_key()

    def _get_fal_key(self) -> str:
        if self.family == Family.GSU and self.oil_type == OilType.INHIBITED:
            return "GSU_inhibited"
        if self.family == Family.LARGE_DIST:
            if self.breathing is None:
                raise ValueError("Breathing must be specified for LargeDist family.")
            return f"LargeDist_{self.breathing.value}"
        return self.family.value

    def _get_co2_key(self) -> str:
        if self.family == Family.LARGE_DIST:
            if self.breathing is None:
                raise ValueError("Breathing must be specified for LargeDist family.")
            return f"LargeDist_{self.breathing.value}"
        return self.family.value

    def add_test(self, date: str, fal: float, co2: float) -> None:
        test_date = pd.to_datetime(date)
        age_years = (test_date - self.commissioning_date).days / 365.25
        new_row = pd.DataFrame({
            "Date": [test_date], "Age_Years": [age_years],
            "2FAL": [float(fal)], "CO2": [float(co2)]
        })
        self.tests = pd.concat([self.tests, new_row], ignore_index=True)
        self.tests = self.tests.sort_values("Date").reset_index(drop=True)

    def record_maintenance(self, date: str, mtype: MaintenanceType) -> None:
        self.maintenance.append(MaintenanceRecord(pd.to_datetime(date), mtype))

    def _age_category(self, age: float) -> AgeCategory:
        if age <= 1: return "<1Y"
        elif age <= 10: return "1-10Y"
        elif age <= 30: return "10-30Y"
        else: return ">30Y"

    def _recent_oil_disturbance(self, latest_date: pd.Timestamp) -> Optional[str]:
        six_months = pd.Timedelta(days=183)
        for rec in self.maintenance:
            if rec.mtype in {MaintenanceType.RECONDITIONING, MaintenanceType.RECLAMATION, MaintenanceType.OIL_CHANGE}:
                if rec.date <= latest_date and (latest_date - rec.date) <= six_months:
                    return f"{rec.mtype.value} on {rec.date.date()}"
        return None

    def _calculate_roi(self) -> Dict[str, Any]:
        if len(self.tests) < 2:
            return {"roi": None, "status": "N.A.", "notes": "Less than 2 tests"}
        
        latest_date = self.tests["Date"].max()
        if self._recent_oil_disturbance(latest_date):
            return {"roi": None, "status": "N.A.", "notes": "Oil-paper equilibrium disturbed ≤6 months"}

        slope, _ = np.polyfit(self.tests["Age_Years"], self.tests["2FAL"], 1)
        notes = ""
        if len(self.tests) < 3:
            notes = "RoI from <3 points (3–4 recommended)"
        
        return {
            "roi": round(float(slope), 3),
            "status": "ok",
            "notes": notes
        }

    def _get_fal_ref(self, cat: AgeCategory) -> Optional[FALRef]:
        return IEC62874Reference.FAL.get(self.fal_key, {}).get(cat)

    def _get_co2_ref(self, cat: AgeCategory) -> Optional[CO2Ref]:
        return IEC62874Reference.CO2.get(self.co2_key, {}).get(cat)

    def _assess(self, value: float, c90: float, c98: float) -> str:
        if value <= c90: return "LOW"
        elif value <= c98: return "TYPICAL"
        else: return "HIGH"

    def analyze(self) -> Dict[str, Any]:
        if self.tests.empty:
            print("No test data.")
            return {"error": "no_tests"}

        latest = self.tests.iloc[-1]
        age_cat = self._age_category(latest["Age_Years"])

        fal_ref = self._get_fal_ref(age_cat)
        co2_ref = self._get_co2_ref(age_cat)

        fal_status = self._assess(latest["2FAL"], fal_ref.C90, fal_ref.C98) if fal_ref else None
        co2_status = self._assess(latest["CO2"], co2_ref.C90, co2_ref.C98) if co2_ref else None

        roi_info = self._calculate_roi()
        roi_value = roi_info["roi"]
        roi_status = None
        if roi_value is not None and fal_ref and fal_ref.R90 is not None:
            if roi_value > fal_ref.R98:
                roi_status = "HIGH"
            elif roi_value > fal_ref.R90:
                roi_status = "TYPICAL"
            else:
                roi_status = "LOW"

        severity = {"LOW": 0, "TYPICAL": 1, "HIGH": 2, "N.A.": -1}
        candidates = [s for s in [fal_status, co2_status] if s]
        conc_decision = max(candidates, key=lambda x: severity.get(x, -1)) if candidates else "N.A."

        final = conc_decision
        if roi_status and severity.get(roi_status, -1) > severity.get(final, -1):
            final = roi_status

        result = {
            "transformer": self.name,
            "age_years": round(latest["Age_Years"], 2),
            "age_category": age_cat,
            "latest_2FAL_mg/kg": latest["2FAL"],
            "latest_CO2_μl/l": int(latest["CO2"]),
            "2FAL_status": fal_status or "N.A.",
            "CO2_status": co2_status or "N.A.",
            "RoI_mg/kg/year": roi_value,
            "RoI_status": roi_status or "N.A.",
            "final_decision": final,
            "notes": roi_info["notes"]
        }

        self._print_report(result)
        return result

    def _print_report(self, r: Dict[str, Any]) -> None:
        line = "="*76
        print("\n" + line)
        print(f"IEC TR 62874:2015 ANALYSIS — {r['transformer']}")
        print(line)
        print(f"Age: {r['age_years']} years ({r['age_category']})")
        print(f"2-FAL: {r['latest_2FAL_mg/kg']:.3f} mg/kg → {r['2FAL_status']}")
        print(f"CO₂ : {r['latest_CO2_μl/l']:,} μl/l → {r['CO2_status']}")
        if r["RoI_mg/kg/year"] is not None:
            print(f"RoI : {r['RoI_mg/kg/year']:.3f} mg/kg/year → {r['RoI_status']}")
        else:
            print(f"RoI : N.A. ({r['notes']})")
        print(f"\nFINAL DECISION (Conservative): {r['final_decision']}")
        print(line + "\n")

# Example
if __name__ == "__main__":
    t = Transformer("Test-01 LargeDist Open", "2003-06-15", Family.LARGE_DIST, Breathing.OPEN)
    t.add_test("2023-01-10", 1.2, 7200)
    t.add_test("2024-01-15", 2.1, 8100)
    t.add_test("2025-11-20", 3.8, 9500)
    t.analyze()