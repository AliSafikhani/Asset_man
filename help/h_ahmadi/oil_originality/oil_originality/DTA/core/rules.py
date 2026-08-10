from .status import ORIGINAL, SUSPICIOUS, FAKE


def evaluate_rules(sample, ref):
    delta_tonset = abs(sample.tonset - ref.tonset)
    delta_tmax = abs(sample.tmax - ref.tmax)
    delta_delta_t = abs(sample.delta_t - ref.delta_t)
    
    fail_count = 0
    
    if delta_tonset >= 10:
        fail_count += 1
    
    if delta_tmax >= 8:
        fail_count += 1
    
    if delta_delta_t >= 2:
        fail_count += 1
    
    if fail_count >= 2:
        status = FAKE
    elif fail_count == 1:
        status = SUSPICIOUS
    else:
        status = ORIGINAL
    
    return {
        "status": status,
        "details": {
            "delta_tonset": delta_tonset,
            "delta_tmax": delta_tmax,
            "delta_delta_t": delta_delta_t
        }
    }