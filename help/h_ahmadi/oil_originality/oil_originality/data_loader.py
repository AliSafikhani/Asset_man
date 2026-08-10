# data_loader.py
import numpy as np

def load_curve_from_files(x_file_path, y_file_path):
    """
    بارگذاری منحنی از دو فایل txt تک‌ستونه:
    - فایل x: شامل مقادیر دما
    - فایل y: شامل مقادیر سیگنال
    هر دو فایل فقط یک ستون دارند و هیچ هدری ندارند.
    """
    try:
        x_data = np.loadtxt(x_file_path)
        y_data = np.loadtxt(y_file_path)

        if len(x_data) != len(y_data):
            raise ValueError(f"طول فایل‌ها یکسان نیست: x={len(x_data)}, y={len(y_data)}")

        return {
            "temperature": x_data.tolist(),
            "signal": y_data.tolist()
        }
    except Exception as e:
        print(f"❌ خطا در خواندن فایل‌ها: {e}")
        return None


def align_curves(sample_curve, ref_curve):
    """
    درون‌یابی سیگنال نمونه بر روی دمای مرجع
    """
    import numpy as np
    temp_ref = np.array(ref_curve["temperature"])
    signal_ref = np.array(ref_curve["signal"])
    temp_sample = np.array(sample_curve["temperature"])
    signal_sample = np.array(sample_curve["signal"])

    aligned_signal = np.interp(temp_ref, temp_sample, signal_sample)

    return {
        "temperature": temp_ref.tolist(),
        "signal": aligned_signal.tolist()
    }