from dataclasses import dataclass


@dataclass
class DTAFeatures:
    tonset: float      # دمای شروع پیک
    tmax: float        # دمای پیک
    delta_t: float     # اختلاف دمایی بین نمونه و مرجع