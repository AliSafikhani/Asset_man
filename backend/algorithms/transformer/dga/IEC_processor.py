# backend/algorithms/transformer/dga/IEC_processor.py

import numpy as np
from typing import Any, List, Dict, Union
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class IECProcessor:
    """
    A class to encapsulate the IEC DGA algorithm.
    This is a simplified version compared to IEEE C57.104.
    """

    def __init__(self):
        """
        Initializes the IECProcessor.
        """
        pass

    def IEC_DETECTION(
        self,
        samples: np.ndarray,
        days: np.ndarray,
    ) -> np.ndarray:
        """
        IEC DGA detection algorithm.
        
        Parameters:
        -----------
        samples : np.ndarray
            Array of shape (9, n_samples) containing gas concentrations
            Order: [H2, O2, N2, CO, CO2, CH4, C2H4, C2H6, C2H2]
        days : np.ndarray
            Array of days since first sample
            
        Returns:
        --------
        np.ndarray : Status codes for each sample
            2 = Investigate (Both tables pass)
            4 = Action Required (One or both tables fail)
        """
        nptr = len(days)
        tfr_status_iec = np.zeros(nptr)
        sts_tb5 = np.zeros(nptr)  # Table 1: Concentration limits
        sts_tb6 = np.zeros(nptr)  # Table 2: Rate of change limits

        # IEC Table 1: Concentration Limits
        # Order: [C2H2, H2, CH4, C2H4, C2H6, CO, CO2]
        iec_tb1 = np.array([20, 150, 130, 280, 90, 600, 14000])
        
        # IEC Table 2: Rate of Change Limits (per year)
        # Order: [C2H2, H2, CH4, C2H4, C2H6, CO, CO2]
        iec_tb2 = np.array([4, 132, 120, 146, 90, 1060, 10000])

        # Calculate daily gas deviation
        dev_samples = np.zeros((9, nptr))
        for i in range(9):
            for j in range(1, nptr):
                dev_samples[i, j] = samples[i, j] - samples[i, j-1]
        dev_samples[:, 0] = 0

        # Transpose for easier iteration
        samples = samples.T
        dev_samples = dev_samples.T

        # Calculate years from days (avoid division by zero)
        years = np.zeros(nptr)
        for i in range(nptr):
            years[i] = days[i] / 365.0 if days[i] > 0 else 0.001

        # IEC Table 1: Concentration Limits
        # Gas order in samples: [H2, O2, N2, CO, CO2, CH4, C2H4, C2H6, C2H2]
        # IEC Table order:      [C2H2, H2, CH4, C2H4, C2H6, CO, CO2]
        for i in range(nptr):
            # Check if all gas concentrations are below limits
            # samples[i, 8] = C2H2, samples[i, 0] = H2, samples[i, 5] = CH4
            # samples[i, 6] = C2H4, samples[i, 7] = C2H6, samples[i, 3] = CO, samples[i, 4] = CO2
            if (samples[i, 8] < iec_tb1[0] and   # C2H2
                samples[i, 0] < iec_tb1[1] and   # H2
                samples[i, 5] < iec_tb1[2] and   # CH4
                samples[i, 6] < iec_tb1[3] and   # C2H4
                samples[i, 7] < iec_tb1[4] and   # C2H6
                samples[i, 3] < iec_tb1[5] and   # CO
                samples[i, 4] < iec_tb1[6]):     # CO2
                sts_tb5[i] = 3  # Pass
            else:
                sts_tb5[i] = 5  # Fail

        # IEC Table 2: Rate of Change Limits (per year)
        for i in range(nptr):
            # Check if all gas rate of changes are below limits
            # dev_samples[i, 8]/years[i] = C2H2 rate, dev_samples[i, 0]/years[i] = H2 rate, etc.
            if (dev_samples[i, 8] / years[i] < iec_tb2[0] and   # C2H2
                dev_samples[i, 0] / years[i] < iec_tb2[1] and   # H2
                dev_samples[i, 5] / years[i] < iec_tb2[2] and   # CH4
                dev_samples[i, 6] / years[i] < iec_tb2[3] and   # C2H4
                dev_samples[i, 7] / years[i] < iec_tb2[4] and   # C2H6
                dev_samples[i, 3] / years[i] < iec_tb2[5] and   # CO
                dev_samples[i, 4] / years[i] < iec_tb2[6]):     # CO2
                sts_tb6[i] = 3  # Pass
            else:
                sts_tb6[i] = 5  # Fail

        # Final Classification
        for i in range(nptr):
            if sts_tb5[i] == 3 and sts_tb6[i] == 3:
                tfr_status_iec[i] = 2  # Investigate - Both tables pass
            else:
                tfr_status_iec[i] = 4  # Action Required - One or both tables fail

        return tfr_status_iec