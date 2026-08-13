# backend/algorithms/transformer/oil_originality/status.py
# Authenticity status constants (shared by DSC + DTA), ported verbatim from the
# reference algorithm (help/h_ahmadi/oil_originality).

ORIGINAL = "original"
SUSPICIOUS = "suspicious"
FAKE = "fake"

# Numeric score used to combine the two method verdicts.
SCORE_MAP = {
    ORIGINAL: 0,
    SUSPICIOUS: 1,
    FAKE: 2,
}
