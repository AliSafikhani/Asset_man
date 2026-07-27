// frontend/src/constants/assetConstants.js
import { FaCheckCircle, FaExclamationTriangle, FaShieldAlt, FaQuestionCircle } from 'react-icons/fa';

export const STATUS_BADGES = {
  IEEE: {
    Normal: { icon: FaCheckCircle, color: '#10b981', bg: '#d1fae5', label: 'Normal' },
    Investigate: { icon: FaExclamationTriangle, color: '#f59e0b', bg: '#fef3c7', label: 'Investigate' },
    'Action Required': { icon: FaShieldAlt, color: '#ef4444', bg: '#fecaca', label: 'Action Required' },
    Unknown: { icon: FaQuestionCircle, color: '#94a3b8', bg: '#f1f5f9', label: 'Unknown' },
  },
  IEC: {
    Investigate: { icon: FaExclamationTriangle, color: '#f59e0b', bg: '#fef3c7', label: 'Investigate' },
    'Action Required': { icon: FaShieldAlt, color: '#ef4444', bg: '#fecaca', label: 'Action Required' },
    Unknown: { icon: FaQuestionCircle, color: '#94a3b8', bg: '#f1f5f9', label: 'Unknown' },
  },
};

export const GAS_KEYS = ['h2', 'ch4', 'c2h2', 'c2h4', 'c2h6', 'co', 'co2', 'o2', 'n2'];
export const DGA_GASES = ['h2', 'ch4', 'c2h2', 'c2h4', 'c2h6'];

export const ALGO_MAP = {
  duvaltriangle1: 'duval_triangle_1',
  duvaltriangle2: 'duval_triangle_2',
  duvaltriangle4: 'duval_triangle_4',
  duvaltriangle5: 'duval_triangle_5',
  duvaltriangle6: 'duval_triangle_6',
  duvalpentagon1: 'duval_pentagon_1',
  duvalpentagon2: 'duval_pentagon_2',
  rogers: 'rogers_ratio',
  doernenburg: 'doernenburg_ratio',
  iec60599: 'iec60599_ratio',
  iec60599ratio: 'iec60599_ratio',
  ml_dga_1: 'ml_dga_1',
};

// Default visibility per test type (key = test_type_id)
export const DEFAULT_VISIBILITY_MAP = {
  124: {
    checkbox: true,
    test_date: true,
    lab_name: false,
    notes: false,
    actions: true,
    ieee_status: true,
    iec_status: true,
    sample_temp: true,
    h2: false,
    ch4: true,
    c2h2: true,
    c2h4: true,
    c2h6: true,
    co: false,
    co2: false,
    o2: false,
    n2: false,
    tdcg: false,
  },
  2: {
    checkbox: true,
    test_date: true,
    lab_name: false,
    notes: false,
    actions: true,
    ieee_status: false,
    iec_status: false,
    acidity: true,
    water_content: true,
    dielectric_strength: true,
    color: false,
  },
  129: {
    checkbox: true,
    test_date: true,
    lab_name: true,
    notes: false,
    actions: true,
    sample_temp: false,
    fol: true,
    fal: true,
    acf: true,
    mef: true,
    hmf: true,
    furoic_acid: true,
  },
  // ... add more test types as needed
};