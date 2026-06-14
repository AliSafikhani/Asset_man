"""
Downsampling utilities for converting 1 kHz data to ~30 Hz for browser display
Implements various downsampling algorithms (LTTB, Min-Max, Average)
"""

import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class RealtimeDownsampler:
    """
    Downsampler for real-time high-frequency data
    Converts 1 kHz data to lower frequency for efficient browser display
    """
    
    def __init__(self, target_freq: float = 30.0):
        """
        Initialize downsampler
        
        Args:
            target_freq: Target frequency in Hz (default 30 Hz)
        """
        self.target_freq = target_freq
        self.window_ms = int(1000 / target_freq)  # Window size in milliseconds
        self.buffer = []
        
    def downsample(self, data_points: List[Dict[str, Any]], algorithm: str = "lttb") -> List[Dict[str, Any]]:
        """
        Downsample data points to target frequency
        
        Args:
            data_points: List of data points with timestamps and values
            algorithm: Downsampling algorithm ('lttb', 'minmax', 'average')
        
        Returns:
            Downsampled list of data points
        """
        if not data_points:
            return []
        
        if len(data_points) <= 100:
            return data_points
        
        if algorithm == "lttb":
            return self._downsample_lttb(data_points)
        elif algorithm == "minmax":
            return self._downsample_minmax(data_points)
        elif algorithm == "average":
            return self._downsample_average(data_points)
        else:
            logger.warning(f"Unknown algorithm {algorithm}, using LTTB")
            return self._downsample_lttb(data_points)
    
    def _downsample_lttb(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Largest Triangle Three Buckets algorithm
        Preserves visual characteristics of the data
        Best for time-series visualization
        """
        if len(data) <= 100:
            return data
        
        # Convert to numpy array for performance
        timestamps = [self._parse_timestamp(d['timestamp']) for d in data]
        values = [d['value'] for d in data]
        
        target_size = min(100, len(data) // 10)  # Downsample to ~10% of original
        if target_size < 2:
            target_size = 2
        
        # LTTB algorithm
        result_indices = self._lttb(np.array(timestamps), np.array(values), target_size)
        
        return [data[i] for i in result_indices]
    
    def _lttb(self, timestamps: np.ndarray, values: np.ndarray, target_size: int) -> List[int]:
        """
        Largest Triangle Three Buckets implementation
        """
        if target_size >= len(timestamps):
            return list(range(len(timestamps)))
        
        # Calculate bucket size
        bucket_size = (len(timestamps) - 2) / (target_size - 2)
        
        # Initialize result with first and last points
        result_indices = [0]
        
        # For each bucket
        for i in range(1, target_size - 1):
            # Calculate bucket range
            start_idx = int((i - 1) * bucket_size) + 1
            end_idx = int(i * bucket_size) + 1
            
            if start_idx >= end_idx:
                end_idx = start_idx + 1
            
            # Get previous point index
            prev_idx = result_indices[-1]
            
            # Calculate average of next bucket
            next_start = int(i * bucket_size) + 1
            next_end = int((i + 1) * bucket_size) + 1
            
            if next_start >= len(timestamps):
                next_start = len(timestamps) - 1
            if next_end > len(timestamps):
                next_end = len(timestamps)
            
            avg_x = np.mean(timestamps[next_start:next_end])
            avg_y = np.mean(values[next_start:next_end])
            
            # Find point with maximum triangle area
            max_area = -1
            max_idx = start_idx
            
            for idx in range(start_idx, min(end_idx, len(timestamps))):
                # Calculate triangle area
                area = abs(
                    (timestamps[prev_idx] - avg_x) * (values[idx] - values[prev_idx]) -
                    (timestamps[prev_idx] - timestamps[idx]) * (avg_y - values[prev_idx])
                ) * 0.5
                
                if area > max_area:
                    max_area = area
                    max_idx = idx
            
            result_indices.append(max_idx)
        
        # Add last point
        result_indices.append(len(timestamps) - 1)
        
        return result_indices
    
    def _downsample_minmax(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Min-Max downsampling
        Preserves extreme values (min and max in each window)
        """
        if len(data) <= 100:
            return data
        
        # Calculate number of points per window
        points_per_window = len(data) // 100
        
        if points_per_window < 1:
            return data
        
        downsampled = []
        
        for i in range(0, len(data), points_per_window):
            window = data[i:i + points_per_window]
            if not window:
                continue
            
            # Find min and max values in window
            min_point = min(window, key=lambda x: x['value'])
            max_point = max(window, key=lambda x: x['value'])
            
            # Add both min and max to preserve extremes
            if min_point != max_point:
                downsampled.append(min_point)
                downsampled.append(max_point)
            else:
                downsampled.append(min_point)
        
        # Ensure we don't exceed target size
        if len(downsampled) > 100:
            step = len(downsampled) // 100
            downsampled = downsampled[::step]
        
        return downsampled
    
    def _downsample_average(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Average downsampling
        Calculates average of values in each window
        Good for reducing noise
        """
        if len(data) <= 100:
            return data
        
        # Calculate number of points per window
        points_per_window = len(data) // 100
        
        if points_per_window < 1:
            return data
        
        downsampled = []
        
        for i in range(0, len(data), points_per_window):
            window = data[i:i + points_per_window]
            if not window:
                continue
            
            # Calculate average value
            avg_value = sum(p['value'] for p in window) / len(window)
            
            # Use middle timestamp
            middle_idx = len(window) // 2
            
            downsampled.append({
                'timestamp': window[middle_idx]['timestamp'],
                'value': round(avg_value, 2),
                'stream_id': window[0].get('stream_id')
            })
        
        return downsampled
    
    def _parse_timestamp(self, timestamp: Any) -> float:
        """
        Parse timestamp to float (seconds since epoch)
        
        Args:
            timestamp: Timestamp string or datetime object
        
        Returns:
            Seconds since epoch as float
        """
        if isinstance(timestamp, (int, float)):
            return float(timestamp)
        elif isinstance(timestamp, datetime):
            return timestamp.timestamp()
        elif isinstance(timestamp, str):
            try:
                dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                return dt.timestamp()
            except:
                return 0
        else:
            return 0


class BatchDownsampler:
    """
    Downsampler for batch processing of historical data
    More sophisticated algorithms for offline processing
    """
    
    @staticmethod
    def downsample_pandas(df, target_points: int = 1000, algorithm: str = "lttb"):
        """
        Downsample pandas DataFrame
        
        Args:
            df: Pandas DataFrame with 'timestamp' and 'value' columns
            target_points: Target number of points
            algorithm: Downsampling algorithm
        
        Returns:
            Downsampled DataFrame
        """
        try:
            import pandas as pd
        except ImportError:
            logger.error("Pandas not installed")
            return df
        
        if len(df) <= target_points:
            return df
        
        if algorithm == "lttb":
            return BatchDownsampler._lttb_pandas(df, target_points)
        else:
            # Use simple sampling
            step = len(df) // target_points
            return df.iloc[::step]
    
    @staticmethod
    def _lttb_pandas(df, target_points: int):
        """
        LTTB algorithm for pandas DataFrame
        """
        if target_points >= len(df):
            return df
        
        import numpy as np
        
        timestamps = df['timestamp'].values.astype(np.int64) // 10**9  # Convert to seconds
        values = df['value'].values
        
        bucket_size = (len(df) - 2) / (target_points - 2)
        result_indices = [0]
        
        for i in range(1, target_points - 1):
            start_idx = int((i - 1) * bucket_size) + 1
            end_idx = int(i * bucket_size) + 1
            
            if start_idx >= end_idx:
                end_idx = start_idx + 1
            
            prev_idx = result_indices[-1]
            
            next_start = int(i * bucket_size) + 1
            next_end = int((i + 1) * bucket_size) + 1
            
            if next_start >= len(df):
                next_start = len(df) - 1
            if next_end > len(df):
                next_end = len(df)
            
            avg_x = np.mean(timestamps[next_start:next_end])
            avg_y = np.mean(values[next_start:next_end])
            
            max_area = -1
            max_idx = start_idx
            
            for idx in range(start_idx, min(end_idx, len(df))):
                area = abs(
                    (timestamps[prev_idx] - avg_x) * (values[idx] - values[prev_idx]) -
                    (timestamps[prev_idx] - timestamps[idx]) * (avg_y - values[prev_idx])
                ) * 0.5
                
                if area > max_area:
                    max_area = area
                    max_idx = idx
            
            result_indices.append(max_idx)
        
        result_indices.append(len(df) - 1)
        
        return df.iloc[result_indices]