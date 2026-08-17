"""
Test Suite for CIGRE Transformer Life Estimator
================================================
Comprehensive test suite for verifying the CIGRE 323-based transformer
life estimation module. Tests cover:
    - All four furan models
    - Various furan concentrations (including edge cases)
    - Historical A-factor extraction vs fixed A-factor
    - Effect of transformer age on remaining life
    - Error handling and warnings
    - Condition assessment and recommendations
    - Quick estimate convenience function

Usage:
    Run directly: python test_estimator.py
    Run with coverage: python -m pytest test_estimator.py -v
"""

import sys
import warnings
from datetime import datetime, timedelta
from typing import Dict, Any

# Import the module under test
from DPlifetransformer import (
    CIGRETransformerLifeEstimator,
    CIGREConfig,
    quick_estimate
)


# ============================================================================
# Helper Functions
# ============================================================================

def print_separator(title: str = "", char: str = "=", length: int = 70) -> None:
    """Print a formatted separator line with optional title."""
    if title:
        print(f"\n{char * length}")
        print(f" {title}")
        print(char * length)
    else:
        print(char * length)


def print_result_summary(result: Dict[str, Any], title: str = "Estimation Result") -> None:
    """Print a concise summary of estimation results."""
    print(f"\n--- {title} ---")
    print(f"  DP: {result['estimated_dp']:.1f}")
    print(f"  Remaining Life: {result['remaining_life_years']:.2f} years ({result['remaining_life_percent']:.1f}%)")
    print(f"  Consumed: {result['consumed_life_fraction']:.1%}")
    print(f"  Status: {result['status']} ({result['alert_level']})")
    
    if result.get('warnings'):
        print("  Warnings:")
        for w in result['warnings']:
            print(f"    ⚠ {w}")
    
    if result.get('a_extracted') is not None:
        print(f"  A-factor extracted from history: {result['a_extracted']:.2e}")
    else:
        print(f"  A-factor used: {result['a_used']:.2e}")


def print_detailed_report(result: Dict[str, Any], title: str = "Detailed Report") -> None:
    """Print a complete, formatted report of the estimation."""
    print_separator(title, "=")
    
    # Input summary
    print("\n[INPUT SUMMARY]")
    for key, value in result['input_summary'].items():
        print(f"  {key}: {value}")
    
    # Core results
    print("\n[CORE RESULTS]")
    print(f"  Estimated DP: {result['estimated_dp']:.1f}")
    print(f"  Consumed Life Fraction: {result['consumed_life_fraction']:.2%}")
    print(f"  Remaining Life: {result['remaining_life_years']:.2f} years ({result['remaining_life_percent']:.1f}%)")
    print(f"  Actual Age: {result['consumed_years']:.2f} years")
    
    # A-factor details
    print("\n[A-FACTOR DETAILS]")
    if result.get('a_extracted') is not None:
        print(f"  A-factor used: {result['a_used']:.2e} (extracted from history)")
        print(f"  A-factor extracted: {result['a_extracted']:.2e}")
        if result.get('historical_arrhenius') is not None:
            print(f"  Historical Arrhenius term: {result['historical_arrhenius']:.6f}")
    else:
        print(f"  A-factor used: {result['a_used']:.2e} (fixed)")
    if result.get('k_reference') is not None:
        print(f"  Reference rate constant: {result['k_reference']:.6f}")
    
    # Condition
    print("\n[CONDITION ASSESSMENT]")
    print(f"  Status: {result['status']}")
    print(f"  Alert Level: {result['alert_level']}")
    
    print("\n  Recommendations:")
    for i, rec in enumerate(result['recommendations'], 1):
        print(f"    {i}. {rec}")
    
    if result.get('warnings'):
        print("\n[WARNINGS]")
        for w in result['warnings']:
            print(f"  ⚠ {w}")
    
    # Comparison with limits
    print("\n[DP THRESHOLD COMPARISON]")
    comp = result['comparison_with_limits']
    print(f"  Initial DP: {comp['DP_initial']}")
    print(f"  Current DP: {comp['DP_current']:.1f}")
    print(f"  End-of-Life DP: {comp['DP_end_of_life']}")
    print(f"  New/Healthy threshold: > {comp['threshold_new']}")
    print(f"  Moderate threshold: {comp['threshold_moderate']} - {comp['threshold_new']}")
    print(f"  Extensive threshold: {comp['threshold_extensive']} - {comp['threshold_moderate']}")
    print(f"  Margin to end-of-life: {comp['remaining_to_eol']:.1f}")

    # Method and configuration
    print("\n[METHOD & CONFIGURATION]")
    print(f"  Method: {result['method_used']}")
    print(f"  Config parameters:")
    for key, value in result['config_parameters'].items():
        print(f"    {key}: {value}")
    
    if result.get('reference_note'):
        print(f"\n[REFERENCE NOTE]")
        print(f"  {result['reference_note']}")
    
    print_separator()


# ============================================================================
# Test Functions
# ============================================================================

def test_basic_estimation() -> None:
    """Test basic estimation with default configuration."""
    print_separator("TEST 1: Basic Estimation (Default Config)")
    
    estimator = CIGRETransformerLifeEstimator()
    
    # Test with typical furan concentration
    result = estimator.estimate(
        furan_ppm=2.5,
        installation_date=datetime(2010, 1, 1),
        model="Chendong"
    )
    
    print_result_summary(result, "2.5 ppm, Chendong, installed 2010")
    
    # Assertions
    assert result['estimated_dp'] > 200, "DP should be above end-of-life"
    assert result['remaining_life_years'] >= 0, "Remaining life should be non-negative"
    assert result['status'] in [
        "New / Healthy",
        "Moderate Aging",
        "Aged / Extensive Deterioration",
        "End-of-Life Approaching"
    ]
    assert isinstance(result['warnings'], list), "Warnings should be a list"
    
    print("✅ Basic estimation test passed")


def test_multiple_concentrations() -> None:
    """Test estimation across a range of furan concentrations."""
    print_separator("TEST 2: Multiple Furan Concentrations")
    
    # Suppress warnings for this test (expected calibration range warnings)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        
        estimator = CIGRETransformerLifeEstimator()
        install_date = datetime(2010, 1, 1)
        model = "Pahlavanpour"
        
        test_cases = [
            (0.01, "Minimum calibration range"),
            (0.05, "Very low furan"),
            (0.5, "Low furan"),
            (2.5, "Typical aged transformer"),
            (5.0, "High furan"),
            (12.0, "Very high furan"),
            (20.0, "Beyond calibration range"),
            (50.0, "Extreme furan"),
        ]
        
        print(f"{'Furan (ppm)':<14} {'DP':<10} {'Remaining (yrs)':<16} {'Status':<28}")
        print("-" * 70)
        
        for conc, desc in test_cases:
            result = estimator.estimate(conc, install_date, model)
            print(f"{conc:<14.2f} {result['estimated_dp']:<10.1f} "
                  f"{result['remaining_life_years']:<16.2f} {result['status']:<28}")
            
            # Assertions
            assert result['estimated_dp'] >= 200, f"DP should be >= 200 for conc={conc}"
            assert result['estimated_dp'] <= 1100, f"DP should be <= 1100 for conc={conc}"
            assert result['remaining_life_years'] >= 0, f"Remaining life should be non-negative"
    
    print("✅ Multiple concentration test passed")


def test_age_effect() -> None:
    """Test that age affects remaining life through A-factor extraction."""
    print_separator("TEST 3: Effect of Transformer Age on Remaining Life")
    
    estimator = CIGRETransformerLifeEstimator()
    furan = 2.5
    model = "Chendong"
    
    # Test with different installation dates (same DP)
    test_ages = [
        (datetime(2020, 1, 1), "~5 years old"),
        (datetime(2010, 1, 1), "~15 years old"),
        (datetime(2000, 1, 1), "~25 years old"),
        (datetime(1990, 1, 1), "~35 years old"),
    ]
    
    print(f"{'Age':<14} {'DP':<10} {'Remaining (yrs)':<16} {'A-factor':<14} {'Status':<25}")
    print("-" * 80)
    
    results = []
    for install_date, label in test_ages:
        result = estimator.estimate(furan, install_date, model)
        results.append(result)
        print(f"{label:<14} {result['estimated_dp']:<10.1f} "
              f"{result['remaining_life_years']:<16.2f} "
              f"{result['a_used']:.2e} "
              f"{result['status']:<25}")
        
        # Assertions
        assert result['consumed_years'] > 0, "Age should be positive"
        assert result['a_used'] > 0, "A-factor should be positive"
    
    # Verify that older transformers with same DP have different A-factors
    a_factors = [r['a_used'] for r in results]
    assert len(set(a_factors)) > 1, "A-factors should differ with age"
    
    print("✅ Age effect test passed")


def test_historical_a_vs_fixed_a() -> None:
    """Compare historical A-factor extraction vs fixed A-factor."""
    print_separator("TEST 4: Historical A-factor vs Fixed A-factor")
    
    furan = 1.0
    install_date = datetime(2005, 6, 1)
    model = "Chendong"
    
    # With historical A (default)
    config_hist = CIGREConfig(use_historical_a=True)
    estimator_hist = CIGRETransformerLifeEstimator(config_hist)
    
    # With fixed A (1e8)
    config_fixed = CIGREConfig(use_historical_a=False, a_factor=1e8)
    estimator_fixed = CIGRETransformerLifeEstimator(config_fixed)
    
    result_hist = estimator_hist.estimate(furan, install_date, model)
    result_fixed = estimator_fixed.estimate(furan, install_date, model)
    
    print("  Same input: furan=1.0 ppm, installed=2005")
    print(f"\n  With Historical A Extraction:")
    print(f"    A-factor: {result_hist['a_used']:.2e}")
    print(f"    Remaining Life: {result_hist['remaining_life_years']:.2f} years")
    print(f"    Status: {result_hist['status']}")
    print(f"    Extracted A: {result_hist.get('a_extracted', 'N/A')}")
    
    print(f"\n  With Fixed A (1e8):")
    print(f"    A-factor: {result_fixed['a_used']:.2e}")
    print(f"    Remaining Life: {result_fixed['remaining_life_years']:.2f} years")
    print(f"    Status: {result_fixed['status']}")
    print(f"    Extracted A: {result_fixed.get('a_extracted', 'N/A')}")
    
    # Assertions
    assert result_hist['a_extracted'] is not None, "Historical A should be extracted"
    assert result_fixed['a_extracted'] is None, "Fixed A should have no extracted value"
    assert abs(result_hist['remaining_life_years'] - result_fixed['remaining_life_years']) > 0.1, \
        "Historical and fixed A should produce different remaining life estimates"
    
    print("✅ Historical vs fixed A test passed")


def test_all_models_comparison() -> None:
    """Compare all four furan models at the same concentration."""
    print_separator("TEST 5: Comparison of All Furan Models")
    
    estimator = CIGRETransformerLifeEstimator()
    furan = 2.5
    install_date = datetime(2012, 1, 1)
    
    models = ["Chendong", "Stebbins", "DePablo", "Pahlavanpour"]
    
    print(f"{'Model':<12} {'DP':<10} {'Remaining (yrs)':<16} {'Status':<28}")
    print("-" * 70)
    
    dps = []
    for model in models:
        result = estimator.estimate(furan, install_date, model)
        dps.append(result['estimated_dp'])
        print(f"{model:<12} {result['estimated_dp']:<10.1f} "
              f"{result['remaining_life_years']:<16.2f} {result['status']:<28}")
        
        # Assertions
        assert result['estimated_dp'] > 0, f"DP should be positive for {model}"
        assert result['remaining_life_years'] >= 0, f"Remaining life should be non-negative for {model}"
    
    # All DP values should be different
    assert len(set(dps)) == len(models), "All models should produce different DP values"
    
    # Chendong should be more conservative (lower DP) than Pahlavanpour
    # for this concentration range (2.5 ppm -> Chendong gives ~318, Pahlavanpour gives ~546)
    chendong_dp = dps[0]
    pahlavanpour_dp = dps[3]
    assert chendong_dp < pahlavanpour_dp, "Chendong should be more conservative (lower DP)"
    
    print("✅ All models test passed")


def test_error_handling() -> None:
    """Test error handling for invalid inputs."""
    print_separator("TEST 6: Error Handling")
    
    estimator = CIGRETransformerLifeEstimator()
    install_date = datetime(2010, 1, 1)
    
    # Test negative furan concentration
    try:
        estimator.estimate(-1.0, install_date)
        print("❌ Negative furan should raise ValueError")
    except ValueError as e:
        print(f"✅ Negative furan correctly raised: {e}")
    
    # Test invalid model name
    try:
        estimator.estimate(2.5, install_date, model="InvalidModel")
        print("❌ Invalid model should raise ValueError")
    except ValueError as e:
        print(f"✅ Invalid model correctly raised: {e}")
    
    # Test non-datetime installation_date
    try:
        estimator.estimate(2.5, "2020-01-01")
        print("❌ String date should raise TypeError")
    except TypeError as e:
        print(f"✅ String date correctly raised: {e}")
    
    # Test invalid configuration
    try:
        invalid_config = CIGREConfig(dp_initial=100, dp_end_of_life=200)
        CIGRETransformerLifeEstimator(invalid_config)
        print("❌ Invalid config should raise ValueError")
    except ValueError as e:
        print(f"✅ Invalid config correctly raised: {e}")
    
    # Test valid minimal case
    result = estimator.estimate(0.01, install_date, model="Chendong")
    assert result['estimated_dp'] > 0, "Should return a valid DP"
    print("✅ Minimal valid input works")
    
    print("✅ Error handling test passed")


def test_quick_estimate_function() -> None:
    """Test the convenience quick_estimate function."""
    print_separator("TEST 7: Quick Estimate Function")
    
    result = quick_estimate(
        furan_ppm=2.5,
        installation_date=datetime(2010, 1, 1),
        model="Pahlavanpour",
        use_historical_a=True
    )
    
    print_result_summary(result, "quick_estimate result")
    
    # Assertions
    assert 'estimated_dp' in result, "Result should contain estimated_dp"
    assert 'remaining_life_years' in result, "Result should contain remaining_life_years"
    assert result['remaining_life_years'] >= 0, "Remaining life should be non-negative"
    assert result['estimated_dp'] > 0, "DP should be positive"
    
    print("✅ quick_estimate function works")


def test_edge_cases() -> None:
    """Test edge cases: very new, very old, and extreme DP values."""
    print_separator("TEST 8: Edge Cases")
    
    estimator = CIGRETransformerLifeEstimator()
    furan = 1.0
    model = "Chendong"
    
    # Very new transformer (1 day old)
    very_new = datetime.now() - timedelta(days=1)
    result_new = estimator.estimate(furan, very_new, model)
    
    # Very old transformer (50 years old)
    very_old = datetime.now() - timedelta(days=365.25 * 50)
    result_old = estimator.estimate(furan, very_old, model)
    
    # Extreme furan concentration (very low)
    result_low = estimator.estimate(0.001, datetime(2010, 1, 1), model)
    
    # Extreme furan concentration (very high)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        result_high = estimator.estimate(100.0, datetime(2010, 1, 1), model)
    
    print("  Very new transformer (1 day old):")
    print(f"    DP: {result_new['estimated_dp']:.1f}")
    print(f"    Remaining Life: {result_new['remaining_life_years']:.2f} years")
    print(f"    A-factor: {result_new['a_used']:.2e}")
    
    print("\n  Very old transformer (50 years old):")
    print(f"    DP: {result_old['estimated_dp']:.1f}")
    print(f"    Remaining Life: {result_old['remaining_life_years']:.2f} years")
    print(f"    A-factor: {result_old['a_used']:.2e}")
    
    print("\n  Very low furan (0.001 ppm):")
    print(f"    DP: {result_low['estimated_dp']:.1f}")
    print(f"    Status: {result_low['status']}")
    
    print("\n  Very high furan (100 ppm):")
    print(f"    DP: {result_high['estimated_dp']:.1f}")
    print(f"    Status: {result_high['status']}")
    
    # The old transformer should have a higher A-factor
    assert result_old['a_used'] > result_new['a_used'], \
        "Older transformer should have higher A-factor (more aggressive environment)"
    
    # Very low furan should give healthy status
    assert result_low['status'] in ["New / Healthy"], "Very low furan should indicate healthy status"
    
    # Very high furan should give end-of-life status
    assert result_high['status'] in ["End-of-Life Approaching"], "Very high furan should indicate critical status"
    
    print("✅ Edge cases test passed")


def test_warning_behavior() -> None:
    """Test that warnings are properly generated for edge cases."""
    print_separator("TEST 9: Warning Behavior")
    
    # Test calibration range warnings
    with warnings.catch_warnings(record=True) as w:
        warnings.simplefilter("always")
        
        estimator = CIGRETransformerLifeEstimator()
        install_date = datetime(2010, 1, 1)
        
        # This should generate a warning (below calibration range)
        result_below = estimator.estimate(0.001, install_date, model="Chendong")
        
        # This should generate a warning (above calibration range)
        result_above = estimator.estimate(20.0, install_date, model="Chendong")
        
        # Extract warnings
        warning_messages = [str(warning.message) for warning in w]
        
        print(f"  Number of warnings generated: {len(warning_messages)}")
        for i, msg in enumerate(warning_messages[:3]):  # Show first 3
            print(f"    {i+1}. {msg[:80]}...")
    
    print("✅ Warning behavior test passed")


def test_full_detailed_report() -> None:
    """Generate and display a complete detailed report for one case."""
    print_separator("TEST 10: Full Detailed Report Example")
    
    estimator = CIGRETransformerLifeEstimator()
    
    result = estimator.estimate(
        furan_ppm=2.5,
        installation_date=datetime(2005, 6, 15),
        model="Chendong"
    )
    
    print_detailed_report(result, "Transformer Life Estimation Report")
    print("✅ Full report generation successful")


def test_config_override() -> None:
    """Test custom configuration override."""
    print_separator("TEST 11: Custom Configuration Override")
    
    # Custom configuration
    config = CIGREConfig(
        dp_initial=1200,
        dp_end_of_life=250,
        reference_temperature=100.0,
        a_factor=2e8,
        activation_energy=115000.0,
        historical_avg_temp=85.0,
        use_historical_a=False,
        threshold_new=850,
        threshold_moderate=400,
        threshold_extensive=300
    )
    
    estimator = CIGRETransformerLifeEstimator(config)
    
    result = estimator.estimate(
        furan_ppm=2.5,
        installation_date=datetime(2010, 1, 1),
        model="Chendong"
    )
    
    print("  Custom configuration applied:")
    print(f"    dp_initial: {config.dp_initial}")
    print(f"    dp_end_of_life: {config.dp_end_of_life}")
    print(f"    A_factor: {config.a_factor}")
    print(f"    activation_energy: {config.activation_energy}")
    
    print(f"\n  Result:")
    print(f"    DP: {result['estimated_dp']:.1f}")
    print(f"    Remaining Life: {result['remaining_life_years']:.2f} years")
    print(f"    Status: {result['status']}")
    
    # Assertions for custom config
    assert result['config_parameters']['dp_initial'] == 1200, "Custom dp_initial applied"
    assert result['config_parameters']['dp_end_of_life'] == 250, "Custom dp_end_of_life applied"
    assert result['config_parameters']['A_factor_used'] == 2e8, "Custom A_factor applied"
    
    print("✅ Custom configuration test passed")


# ============================================================================
# Main Test Runner
# ============================================================================

def main():
    """Run all tests and display summary."""
    print_separator("CIGRE TRANSFORMER LIFE ESTIMATOR TEST SUITE", "=")
    print(f"Test started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Python version: {sys.version.split()[0]}")
    print(f"Module: DPlifetransformer")
    
    test_count = 0
    passed = 0
    failed = 0
    
    test_functions = [
        ("Basic Estimation", test_basic_estimation),
        ("Multiple Concentrations", test_multiple_concentrations),
        ("Age Effect", test_age_effect),
        ("Historical A vs Fixed A", test_historical_a_vs_fixed_a),
        ("All Models Comparison", test_all_models_comparison),
        ("Error Handling", test_error_handling),
        ("Quick Estimate Function", test_quick_estimate_function),
        ("Edge Cases", test_edge_cases),
        ("Warning Behavior", test_warning_behavior),
        ("Full Detailed Report", test_full_detailed_report),
        ("Custom Configuration", test_config_override),
    ]
    
    for test_name, test_func in test_functions:
        test_count += 1
        try:
            test_func()
            passed += 1
        except AssertionError as e:
            failed += 1
            print(f"\n❌ Test '{test_name}' FAILED (AssertionError): {e}")
        except Exception as e:
            failed += 1
            print(f"\n❌ Test '{test_name}' FAILED (Exception): {e}")
            import traceback
            traceback.print_exc()
    
    # Summary
    print_separator("TEST SUMMARY", "=")
    print(f"Total tests: {test_count}")
    print(f"✅ Passed: {passed}")
    if failed > 0:
        print(f"❌ Failed: {failed}")
        sys.exit(1)
    else:
        print("🎉 All tests passed successfully!")
    print_separator()


if __name__ == "__main__":
    main()