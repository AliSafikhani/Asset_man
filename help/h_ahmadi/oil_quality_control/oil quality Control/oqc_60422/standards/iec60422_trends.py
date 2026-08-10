# standards/iec60422_trends.py
from __future__ import annotations

"""
IEC 60422:2024 – Trend Analysis Limits

مطابق با استاندارد، تحلیل روند برای پارامترهای کلیدی زیر انجام می‌شود:
- رطوبت (Water Content)
- اسیدیته (Acidity)
- فوران‌ها (Furans) – در این پروژه پشتیبانی نمی‌شود
- گازهای محلول (DGA) – در این پروژه پشتیبانی نمی‌شود

مقادیر حدی بر اساس **تغییرات سالانه** (Per Year) تعریف شده‌اند.
موتور ارزیابی باید شیب (Slope) را بر حسب روز محاسبه کرده و با limit/365 مقایسه کند.

⚠️ نکته: تمامی نتایج باید با نمونه‌برداری مجدد تأیید شوند.
"""

# =====================================================================
# ساختار جدید: هر پارامتر شامل اطلاعات کامل برای تحلیل روند
# =====================================================================

TREND_CONFIG = {
    
    # ======================== 1. رطوبت (Water Content) ========================
    "water_content": {
        "unit": "mg/kg",
        "limit_per_year": 5.0,           # افزایش بیش از ۵ واحد در سال خطرناک
        "direction": "increase",         # افزایش خطرناک است
        "description": "افزایش رطوبت نشان‌دهنده نفوذ رطوبت یا تخریب عایق است.",
        "reference": "Table 5 – Water Content",
    },
    
    # ======================== 2. اسیدیته (Acidity) ========================
    "acidity": {
        "unit": "mgKOH/g",
        "limit_per_year": 0.05,          # افزایش بیش از ۰.۰۵ واحد در سال خطرناک
        "direction": "increase",
        "description": "افزایش اسیدیته نشان‌دهنده اکسیداسیون روغن و تشکیل اسیدهای آلی است.",
        "reference": "Table 5 – Acidity",
    },
    
    # ======================== 3. ولتاژ شکست (Breakdown Voltage) ========================
    "breakdown_voltage": {
        "unit": "kV",
        "limit_per_year": -3.0,          # کاهش بیش از ۳ کیلوولت در سال خطرناک
        "direction": "decrease",
        "description": "کاهش ولتاژ شکست نشان‌دهنده افزایش رطوبت، ذرات یا تخریب روغن است.",
        "reference": "Table 5 – Breakdown Voltage",
    },
    
    # ======================== 4. ضریب اتلاف دی‌الکتریک (DDF) ========================
    "dielectric_dissipation_90": {
        "unit": "dimensionless",
        "limit_per_year": 0.005,         # افزایش بیش از ۰.۰۰۵ در سال خطرناک
        "direction": "increase",
        "description": "افزایش DDF نشان‌دهنده آلودگی، اکسیداسیون یا تشکیل رسوب است.",
        "reference": "Table 5 – Dielectric Dissipation Factor",
    },
    
    # ======================== 5. کشش سطحی (Interfacial Tension) ========================
    "interfacial_tension": {
        "unit": "mN/m",
        "limit_per_year": -2.0,          # کاهش بیش از ۲ واحد در سال خطرناک
        "direction": "decrease",
        "description": "کاهش کشش سطحی نشان‌دهنده حضور مواد قطبی یا سورفکتانت‌ها (حاصل از اکسیداسیون) است.",
        "reference": "Table 5 – Interfacial Tension",
    },
    
    # ======================== 6. رنگ (Colour) ========================
    "colour": {
        "unit": "ISO scale",
        "limit_per_year": 0.5,           # افزایش بیش از ۰.۵ در سال خطرناک
        "direction": "increase",
        "description": "تغییر سریع رنگ می‌تواند نشان‌دهنده پیری یا آلودگی روغن باشد، اما نباید به‌تنهایی ملاک قضاوت قرار گیرد.",
        "reference": "Table 5 – Colour",
    },
    
    # ======================== 7. ظاهر (Appearance) ========================
    "appearance": {
        "unit": "level (1=Clear, 2=Turbid, 3=Severe)",
        "limit_per_year": 0.5,           # افزایش بیش از ۰.۵ در سال خطرناک
        "direction": "increase",
        "description": "تغییر ظاهر از شفاف به کدر نشان‌دهنده افزایش رطوبت، رسوب یا آلودگی است.",
        "reference": "Table 5 – Appearance",
    },
    
    # ======================== 8. رسوب (Sediment) ========================
    "sediments": {
        "unit": "% by mass",
        "limit_per_year": 0.1,           # افزایش بیش از ۰.۱٪ در سال خطرناک
        "direction": "increase",
        "description": "تشکیل رسوب نشان‌دهنده اکسیداسیون پیشرفته و نیاز به بازیابی روغن است.",
        "reference": "Table 5 – Sediment",
    },
    
    # ======================== 9. لجن (Sludge) ========================
    "sludge": {
        "unit": "% by mass",
        "limit_per_year": 0.1,           # افزایش بیش از ۰.۱٪ در سال خطرناک
        "direction": "increase",
        "description": "تشکیل لجن قابل رسوب نشان‌دهنده تخریب شدید روغن است و نیاز به بازیابی دارد.",
        "reference": "Table 5 – Sludge",
    },
    
    # ======================== 10. بازدارنده (Inhibitor Content) ========================
    "inhibitor_content": {
        "unit": "% of original value",
        "limit_per_year": -5.0,          # کاهش بیش از ۵٪ از مقدار اولیه در سال خطرناک
        "direction": "decrease_percentage",  # کاهش درصدی از مقدار اولیه
        "description": "کاهش محتوای بازدارنده نشان‌دهنده مصرف آن در حین اکسیداسیون است.",
        "reference": "Table 5 – Inhibitor Content",
        "requires_initial_value": True,  # نیاز به مقدار اولیه دارد
    },
    
    # ======================== 11. غیرفعال‌کننده فلز (Passivator Content) ========================
    "passivator_content": {
        "unit": "mg/kg",
        "limit_per_year": -10.0,         # کاهش بیش از ۱۰ میلی‌گرم بر کیلوگرم در سال خطرناک
        "direction": "decrease",
        "description": "کاهش سریع غیرفعال‌کننده نشان‌دهنده واکنش با ترکیبات گوگردی خورنده است.",
        "reference": "Table 5 – Passivator Content",
    },
    
    # ======================== 12. گوگرد خورنده (Corrosive Sulphur) ========================
    "corrosive_sulphur": {
        "unit": "boolean (0=False, 1=True)",
        "limit_per_year": None,          # تغییر وضعیت از False به True خطرناک است
        "direction": "boolean_change",
        "description": "تغییر از غیرخورنده به خورنده نیاز به ارزیابی ریسک فوری دارد.",
        "reference": "Table 5 – Corrosive Sulphur",
    },
    
    # ======================== 13. گوگرد بالقوه خورنده (Potentially Corrosive Sulphur) ========================
    "potentially_corrosive_sulphur": {
        "unit": "boolean (0=False, 1=True)",
        "limit_per_year": None,
        "direction": "boolean_change",
        "description": "تغییر از غیرخورنده به بالقوه خورنده نیاز به ارزیابی ریسک دارد.",
        "reference": "Table 5 – Potentially Corrosive Sulphur",
    },
    
    # ======================== 14. DBDS ========================
    "dbds": {
        "unit": "mg/kg",
        "limit_per_year": 2.0,           # افزایش بیش از ۲ میلی‌گرم بر کیلوگرم در سال خطرناک
        "direction": "increase",
        "description": "افزایش DBDS نشان‌دهنده حضور ترکیبات گوگردی فعال است که می‌توانند باعث خوردگی شوند.",
        "reference": "Table 5 – DBDS",
    },
    
    # ======================== 15. PCBs ========================
    "pcb": {
        "unit": "mg/kg",
        "limit_per_year": 1.0,           # افزایش بیش از ۱ میلی‌گرم بر کیلوگرم در سال خطرناک
        "direction": "increase",
        "description": "افزایش PCBs نشان‌دهنده آلودگی از تجهیزات دیگر است.",
        "reference": "Table 5 – PCBs",
    },
    
    # ======================== 16. نقطه اشتعال (Flash Point) ========================
    "flash_point": {
        "unit": "°C",
        "limit_per_year": -5.0,          # کاهش بیش از ۵ درجه سانتی‌گراد در سال خطرناک
        "direction": "decrease",
        "description": "کاهش نقطه اشتعال نشان‌دهنده آلودگی با حلال‌ها یا تجزیه روغن است.",
        "reference": "Table 5 – Flash Point",
    },
}

# =====================================================================
# نگاشت نام‌های قدیمی به جدید برای سازگاری با کدهای قبلی
# =====================================================================

# پارامترهایی که در نسخه‌های قبلی بودند و حذف شده‌اند:
# water_saturation, oxidation_stability_*, total_dissolved_gas,
# hydrogen, acetylene, volume_resistivity_90

# =====================================================================
# توابع کمکی
# =====================================================================

def get_trend_limit(param: str) -> float | None:
    """
    دریافت مقدار حدی برای یک پارامتر (بر اساس سال)
    """
    config = TREND_CONFIG.get(param)
    return config.get("limit_per_year") if config else None


def get_trend_direction(param: str) -> str | None:
    """
    دریافت جهت خطرناک بودن روند:
    - "increase": افزایش از حد مجاز خطرناک است
    - "decrease": کاهش از حد مجاز خطرناک است
    - "decrease_percentage": کاهش درصدی از مقدار اولیه خطرناک است
    - "boolean_change": تغییر وضعیت بولی خطرناک است
    """
    config = TREND_CONFIG.get(param)
    return config.get("direction") if config else None


def is_trend_dangerous(param: str, slope_per_day: float, initial_value: float | None = None) -> bool | None:
    """
    بررسی اینکه آیا روند یک پارامتر خطرناک است یا خیر.
    
    Args:
        param: نام پارامتر
        slope_per_day: شیب تغییرات بر حسب روز (محاسبه شده از داده‌های تاریخی)
        initial_value: مقدار اولیه (فقط برای inhibitor_content لازم است)
    
    Returns:
        True: اگر روند خطرناک باشد
        False: اگر روند خطرناک نباشد
        None: اگر پارامتر در TREND_CONFIG وجود نداشته باشد
    """
    config = TREND_CONFIG.get(param)
    if not config:
        return None
    
    limit_per_year = config.get("limit_per_year")
    direction = config.get("direction")
    
    # تبدیل حد سالانه به روزانه
    if limit_per_year is None:
        # برای پارامترهای بولی، تغییر وضعیت را بررسی می‌کنیم
        if direction == "boolean_change":
            # اگر شیب صفر نباشد، یعنی تغییر وضعیت داده‌ای رخ داده است
            return abs(slope_per_day) > 0.001
        return None
    
    limit_per_day = limit_per_year / 365.0
    
    # ====== افزایش ======
    if direction == "increase":
        return slope_per_day > limit_per_day
    
    # ====== کاهش مطلق ======
    elif direction == "decrease":
        return slope_per_day < limit_per_day  # slope منفی‌تر از حد مجاز
    
    # ====== کاهش درصدی از مقدار اولیه ======
    elif direction == "decrease_percentage":
        if initial_value is None or initial_value == 0:
            return None
        # محاسبه درصد کاهش در سال
        # slope_per_day * 365 = تغییر سالانه بر حسب واحد
        yearly_change = slope_per_day * 365
        percent_change = (yearly_change / initial_value) * 100
        # کاهش بیش از ۵٪ در سال خطرناک است (limit_per_year = -5)
        return percent_change < limit_per_year  # limit_per_year منفی است
    
    return None


def get_trend_description(param: str) -> str:
    """
    دریافت توضیحات مربوط به روند یک پارامتر
    """
    config = TREND_CONFIG.get(param)
    return config.get("description", "") if config else ""


def get_trend_unit(param: str) -> str:
    """
    دریافت واحد اندازه‌گیری پارامتر
    """
    config = TREND_CONFIG.get(param)
    return config.get("unit", "") if config else ""


def requires_initial_value(param: str) -> bool:
    """
    بررسی اینکه آیا پارامتر برای تحلیل روند نیاز به مقدار اولیه دارد یا خیر
    """
    config = TREND_CONFIG.get(param)
    return config.get("requires_initial_value", False) if config else False


# =====================================================================
# تابعی برای تولید دیکشنری قدیمی (سازگاری با کدهای قبلی)
# =====================================================================

def get_legacy_limits() -> dict[str, float]:
    """
    تولید دیکشنری قدیمی TREND_LIMITS_PER_YEAR برای سازگاری با کدهای قبلی
    """
    legacy = {}
    for param, config in TREND_CONFIG.items():
        limit = config.get("limit_per_year")
        if limit is not None:
            legacy[param] = limit
    return legacy


# برای سازگاری با کدهای قبلی که از TREND_LIMITS_PER_YEAR استفاده می‌کنند
TREND_LIMITS_PER_YEAR = get_legacy_limits()
