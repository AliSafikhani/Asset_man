"""
IEEE Algorithm - Exact port of the original IEEEProcessor
"""

import numpy as np
from scipy.stats import linregress
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from algorithms.base import BaseAlgorithm
from algorithms.transformer.dga.zones import IEEEStatus


class IEEEAlgorithm(BaseAlgorithm):
    """
    IEEE Algorithm - Exact port of the original IEEEProcessor
    """
    
    def __init__(self):
        super().__init__(
            name="IEEE C57.104-2019",
            description="IEEE DGA Interpretation Algorithm using time-series analysis",
            version="1.0"
        )
        self.asset_type = "transformer"
        self.test_type = "dga"
        
        # Gas order matching the original IEEEProcessor:
        # 0: H2, 1: O2, 2: N2, 3: CO, 4: CO2, 5: CH4, 6: C2H4, 7: C2H6, 8: C2H2
        self.GAS_INDICES = {
            'h2': 0,
            'o2': 1,
            'n2': 2,
            'co': 3,
            'co2': 4,
            'ch4': 5,
            'c2h4': 6,
            'c2h6': 7,
            'c2h2': 8,
        }
        
        # IEEE Tables (exactly as in original)
        self.ieee_tb1 = np.array([
            [80, 90, 90, 50, 1, 900, 9000],
            [75, 45, 30, 20, 1, 900, 5000],
            [75, 90, 90, 50, 1, 900, 10000],
            [100, 110, 150, 90, 1, 900, 10000],
            [40, 20, 15, 50, 2, 500, 5000],
            [40, 20, 15, 25, 2, 500, 3500],
            [40, 20, 15, 60, 2, 500, 5500],
            [40, 20, 15, 60, 2, 500, 5500],
        ])
        
        self.ieee_tb2 = np.array([
            [200, 150, 175, 100, 2, 1100, 12500],
            [200, 100, 70, 40, 2, 1100, 7000],
            [200, 150, 175, 95, 2, 1100, 14000],
            [200, 200, 250, 175, 4, 1100, 14000],
            [90, 50, 40, 100, 7, 600, 7000],
            [90, 60, 30, 80, 7, 600, 5000],
            [90, 60, 40, 125, 7, 600, 8000],
            [90, 30, 40, 125, 7, 600, 8000],
        ])
        
        self.ieee_tb3 = np.array([
            [40, 30, 25, 20, 0, 250, 2500],
            [25, 10, 7, 20, 0, 175, 1750],
        ])
        
        self.ieee_tb4 = np.array([
            [50, 15, 15, 10, 0, 200, 1750],
            [20, 10, 9, 7, 0, 100, 1000],
            [25, 4, 3, 7, 0, 100, 1000],
            [10, 3, 2, 5, 0, 80, 800],
        ])
    
    def get_required_parameters(self) -> List[str]:
        return ['h2', 'ch4', 'c2h2', 'c2h4', 'c2h6', 'co', 'co2', 'o2', 'n2']
    
    def get_visualization_type(self) -> str:
        return "time_series"
    
    def _extract_gas_array(self, samples: List[Dict[str, Any]]) -> np.ndarray:
        """
        Extract gas values from samples into a 2D array.
        Gas order matching the original IEEEProcessor:
        0: H2, 1: O2, 2: N2, 3: CO, 4: CO2, 5: CH4, 6: C2H4, 7: C2H6, 8: C2H2
        """
        n_samples = len(samples)
        gas_array = np.zeros((9, n_samples))
        
        for i, sample in enumerate(samples):
            gas_data = sample.get('gas_data', {})
            gas_array[0, i] = float(gas_data.get('h2', 0) or 0)
            gas_array[1, i] = float(gas_data.get('o2', 0) or 0)
            gas_array[2, i] = float(gas_data.get('n2', 0) or 0)
            gas_array[3, i] = float(gas_data.get('co', 0) or 0)
            gas_array[4, i] = float(gas_data.get('co2', 0) or 0)
            gas_array[5, i] = float(gas_data.get('ch4', 0) or 0)
            gas_array[6, i] = float(gas_data.get('c2h4', 0) or 0)
            gas_array[7, i] = float(gas_data.get('c2h6', 0) or 0)
            gas_array[8, i] = float(gas_data.get('c2h2', 0) or 0)
        
        return gas_array
    
    def _extract_days_array(self, samples: List[Dict[str, Any]]) -> np.ndarray:
        """
        Extract days from samples.
        Original algorithm expects: oldest sample has days = 0, newest has max days
        """
        dates = []
        for sample in samples:
            sample_date = sample.get('sample_date')
            if isinstance(sample_date, str):
                try:
                    dates.append(datetime.strptime(sample_date, '%Y-%m-%d'))
                except ValueError:
                    dates.append(datetime.now())
            elif isinstance(sample_date, datetime):
                dates.append(sample_date)
            else:
                dates.append(datetime.now())
        
        # Sort dates to ensure oldest first
        dates = sorted(dates)
        
        # Oldest sample has days = 0, others have days difference
        oldest_date = dates[0] if dates else datetime.now()
        days_array = np.array([(d - oldest_date).days for d in dates])
        return days_array.astype(float)
    
    def calculate(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError("IEEE algorithm requires multiple samples. Use calculate_batch() instead.")
    
    def calculate_batch(self, samples: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Calculate IEEE status for multiple samples using the original algorithm"""
        print(f"\n📦 IEEEAlgorithm.calculate_batch() called with {len(samples)} samples")
        
        if len(samples) == 0:
            return []
        
        # Sort samples by date (oldest to newest)
        sorted_samples = sorted(samples, key=lambda x: x.get('sample_date', ''))
        
        # Extract gas data and days
        gas_array = self._extract_gas_array(sorted_samples)
        days = self._extract_days_array(sorted_samples)
        nptr = len(sorted_samples)
        
        # Get transformer age
        tfr_age = 0
        if samples and 'transformer_age' in samples[0]:
            tfr_age = samples[0].get('transformer_age', 0)
        
        print(f"   📊 Processing {nptr} samples, transformer age: {tfr_age}")
        print(f"   📅 Days array: {days}")
        
        # Run the original algorithm
        tfr_status_ieee, sts_tb1, sts_tb2, sts_tb3, sts_tb4, pdctas, pdctas_2, nptr, mlplpy = self._ieee_detection(
            gas_array, days, 730, tfr_age
        )
        
        # Build results for each sample
        results = []
        for i, sample in enumerate(sorted_samples):
            status_code = int(tfr_status_ieee[i])
            
            result = {
                'id': sample.get('id'),
                'sample_date': sample.get('sample_date'),
                'fault_zone': str(status_code),
                'fault_name': IEEEStatus.STATUS_NAMES.get(status_code, 'Unknown'),
                'zone_color': IEEEStatus.STATUS_COLORS.get(status_code, '#95A5A6'),
                'status': status_code,
                'status_name': IEEEStatus.STATUS_NAMES.get(status_code, 'Unknown'),
                'status_description': IEEEStatus.STATUS_DESCRIPTIONS.get(status_code, ''),
                'days_from_latest': int(days[-1] - days[i]) if len(days) > 0 else 0,
                'additional_data': {
                    'sts_tb1': float(sts_tb1[i]),
                    'sts_tb2': float(sts_tb2[i]),
                    'sts_tb3': float(sts_tb3[i]),
                    'sts_tb4': float(sts_tb4[i]),
                }
            }
            results.append(result)
        
        print(f"   ✅ Returning {len(results)} results")
        return results
    
    def _ieee_detection(self, samples: np.ndarray, days: np.ndarray, max_day: int, tfr_age: int):
        """
        Exact port of the original IEEE_DETECTTION method
        """
        # IEEE Tables
        ieee_tb1 = self.ieee_tb1
        ieee_tb2 = self.ieee_tb2
        ieee_tb3 = self.ieee_tb3
        ieee_tb4 = self.ieee_tb4
        
        nptr = len(days)
        
        # Calculate O2/N2 ratios
        o2 = samples[1, :].astype(float)
        n2 = samples[2, :].astype(float)
        tfr_o2n2 = np.where(n2 != 0, np.round(o2 / n2, 3), 0)
        
        # Calculate deviation samples
        dev_samples = np.zeros((9, nptr))
        for i in range(9):
            for j in range(1, nptr):
                dev_samples[i, j] = samples[i, j] - samples[i, j - 1]
        dev_samples[:, 0] = 0
        
        # Initialize arrays
        pdcta = np.zeros((9, nptr))
        pdctas = [[None for _ in range(nptr)] for _ in range(9)]
        mlplpy = [[None for _ in range(nptr)] for _ in range(9)]
        gasvalue = samples
        durat = np.zeros(nptr)
        
        # Calculate mlplpy - EXACTLY matching original
        for j in range(nptr):
            if j <= 4:
                for i in range(9):
                    mlplpy[i][j] = "NA"
            else:
                daya6 = days[j-5:j+1].astype(float)
                for i in range(9):
                    tvalwa6 = (gasvalue[i, j-5:j+1]).astype(float)
                    slope6, intercept6, r_value6, p_value6, std_err6 = linregress(daya6, tvalwa6)
                    predicted_valuea6 = (slope6 * daya6 + intercept6)
                    mlplpy[i][j] = (predicted_valuea6[-1] - predicted_valuea6[0]) * 365 / (daya6[-1] - daya6[0])
        
        # Calculate pdcta and pdctas - EXACTLY matching original
        for j in range(nptr):
            if j == 0:
                for i in range(9):
                    pdcta[i, 0] = gasvalue[i, 0]
                    pdctas[i][0] = "NA"
                durat[j] = 0
            elif j == 1:
                for i in range(9):
                    pdcta[i, 1] = gasvalue[i, 1]
                    pdctas[i][1] = "NA"
                durat[j] = 0
            elif j == 2:
                for i in range(9):
                    pdcta[i, 2] = gasvalue[i, 2]
                    pdctas[i][2] = "NA"
                durat[j] = 0
            elif j == 3:
                daya = days[0:j+1].astype(float)
                if daya[j] < max_day:
                    for i in range(9):
                        tvalwa = (gasvalue[i, 0:j+1]).astype(float)
                        slope, intercept, r_value, p_value, std_err = linregress(daya, tvalwa)
                        predicted_valuea = (slope * daya + intercept)
                        pdcta[i, j] = (predicted_valuea[j] - predicted_valuea[0]) * 365 / daya[j]
                        pdctas[i][j] = (predicted_valuea[j] - predicted_valuea[0]) * 365 / daya[j]
                    durat[j] = daya[j]
                else:
                    for i in range(9):
                        pdcta[i, 2] = gasvalue[i, 2]
                        pdctas[i][2] = "NA"
                    durat[j] = 0
            elif j == 4:
                daya5 = days[j-4:j+1].astype(float)
                daya4 = days[j-3:j+1].astype(float)
                for i in range(9):
                    tvalwa5 = (gasvalue[i, j-4:j+1]).astype(float)
                    tvalwa4 = (gasvalue[i, j-3:j+1]).astype(float)
                    slope5, intercept5, r_value, p_value, std_err = linregress(daya5, tvalwa5)
                    slope4, intercept4, r_value4, p_value4, std_err4 = linregress(daya4, tvalwa4)
                    predicted_valuea5 = (slope5 * daya5 + intercept5)
                    predicted_valuea4 = (slope4 * daya4 + intercept4)
                    if daya5[j] - daya5[j-4] < max_day:
                        pdcta[i, j] = (predicted_valuea5[j] - predicted_valuea5[j-4]) * 365 / (daya5[j] - daya5[j-4])
                        pdctas[i][j] = (predicted_valuea5[j] - predicted_valuea5[j-4]) * 365 / (daya5[j] - daya5[j-4])
                        durat[j] = (daya5[j] - daya5[j-4])
                    elif daya4[j-1] - daya4[j-4] < max_day:
                        pdcta[i, j] = (predicted_valuea4[j-1] - predicted_valuea4[j-4]) * 365 / (daya4[j-1] - daya4[j-4])
                        pdctas[i][j] = (predicted_valuea4[j-1] - predicted_valuea4[j-4]) * 365 / (daya4[j-1] - daya4[j-4])
                        durat[j] = (daya4[j-1] - daya4[j-4])
                    else:
                        pdcta[i, j] = gasvalue[i, j]
                        pdctas[i][j] = "NA"
                        durat[j] = 0
            elif j > 4:
                daya6 = days[j-5:j+1].astype(float)
                daya5 = days[j-4:j+1].astype(float)
                daya4 = days[j-3:j+1].astype(float)
                for i in range(9):
                    tvalwa6 = (gasvalue[i, j-5:j+1]).astype(float)
                    tvalwa5 = (gasvalue[i, j-4:j+1]).astype(float)
                    tvalwa4 = (gasvalue[i, j-3:j+1]).astype(float)
                    
                    slope6, intercept6, r_value6, p_value6, std_err6 = linregress(daya6, tvalwa6)
                    slope5, intercept5, r_value5, p_value5, std_err5 = linregress(daya5, tvalwa5)
                    slope4, intercept4, r_value4, p_value4, std_err4 = linregress(daya4, tvalwa4)
                    
                    predicted_valuea6 = (slope6 * daya6 + intercept6)
                    predicted_valuea5 = (slope5 * daya5 + intercept5)
                    predicted_valuea4 = (slope4 * daya4 + intercept4)
                    
                    if daya6[5] - daya6[0] < max_day:
                        pdcta[i, j] = (predicted_valuea6[5] - predicted_valuea6[0]) * 365 / (daya6[5] - daya6[0])
                        pdctas[i][j] = (predicted_valuea6[5] - predicted_valuea6[0]) * 365 / (daya6[5] - daya6[0])
                        durat[j] = (daya6[5] - daya6[0])
                    elif daya5[4] - daya5[0] < max_day:
                        pdcta[i, j] = (predicted_valuea5[4] - predicted_valuea5[0]) * 365 / (daya5[4] - daya5[0])
                        pdctas[i][j] = (predicted_valuea5[4] - predicted_valuea5[0]) * 365 / (daya5[4] - daya5[0])
                        durat[j] = (daya5[4] - daya5[0])
                    elif daya4[3] - daya4[0] < max_day:
                        pdcta[i, j] = (predicted_valuea4[3] - predicted_valuea4[0]) * 365 / (daya4[3] - daya4[0])
                        pdctas[i][j] = (predicted_valuea4[3] - predicted_valuea4[0]) * 365 / (daya4[3] - daya4[0])
                        durat[j] = (daya4[3] - daya4[0])
                    else:
                        pdcta[i, j] = gasvalue[i, j]
                        pdctas[i][j] = "NA"
                        durat[j] = 0
        
        # Transpose for table calculations
        samples_t = samples.T
        dev_samples_t = dev_samples.T
        
        # IEEE TABLE 1
        sts_tb1 = np.zeros(nptr)
        sts_tb2 = np.zeros(nptr)
        sts_tb3 = np.zeros(nptr)
        sts_tb4 = np.zeros(nptr)
        
        # Table 1
        if tfr_age == "NA":
            for i in range(nptr):
                if tfr_o2n2[i] <= 0.2:
                    if (samples_t[i, 0] < ieee_tb1[0, 0] and samples_t[i, 5] < ieee_tb1[0, 1] and 
                        samples_t[i, 7] < ieee_tb1[0, 2] and samples_t[i, 6] < ieee_tb1[0, 3] and 
                        samples_t[i, 8] < ieee_tb1[0, 4] and samples_t[i, 3] < ieee_tb1[0, 5] and 
                        samples_t[i, 4] < ieee_tb1[0, 6]):
                        sts_tb1[i] = 1
                elif tfr_o2n2[i] > 0.2:
                    if (samples_t[i, 0] < ieee_tb1[4, 0] and samples_t[i, 5] < ieee_tb1[4, 1] and 
                        samples_t[i, 7] < ieee_tb1[4, 2] and samples_t[i, 6] < ieee_tb1[4, 3] and 
                        samples_t[i, 8] < ieee_tb1[4, 4] and samples_t[i, 3] < ieee_tb1[4, 5] and 
                        samples_t[i, 4] < ieee_tb1[4, 6]):
                        sts_tb1[i] = 1
        elif tfr_age < 10:
            for i in range(nptr):
                if tfr_o2n2[i] <= 0.2:
                    if (samples_t[i, 0] < ieee_tb1[1, 0] and samples_t[i, 5] < ieee_tb1[1, 1] and 
                        samples_t[i, 7] < ieee_tb1[1, 2] and samples_t[i, 6] < ieee_tb1[1, 3] and 
                        samples_t[i, 8] < ieee_tb1[1, 4] and samples_t[i, 3] < ieee_tb1[1, 5] and 
                        samples_t[i, 4] < ieee_tb1[1, 6]):
                        sts_tb1[i] = 1
                elif tfr_o2n2[i] > 0.2:
                    if (samples_t[i, 0] < ieee_tb1[5, 0] and samples_t[i, 5] < ieee_tb1[5, 1] and 
                        samples_t[i, 7] < ieee_tb1[5, 2] and samples_t[i, 6] < ieee_tb1[5, 3] and 
                        samples_t[i, 8] < ieee_tb1[5, 4] and samples_t[i, 3] < ieee_tb1[5, 5] and 
                        samples_t[i, 4] < ieee_tb1[5, 6]):
                        sts_tb1[i] = 1
        elif tfr_age >= 10 and tfr_age < 30:
            for i in range(nptr):
                if tfr_o2n2[i] <= 0.2:
                    if (samples_t[i, 0] < ieee_tb1[2, 0] and samples_t[i, 5] < ieee_tb1[2, 1] and 
                        samples_t[i, 7] < ieee_tb1[2, 2] and samples_t[i, 6] < ieee_tb1[2, 3] and 
                        samples_t[i, 8] < ieee_tb1[2, 4] and samples_t[i, 3] < ieee_tb1[2, 5] and 
                        samples_t[i, 4] < ieee_tb1[2, 6]):
                        sts_tb1[i] = 1
                elif tfr_o2n2[i] > 0.2:
                    if (samples_t[i, 0] < ieee_tb1[6, 0] and samples_t[i, 5] < ieee_tb1[6, 1] and 
                        samples_t[i, 7] < ieee_tb1[6, 2] and samples_t[i, 6] < ieee_tb1[6, 3] and 
                        samples_t[i, 8] < ieee_tb1[6, 4] and samples_t[i, 3] < ieee_tb1[6, 5] and 
                        samples_t[i, 4] < ieee_tb1[6, 6]):
                        sts_tb1[i] = 1
        elif tfr_age >= 30:
            for i in range(nptr):
                if tfr_o2n2[i] <= 0.2:
                    if (samples_t[i, 0] < ieee_tb1[3, 0] and samples_t[i, 5] < ieee_tb1[3, 1] and 
                        samples_t[i, 7] < ieee_tb1[3, 2] and samples_t[i, 6] < ieee_tb1[3, 3] and 
                        samples_t[i, 8] < ieee_tb1[3, 4] and samples_t[i, 3] < ieee_tb1[3, 5] and 
                        samples_t[i, 4] < ieee_tb1[3, 6]):
                        sts_tb1[i] = 1
                elif tfr_o2n2[i] > 0.2:
                    if (samples_t[i, 0] < ieee_tb1[7, 0] and samples_t[i, 5] < ieee_tb1[7, 1] and 
                        samples_t[i, 7] < ieee_tb1[7, 2] and samples_t[i, 6] < ieee_tb1[7, 3] and 
                        samples_t[i, 8] < ieee_tb1[7, 4] and samples_t[i, 3] < ieee_tb1[7, 5] and 
                        samples_t[i, 4] < ieee_tb1[7, 6]):
                        sts_tb1[i] = 1
        
        # Table 2
        if tfr_age == "NA":
            for i in range(nptr):
                if tfr_o2n2[i] <= 0.2:
                    if (samples_t[i, 0] < ieee_tb2[0, 0] and samples_t[i, 5] < ieee_tb2[0, 1] and 
                        samples_t[i, 7] < ieee_tb2[0, 2] and samples_t[i, 6] < ieee_tb2[0, 3] and 
                        samples_t[i, 8] < ieee_tb2[0, 4] and samples_t[i, 3] < ieee_tb2[0, 5] and 
                        samples_t[i, 4] < ieee_tb2[0, 6]):
                        sts_tb2[i] = 1
                elif tfr_o2n2[i] > 0.2:
                    if (samples_t[i, 0] < ieee_tb2[4, 0] and samples_t[i, 5] < ieee_tb2[4, 1] and 
                        samples_t[i, 7] < ieee_tb2[4, 2] and samples_t[i, 6] < ieee_tb2[4, 3] and 
                        samples_t[i, 8] < ieee_tb2[4, 4] and samples_t[i, 3] < ieee_tb2[4, 5] and 
                        samples_t[i, 4] < ieee_tb2[4, 6]):
                        sts_tb2[i] = 1
        elif tfr_age < 10:
            for i in range(nptr):
                if tfr_o2n2[i] <= 0.2:
                    if (samples_t[i, 0] < ieee_tb2[1, 0] and samples_t[i, 5] < ieee_tb2[1, 1] and 
                        samples_t[i, 7] < ieee_tb2[1, 2] and samples_t[i, 6] < ieee_tb2[1, 3] and 
                        samples_t[i, 8] < ieee_tb2[1, 4] and samples_t[i, 3] < ieee_tb2[1, 5] and 
                        samples_t[i, 4] < ieee_tb2[1, 6]):
                        sts_tb2[i] = 1
                elif tfr_o2n2[i] > 0.2:
                    if (samples_t[i, 0] < ieee_tb2[5, 0] and samples_t[i, 5] < ieee_tb2[5, 1] and 
                        samples_t[i, 7] < ieee_tb2[5, 2] and samples_t[i, 6] < ieee_tb2[5, 3] and 
                        samples_t[i, 8] < ieee_tb2[5, 4] and samples_t[i, 3] < ieee_tb2[5, 5] and 
                        samples_t[i, 4] < ieee_tb2[5, 6]):
                        sts_tb2[i] = 1
        elif tfr_age >= 10 and tfr_age < 30:
            for i in range(nptr):
                if tfr_o2n2[i] <= 0.2:
                    if (samples_t[i, 0] < ieee_tb2[2, 0] and samples_t[i, 5] < ieee_tb2[2, 1] and 
                        samples_t[i, 7] < ieee_tb2[2, 2] and samples_t[i, 6] < ieee_tb2[2, 3] and 
                        samples_t[i, 8] < ieee_tb2[2, 4] and samples_t[i, 3] < ieee_tb2[2, 5] and 
                        samples_t[i, 4] < ieee_tb2[2, 6]):
                        sts_tb2[i] = 1
                elif tfr_o2n2[i] > 0.2:
                    if (samples_t[i, 0] < ieee_tb2[6, 0] and samples_t[i, 5] < ieee_tb2[6, 1] and 
                        samples_t[i, 7] < ieee_tb2[6, 2] and samples_t[i, 6] < ieee_tb2[6, 3] and 
                        samples_t[i, 8] < ieee_tb2[6, 4] and samples_t[i, 3] < ieee_tb2[6, 5] and 
                        samples_t[i, 4] < ieee_tb2[6, 6]):
                        sts_tb2[i] = 1
        elif tfr_age >= 30:
            for i in range(nptr):
                if tfr_o2n2[i] <= 0.2:
                    if (samples_t[i, 0] < ieee_tb2[3, 0] and samples_t[i, 5] < ieee_tb2[3, 1] and 
                        samples_t[i, 7] < ieee_tb2[3, 2] and samples_t[i, 6] < ieee_tb2[3, 3] and 
                        samples_t[i, 8] < ieee_tb2[3, 4] and samples_t[i, 3] < ieee_tb2[3, 5] and 
                        samples_t[i, 4] < ieee_tb2[3, 6]):
                        sts_tb2[i] = 1
                elif tfr_o2n2[i] > 0.2:
                    if (samples_t[i, 0] < ieee_tb2[7, 0] and samples_t[i, 5] < ieee_tb2[7, 1] and 
                        samples_t[i, 7] < ieee_tb2[7, 2] and samples_t[i, 6] < ieee_tb2[7, 3] and 
                        samples_t[i, 8] < ieee_tb2[7, 4] and samples_t[i, 3] < ieee_tb2[7, 5] and 
                        samples_t[i, 4] < ieee_tb2[7, 6]):
                        sts_tb2[i] = 1
        
        # Table 3
        for i in range(nptr):
            if tfr_o2n2[i] <= 0.2:
                if (dev_samples_t[i, 0] < ieee_tb3[0, 0] and dev_samples_t[i, 5] < ieee_tb3[0, 1] and 
                    dev_samples_t[i, 7] < ieee_tb3[0, 2] and dev_samples_t[i, 6] < ieee_tb3[0, 3] and 
                    dev_samples_t[i, 8] <= ieee_tb3[0, 4] and dev_samples_t[i, 3] < ieee_tb3[0, 5] and 
                    dev_samples_t[i, 4] < ieee_tb3[0, 6]):
                    sts_tb3[i] = 1
            elif tfr_o2n2[i] > 0.2:
                if (dev_samples_t[i, 0] < ieee_tb3[1, 0] and dev_samples_t[i, 5] < ieee_tb3[1, 1] and 
                    dev_samples_t[i, 7] < ieee_tb3[1, 2] and dev_samples_t[i, 6] < ieee_tb3[1, 3] and 
                    dev_samples_t[i, 8] <= ieee_tb3[1, 4] and dev_samples_t[i, 3] < ieee_tb3[1, 5] and 
                    dev_samples_t[i, 4] < ieee_tb3[1, 6]):
                    sts_tb3[i] = 1
        
        # Table 4
        pdctas_2 = pdctas[4]  # C2H6 trend (5th row) - keep as list with "NA" strings
        
        # Convert pdctas to numeric for table 4 calculations
        pdctas_numeric = np.array(pdctas, dtype=object)
        pdctas_numeric[pdctas_numeric == 'NA'] = np.nan
        pdctas_numeric = pdctas_numeric.astype(float)
        
        if tfr_age <= 25:
            for i in range(nptr):
                if durat[i] < 300:
                    if tfr_o2n2[i] <= 0.2:
                        if (pdctas_numeric[0][i] < ieee_tb4[0, 0] and pdctas_numeric[5][i] < ieee_tb4[0, 1] and 
                            pdctas_numeric[7][i] < ieee_tb4[0, 2] and pdctas_numeric[6][i] < ieee_tb4[0, 3] and 
                            pdctas_numeric[8][i] < ieee_tb4[0, 4] and pdctas_numeric[3][i] < ieee_tb4[0, 5] and 
                            pdctas_numeric[4][i] < ieee_tb4[0, 6]):
                            sts_tb4[i] = 1
                    elif tfr_o2n2[i] > 0.2:
                        # CRITICAL FIX: Uses ieee_tb2[2, 4] for N2, not ieee_tb4
                        if (pdctas_numeric[0][i] < ieee_tb4[2, 0] and pdctas_numeric[5][i] < ieee_tb4[2, 1] and 
                            pdctas_numeric[7][i] < ieee_tb4[2, 2] and pdctas_numeric[6][i] < ieee_tb4[2, 3] and 
                            pdctas_numeric[8][i] < ieee_tb2[2, 4] and pdctas_numeric[3][i] < ieee_tb4[2, 5] and 
                            pdctas_numeric[4][i] < ieee_tb4[2, 6]):
                            sts_tb4[i] = 1
                elif durat[i] >= 300:
                    if tfr_o2n2[i] <= 0.2:
                        if (pdctas_numeric[0][i] < ieee_tb4[1, 0] and pdctas_numeric[5][i] < ieee_tb4[1, 1] and 
                            pdctas_numeric[7][i] < ieee_tb4[1, 2] and pdctas_numeric[6][i] < ieee_tb4[1, 3] and 
                            pdctas_numeric[8][i] < ieee_tb4[1, 4] and pdctas_numeric[3][i] < ieee_tb4[1, 5] and 
                            pdctas_numeric[4][i] < ieee_tb4[1, 6]):
                            sts_tb4[i] = 1
                    elif tfr_o2n2[i] > 0.2:
                        if (pdctas_numeric[0][i] < ieee_tb4[3, 0] and pdctas_numeric[5][i] < ieee_tb4[3, 1] and 
                            pdctas_numeric[7][i] < ieee_tb4[3, 2] and pdctas_numeric[6][i] < ieee_tb4[3, 3] and 
                            pdctas_numeric[8][i] < ieee_tb4[3, 4] and pdctas_numeric[3][i] < ieee_tb4[3, 5] and 
                            pdctas_numeric[4][i] < ieee_tb4[3, 6]):
                            sts_tb4[i] = 1
        
        # Final status determination
        tfr_status_ieee = np.zeros(nptr)
        for i in range(nptr):
            if nptr == 1:
                if sts_tb2[i] == 0:
                    tfr_status_ieee[i] = 3
                else:
                    tfr_status_ieee[i] = 2
            else:
                # pdctas_2 is the list with "NA" strings or None
                # Treat None as "NA" for comparison
                pdctas_val = pdctas_2[i]
                if pdctas_val == "NA" or pdctas_val is None:
                    if sts_tb3[i] == 0:
                        tfr_status_ieee[i] = 3
                    else:
                        tfr_status_ieee[i] = 2
                else:
                    if sts_tb1[i] == 1 and sts_tb3[i] == 1 and sts_tb4[i] == 1:
                        tfr_status_ieee[i] = 1
                    else:
                        if sts_tb2[i] == 0 or sts_tb4[i] == 0:
                            tfr_status_ieee[i] = 3
                        else:
                            tfr_status_ieee[i] = 2
        
        return (tfr_status_ieee, sts_tb1, sts_tb2, sts_tb3, sts_tb4, pdctas_numeric, pdctas_2, nptr, mlplpy)