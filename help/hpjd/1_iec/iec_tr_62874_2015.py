"""
IEC TR 62874:2015 — Paper Thermal Degradation Assessment Module
================================================================
This module evaluates transformer paper thermal degradation according
to IEC TR 62874:2015 using data loaded from database.

IMPORTANT: This standard is ONLY applicable to Kraft paper insulation.
           If insulation type is not Kraft, analysis will be rejected.

================================================================
INPUT DICTIONARY (from Backend - loaded from database):
================================================================

1. Transformer Configuration:
   {
       "name": str,                    # Transformer identifier
       "commissioning_date": str,      # "YYYY-MM-DD"
       "family": str,                  # "GSU" | "Network" | "LargeDist" | "Industrial" | "LVDC" | "HVDC" | "Reactor" | "Furnace"
       "breathing": str | None,        # "Open" | "Sealed" (REQUIRED for LargeDist)
       "oil_type": str                 # "uninhibited" | "inhibited" (default: "uninhibited")
       "insulation_type": str          # "Kraft" | "TUP" | "Synthetic" | "Other" (REQUIRED)
   }

2. Test Data (list of records from database):
   [
       {
           "date": str,                # "YYYY-MM-DD"
           "fal": float | None,        # 2-FAL in mg/kg (None if not measured)
           "co2": float | None         # CO2 in μl/l (None if not measured)
       },
       ...
   ]
   Note: 2-FAL and CO2 can be recorded on different dates independently.

3. Maintenance Data (list of records from database - optional):
   [
       {
           "date": str,                # "YYYY-MM-DD"
           "mtype": str                # "oil_change" | "reconditioning" | "reclamation"
       },
       ...
   ]

================================================================
OUTPUT DICTIONARY (from analyze() method):
================================================================
{
    "transformer": str,                # Asset name
    "age_years": float,                # Current age in years
    "age_category": str,               # "<1Y" | "1-10Y" | "10-30Y" | ">30Y"
    "latest_2FAL_mg/kg": float | None, # Latest valid 2-FAL value
    "latest_CO2_μl/l": int | None,     # Latest valid CO2 value
    "2FAL_status": str,                # "LOW" | "TYPICAL" | "HIGH" | "N.A."
    "CO2_status": str,                 # "LOW" | "TYPICAL" | "HIGH" | "N.A."
    "RoI_mg/kg_year": float | None,    # Rate of Increase for 2-FAL
    "RoI_status": str | None,          # "LOW" | "TYPICAL" | "HIGH" | "N.A."
    "final_decision": str,             # "LOW" | "TYPICAL" | "HIGH"
    "notes": str,                      # Additional remarks
    "validation": {
        "status": str,                 # "VALID" | "INSUFFICIENT_TESTS" | "INSUFFICIENT_TIME_GAP" | "NO_VALID_TESTS_AFTER_MAINTENANCE"
        "message": str,
        "details": dict
    },
    "test_summary": {
        "total_tests": int,
        "valid_tests": int,
        "invalid_tests": int,
        "valid_test_dates": list,
        "invalid_test_dates": list,
        "valid_test_reasons": list,
        "invalid_test_reasons": list
    },
    "warnings": list,                  # List of warning messages (English)
    "reference_2FAL": {                # Reference values (Annex A.2) - None if not defined
        "C90": float,
        "C98": float,
        "R90": float | None,
        "R98": float | None
    } | None,
    "reference_CO2": {                 # Reference values (Annex A.3) - None if not defined
        "C90": int,
        "C98": int
    } | None
}

================================================================
FAMILIES OF EQUIPMENT (Clause 5.2):
================================================================
- GSU (generation step-up units)
- Network (network transmission)
- LargeDist (large distribution > 2 MVA)
- Industrial (industrial/distribution < 2 MVA)
- LVDC (low voltage DC)
- HVDC (high voltage DC)
- Reactor
- Furnace

Note: Reference values (Annex A) are only provided for:
      GSU, Network, LargeDist, Industrial, LVDC.
      For HVDC, Reactor, Furnace, users must define their own reference tables.

================================================================
VALIDATION RULES (Clause 3.7.2, 4.3, 5.1):
================================================================
1. Insulation type MUST be "Kraft" (IEC Scope)
2. Tests before last oil maintenance → INVALID
3. Tests within 6 months after last oil maintenance → INVALID
4. Tests >= 6 months after last oil maintenance → VALID
5. Minimum 6 months gap between consecutive VALID tests
6. Minimum 2 VALID tests required for analysis

================================================================
WARNINGS (added to output):
================================================================
1. If the number of valid 2-FAL tests and valid CO2 tests differ by > 20%
2. If the last valid test dates for 2-FAL and CO2 differ by > 1 year (365 days)
"""

from __future__ import annotations
from dataclasses import dataclass
from enum import Enum
from typing import Optional, Literal, Dict, Any, List, Union
import pandas as pd
import numpy as np


# ============================================================================
# TYPE DEFINITIONS
# ============================================================================

AgeCategory = Literal["<1Y", "1-10Y", "10-30Y", ">30Y"]


class Family(str, Enum):
    """Transformer family classification - Clause 5.2"""
    GSU = "GSU"
    NETWORK = "Network"
    LARGE_DIST = "LargeDist"
    INDUSTRIAL = "Industrial"
    LVDC = "LVDC"
    HVDC = "HVDC"
    REACTOR = "Reactor"
    FURNACE = "Furnace"


class Breathing(str, Enum):
    OPEN = "Open"
    SEALED = "Sealed"


class OilType(str, Enum):
    UNINHIBITED = "uninhibited"
    INHIBITED = "inhibited"


class InsulationType(str, Enum):
    """IEC TR 62874:2015 is ONLY applicable to Kraft paper."""
    KRAFT = "Kraft"
    TUP = "TUP"                      # Thermally Upgraded Paper
    SYNTHETIC = "Synthetic"
    OTHER = "Other"


class MaintenanceType(str, Enum):
    RECONDITIONING = "reconditioning"
    RECLAMATION = "reclamation"
    OIL_CHANGE = "oil_change"


class ValidationStatus(str, Enum):
    VALID = "VALID"
    INSUFFICIENT_TESTS = "INSUFFICIENT_TESTS"
    INSUFFICIENT_TIME_GAP = "INSUFFICIENT_TIME_GAP"
    NO_VALID_TESTS_AFTER_MAINTENANCE = "NO_VALID_TESTS_AFTER_MAINTENANCE"


# ============================================================================
# INTERNAL DATA STRUCTURES
# ============================================================================

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


@dataclass
class MaintenanceRecord:
    date: pd.Timestamp
    mtype: MaintenanceType


@dataclass
class ValidationResult:
    status: ValidationStatus
    message: str
    details: Dict[str, Any]


# ============================================================================
# REFERENCE TABLES (IEC TR 62874:2015 Annex A)
# ============================================================================

class IEC62874Reference:
    """
    Reference values from IEC TR 62874:2015 Annex A.
    
    NOTE: For families not listed below (HVDC, Reactor, Furnace),
          the standard does not provide typical values (Clause A.1).
          Users should define their own reference tables based on collected data.
    """

    # 2-FAL Reference Tables (Annex A.2)
    FAL = {
        # Table A.1 - GSU with uninhibited oil
        "GSU_uninhibited": {
            "<1Y":    FALRef(0.05, 0.05, 0.010, 0.010),
            "1-10Y":  FALRef(0.30, 1.00, 0.040, 0.100),
            "10-30Y": FALRef(2.00, 4.00, 0.300, 0.700),
            ">30Y":   FALRef(3.00, 6.00, None,  None),
        },
        # Table A.2 - GSU with inhibited oil
        "GSU_inhibited": {
            "1-10Y":  FALRef(0.10, 0.15, None, None),
            "10-30Y": FALRef(0.80, 1.50, 0.250, 0.600),
        },
        # Table A.3 - Network transmission
        "Network": {
            "<1Y":    FALRef(0.10, 0.20, 0.010, 0.020),
            "1-10Y":  FALRef(0.30, 1.10, 0.060, 0.600),
            "10-30Y": FALRef(1.60, 3.50, 0.250, 0.800),
            ">30Y":   FALRef(2.00, 4.50, 0.300, 1.100),
        },
        # Table A.4 - Large Distribution (Open conservator)
        "LargeDist_Open": {
            "<1Y":    FALRef(0.05, 0.20, 0.010, 0.030),
            "1-10Y":  FALRef(0.70, 3.00, 0.200, 0.500),
            "10-30Y": FALRef(1.80, 4.20, 0.250, 0.650),
            ">30Y":   FALRef(3.00, 6.00, 0.300, 0.800),
        },
        # Table A.5 - Large Distribution (Sealed conservator)
        "LargeDist_Sealed": {
            "<1Y":    FALRef(0.05, 0.15, None, None),
            "1-10Y":  FALRef(0.15, 0.85, 0.020, 0.040),
            "10-30Y": FALRef(1.60, 5.00, 0.400, 0.700),
        },
        # Table A.6 - Industrial Distribution
        "Industrial": {
            "<1Y":    FALRef(0.60, 1.50, 0.020, 0.200),
            "1-10Y":  FALRef(0.70, 2.70, 0.100, 0.700),
            "10-30Y": FALRef(1.30, 4.50, 0.300, 1.100),
        },
        # Table A.7 - LVDC
        "LVDC": {
            "1-10Y":  FALRef(0.80, 1.40, 0.300, 0.800),
            "10-30Y": FALRef(1.00, 3.00, 0.300, 0.800),
        }
    }

    # CO2 Reference Tables (Annex A.3)
    CO2 = {
        # Table A.8 - GSU
        "GSU": {
            "<1Y":    CO2Ref(2000, 2500),
            "1-10Y":  CO2Ref(5000, 7000),
            "10-30Y": CO2Ref(6000, 11000),
            ">30Y":   CO2Ref(8000, 15000),
        },
        # Table A.9 - Network
        "Network": {
            "<1Y":    CO2Ref(3000, 5000),
            "1-10Y":  CO2Ref(5000, 8000),
            "10-30Y": CO2Ref(8000, 11000),
            ">30Y":   CO2Ref(8000, 13000),
        },
        # Table A.10 - Large Distribution (Open)
        "LargeDist_Open": {
            "<1Y":    CO2Ref(2000, 3500),
            "1-10Y":  CO2Ref(4000, 8000),
            "10-30Y": CO2Ref(8500, 13000),
            ">30Y":   CO2Ref(9000, 14000),
        },
        # Table A.10 - Large Distribution (Sealed)
        "LargeDist_Sealed": {
            "<1Y":    CO2Ref(2000, 3000),
            "1-10Y":  CO2Ref(3500, 6500),
            "10-30Y": CO2Ref(7000, 11000),
            ">30Y":   CO2Ref(8000, 12000),
        },
        # Table A.11 - Industrial
        "Industrial": {
            "<1Y":    CO2Ref(1500, 3500),
            "1-10Y":  CO2Ref(3500, 5500),
            "10-30Y": CO2Ref(4500, 7000),
            ">30Y":   CO2Ref(5000, 9000),
        },
        # Table A.12 - LVDC
        "LVDC": {
            "1-10Y":  CO2Ref(3000, 4500),
            "10-30Y": CO2Ref(4500, 7500),
        }
    }

    @classmethod
    def get_fal_ref(cls, key: str, age_category: AgeCategory) -> Optional[FALRef]:
        return cls.FAL.get(key, {}).get(age_category)

    @classmethod
    def get_co2_ref(cls, key: str, age_category: AgeCategory) -> Optional[CO2Ref]:
        return cls.CO2.get(key, {}).get(age_category)


# ============================================================================
# MAIN TRANSFORMER CLASS
# ============================================================================

class Transformer:
    """
    Transformer asset with IEC TR 62874:2015 assessment capability.
    Data is loaded from database via load_from_database().
    
    IMPORTANT: insulation_type MUST be "Kraft" for this standard.
    """

    def __init__(
        self,
        name: str,
        commissioning_date: str,
        family: Family,
        breathing: Optional[Breathing] = None,
        oil_type: OilType = OilType.UNINHIBITED,
        insulation_type: InsulationType = InsulationType.KRAFT
    ) -> None:
        self.name = name
        self.commissioning_date = pd.to_datetime(commissioning_date)
        self.family = family
        self.breathing = breathing
        self.oil_type = oil_type
        self.insulation_type = insulation_type

        self.tests: pd.DataFrame = pd.DataFrame(
            columns=["Date", "Age_Years", "2FAL", "CO2", "Valid", "Validity_Reason"]
        )
        self.maintenance: List[MaintenanceRecord] = []

        self._fal_key = self._get_fal_key()
        self._co2_key = self._get_co2_key()

    # ========================================================================
    # DATABASE LOADING METHODS
    # ========================================================================

    def load_from_database(
        self,
        tests_data: List[Dict[str, Any]],
        maintenance_data: Optional[List[Dict[str, Any]]] = None
    ) -> None:
        """
        Load all data from database.
        
        INPUT:
            tests_data: List of test records with date, fal, co2
            maintenance_data: List of maintenance records (optional)
        """
        # Clear existing data
        self.tests = pd.DataFrame(
            columns=["Date", "Age_Years", "2FAL", "CO2", "Valid", "Validity_Reason"]
        )
        self.maintenance = []
        
        # Load maintenance records first
        if maintenance_data:
            for rec in maintenance_data:
                mtype = rec["mtype"]
                if isinstance(mtype, str):
                    mtype = MaintenanceType(mtype)
                self.record_maintenance(rec["date"], mtype)
        
        # Load test records
        for test in tests_data:
            fal = test.get("fal")
            co2 = test.get("co2")
            self._add_test_from_db(test["date"], fal, co2)

    def _add_test_from_db(self, date: str, fal: Optional[float], co2: Optional[float]) -> None:
        """Internal method to add test from database."""
        test_date = pd.to_datetime(date)
        
        # Check validity against maintenance
        is_valid, reason = self._is_test_valid_after_maintenance(test_date)
        
        # If valid, check gap from last valid test
        if is_valid and not self.tests.empty:
            valid_tests = self.tests[self.tests["Valid"] == True]
            if not valid_tests.empty:
                last_valid_date = valid_tests["Date"].max()
                days_diff = (test_date - last_valid_date).days
                if days_diff < 180:
                    is_valid = False
                    reason = (
                        f"Only {days_diff} days since last valid test ({last_valid_date.date()}). "
                        f"Minimum 6 months required (Clause 5.1)"
                    )
        
        age_years = (test_date - self.commissioning_date).days / 365.25
        
        new_row = pd.DataFrame({
            "Date": [test_date],
            "Age_Years": [age_years],
            "2FAL": [float(fal) if fal is not None else np.nan],
            "CO2": [float(co2) if co2 is not None else np.nan],
            "Valid": [is_valid],
            "Validity_Reason": [reason]
        })
        
        if self.tests.empty:
            self.tests = new_row
        else:
            self.tests = pd.concat([self.tests, new_row], ignore_index=True)
        
        self.tests = self.tests.sort_values("Date").reset_index(drop=True)

    # ========================================================================
    # MAINTENANCE HANDLING
    # ========================================================================

    def record_maintenance(self, date: str, mtype: MaintenanceType) -> None:
        """Record maintenance operation (for database loading)."""
        maintenance_date = pd.to_datetime(date)
        self.maintenance.append(
            MaintenanceRecord(maintenance_date, mtype)
        )
        self._revalidate_tests_after_maintenance()

    def _revalidate_tests_after_maintenance(self) -> None:
        """Re-validate all tests after maintenance recording."""
        if self.tests.empty:
            return
        for idx in range(len(self.tests)):
            test_date = self.tests.iloc[idx]["Date"]
            is_valid, reason = self._is_test_valid_after_maintenance(test_date)
            self.tests.at[idx, "Valid"] = is_valid
            self.tests.at[idx, "Validity_Reason"] = reason

    # ========================================================================
    # VALIDATION HELPERS
    # ========================================================================

    def _get_last_disturbing_maintenance(self) -> Optional[MaintenanceRecord]:
        disturbing_types = {
            MaintenanceType.RECONDITIONING,
            MaintenanceType.RECLAMATION,
            MaintenanceType.OIL_CHANGE
        }
        latest = None
        for rec in self.maintenance:
            if rec.mtype in disturbing_types:
                if latest is None or rec.date > latest.date:
                    latest = rec
        return latest

    def _is_test_valid_after_maintenance(self, test_date: pd.Timestamp) -> tuple[bool, str]:
        """
        Check if test is valid considering oil maintenance.
        
        Rules (Clause 3.7.2):
        - If no maintenance → VALID
        - If test date < maintenance date → INVALID
        - If test date - maintenance date < 180 days → INVALID
        - If test date - maintenance date >= 180 days → VALID
        """
        last_maintenance = self._get_last_disturbing_maintenance()
        
        if last_maintenance is None:
            return True, "No oil maintenance recorded"
        
        days_since_maintenance = (test_date - last_maintenance.date).days
        
        if days_since_maintenance < 0:
            return False, (
                f"Test before oil maintenance on {last_maintenance.date.date()} "
                f"(Clause 3.7.2)"
            )
        elif days_since_maintenance < 180:
            return False, (
                f"Test only {days_since_maintenance} days after "
                f"{last_maintenance.mtype.value} on {last_maintenance.date.date()}. "
                f"Minimum 6 months required (Clause 3.7.2)"
            )
        
        return True, f"Valid: {days_since_maintenance} days after last maintenance"

    # ========================================================================
    # KEY GENERATION FOR REFERENCE TABLES
    # ========================================================================

    def _get_fal_key(self) -> str:
        """Generate key for 2-FAL reference table."""
        if self.family == Family.GSU:
            if self.oil_type == OilType.INHIBITED:
                return "GSU_inhibited"
            return "GSU_uninhibited"
        
        if self.family == Family.LARGE_DIST:
            if self.breathing is None:
                raise ValueError("Breathing must be specified for LargeDist family.")
            return f"LargeDist_{self.breathing.value}"
        
        # For other families, use the family name as key
        return self.family.value

    def _get_co2_key(self) -> str:
        """Generate key for CO2 reference table."""
        if self.family == Family.LARGE_DIST:
            if self.breathing is None:
                raise ValueError("Breathing must be specified for LargeDist family.")
            return f"LargeDist_{self.breathing.value}"
        
        return self.family.value

    # ========================================================================
    # DATA ACCESS METHODS
    # ========================================================================

    def get_valid_tests(self) -> pd.DataFrame:
        if self.tests.empty:
            return pd.DataFrame(columns=["Date", "Age_Years", "2FAL", "CO2", "Valid", "Validity_Reason"])
        return self.tests[self.tests["Valid"] == True].copy()

    def get_invalid_tests(self) -> pd.DataFrame:
        if self.tests.empty:
            return pd.DataFrame(columns=["Date", "Age_Years", "2FAL", "CO2", "Valid", "Validity_Reason"])
        return self.tests[self.tests["Valid"] == False].copy()

    def get_valid_tests_summary(self) -> Dict[str, Any]:
        valid_tests = self.get_valid_tests()
        invalid_tests = self.get_invalid_tests()
        return {
            "total_tests": len(self.tests),
            "valid_tests": len(valid_tests),
            "invalid_tests": len(self.tests) - len(valid_tests),
            "valid_test_dates": [str(d.date()) for d in valid_tests["Date"]] if not valid_tests.empty else [],
            "invalid_test_dates": [str(d.date()) for d in invalid_tests["Date"]] if not invalid_tests.empty else [],
            "valid_test_reasons": [str(r) for r in valid_tests["Validity_Reason"]] if not valid_tests.empty else [],
            "invalid_test_reasons": [str(r) for r in invalid_tests["Validity_Reason"]] if not invalid_tests.empty else []
        }

    def get_test_history(self) -> pd.DataFrame:
        return self.tests.copy()

    # ========================================================================
    # WARNINGS GENERATION
    # ========================================================================

    def _generate_warnings(self) -> List[str]:
        """
        Generate warnings based on data discrepancies between 2-FAL and CO2 tests.
        
        Conditions:
        1. If count of valid 2-FAL tests and valid CO2 tests differ by > 20%
        2. If last valid test dates differ by > 1 year (365 days)
        """
        warnings = []
        
        valid_tests = self.get_valid_tests()
        if valid_tests.empty:
            return warnings
        
        # Count valid tests for each parameter
        fal_valid_tests = valid_tests[~valid_tests["2FAL"].isna()]
        co2_valid_tests = valid_tests[~valid_tests["CO2"].isna()]
        
        count_fal = len(fal_valid_tests)
        count_co2 = len(co2_valid_tests)
        
        # Condition 1: Count difference > 20%
        if count_fal > 0 and count_co2 > 0:
            max_count = max(count_fal, count_co2)
            if max_count > 0:
                diff_percent = abs(count_fal - count_co2) / max_count
                if diff_percent > 0.20:
                    warnings.append(
                        f"The number of valid tests for 2-FAL ({count_fal}) and CO2 ({count_co2}) "
                        f"differ by more than 20%."
                    )
        elif count_fal > 0 and count_co2 == 0:
            warnings.append(
                f"There are {count_fal} valid 2-FAL tests but no valid CO2 tests."
            )
        elif count_co2 > 0 and count_fal == 0:
            warnings.append(
                f"There are {count_co2} valid CO2 tests but no valid 2-FAL tests."
            )
        
        # Condition 2: Last test date difference > 1 year (365 days)
        if not fal_valid_tests.empty and not co2_valid_tests.empty:
            last_fal_date = fal_valid_tests.iloc[-1]["Date"]
            last_co2_date = co2_valid_tests.iloc[-1]["Date"]
            
            days_diff = abs((last_fal_date - last_co2_date).days)
            if days_diff > 365:
                warnings.append(
                    f"The last valid test date for 2-FAL ({last_fal_date.date()}) "
                    f"and CO2 ({last_co2_date.date()}) differ by more than 1 year ({days_diff} days)."
                )
        
        # Add recommendation if any warnings exist
        if warnings:
            warnings.append(
                "It is recommended to perform 2-FAL and CO2 tests simultaneously "
                "with less than 6 months interval."
            )
        
        return warnings

    # ========================================================================
    # INSULATION TYPE VALIDATION
    # ========================================================================

    def _validate_insulation_type(self) -> Optional[str]:
        """
        Validate that insulation type is Kraft.
        
        Returns:
            None if valid, error message string if invalid.
        """
        if self.insulation_type != InsulationType.KRAFT:
            return (
                f"IEC TR 62874:2015 is ONLY applicable to Kraft paper insulation. "
                f"Current insulation type is '{self.insulation_type.value}'. "
                f"Analysis cannot be performed."
            )
        return None

    # ========================================================================
    # CORE ANALYSIS
    # ========================================================================

    def validate_analysis(self) -> ValidationResult:
        """
        Validate that all requirements for analysis are met.
        
        Rules (Clause 3.7.2, 4.3, 5.1):
        1. Insulation type MUST be Kraft (IEC Scope)
        2. Minimum 2 valid tests (Clause 4.3)
        3. Minimum 6 months between valid tests (Clause 5.1)
        4. Valid tests must be after last maintenance (Clause 3.7.2)
        """
        # Rule 0: Insulation type check (IEC Scope)
        insulation_error = self._validate_insulation_type()
        if insulation_error:
            return ValidationResult(
                status=ValidationStatus.INSUFFICIENT_TESTS,
                message=insulation_error,
                details={
                    "insulation_type": self.insulation_type.value,
                    "required": "Kraft"
                }
            )
        
        valid_tests = self.get_valid_tests()
        
        # Rule 1: Minimum 2 valid tests
        if len(valid_tests) < 2:
            total_tests = len(self.tests)
            invalid_tests = total_tests - len(valid_tests)
            
            if total_tests == 0:
                return ValidationResult(
                    status=ValidationStatus.INSUFFICIENT_TESTS,
                    message="No test records found. Minimum 2 valid tests required (Clause 4.3)",
                    details={"total_tests": 0, "valid_tests": 0, "invalid_tests": 0, "required": 2}
                )
            
            last_maintenance = self._get_last_disturbing_maintenance()
            if last_maintenance and invalid_tests > 0:
                return ValidationResult(
                    status=ValidationStatus.NO_VALID_TESTS_AFTER_MAINTENANCE,
                    message=f"All {total_tests} test(s) are before or within 6 months of "
                            f"last oil maintenance ({last_maintenance.date.date()}). "
                            f"Minimum 2 valid tests required after maintenance (Clause 3.7.2)",
                    details={
                        "total_tests": total_tests,
                        "valid_tests": len(valid_tests),
                        "invalid_tests": invalid_tests,
                        "last_maintenance": str(last_maintenance.date.date()),
                        "maintenance_type": last_maintenance.mtype.value,
                        "required": 2
                    }
                )
            else:
                return ValidationResult(
                    status=ValidationStatus.INSUFFICIENT_TESTS,
                    message=f"Minimum 2 valid test records required (Clause 4.3). "
                            f"Current: {len(valid_tests)} valid out of {total_tests} total",
                    details={
                        "total_tests": total_tests,
                        "valid_tests": len(valid_tests),
                        "invalid_tests": invalid_tests,
                        "required": 2
                    }
                )
        
        # Rule 2: Minimum 6 months between valid tests
        for i in range(1, len(valid_tests)):
            days_diff = (valid_tests.iloc[i]["Date"] - valid_tests.iloc[i-1]["Date"]).days
            if days_diff < 180:
                return ValidationResult(
                    status=ValidationStatus.INSUFFICIENT_TIME_GAP,
                    message=f"Minimum 6 months between valid tests required (Clause 5.1). "
                            f"Gap between {valid_tests.iloc[i-1]['Date'].date()} "
                            f"and {valid_tests.iloc[i]['Date'].date()} is {days_diff} days",
                    details={
                        "gap_days": days_diff,
                        "required_days": 180,
                        "test_1": str(valid_tests.iloc[i-1]["Date"].date()),
                        "test_2": str(valid_tests.iloc[i]["Date"].date())
                    }
                )
        
        return ValidationResult(
            status=ValidationStatus.VALID,
            message="All validation checks passed",
            details={
                "total_tests": len(self.tests),
                "valid_tests": len(valid_tests),
                "invalid_tests": len(self.tests) - len(valid_tests),
                "first_valid_test": str(valid_tests.iloc[0]["Date"].date()),
                "last_valid_test": str(valid_tests.iloc[-1]["Date"].date()),
                "maintenance_count": len(self.maintenance),
                "insulation_type": self.insulation_type.value
            }
        )

    def get_validation_status(self) -> Dict[str, Any]:
        validation = self.validate_analysis()
        return {
            "status": validation.status.value,
            "message": validation.message,
            "details": validation.details
        }

    def _age_category(self, age: float) -> AgeCategory:
        if age <= 1:
            return "<1Y"
        elif age <= 10:
            return "1-10Y"
        elif age <= 30:
            return "10-30Y"
        else:
            return ">30Y"

    def _recent_oil_disturbance(self, latest_date: pd.Timestamp) -> Optional[str]:
        six_months = pd.Timedelta(days=183)
        disturbing_types = {
            MaintenanceType.RECONDITIONING,
            MaintenanceType.RECLAMATION,
            MaintenanceType.OIL_CHANGE
        }
        for rec in self.maintenance:
            if rec.mtype in disturbing_types:
                if rec.date <= latest_date and (latest_date - rec.date) <= six_months:
                    return f"{rec.mtype.value} on {rec.date.date()}"
        return None

    def _calculate_roi(self) -> Dict[str, Any]:
        valid_tests = self.get_valid_tests()
        
        if len(valid_tests) < 2:
            return {"roi": None, "status": "N.A.", "notes": "Less than 2 valid tests required"}
        
        latest_date = valid_tests["Date"].max()
        disturbance = self._recent_oil_disturbance(latest_date)
        if disturbance:
            return {
                "roi": None,
                "status": "N.A.",
                "notes": f"Oil-paper equilibrium disturbed: {disturbance}"
            }
        
        x = valid_tests["Age_Years"].values
        y = valid_tests["2FAL"].values
        
        mask = ~np.isnan(y)
        if np.sum(mask) < 2:
            return {"roi": None, "status": "N.A.", "notes": "Insufficient 2-FAL data for RoI calculation"}
        
        x = x[mask]
        y = y[mask]
        slope, _ = np.polyfit(x, y, 1)
        
        notes = ""
        if len(valid_tests) < 3:
            notes = "RoI from <3 points (3-4 recommended per Clause 5.1)"
        
        return {
            "roi": round(float(slope), 3),
            "status": "ok",
            "notes": notes
        }

    def _get_fal_ref(self, category: AgeCategory) -> Optional[FALRef]:
        return IEC62874Reference.get_fal_ref(self._fal_key, category)

    def _get_co2_ref(self, category: AgeCategory) -> Optional[CO2Ref]:
        return IEC62874Reference.get_co2_ref(self._co2_key, category)

    def _assess_level(self, value: float, c90: float, c98: float) -> str:
        if value <= c90:
            return "LOW"
        elif value <= c98:
            return "TYPICAL"
        else:
            return "HIGH"

    @staticmethod
    def _severity(level: Optional[str]) -> int:
        if level is None:
            return -1
        return {"LOW": 0, "TYPICAL": 1, "HIGH": 2, "N.A.": -1}.get(level, -1)

    def analyze(self) -> Dict[str, Any]:
        """
        Execute paper thermal degradation assessment per IEC TR 62874:2015.
        
        OUTPUT:
            Dict with assessment results (see module docstring)
        
        Raises:
            ValueError: If validation fails (including invalid insulation type)
        """
        validation = self.validate_analysis()
        
        if validation.status != ValidationStatus.VALID:
            raise ValueError(
                f"Validation failed: {validation.message}\n"
                f"Details: {validation.details}"
            )
        
        valid_tests = self.get_valid_tests()
        latest = valid_tests.iloc[-1]
        age_cat = self._age_category(latest["Age_Years"])
        
        fal_ref = self._get_fal_ref(age_cat)
        co2_ref = self._get_co2_ref(age_cat)
        
        # Check if reference values exist for this family
        if fal_ref is None:
            print(f"Warning: No 2-FAL reference values defined for family '{self.family.value}'. "
                  f"Status will be 'N.A.' (Clause A.1)")
        if co2_ref is None:
            print(f"Warning: No CO2 reference values defined for family '{self.family.value}'. "
                  f"Status will be 'N.A.' (Clause A.1)")
        
        # Assess 2-FAL level
        fal_status = None
        if fal_ref and not np.isnan(latest["2FAL"]):
            fal_status = self._assess_level(latest["2FAL"], fal_ref.C90, fal_ref.C98)
        
        # Assess CO2 level
        co2_status = None
        if co2_ref and not np.isnan(latest["CO2"]):
            co2_status = self._assess_level(latest["CO2"], co2_ref.C90, co2_ref.C98)
        
        # Calculate RoI
        roi_info = self._calculate_roi()
        roi_value = roi_info["roi"]
        roi_status = None
        
        if roi_value is not None and fal_ref and fal_ref.R90 is not None and fal_ref.R98 is not None:
            if roi_value > fal_ref.R98:
                roi_status = "HIGH"
            elif roi_value > fal_ref.R90:
                roi_status = "TYPICAL"
            else:
                roi_status = "LOW"
        
        # Conservative decision (Clause 6.2)
        candidates = [s for s in [fal_status, co2_status] if s is not None]
        conc_decision = max(candidates, key=self._severity) if candidates else "N.A."
        
        final_decision = conc_decision
        if roi_status and self._severity(roi_status) > self._severity(final_decision):
            final_decision = roi_status
        
        test_summary = self.get_valid_tests_summary()
        
        # Generate warnings
        warnings = self._generate_warnings()
        
        result = {
            "transformer": self.name,
            "age_years": round(latest["Age_Years"], 2),
            "age_category": age_cat,
            "latest_2FAL_mg/kg": latest["2FAL"] if not np.isnan(latest["2FAL"]) else None,
            "latest_CO2_μl/l": int(latest["CO2"]) if not np.isnan(latest["CO2"]) else None,
            "2FAL_status": fal_status or "N.A.",
            "CO2_status": co2_status or "N.A.",
            "RoI_mg/kg_year": roi_value,
            "RoI_status": roi_status or "N.A.",
            "final_decision": final_decision,
            "notes": roi_info["notes"],
            "validation": {
                "status": validation.status.value,
                "message": validation.message,
                "details": validation.details
            },
            "test_summary": test_summary,
            "warnings": warnings,
            "reference_2FAL": {
                "C90": fal_ref.C90,
                "C98": fal_ref.C98,
                "R90": fal_ref.R90,
                "R98": fal_ref.R98,
            } if fal_ref else None,
            "reference_CO2": {
                "C90": co2_ref.C90,
                "C98": co2_ref.C98,
            } if co2_ref else None,
        }
        
        return result


# ============================================================================
# FACTORY FUNCTION
# ============================================================================

def create_transformer_from_database(config: Dict[str, Any]) -> Transformer:
    """
    Create Transformer instance from database configuration.
    
    INPUT:
        config: Dict with keys:
            name: str
            commissioning_date: str
            family: str | Family
            breathing: str | Breathing | None (required for LargeDist)
            oil_type: str | OilType
            insulation_type: str | InsulationType (default: "Kraft")
    
    OUTPUT:
        Transformer instance
    """
    family = config["family"]
    if isinstance(family, str):
        family = Family(family)
    
    breathing = config.get("breathing")
    if isinstance(breathing, str):
        breathing = Breathing(breathing)
    
    oil_type = config.get("oil_type", "uninhibited")
    if isinstance(oil_type, str):
        oil_type = OilType(oil_type)
    
    insulation_type = config.get("insulation_type", "Kraft")
    if isinstance(insulation_type, str):
        insulation_type = InsulationType(insulation_type)
    
    return Transformer(
        name=config["name"],
        commissioning_date=config["commissioning_date"],
        family=family,
        breathing=breathing,
        oil_type=oil_type,
        insulation_type=insulation_type
    )