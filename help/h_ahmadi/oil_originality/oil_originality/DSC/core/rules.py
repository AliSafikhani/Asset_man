# oil_originality/DSC/core/rules.py

def evaluate_rules(sample, ref):
    delta_tonset = abs(sample.tonset - ref.tonset)
    delta_tmax = abs(sample.tmax - ref.tmax)
    delta_area = abs(sample.area - ref.area) / ref.area * 100

    fail_count = 0

    if delta_tonset > 10:
        fail_count += 1

    if delta_tmax > 5:
        fail_count += 1

    if delta_area > 20:
        fail_count += 1

    if fail_count >= 2:
        status = "fake"
    elif fail_count == 1:
        status = "suspicious"
    else:
        status = "original"

    return {
        "status": status,
        "details": {
            "delta_tonset": delta_tonset,
            "delta_tmax": delta_tmax,
            "delta_area": delta_area
        }
    }