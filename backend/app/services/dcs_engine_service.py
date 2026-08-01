"""
DCS Engine Service – Updated with Smart Downsampling & Aggregated Timeline
File: app/services/dcs_engine_service.py
Description: Service for querying the DCS engine database with auto‑downsampling
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from decimal import Decimal
import math

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

logger = logging.getLogger(__name__)


class DCSEngineService:
    """
    Service for querying the DCS engine database.
    All methods are read‑only.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    # ============================================================
    # HELPER: Compute optimal bucket size (seconds)
    # ============================================================

    def _compute_bucket_seconds(
        self,
        start_time: datetime,
        end_time: datetime,
        max_points: int = 10000,
        min_interval_seconds: int = 1,
    ) -> int:
        """
        Compute the optimal bucket size (in seconds) to keep the total
        number of points under `max_points`.

        Args:
            start_time: Start of time range
            end_time: End of time range
            max_points: Maximum number of points to return
            min_interval_seconds: Minimum bucket size (1 second for raw)

        Returns:
            Bucket size in seconds
        """
        if not start_time or not end_time:
            return min_interval_seconds

        total_seconds = (end_time - start_time).total_seconds()
        if total_seconds <= 0:
            return min_interval_seconds

        # Calculate required bucket size
        bucket_seconds = math.ceil(total_seconds / max_points)

        # Ensure minimum
        if bucket_seconds < min_interval_seconds:
            bucket_seconds = min_interval_seconds

        # Round to clean values for better SQL performance
        if bucket_seconds <= 60:
            # Use seconds: 1, 2, 5, 10, 15, 30, 60
            clean_values = [1, 2, 5, 10, 15, 30, 60]
            for v in clean_values:
                if bucket_seconds <= v:
                    return v
            return 60
        elif bucket_seconds <= 3600:
            # Use minutes: 1, 2, 5, 10, 15, 30, 60
            minutes = math.ceil(bucket_seconds / 60)
            clean_minutes = [1, 2, 5, 10, 15, 30, 60]
            for v in clean_minutes:
                if minutes <= v:
                    return v * 60
            return 3600
        elif bucket_seconds <= 86400:
            # Use hours: 1, 2, 3, 6, 12, 24
            hours = math.ceil(bucket_seconds / 3600)
            clean_hours = [1, 2, 3, 6, 12, 24]
            for v in clean_hours:
                if hours <= v:
                    return v * 3600
            return 86400
        else:
            # Use days: 1, 2, 3, 7, 14, 30
            days = math.ceil(bucket_seconds / 86400)
            clean_days = [1, 2, 3, 7, 14, 30]
            for v in clean_days:
                if days <= v:
                    return v * 86400
            return 30 * 86400

    # ============================================================
    # SIGNAL METADATA
    # ============================================================

    async def get_signals_by_plant(self, plant_id: int) -> List[Dict[str, Any]]:
        """Get all signals for a specific plant."""
        try:
            query = text("""
                SELECT
                    id,
                    plant_id,
                    kks_code,
                    name,
                    description,
                    unit,
                    alarm_level_1,
                    alarm_level_2,
                    alarm_level_3,
                    max_permissible,
                    min_permissible,
                    valid_from,
                    valid_to,
                    created_at,
                    updated_at
                FROM dcs_signal_characteristic
                WHERE plant_id = :plant_id
                AND valid_to = 'infinity'
                ORDER BY id
            """)

            result = await self.db.execute(query, {"plant_id": plant_id})
            rows = result.fetchall()

            signals = []
            for row in rows:
                signals.append({
                    "id": row[0],
                    "plant_id": row[1],
                    "kks_code": row[2],
                    "name": row[3],
                    "description": row[4],
                    "unit": row[5],
                    "alarm_level_1": float(row[6]) if row[6] is not None else None,
                    "alarm_level_2": float(row[7]) if row[7] is not None else None,
                    "alarm_level_3": float(row[8]) if row[8] is not None else None,
                    "max_permissible": float(row[9]) if row[9] is not None else None,
                    "min_permissible": float(row[10]) if row[10] is not None else None,
                    "valid_from": row[11].isoformat() if row[11] else None,
                    "valid_to": row[12].isoformat() if row[12] else None,
                    "created_at": row[13].isoformat() if row[13] else None,
                    "updated_at": row[14].isoformat() if row[14] else None,
                })

            return signals

        except Exception as e:
            logger.error(f"Error fetching signals for plant {plant_id}: {e}")
            return []

    async def get_signal_by_id(self, signal_id: int) -> Optional[Dict[str, Any]]:
        """Get a single signal by ID."""
        try:
            query = text("""
                SELECT
                    id,
                    plant_id,
                    kks_code,
                    name,
                    description,
                    unit,
                    alarm_level_1,
                    alarm_level_2,
                    alarm_level_3,
                    max_permissible,
                    min_permissible,
                    valid_from,
                    valid_to
                FROM dcs_signal_characteristic
                WHERE id = :signal_id
                AND valid_to = 'infinity'
            """)

            result = await self.db.execute(query, {"signal_id": signal_id})
            row = result.fetchone()

            if not row:
                return None

            return {
                "id": row[0],
                "plant_id": row[1],
                "kks_code": row[2],
                "name": row[3],
                "description": row[4],
                "unit": row[5],
                "alarm_level_1": float(row[6]) if row[6] is not None else None,
                "alarm_level_2": float(row[7]) if row[7] is not None else None,
                "alarm_level_3": float(row[8]) if row[8] is not None else None,
                "max_permissible": float(row[9]) if row[9] is not None else None,
                "min_permissible": float(row[10]) if row[10] is not None else None,
                "valid_from": row[11].isoformat() if row[11] else None,
                "valid_to": row[12].isoformat() if row[12] else None,
            }

        except Exception as e:
            logger.error(f"Error fetching signal {signal_id}: {e}")
            return None

    async def get_signals_by_ids(self, signal_ids: List[int]) -> List[Dict[str, Any]]:
        """Get multiple signals by their IDs."""
        if not signal_ids:
            return []

        try:
            ids_str = ','.join(str(id) for id in signal_ids)
            query = text(f"""
                SELECT
                    id,
                    plant_id,
                    kks_code,
                    name,
                    description,
                    unit,
                    alarm_level_1,
                    alarm_level_2,
                    alarm_level_3,
                    max_permissible,
                    min_permissible,
                    valid_from,
                    valid_to
                FROM dcs_signal_characteristic
                WHERE id IN ({ids_str})
                AND valid_to = 'infinity'
                ORDER BY id
            """)

            result = await self.db.execute(query)
            rows = result.fetchall()

            signals = []
            for row in rows:
                signals.append({
                    "id": row[0],
                    "plant_id": row[1],
                    "kks_code": row[2],
                    "name": row[3],
                    "description": row[4],
                    "unit": row[5],
                    "alarm_level_1": float(row[6]) if row[6] is not None else None,
                    "alarm_level_2": float(row[7]) if row[7] is not None else None,
                    "alarm_level_3": float(row[8]) if row[8] is not None else None,
                    "max_permissible": float(row[9]) if row[9] is not None else None,
                    "min_permissible": float(row[10]) if row[10] is not None else None,
                    "valid_from": row[11].isoformat() if row[11] else None,
                    "valid_to": row[12].isoformat() if row[12] else None,
                })

            return signals

        except Exception as e:
            logger.error(f"Error fetching signals by IDs: {e}")
            return []

    # ============================================================
    # AGGREGATED DATA FETCHING (with dynamic downsampling)
    # ============================================================

    async def get_raw_data_aggregated(
        self,
        signal_id: int,
        start_time: datetime,
        end_time: datetime,
        max_points: int = 10000,
    ) -> List[Dict[str, Any]]:
        print("🔴 get_raw_data_aggregated called!")  # <-- ADD THIS
        try:
            query = text("""
                SELECT
                    timestamp,
                    value,
                    value as min_value,
                    value as max_value,
                    quality
                FROM dcs_signal_raw
                WHERE signal_id = :signal_id
                ORDER BY timestamp DESC
                LIMIT :max_points
            """)
            result = await self.db.execute(query, {"signal_id": signal_id, "max_points": max_points})
            rows = result.fetchall()
            rows = rows[::-1]
            data = []
            for row in rows:
                data.append({
                    "timestamp": row[0].isoformat() if row[0] else None,
                    "avg_value": float(row[1]) if row[1] is not None else None,
                    "min_value": float(row[2]) if row[2] is not None else None,
                    "max_value": float(row[3]) if row[3] is not None else None,
                    "quality": row[4] if row[4] is not None else True,
                })
            return data
        except Exception as e:
            logger.error(f"Error fetching raw data for signal {signal_id}: {e}")
            return []
    async def get_minute_data_aggregated(
        self,
        signal_id: int,
        start_time: datetime,
        end_time: datetime,
        max_points: int = 10000,
    ) -> List[Dict[str, Any]]:
        """
        Get minute data with automatic downsampling if needed.

        Args:
            signal_id: The DCS signal ID
            start_time: Start of time range
            end_time: End of time range
            max_points: Maximum number of points to return

        Returns:
            List of data points (timestamp, avg_value, min_value, max_value)
        """
        try:
            # Compute optimal bucket size (minimum 60 seconds)
            bucket_seconds = self._compute_bucket_seconds(
                start_time,
                end_time,
                max_points,
                min_interval_seconds=60,
            )

            # If bucket is 60 seconds, return minute data directly
            if bucket_seconds == 60:
                query = text("""
                    SELECT
                        timestamp,
                        avg_value,
                        min_value,
                        max_value,
                        rms_avg
                    FROM dcs_signal_min
                    WHERE signal_id = :signal_id
                    AND timestamp BETWEEN :start_time AND :end_time
                    ORDER BY timestamp
                    LIMIT :max_points
                """)

                result = await self.db.execute(
                    query,
                    {
                        "signal_id": signal_id,
                        "start_time": start_time,
                        "end_time": end_time,
                        "max_points": max_points,
                    }
                )
                rows = result.fetchall()

                data = []
                for row in rows:
                    data.append({
                        "timestamp": row[0].isoformat() if row[0] else None,
                        "avg_value": float(row[1]) if row[1] is not None else None,
                        "min_value": float(row[2]) if row[2] is not None else None,
                        "max_value": float(row[3]) if row[3] is not None else None,
                        "rms_avg": float(row[4]) if row[4] is not None else None,
                    })

                return data

            # Otherwise, aggregate by time bucket
            interval_str = f"{bucket_seconds} seconds"
            query = text(f"""
                SELECT
                    time_bucket('{interval_str}', timestamp) AS bucket,
                    AVG(avg_value) AS avg_value,
                    MIN(min_value) AS min_value,
                    MAX(max_value) AS max_value,
                    AVG(rms_avg) AS rms_avg
                FROM dcs_signal_min
                WHERE signal_id = :signal_id
                AND timestamp BETWEEN :start_time AND :end_time
                GROUP BY bucket
                ORDER BY bucket
            """)

            result = await self.db.execute(
                query,
                {
                    "signal_id": signal_id,
                    "start_time": start_time,
                    "end_time": end_time,
                }
            )
            rows = result.fetchall()

            data = []
            for row in rows:
                data.append({
                    "timestamp": row[0].isoformat() if row[0] else None,
                    "avg_value": float(row[1]) if row[1] is not None else None,
                    "min_value": float(row[2]) if row[2] is not None else None,
                    "max_value": float(row[3]) if row[3] is not None else None,
                    "rms_avg": float(row[4]) if row[4] is not None else None,
                })

            return data

        except Exception as e:
            logger.error(f"Error fetching aggregated minute data for signal {signal_id}: {e}")
            return []

    async def get_hour_data_aggregated(
        self,
        signal_id: int,
        start_time: datetime,
        end_time: datetime,
        max_points: int = 10000,
    ) -> List[Dict[str, Any]]:
        """
        Get hour data with automatic downsampling if needed.

        Args:
            signal_id: The DCS signal ID
            start_time: Start of time range
            end_time: End of time range
            max_points: Maximum number of points to return

        Returns:
            List of data points (timestamp, avg_value, min_value, max_value)
        """
        try:
            # Compute optimal bucket size (minimum 3600 seconds = 1 hour)
            bucket_seconds = self._compute_bucket_seconds(
                start_time,
                end_time,
                max_points,
                min_interval_seconds=3600,
            )

            # If bucket is 3600 seconds, return hour data directly
            if bucket_seconds == 3600:
                query = text("""
                    SELECT
                        timestamp,
                        avg_value,
                        min_value,
                        max_value,
                        rms_avg
                    FROM dcs_signal_hour
                    WHERE signal_id = :signal_id
                    AND timestamp BETWEEN :start_time AND :end_time
                    ORDER BY timestamp
                    LIMIT :max_points
                """)

                result = await self.db.execute(
                    query,
                    {
                        "signal_id": signal_id,
                        "start_time": start_time,
                        "end_time": end_time,
                        "max_points": max_points,
                    }
                )
                rows = result.fetchall()

                data = []
                for row in rows:
                    data.append({
                        "timestamp": row[0].isoformat() if row[0] else None,
                        "avg_value": float(row[1]) if row[1] is not None else None,
                        "min_value": float(row[2]) if row[2] is not None else None,
                        "max_value": float(row[3]) if row[3] is not None else None,
                        "rms_avg": float(row[4]) if row[4] is not None else None,
                    })

                return data

            # Otherwise, aggregate by time bucket
            interval_str = f"{bucket_seconds} seconds"
            query = text(f"""
                SELECT
                    time_bucket('{interval_str}', timestamp) AS bucket,
                    AVG(avg_value) AS avg_value,
                    MIN(min_value) AS min_value,
                    MAX(max_value) AS max_value,
                    AVG(rms_avg) AS rms_avg
                FROM dcs_signal_hour
                WHERE signal_id = :signal_id
                AND timestamp BETWEEN :start_time AND :end_time
                GROUP BY bucket
                ORDER BY bucket
            """)

            result = await self.db.execute(
                query,
                {
                    "signal_id": signal_id,
                    "start_time": start_time,
                    "end_time": end_time,
                }
            )
            rows = result.fetchall()

            data = []
            for row in rows:
                data.append({
                    "timestamp": row[0].isoformat() if row[0] else None,
                    "avg_value": float(row[1]) if row[1] is not None else None,
                    "min_value": float(row[2]) if row[2] is not None else None,
                    "max_value": float(row[3]) if row[3] is not None else None,
                    "rms_avg": float(row[4]) if row[4] is not None else None,
                })

            return data

        except Exception as e:
            logger.error(f"Error fetching aggregated hour data for signal {signal_id}: {e}")
            return []

    # ============================================================
    # LATEST VALUE
    # ============================================================

    async def get_latest_value(self, signal_id: int) -> Optional[Dict[str, Any]]:
        """Get the latest value for a signal."""
        try:
            query = text("""
                SELECT
                    timestamp,
                    value,
                    quality,
                    rms,
                    rate_of_change
                FROM dcs_signal_raw
                WHERE signal_id = :signal_id
                ORDER BY timestamp DESC
                LIMIT 1
            """)

            result = await self.db.execute(query, {"signal_id": signal_id})
            row = result.fetchone()

            if not row:
                return None

            return {
                "timestamp": row[0].isoformat() if row[0] else None,
                "value": float(row[1]) if row[1] is not None else None,
                "quality": row[2] if row[2] is not None else True,
                "rms": float(row[3]) if row[3] is not None else None,
                "rate_of_change": float(row[4]) if row[4] is not None else None,
            }

        except Exception as e:
            logger.error(f"Error fetching latest value for signal {signal_id}: {e}")
            return None

    async def get_latest_values(self, signal_ids: List[int]) -> Dict[int, Dict[str, Any]]:
        """Get the latest values for multiple signals."""
        if not signal_ids:
            return {}

        try:
            result = {}
            for signal_id in signal_ids:
                latest = await self.get_latest_value(signal_id)
                if latest:
                    result[signal_id] = latest
            return result

        except Exception as e:
            logger.error(f"Error fetching latest values: {e}")
            return {}

    # ============================================================
    # DATA AVAILABILITY TIMELINE (Aggregated)
    # ============================================================

    async def get_raw_timeline_aggregated(
        self,
        signal_id: int,
        start_time: datetime,
        end_time: datetime,
        granularity_seconds: int = 3600,
    ) -> List[Dict[str, Any]]:
        """
        Get aggregated data availability timeline for raw data.

        Args:
            signal_id: The DCS signal ID
            start_time: Start of time range
            end_time: End of time range
            granularity_seconds: Interval size in seconds (default: 1 hour)

        Returns:
            List of intervals with data count
        """
        try:
            interval_str = f"{granularity_seconds} seconds"
            query = text(f"""
                SELECT
                    time_bucket('{interval_str}', timestamp) AS bucket,
                    COUNT(*) AS data_count,
                    AVG(CASE WHEN quality THEN 1 ELSE 0 END) AS quality_ratio,
                    MIN(value) AS min_value,
                    MAX(value) AS max_value,
                    AVG(value) AS avg_value
                FROM dcs_signal_raw
                WHERE signal_id = :signal_id
                AND timestamp BETWEEN :start_time AND :end_time
                GROUP BY bucket
                ORDER BY bucket
            """)

            result = await self.db.execute(
                query,
                {
                    "signal_id": signal_id,
                    "start_time": start_time,
                    "end_time": end_time,
                }
            )
            rows = result.fetchall()

            timeline = []
            for row in rows:
                timeline.append({
                    "timestamp": row[0].isoformat() if row[0] else None,
                    "data_count": row[1] if row[1] is not None else 0,
                    "quality_ratio": float(row[2]) if row[2] is not None else 0,
                    "min_value": float(row[3]) if row[3] is not None else None,
                    "max_value": float(row[4]) if row[4] is not None else None,
                    "avg_value": float(row[5]) if row[5] is not None else None,
                })

            return timeline

        except Exception as e:
            logger.error(f"Error fetching raw timeline for signal {signal_id}: {e}")
            return []

    async def get_minute_timeline_aggregated(
        self,
        signal_id: int,
        start_time: datetime,
        end_time: datetime,
        granularity_days: int = 1,
    ) -> List[Dict[str, Any]]:
        """
        Get aggregated data availability timeline for minute data.

        Args:
            signal_id: The DCS signal ID
            start_time: Start of time range
            end_time: End of time range
            granularity_days: Interval size in days (default: 1 day)

        Returns:
            List of intervals with data count
        """
        try:
            query = text("""
                SELECT
                    date_trunc('day', timestamp) AS day_bucket,
                    COUNT(*) AS data_count,
                    AVG(avg_value) AS avg_value,
                    MIN(min_value) AS min_value,
                    MAX(max_value) AS max_value
                FROM dcs_signal_min
                WHERE signal_id = :signal_id
                AND timestamp BETWEEN :start_time AND :end_time
                GROUP BY day_bucket
                ORDER BY day_bucket
            """)

            result = await self.db.execute(
                query,
                {
                    "signal_id": signal_id,
                    "start_time": start_time,
                    "end_time": end_time,
                }
            )
            rows = result.fetchall()

            timeline = []
            for row in rows:
                timeline.append({
                    "timestamp": row[0].isoformat() if row[0] else None,
                    "data_count": row[1] if row[1] is not None else 0,
                    "avg_value": float(row[2]) if row[2] is not None else None,
                    "min_value": float(row[3]) if row[3] is not None else None,
                    "max_value": float(row[4]) if row[4] is not None else None,
                })

            return timeline

        except Exception as e:
            logger.error(f"Error fetching minute timeline for signal {signal_id}: {e}")
            return []

    async def get_hour_timeline_aggregated(
        self,
        signal_id: int,
        start_time: datetime,
        end_time: datetime,
        granularity_months: int = 1,
    ) -> List[Dict[str, Any]]:
        """
        Get aggregated data availability timeline for hour data.

        Args:
            signal_id: The DCS signal ID
            start_time: Start of time range
            end_time: End of time range
            granularity_months: Interval size in months (default: 1 month)

        Returns:
            List of intervals with data count
        """
        try:
            query = text("""
                SELECT
                    date_trunc('month', timestamp) AS month_bucket,
                    COUNT(*) AS data_count,
                    AVG(avg_value) AS avg_value,
                    MIN(min_value) AS min_value,
                    MAX(max_value) AS max_value
                FROM dcs_signal_hour
                WHERE signal_id = :signal_id
                AND timestamp BETWEEN :start_time AND :end_time
                GROUP BY month_bucket
                ORDER BY month_bucket
            """)

            result = await self.db.execute(
                query,
                {
                    "signal_id": signal_id,
                    "start_time": start_time,
                    "end_time": end_time,
                }
            )
            rows = result.fetchall()

            timeline = []
            for row in rows:
                timeline.append({
                    "timestamp": row[0].isoformat() if row[0] else None,
                    "data_count": row[1] if row[1] is not None else 0,
                    "avg_value": float(row[2]) if row[2] is not None else None,
                    "min_value": float(row[3]) if row[3] is not None else None,
                    "max_value": float(row[4]) if row[4] is not None else None,
                })

            return timeline

        except Exception as e:
            logger.error(f"Error fetching hour timeline for signal {signal_id}: {e}")
            return []

    # ============================================================
    # DATA RANGE INFO
    # ============================================================

    async def get_data_range(self, signal_id: int) -> Dict[str, Any]:
        """Get the min and max timestamps for a signal."""
        try:
            query = text("""
                SELECT
                    MIN(timestamp) as min_timestamp,
                    MAX(timestamp) as max_timestamp
                FROM dcs_signal_raw
                WHERE signal_id = :signal_id
            """)

            result = await self.db.execute(query, {"signal_id": signal_id})
            row = result.fetchone()

            if not row or row[0] is None:
                return {"min_timestamp": None, "max_timestamp": None}

            return {
                "min_timestamp": row[0].isoformat() if row[0] else None,
                "max_timestamp": row[1].isoformat() if row[1] else None,
            }

        except Exception as e:
            logger.error(f"Error fetching data range for signal {signal_id}: {e}")
            return {"min_timestamp": None, "max_timestamp": None}