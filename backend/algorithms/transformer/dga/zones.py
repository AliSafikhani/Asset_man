# DGA Zone Definitions
#backend\algorithms\transformer\dga\zones.py
# Common DGA Constants
DGA_GASES = ['h2', 'ch4', 'c2h2', 'c2h4', 'c2h6', 'co', 'co2', 'o2', 'n2']

DGA_GAS_NAMES = {
    'h2': 'Hydrogen',
    'ch4': 'Methane',
    'c2h2': 'Acetylene',
    'c2h4': 'Ethylene',
    'c2h6': 'Ethane',
    'co': 'Carbon Monoxide',
    'co2': 'Carbon Dioxide',
    'o2': 'Oxygen',
    'n2': 'Nitrogen'
}

# Duval Triangle 1 Zones
class DuvalTriangle1Zones:
    PD = "PD"
    T1 = "T1"
    T2 = "T2"
    T3 = "T3"
    D1 = "D1"
    D2 = "D2"
    DT = "DT"
    N = "N"
    S = "S"
    O = "O"
    UNK = "UNK"
    
    ZONE_NAMES = {
        "PD": "Partial Discharge",
        "T1": "Thermal Fault T1 (<300 C)",
        "T2": "Thermal Fault T2 (300-700 C)",
        "T3": "Thermal Fault T3 (>700 C)",
        "D1": "Discharge D1 (low energy)",
        "D2": "Discharge D2 (high energy)",
        "DT": "Mixed Fault (DT)",
        "N": "Normal Operation",
        "S": "Stray Gassing",
        "O": "Overheating",
        "UNK": "Unknown"
    }
    
    ZONE_COLORS = {
        "PD": "#FF6B6B",
        "T1": "#4ECDC4",
        "T2": "#45B7D1",
        "T3": "#96CEB4",
        "D1": "#FFEAA7",
        "D2": "#DDA0DD",
        "DT": "#F39C12",
        "N": "#4CAF50",
        "S": "#A8E6CF",
        "O": "#F39C12",
        "UNK": "#95A5A6"
    }


# Duval Triangle 2 Zones
class DuvalTriangle2Zones:
    N = "N"
    T3 = "T3"
    X3 = "X3"
    T2 = "T2"
    D1 = "D1"
    X1 = "X1"
    UNK = "UNK"
    
    ZONE_NAMES = {
        "N": "Normal",
        "T3": "Thermal Fault T3 (>700 C)",
        "X3": "Unknown Fault X3",
        "T2": "Thermal Fault T2 (300-700 C)",
        "D1": "Discharge D1 (low energy)",
        "X1": "Unknown Fault X1 ",
        "UNK": "Unknown"
    }
    
    ZONE_COLORS = {
        "N": "#4CAF50",
        "T3": "#96CEB4",
        "X3": "#FFD93D",
        "T2": "#45B7D1",
        "D1": "#FFEAA7",
        "X1": "#FF6B6B",
        "UNK": "#95A5A6"
    }


# Duval Triangle 4 Zones
class DuvalTriangle4Zones:
    O = "O"
    C = "C"
    ND = "ND"
    S = "S"
    PD = "PD"
    NA = "NA"
    
    ZONE_NAMES = {
        "O": "Overheating <250 C",
        "C": "Carbonization >250 C",
        "ND": "Not Determined",
        "S": "Stray Gassing",
        "PD": "Partial Discharge",
        "NA": "Not Applicable"
    }
    
    ZONE_COLORS = {
        "O": "#FFB74D",
        "C": "#A1887F",
        "ND": "#90A4AE",
        "S": "#A8E6CF",
        "PD": "#FF6B6B",
        "NA": "#E0E0E0"
    }


# Duval Triangle 5 Zones
class DuvalTriangle5Zones:
    O = "O"
    O2 = "O2"
    S = "S"
    PD = "PD"
    T2 = "T2"
    C = "C"
    T31 = "T31"
    T32 = "T32"
    ND = "ND"
    NA = "NA"
    
    ZONE_NAMES = {
        "O": "Overheating <250 C",
        "O2": "Overheating >250 C",
        "S": "Stray Gassing",
        "PD": "Partial Discharge",
        "T2": "Thermal Fault T2 (300-700 C)",
        "C": "Carbonization",
        "T31": "Thermal Fault T3 Type 1",
        "T32": "Thermal Fault T3 Type 2",
        "ND": "Not Determined",
        "NA": "Not Applicable"
    }
    
    ZONE_COLORS = {
        "O": "#FFB74D",
        "O2": "#FF8A65",
        "S": "#A8E6CF",
        "PD": "#FF6B6B",
        "T2": "#45B7D1",
        "C": "#A1887F",
        "T31": "#96CEB4",
        "T32": "#81C784",
        "ND": "#90A4AE",
        "NA": "#E0E0E0"
    }


# Duval Triangle 6 Zones
class DuvalTriangle6Zones:
    D1 = "D1"
    D2 = "D2"
    DT = "DT"
    PD = "PD"
    T1 = "T1"
    T2 = "T2"
    T3 = "T3"
    UNK = "UNK"
    
    ZONE_NAMES = {
        "D1": "Discharge D1 (low energy)",
        "D2": "Discharge D2 (high energy)",
        "DT": "Mixed Fault (DT)",
        "PD": "Partial Discharge",
        "T1": "Thermal Fault T1 (<300 C)",
        "T2": "Thermal Fault T2 (300-700 C)",
        "T3": "Thermal Fault T3 (>700 C)",
        "UNK": "Unknown"
    }
    
    ZONE_COLORS = {
        "D1": "#FFEAA7",
        "D2": "#DDA0DD",
        "DT": "#F39C12",
        "PD": "#FF6B6B",
        "T1": "#4ECDC4",
        "T2": "#45B7D1",
        "T3": "#96CEB4",
        "UNK": "#95A5A6"
    }


# Duval Pentagon 1 Zones
class DuvalPentagon1Zones:
    PD = "PD"
    S = "S"
    T1 = "T1"
    T2 = "T2"
    T3 = "T3"
    D1 = "D1"
    D2 = "D2"
    ND = "ND"
    
    ZONE_NAMES = {
        "PD": "Partial Discharge",
        "S": "Stray Gassing",
        "T1": "Thermal Fault T1 (<300 C)",
        "T2": "Thermal Fault T2 (300-700 C)",
        "T3": "Thermal Fault T3 (>700 C)",
        "D1": "Discharge D1 (low energy)",
        "D2": "Discharge D2 (high energy)",
        "ND": "Not Determined"
    }
    
    ZONE_COLORS = {
        "PD": "#FF6B6B",
        "S": "#A8E6CF",
        "T1": "#4ECDC4",
        "T2": "#45B7D1",
        "T3": "#96CEB4",
        "D1": "#FFEAA7",
        "D2": "#DDA0DD",
        "ND": "#90A4AE"
    }


# Duval Pentagon 2 Zones
class DuvalPentagon2Zones:
    PD = "PD"
    S = "S"
    O = "O"
    C = "C"
    T3H = "T3H"
    D1 = "D1"
    D2 = "D2"
    NA = "NA"

    ZONE_NAMES = {
        "PD": "Partial Discharge",
        "S": "Stray Gassing",
        "O": "Overheating <250 C",
        "C": "Carbonization",
        "T3H": "Thermal Fault T3 Hot Spot",
        "D1": "Discharge D1 (low energy)",
        "D2": "Discharge D2 (high energy)",
        "NA": "Not Applicable"
    }

    ZONE_COLORS = {
        "PD": "#FF6B6B",
        "S": "#A8E6CF",
        "O": "#FFB74D",
        "C": "#A1887F",
        "T3H": "#96CEB4",
        "D1": "#FFEAA7",
        "D2": "#DDA0DD",
        "NA": "#E0E0E0"
    }


# Rogers Ratio Status
class RogersStatus:
    NORMAL = "NL"
    PD = "PD"
    ARC = "ARC"
    T1 = "T1"
    T2 = "T2"
    T3 = "T3"
    UNK = "UNK"

    ZONE_NAMES = {
        "NL": "Normal",
        "PD": "Partial Discharge",
        "ARC": "Arcing (Electrical Discharge)",
        "T1": "Thermal Fault < 300 C",
        "T2": "Thermal Fault 300-700 C",
        "T3": "Thermal Fault > 700 C",
        "UNK": "Unknown"
    }

    ZONE_COLORS = {
        "NL": "#4CAF50",
        "PD": "#FF6B6B",
        "ARC": "#DDA0DD",
        "T1": "#4ECDC4",
        "T2": "#45B7D1",
        "T3": "#96CEB4",
        "UNK": "#95A5A6"
    }

    # 3D plotting zones (x=R1, y=R2, z=R3)
    ZONE_RANGES = {
        "NL": {"x": [0, 1], "y": [0.1, 1], "z": [0, 0.1]},
        "PD": {"x": [0, 1], "y": [0, 0.1], "z": [0, 0.1]},
        "ARC": {"x": [3, 10], "y": [0.1, 1], "z": [0.1, 3]},
        "T1": {"x": [0.1, 3], "y": [0.1, 1], "z": [0, 0.1]},
        "T2": {"x": [0.1, 3], "y": [1, 10], "z": [0, 0.1]},
        "T3": {"x": [3, 10], "y": [1, 10], "z": [0, 0.2]},
    }


# Doernenburg Ratio Status
class DoernenburgStatus:
    NORMAL = "Normal"
    THERMAL_FAULT = "Thermal Fault"
    PARTIAL_DISCHARGE = "Partial Discharge"
    ARCING = "Arcing"
    NOT_DETERMINED = "Not Determined"
    RESAMPLE = "Resample"
    UNK = "UNK"

    ZONE_NAMES = {
        "Normal": "Normal Operation",
        "Thermal Fault": "Thermal Fault",
        "Partial Discharge": "Partial Discharge",
        "Arcing": "Arcing (Electrical Discharge)",
        "Not Determined": "Not Determined",
        "Resample": "Resample Required",
        "UNK": "Unknown"
    }

    ZONE_COLORS = {
        "Normal": "#4CAF50",
        "Thermal Fault": "#F39C12",
        "Partial Discharge": "#FF6B6B",
        "Arcing": "#DDA0DD",
        "Not Determined": "#90A4AE",
        "Resample": "#FF9800",
        "UNK": "#95A5A6"
    }


# ============================================
# IEC 60599 Algorithm Zones
# ============================================
class IEC60599Status:
    """IEC 60599 Fault Types"""
    PD = "PD"           # Partial Discharge
    D1 = "D1"           # Low Energy Discharge
    D2 = "D2"           # High Energy Discharge
    D1D2 = "D1D2"       # Low/High Energy Discharge
    T1 = "T1"           # Thermal Fault < 300°C
    T2 = "T2"           # Thermal Fault 300-700°C
    T3 = "T3"           # Thermal Fault > 700°C
    ND = "ND"           # No Diagnosis
    
    ZONE_NAMES = {
        "PD": "Partial Discharge",
        "D1": "Low Energy Discharge",
        "D2": "High Energy Discharge",
        "D1D2": "Low/High Energy Discharge",
        "T1": "Thermal Fault < 300°C",
        "T2": "Thermal Fault 300-700°C",
        "T3": "Thermal Fault > 700°C",
        "ND": "No Diagnosis"
    }
    
    ZONE_COLORS = {
        "PD": "#FF6B6B",      # Red
        "D1": "#FFEAA7",      # Yellow
        "D2": "#DDA0DD",      # Plum
        "D1D2": "#FFD93D",    # Gold
        "T1": "#4ECDC4",      # Teal
        "T2": "#45B7D1",      # Blue
        "T3": "#96CEB4",      # Green
        "ND": "#90A4AE"       # Gray
    }
    
    # Zone ranges for 3D plotting (x=C2H4/C2H6, y=CH4/H2, z=C2H2/C2H4)
    ZONE_RANGES = {
        "PD": {"x": [0, 0.2], "y": [0, 0.1], "z": [0, 0.01]},
        "D1": {"x": [1, 10], "y": [0.1, 0.5], "z": [1, 10]},
        "D2": {"x": [2, 10], "y": [0.1, 1], "z": [0.6, 2.5]},
        "D1D2": {"x": [2, 10], "y": [0.1, 0.5], "z": [1, 2.5]},
        "T1": {"x": [0, 1], "y": [1, 10], "z": [0, 0.01]},
        "T2": {"x": [1, 4], "y": [1, 10], "z": [0, 0.1]},
        "T3": {"x": [4, 10], "y": [1, 10], "z": [0, 0.2]},
    }

# ============================================
# ML DGA Algorithm Zones - Multiple Models
# ============================================
class MLDGAFaultStatus:
    """ML DGA Fault Types - Common across all ML models"""
    PD = "PD"           # Partial Discharge
    T1 = "T1"           # Thermal Fault < 300°C
    T2 = "T2"           # Thermal Fault 300-700°C
    T3 = "T3"           # Thermal Fault > 700°C
    D1 = "D1"           # Low Energy Discharge
    D2 = "D2"           # High Energy Discharge
    N = "N"             # Normal
    UNK = "UNK"         # Unknown
    
    ZONE_NAMES = {
        "PD": "Partial Discharge",
        "T1": "Thermal Fault < 300°C",
        "T2": "Thermal Fault 300-700°C",
        "T3": "Thermal Fault > 700°C",
        "D1": "Low Energy Discharge",
        "D2": "High Energy Discharge",
        "N": "Normal",
        "UNK": "Unknown"
    }
    
    ZONE_COLORS = {
        "PD": "#FF6B6B",      # Red
        "T1": "#4ECDC4",      # Teal
        "T2": "#45B7D1",      # Blue
        "T3": "#96CEB4",      # Green
        "D1": "#FFEAA7",      # Yellow
        "D2": "#DDA0DD",      # Plum
        "N": "#4CAF50",       # Green
        "UNK": "#95A5A6"      # Gray
    }

# ============================================
# IEEE Algorithm Status
# ============================================
class IEEEStatus:
    """IEEE Algorithm Status Codes"""
    UNKNOWN = 0           # Status 0: Unknown/Undetermined
    NORMAL = 1            # Status 1: Normal Operation
    INVESTIGATE = 2       # Status 2: Investigate Further
    ACTION_REQUIRED = 3   # Status 3: Immediate Action Required
    
    STATUS_NAMES = {
        0: "Unknown",
        1: "Normal",
        2: "Investigate",
        3: "Action Required"
    }
    
    STATUS_COLORS = {
        0: "#95A5A6",      # Gray
        1: "#4CAF50",      # Green
        2: "#FF9800",      # Orange
        3: "#EF4444"       # Red
    }
    
    STATUS_BADGE_CLASSES = {
        0: "unknown",
        1: "normal",
        2: "investigate",
        3: "action-required"
    }
    
    STATUS_DESCRIPTIONS = {
        0: "Unable to determine transformer condition",
        1: "All parameters within normal ranges",
        2: "Some parameters outside normal ranges - further investigation recommended",
        3: "Critical parameters outside acceptable ranges - immediate action required"
    }

# IEC Status
# ============================================
class IECStatus:
    """IEC DGA Status Codes"""
    UNKNOWN = "UNKNOWN"
    INVESTIGATE = "Investigate"
    ACTION_REQUIRED = "Action Required"
    
    ZONE_NAMES = {
        "UNKNOWN": "Unable to Determine",
        "Investigate": "Investigate - Monitor Closely",
        "Action Required": "Action Required - Immediate Attention"
    }
    
    ZONE_COLORS = {
        "UNKNOWN": "#95A5A6",
        "Investigate": "#FF9800",
        "Action Required": "#f44336"
    }