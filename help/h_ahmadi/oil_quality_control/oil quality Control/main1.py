# main1.py (یا هر اسم دیگه)
import sys
import os
from datetime import datetime, timedelta

# تنظیم مسیر
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from oqc_60422.core.equipment import EquipmentCategory
from oqc_60422.standards.iec60422_table2 import TABLE_2, get_parameter_info
from oqc_60422.standards.iec60422_table3 import TABLE_3
from oqc_60422.standards.iec60422_table5 import (
    TABLE_5,
    get_rules_for_category,
    get_recommendations,
    get_notes,
    get_full_parameter_info,
    STATUS_GOOD,
    STATUS_FAIR,
    STATUS_POOR,
)
from oqc_60422.standards.iec60422_trends import (
    TREND_CONFIG,
    is_trend_dangerous,
    requires_initial_value,
    get_trend_description,
)

# ============================================================
# داده‌های تست
# ============================================================
def generate_history():
    base = datetime(2023, 1, 1)
    return [
        {
            "date": (base + timedelta(days=0)).strftime("%Y-%m-%d"),
            "values": {
                "water_content": 8, "breakdown_voltage": 65,
                "dielectric_dissipation_90": 0.02, "interfacial_tension": 42,
                "acidity": 0.02, "colour": 0.5, "appearance": 1,
                "sediments": 0.0, "sludge": 0.0, "inhibitor_content": 80,
                "passivator_content": 85, "corrosive_sulphur": 0,
                "potentially_corrosive_sulphur": 0, "dbds": 1,
                "flash_point": 145, "pcb": 0.5,
            }
        },
        {
            "date": (base + timedelta(days=365)).strftime("%Y-%m-%d"),
            "values": {
                "water_content": 18, "breakdown_voltage": 55,
                "dielectric_dissipation_90": 0.08, "interfacial_tension": 32,
                "acidity": 0.08, "colour": 1.8, "appearance": 2,
                "sediments": 0.3, "sludge": 0.1, "inhibitor_content": 55,
                "passivator_content": 60, "corrosive_sulphur": 0,
                "potentially_corrosive_sulphur": 0, "dbds": 3,
                "flash_point": 138, "pcb": 1.8,
            }
        },
        {
            "date": (base + timedelta(days=730)).strftime("%Y-%m-%d"),
            "values": {
                "water_content": 28, "breakdown_voltage": 40,
                "dielectric_dissipation_90": 0.25, "interfacial_tension": 18,
                "acidity": 0.25, "colour": 3.5, "appearance": 3,
                "sediments": 1.2, "sludge": 0.8, "inhibitor_content": 30,
                "passivator_content": 35, "corrosive_sulphur": 1,
                "potentially_corrosive_sulphur": 1, "dbds": 25,
                "flash_point": 120, "pcb": 6.0,
            }
        }
    ]

def get_sample_good():
    return {
        "water_content": 8, "breakdown_voltage": 65,
        "dielectric_dissipation_90": 0.02, "interfacial_tension": 42,
        "acidity": 0.02, "colour": 0.5, "appearance": 1,
        "sediments": 0.0, "sludge": 0.0, "inhibitor_content": 80,
        "passivator_content": 85, "corrosive_sulphur": 0,
        "potentially_corrosive_sulphur": 0, "dbds": 1,
        "flash_point": 145, "pcb": 0.5,
    }

def get_sample_fair():
    return {
        "water_content": 18, "breakdown_voltage": 55,
        "dielectric_dissipation_90": 0.08, "interfacial_tension": 32,
        "acidity": 0.08, "colour": 1.8, "appearance": 2,
        "sediments": 0.3, "sludge": 0.1, "inhibitor_content": 55,
        "passivator_content": 60, "corrosive_sulphur": 0,
        "potentially_corrosive_sulphur": 0, "dbds": 3,
        "flash_point": 138, "pcb": 1.8,
    }

def get_sample_poor():
    return {
        "water_content": 28, "breakdown_voltage": 40,
        "dielectric_dissipation_90": 0.25, "interfacial_tension": 18,
        "acidity": 0.25, "colour": 3.5, "appearance": 3,
        "sediments": 1.2, "sludge": 0.8, "inhibitor_content": 30,
        "passivator_content": 35, "corrosive_sulphur": 1,
        "potentially_corrosive_sulphur": 1, "dbds": 25,
        "flash_point": 120, "pcb": 6.0,
    }

def calculate_slope(history, param):
    if len(history) < 2:
        return None
    first = history[0]["values"].get(param)
    last = history[-1]["values"].get(param)
    if first is None or last is None:
        return None
    days = (datetime.strptime(history[-1]["date"], "%Y-%m-%d") -
            datetime.strptime(history[0]["date"], "%Y-%m-%d")).days
    if days == 0:
        return 0.0
    return (last - first) / days

def get_status_emoji(status):
    m = {
        "GOOD": "✅", "NORMAL": "✅",
        "FAIR": "⚠️", "ATTENTION": "⚠️",
        "POOR": "❌", "ACTION": "❌",
    }
    return m.get(status.upper(), "❓")

def print_header(title):
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)

def print_subheader(title):
    print("\n" + "-" * 60)
    print(f"  {title}")
    print("-" * 60)

# ============================================================
# تست‌ها
# ============================================================

def test_table2():
    print_header("📋 تست ۱: جدول ۲ – گروه‌بندی تست‌ها")
    for group, items in TABLE_2.items():
        print(f"\n📌 گروه {group.upper()}:")
        for item in items:
            print(f"   - {item['parameter']} (بند {item['subclause']} – روش: {item['method']})")

def test_table3():
    print_header("📋 تست ۲: جدول ۳ – تجهیزات جدید")
    for name, cat in [("CATEGORY_A", EquipmentCategory.CATEGORY_A),
                      ("CATEGORY_B", EquipmentCategory.CATEGORY_B),
                      ("CATEGORY_C", EquipmentCategory.CATEGORY_C)]:
        print(f"\n📌 {name}:")
        rules = TABLE_3.get(cat, {})
        for param, rule in rules.items():
            if "min" in rule:
                print(f"   {param}: ≥ {rule['min']}")
            elif "max" in rule:
                print(f"   {param}: ≤ {rule['max']}")
            elif "value" in rule:
                print(f"   {param}: = {rule['value']}")

def test_table5():
    print_header("📋 تست ۳: جدول ۵ – پایش در سرویس")
    cat = EquipmentCategory.CATEGORY_A
    print(f"\n📌 دسته {cat.name}")
    rules = get_rules_for_category(cat)
    print(f"✅ تعداد پارامترهای دارای قانون: {len(rules)}")
    
    param = "water_content"
    print_subheader(f"اطلاعات کامل پارامتر: {param}")
    full_info = get_full_parameter_info(cat, param)
    for status, data in full_info.items():
        print(f"\n🔹 وضعیت {status}:")
        print(f"   محدوده: {data['range']}")
        print(f"   اقدام: {data['recommendation']}")
        if data.get('note'):
            print(f"   نکته: {data['note']}")

def test_sample_evaluation():
    print_header("📋 تست ۴: ارزیابی نمونه‌های تکی")
    cat = EquipmentCategory.CATEGORY_A
    rules = get_rules_for_category(cat)
    
    for name, sample in [("Good", get_sample_good()), ("Fair", get_sample_fair()), ("Poor", get_sample_poor())]:
        print(f"\n📌 {name}:")
        all_pass = True
        for param, value in sample.items():
            if param in rules:
                status_found = None
                for st, (lo, hi) in rules[param].items():
                    if (lo is None or value >= lo) and (hi is None or value <= hi):
                        status_found = st
                        break
                if status_found:
                    emoji = get_status_emoji(status_found)
                    print(f"   {param}: {value} → {emoji} {status_found}")
                    if status_found in ["POOR", "ACTION"]:
                        all_pass = False
                else:
                    print(f"   {param}: {value} → ❌ خارج از محدوده")
                    all_pass = False
            else:
                print(f"   {param}: {value} → ⚠️ بدون قانون")
        print(f"\n   {'✅' if all_pass else '❌'} وضعیت نهایی: {'PASS' if all_pass else 'FAIL'}")

def test_trend_analysis():
    print_header("📋 تست ۵: تحلیل روند")
    history = generate_history()
    print(f"✅ تاریخچه {len(history)} ساله تولید شد.")
    
    for param in ["water_content", "acidity", "breakdown_voltage", "passivator_content", "inhibitor_content"]:
        slope = calculate_slope(history, param)
        if slope is None:
            continue
        initial = history[0]["values"].get(param) if requires_initial_value(param) else None
        print(f"\n📊 {param}: شیب روزانه = {slope:.6f}")
        if param in TREND_CONFIG:
            cfg = TREND_CONFIG[param]
            print(f"   حد سالانه: {cfg.get('limit_per_year', 'N/A')}")
            dangerous = is_trend_dangerous(param, slope, initial)
            if dangerous is True:
                print(f"   🚨 وضعیت: خطرناک")
            elif dangerous is False:
                print(f"   ✅ وضعیت: سالم")
            else:
                print(f"   ⚠️ قابل تعیین نیست")

# ============================================================
# اجرا
# ============================================================

if __name__ == "__main__":
    print("\n" + "=" * 80)
    print("  IEC 60422:2024 – تست کامل پروژه")
    print("=" * 80)
    
    try:
        test_table2()
        test_table3()
        test_table5()
        test_sample_evaluation()
        test_trend_analysis()
    except Exception as e:
        print(f"\n❌ خطا: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    print("\n" + "=" * 80)
    print("  ✅ تمام تست‌ها با موفقیت اجرا شدند.")
    print("=" * 80 + "\n")