# main.py
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from DSC.core.engine import run_dsc_analysis
from DTA.core.engine import run_dta_analysis
from DSC.core.status import ORIGINAL, SUSPICIOUS, FAKE


def combine_results(dsc_result, dta_result):
    """
    ترکیب نتایج DSC و DTA برای تصمیم‌گیری نهایی
    """
    dsc_status = dsc_result['evaluation']['status']
    dta_status = dta_result['evaluation']['status']
    
    # نقشه امتیازدهی
    score_map = {
        ORIGINAL: 0,
        SUSPICIOUS: 1,
        FAKE: 2
    }
    
    total_score = score_map[dsc_status] + score_map[dta_status]
    
    # تصمیم نهایی
    if total_score >= 3:
        final_status = FAKE
    elif total_score >= 2:
        final_status = SUSPICIOUS
    else:
        final_status = ORIGINAL
    
    return {
        "final_status": final_status,
        "dsc_status": dsc_status,
        "dta_status": dta_status,
        "total_score": total_score,
        "dsc_details": dsc_result['evaluation']['details'],
        "dta_details": dta_result['evaluation']['details']
    }


def main(sample_curve, reference_curve):
    """
    اجرای کامل تحلیل اصالت روغن
    """
    print("=" * 60)
    print("شروع تحلیل اصالت روغن ترانسفورماتور")
    print("=" * 60)
    
    # اجرای تحلیل DSC
    print("\n[1] در حال اجرای تحلیل DSC...")
    dsc_result = run_dsc_analysis(sample_curve, reference_curve)
    print(f"    نتیجه DSC: {dsc_result['evaluation']['status']}")
    
    # اجرای تحلیل DTA
    print("\n[2] در حال اجرای تحلیل DTA...")
    dta_result = run_dta_analysis(sample_curve, reference_curve)
    print(f"    نتیجه DTA: {dta_result['evaluation']['status']}")
    
    # ترکیب نتایج
    print("\n[3] ترکیب نتایج...")
    final = combine_results(dsc_result, dta_result)
    
    print("\n" + "=" * 60)
    print("نتیجه نهایی:")
    print(f"  وضعیت نهایی: {final['final_status']}")
    print(f"  امتیاز کل: {final['total_score']}")
    print(f"  نتیجه DSC: {final['dsc_status']}")
    print(f"  نتیجه DTA: {final['dta_status']}")
    print("=" * 60)
    
    return final


if __name__ == "__main__":
    # داده تست
    reference_curve = {
        "temperature": [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150],
        "signal": [0.1, 0.1, 0.1, 0.15, 0.3, 0.6, 0.9, 0.7, 0.3, 0.15, 0.1]
    }
    
    # نمونه اصیل
    original_sample = {
        "temperature": [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150],
        "signal": [0.1, 0.1, 0.11, 0.16, 0.31, 0.61, 0.89, 0.71, 0.31, 0.14, 0.1]
    }
    
    # نمونه تقلبی
    fake_sample = {
        "temperature": [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150],
        "signal": [0.1, 0.1, 0.2, 0.4, 0.8, 1.2, 1.1, 0.8, 0.4, 0.2, 0.1]
    }
    
    print("\n>>> تست با نمونه اصیل")
    main(original_sample, reference_curve)
    
    print("\n\n>>> تست با نمونه تقلبی")