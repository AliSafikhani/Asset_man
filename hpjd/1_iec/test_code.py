"""
Test Script for IEC TR 62874:2015 Module
=========================================
This script tests all functionalities of the IEC TR 62874:2015 module
including validation rules, warnings, and insulation type validation.

Run: python test_iec_62874.py
"""

import sys
import json
from datetime import datetime, timedelta
from iec_tr_62874_2015 import (
    Transformer,
    Family,
    Breathing,
    OilType,
    InsulationType,
    MaintenanceType,
    create_transformer_from_database,
    ValidationStatus
)


def print_header(title: str):
    """Print formatted header."""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)


def print_result(test_name: str, result: dict = None, error: Exception = None):
    """Print test result in formatted output."""
    if error:
        print(f"\n  ❌ {test_name}")
        print(f"     Error: {str(error)[:200]}")
        return
    
    print(f"\n  ✅ {test_name}")
    print(f"     Validation: {result.get('validation', {}).get('status', 'N/A')}")
    print(f"     Final Decision: {result.get('final_decision', 'N/A')}")
    print(f"     Valid Tests: {result.get('test_summary', {}).get('valid_tests', 0)}")
    print(f"     Invalid Tests: {result.get('test_summary', {}).get('invalid_tests', 0)}")
    
    # Show warnings if any
    warnings = result.get('warnings', [])
    if warnings:
        print(f"     Warnings ({len(warnings)}):")
        for w in warnings:
            print(f"       - {w}")


def print_json_result(result: dict):
    """Print JSON result in formatted way."""
    print("\n" + "-" * 40)
    print("JSON OUTPUT:")
    print("-" * 40)
    # Remove large nested dicts for readability
    clean_result = {
        "transformer": result.get("transformer"),
        "age_years": result.get("age_years"),
        "age_category": result.get("age_category"),
        "latest_2FAL_mg/kg": result.get("latest_2FAL_mg/kg"),
        "latest_CO2_μl/l": result.get("latest_CO2_μl/l"),
        "2FAL_status": result.get("2FAL_status"),
        "CO2_status": result.get("CO2_status"),
        "RoI_mg/kg_year": result.get("RoI_mg/kg_year"),
        "RoI_status": result.get("RoI_status"),
        "final_decision": result.get("final_decision"),
        "warnings": result.get("warnings", [])
    }
    print(json.dumps(clean_result, indent=2, ensure_ascii=False))


# ============================================================================
# TEST 1: Valid - No maintenance, 4 tests with 6-month gaps
# ============================================================================

def test_1_valid_no_maintenance():
    """Test 1: Valid - No maintenance, 4 tests with 6-month gaps."""
    print_header("TEST 1: Valid - No Maintenance")
    
    tx = create_transformer_from_database({
        "name": "TX-TEST-001",
        "commissioning_date": "2010-06-01",
        "family": "Network",
        "oil_type": "uninhibited",
        "insulation_type": "Kraft"  # Valid insulation type
    })
    
    tests_data = [
        {"date": "2020-01-15", "fal": 0.25, "co2": 5200},
        {"date": "2020-07-15", "fal": 0.45, "co2": 5800},
        {"date": "2021-01-15", "fal": 0.80, "co2": 6300},
        {"date": "2021-07-15", "fal": 2.50, "co2": 6500},
    ]
    
    tx.load_from_database(tests_data)
    
    try:
        result = tx.analyze()
        print_result("Valid - No Maintenance", result=result)
        print_json_result(result)
        return True
    except ValueError as e:
        print_result("Valid - No Maintenance", error=e)
        return False


# ============================================================================
# TEST 2: Valid - Maintenance >6 months before tests
# ============================================================================

def test_2_valid_maintenance_before():
    """Test 2: Valid - Maintenance >6 months before tests."""
    print_header("TEST 2: Valid - Maintenance >6 months before tests")
    
    tx = create_transformer_from_database({
        "name": "TX-TEST-002",
        "commissioning_date": "2010-06-01",
        "family": "Network",
        "oil_type": "uninhibited",
        "insulation_type": "Kraft"
    })
    
    maintenance_data = [
        {"date": "2019-06-01", "mtype": "oil_change"}
    ]
    
    tests_data = [
        {"date": "2020-01-15", "fal": 0.25, "co2": 5200},
        {"date": "2020-07-15", "fal": 0.45, "co2": 5800},
        {"date": "2021-01-15", "fal": 0.80, "co2": 6300},
        {"date": "2021-07-15", "fal": 2.50, "co2": 6500},
    ]
    
    tx.load_from_database(tests_data, maintenance_data)
    
    try:
        result = tx.analyze()
        print_result("Valid - Maintenance Before", result=result)
        return True
    except ValueError as e:
        print_result("Valid - Maintenance Before", error=e)
        return False


# ============================================================================
# TEST 3: Valid - Maintenance between tests (only tests after are valid)
# ============================================================================

def test_3_valid_maintenance_between():
    """Test 3: Valid - Maintenance between tests."""
    print_header("TEST 3: Valid - Maintenance between tests")
    
    tx = create_transformer_from_database({
        "name": "TX-TEST-003",
        "commissioning_date": "2010-06-01",
        "family": "Network",
        "oil_type": "uninhibited",
        "insulation_type": "Kraft"
    })
    
    tests_data = [
        {"date": "2020-01-15", "fal": 0.25, "co2": 5200},
        {"date": "2020-07-15", "fal": 0.45, "co2": 5800},
    ]
    
    maintenance_data = [
        {"date": "2020-09-01", "mtype": "oil_change"}
    ]
    
    more_tests = [
        {"date": "2021-03-15", "fal": 0.80, "co2": 6300},
        {"date": "2021-09-15", "fal": 1.50, "co2": 6800},
    ]
    
    tx.load_from_database(tests_data, maintenance_data)
    tx.load_from_database(more_tests)
    
    try:
        result = tx.analyze()
        print_result("Valid - Maintenance Between", result=result)
        print_json_result(result)
        return True
    except ValueError as e:
        print_result("Valid - Maintenance Between", error=e)
        return False


# ============================================================================
# TEST 4: Invalid - Less than 6 months between tests
# ============================================================================

def test_4_invalid_gap():
    """Test 4: Invalid - Less than 6 months between tests."""
    print_header("TEST 4: Invalid - Less than 6 months between tests")
    
    tx = create_transformer_from_database({
        "name": "TX-TEST-004",
        "commissioning_date": "2010-06-01",
        "family": "Network",
        "oil_type": "uninhibited",
        "insulation_type": "Kraft"
    })
    
    tests_data = [
        {"date": "2020-01-15", "fal": 0.25, "co2": 5200},
        {"date": "2020-02-15", "fal": 0.45, "co2": 5800},
    ]
    
    tx.load_from_database(tests_data)
    
    try:
        result = tx.analyze()
        print_result("Invalid - Gap < 6 months", result=result)
        return False
    except ValueError as e:
        print_result("Invalid - Gap < 6 months", error=e)
        return True


# ============================================================================
# TEST 5: Invalid - No valid tests after maintenance
# ============================================================================

def test_5_invalid_no_tests_after_maintenance():
    """Test 5: Invalid - No valid tests after maintenance."""
    print_header("TEST 5: Invalid - No valid tests after maintenance")
    
    tx = create_transformer_from_database({
        "name": "TX-TEST-005",
        "commissioning_date": "2010-06-01",
        "family": "Network",
        "oil_type": "uninhibited",
        "insulation_type": "Kraft"
    })
    
    tests_data = [
        {"date": "2020-01-15", "fal": 0.25, "co2": 5200},
        {"date": "2020-07-15", "fal": 0.45, "co2": 5800},
    ]
    
    maintenance_data = [
        {"date": "2020-09-01", "mtype": "oil_change"}
    ]
    
    tx.load_from_database(tests_data, maintenance_data)
    
    try:
        result = tx.analyze()
        print_result("Invalid - No Tests After Maintenance", result=result)
        return False
    except ValueError as e:
        print_result("Invalid - No Tests After Maintenance", error=e)
        return True


# ============================================================================
# TEST 6: Invalid - Insulation type is not Kraft (TUP)
# ============================================================================

def test_6_invalid_insulation_type_tup():
    """Test 6: Invalid - Insulation type is TUP (not Kraft)."""
    print_header("TEST 6: Invalid - Insulation Type TUP (Not Kraft)")
    
    tx = create_transformer_from_database({
        "name": "TX-TEST-006",
        "commissioning_date": "2010-06-01",
        "family": "Network",
        "oil_type": "uninhibited",
        "insulation_type": "TUP"  # Invalid insulation type
    })
    
    tests_data = [
        {"date": "2020-01-15", "fal": 0.25, "co2": 5200},
        {"date": "2020-07-15", "fal": 0.45, "co2": 5800},
        {"date": "2021-01-15", "fal": 0.80, "co2": 6300},
        {"date": "2021-07-15", "fal": 2.50, "co2": 6500},
    ]
    
    tx.load_from_database(tests_data)
    
    try:
        result = tx.analyze()
        print_result("Invalid - Insulation TUP", result=result)
        return False
    except ValueError as e:
        print_result("Invalid - Insulation TUP", error=e)
        return True


# ============================================================================
# TEST 7: Invalid - Insulation type is Synthetic
# ============================================================================

def test_7_invalid_insulation_type_synthetic():
    """Test 7: Invalid - Insulation type is Synthetic (not Kraft)."""
    print_header("TEST 7: Invalid - Insulation Type Synthetic (Not Kraft)")
    
    tx = create_transformer_from_database({
        "name": "TX-TEST-007",
        "commissioning_date": "2010-06-01",
        "family": "Network",
        "oil_type": "uninhibited",
        "insulation_type": "Synthetic"  # Invalid insulation type
    })
    
    tests_data = [
        {"date": "2020-01-15", "fal": 0.25, "co2": 5200},
        {"date": "2020-07-15", "fal": 0.45, "co2": 5800},
        {"date": "2021-01-15", "fal": 0.80, "co2": 6300},
        {"date": "2021-07-15", "fal": 2.50, "co2": 6500},
    ]
    
    tx.load_from_database(tests_data)
    
    try:
        result = tx.analyze()
        print_result("Invalid - Insulation Synthetic", result=result)
        return False
    except ValueError as e:
        print_result("Invalid - Insulation Synthetic", error=e)
        return True


# ============================================================================
# TEST 8: Valid - HVDC (no reference values - shows N.A.)
# ============================================================================

def test_8_valid_hvdc_no_reference():
    """Test 8: Valid - HVDC with Kraft insulation (no reference values)."""
    print_header("TEST 8: Valid - HVDC (no reference values)")
    
    tx = create_transformer_from_database({
        "name": "TX-HVDC-001",
        "commissioning_date": "2010-06-01",
        "family": "HVDC",
        "oil_type": "uninhibited",
        "insulation_type": "Kraft"
    })
    
    tests_data = [
        {"date": "2020-01-15", "fal": 0.25, "co2": 5200},
        {"date": "2020-07-15", "fal": 0.45, "co2": 5800},
        {"date": "2021-01-15", "fal": 0.80, "co2": 6300},
        {"date": "2021-07-15", "fal": 2.50, "co2": 6500},
    ]
    
    tx.load_from_database(tests_data)
    
    try:
        result = tx.analyze()
        print_result("Valid - HVDC (N.A. expected)", result=result)
        return True
    except ValueError as e:
        print_result("Valid - HVDC (N.A. expected)", error=e)
        return False


# ============================================================================
# TEST 9: Warning - Count difference > 20%
# ============================================================================

def test_9_warning_count_difference():
    """Test 9: Warning - Count difference > 20% between 2-FAL and CO2 tests."""
    print_header("TEST 9: Warning - Count difference > 20%")
    
    tx = create_transformer_from_database({
        "name": "TX-TEST-009",
        "commissioning_date": "2010-06-01",
        "family": "Network",
        "oil_type": "uninhibited",
        "insulation_type": "Kraft"
    })
    
    # 10 2-FAL tests, only 2 CO2 tests
    tests_data = [
        {"date": "2020-01-15", "fal": 0.25, "co2": None},
        {"date": "2020-07-15", "fal": 0.30, "co2": None},
        {"date": "2021-01-15", "fal": 0.40, "co2": None},
        {"date": "2021-07-15", "fal": 0.55, "co2": None},
        {"date": "2022-01-15", "fal": 0.70, "co2": None},
        {"date": "2022-07-15", "fal": 0.90, "co2": None},
        {"date": "2023-01-15", "fal": 1.10, "co2": None},
        {"date": "2023-07-15", "fal": 1.40, "co2": None},
        {"date": "2024-01-15", "fal": 1.80, "co2": 6500},
        {"date": "2024-07-15", "fal": 2.20, "co2": 7000},
    ]
    
    tx.load_from_database(tests_data)
    
    try:
        result = tx.analyze()
        print_result("Warning - Count Difference", result=result)
        print_json_result(result)
        return True
    except ValueError as e:
        print_result("Warning - Count Difference", error=e)
        return False


# ============================================================================
# TEST 10: Warning - Date difference > 1 year
# ============================================================================

def test_10_warning_date_difference():
    """Test 10: Warning - Last test date difference > 1 year."""
    print_header("TEST 10: Warning - Date difference > 1 year")
    
    tx = create_transformer_from_database({
        "name": "TX-TEST-010",
        "commissioning_date": "2010-06-01",
        "family": "Network",
        "oil_type": "uninhibited",
        "insulation_type": "Kraft"
    })
    
    tests_data = [
        # 2-FAL tests (last in 2024)
        {"date": "2020-01-15", "fal": 0.25, "co2": None},
        {"date": "2020-07-15", "fal": 0.30, "co2": None},
        {"date": "2021-01-15", "fal": 0.40, "co2": None},
        {"date": "2021-07-15", "fal": 0.55, "co2": None},
        {"date": "2022-01-15", "fal": 0.70, "co2": None},
        {"date": "2022-07-15", "fal": 0.90, "co2": None},
        {"date": "2023-01-15", "fal": 1.10, "co2": None},
        {"date": "2023-07-15", "fal": 1.40, "co2": None},
        {"date": "2024-01-15", "fal": 1.80, "co2": None},
        # CO2 tests (last in 2022 - 2 years ago)
        {"date": "2020-01-20", "fal": None, "co2": 5000},
        {"date": "2020-07-20", "fal": None, "co2": 5200},
        {"date": "2021-01-20", "fal": None, "co2": 5500},
        {"date": "2021-07-20", "fal": None, "co2": 5800},
        {"date": "2022-01-20", "fal": None, "co2": 6200},
    ]
    
    tx.load_from_database(tests_data)
    
    try:
        result = tx.analyze()
        print_result("Warning - Date Difference", result=result)
        print_json_result(result)
        return True
    except ValueError as e:
        print_result("Warning - Date Difference", error=e)
        return False


# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Run all tests."""
    print("\n" + "=" * 80)
    print("  IEC TR 62874:2015 - Module Test Suite")
    print("=" * 80)
    print("\nTesting validation rules, warnings, and insulation type validation...")
    
    results = {
        "test_1": test_1_valid_no_maintenance(),
        "test_2": test_2_valid_maintenance_before(),
        "test_3": test_3_valid_maintenance_between(),
        "test_4": test_4_invalid_gap(),
        "test_5": test_5_invalid_no_tests_after_maintenance(),
        "test_6": test_6_invalid_insulation_type_tup(),
        "test_7": test_7_invalid_insulation_type_synthetic(),
        "test_8": test_8_valid_hvdc_no_reference(),
        "test_9": test_9_warning_count_difference(),
        "test_10": test_10_warning_date_difference(),
    }
    
    # Summary
    print_header("TEST SUMMARY")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"  {name}: {status}")
    
    print(f"\n  Total: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n✅ All tests passed successfully!")
    else:
        print(f"\n⚠️ {total - passed} test(s) failed")
    
    print("=" * 80)


if __name__ == "__main__":
    main()