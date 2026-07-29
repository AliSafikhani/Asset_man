"""
DCS Engine Service
File: app/services/dcs_engine_service.py
Description: Service for querying the DCS engine database (read‑only)
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, and_, between, func

logger = logging.getLogger(__name__)


class DCSEngineService:
    """
    Service for querying the DCS engine database.
    All methods are read‑only.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    # ============================================================
    # SIGNAL METADATA
    # ============================================================

    async def get_signals_by_plant(self, plant_id: int) -> List[Dict[str, Any]]:
        """
        Get all signals for a specific plant from dcs_signal_characteristic.

        Args:
            plant_id: The plant ID (matches plant_id in DCS engine)

        Returns:
            List of signal dictionaries with metadata
        """
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
        """
        Get a single signal by ID.

        Args:
            signal_id: The DCS signal ID

        Returns:
            Signal dictionary or None if not found
        """
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
        """
        Get multiple signals by their IDs.

        Args:
            signal_ids: List of DCS signal IDs

        Returns:
            List of signal dictionaries
        """
        if not signal_ids:
            return []

        try:
            # Convert list to string for SQL IN clause
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
    # TIME-SERIES DATA
    # ============================================================

    async def get_raw_data(
        self,
        signal_id: int,
        start_time: datetime,
        end_time: datetime,
        max_points: int = 10000
    ) -> List[Dict[str, Any]]:
        """
        Get raw 1Hz data from dcs_signal_raw.

        Args:
            signal_id: The DCS signal ID
            start_time: Start of time range
            end_time: End of time range
            max_points: Maximum number of points to return

        Returns:
            List of data points with timestamp and value
        """
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
                    "max_points": max_points
                }
            )
            rows = result.fetchall()

            data = []
            for row in rows:
                data.append({
                    "timestamp": row[0].isoformat() if row[0] else None,
                    "value": float(row[1]) if row[1] is not None else None,
                    "quality": row[2] if row[2] is not None else True,
                    "rms": float(row[3]) if row[3] is not None else None,
                    "rate_of_change": float(row[4]) if row[4] is not None else None,
                })

            return data

        except Exception as e:
            logger.error(f"Error fetching raw data for signal {signal_id}: {e}")
            return []

    async def get_minute_data(
        self,
        signal_id: int,
        start_time: datetime,
        end_time: datetime,
        max_points: int = 10000
    ) -> List[Dict[str, Any]]:
        """
        Get 1-minute aggregated data from dcs_signal_min.

        Args:
            signal_id: The DCS signal ID
            start_time: Start of time range
            end_time: End of time range
            max_points: Maximum number of points to return

        Returns:
            List of data points with timestamp, avg, min, max, count
        """
        try:
            query = text("""
                SELECT
                    timestamp,
                    avg_value,
                    min_value,
                    max_value,
                    count,
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
                    "max_points": max_points
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
                    "count": row[4] if row[4] is not None else 0,
                    "rms_avg": float(row[5]) if row[5] is not None else None,
                })

            return data

        except Exception as e:
            logger.error(f"Error fetching minute data for signal {signal_id}: {e}")
            return []

    async def get_hour_data(
        self,
        signal_id: int,
        start_time: datetime,
        end_time: datetime,
        max_points: int = 10000
    ) -> List[Dict[str, Any]]:
        """
        Get 1-hour aggregated data from dcs_signal_hour.

        Args:
            signal_id: The DCS signal ID
            start_time: Start of time range
            end_time: End of time range
            max_points: Maximum number of points to return

        Returns:
            List of data points with timestamp, avg, min, max, count
        """
        try:
            query = text("""
                SELECT
                    timestamp,
                    avg_value,
                    min_value,
                    max_value,
                    count,
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
                    "max_points": max_points
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
                    "count": row[4] if row[4] is not None else 0,
                    "rms_avg": float(row[5]) if row[5] is not None else None,
                })

            return data

        except Exception as e:
            logger.error(f"Error fetching hour data for signal {signal_id}: {e}")
            return []

    # ============================================================
    # DATA AVAILABILITY TIMELINE
    # ============================================================

    async def get_raw_timeline(
        self,
        signal_id: int,
        start_time: datetime,
        end_time: datetime,
        interval_minutes: int = 60
    ) -> List[Dict[str, Any]]:
        """
        Get data availability timeline for raw data.

        Args:
            signal_id: The DCS signal ID
            start_time: Start of time range
            end_time: End of time range
            interval_minutes: Interval size in minutes

        Returns:
            List of intervals with data count and quality info
        """
        try:
            query = text("""
                SELECT
                    time_bucket,
                    COUNT(*) as data_count,
                    AVG(CASE WHEN quality THEN 1 ELSE 0 END) as quality_ratio,
                    MIN(value) as min_value,
                    MAX(value) as max_value,
                    AVG(value) as avg_value
                FROM (
                    SELECT
                        date_trunc('minute', timestamp) -
                        (EXTRACT(MINUTE FROM timestamp)::int % :interval_minutes) * INTERVAL '1 minute'
                        AS time_bucket,
                        value,
                        quality
                    FROM dcs_signal_raw
                    WHERE signal_id = :signal_id
                    AND timestamp BETWEEN :start_time AND :end_time
                ) AS bucketed
                GROUP BY time_bucket
                ORDER BY time_bucket
            """)

            result = await self.db.execute(
                query,
                {
                    "signal_id": signal_id,
                    "start_time": start_time,
                    "end_time": end_time,
                    "interval_minutes": interval_minutes
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

    async def get_minute_timeline(
        self,
        signal_id: int,
        start_time: datetime,
        end_time: datetime,
        interval_days: int = 1
    ) -> List[Dict[str, Any]]:
        """
        Get data availability timeline for minute data.

        Args:
            signal_id: The DCS signal ID
            start_time: Start of time range
            end_time: End of time range
            interval_days: Interval size in days

        Returns:
            List of intervals with data count
        """
        try:
            query = text("""
                SELECT
                    date_trunc('day', timestamp) as day_bucket,
                    COUNT(*) as data_count,
                    AVG(avg_value) as avg_value,
                    MIN(min_value) as min_value,
                    MAX(max_value) as max_value
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
                    "end_time": end_time
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

    async def get_hour_timeline(
        self,
        signal_id: int,
        start_time: datetime,
        end_time: datetime,
        interval_days: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Get data availability timeline for hour data.

        Args:
            signal_id: The DCS signal ID
            start_time: Start of time range
            end_time: End of time range
            interval_days: Interval size in days

        Returns:
            List of intervals with data count
        """
        try:
            query = text("""
                SELECT
                    date_trunc('month', timestamp) as month_bucket,
                    COUNT(*) as data_count,
                    AVG(avg_value) as avg_value,
                    MIN(min_value) as min_value,
                    MAX(max_value) as max_value
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
                    "end_time": end_time
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
    # LATEST VALUE
    # ============================================================

    async def get_latest_value(self, signal_id: int) -> Optional[Dict[str, Any]]:
        """
        Get the latest value for a signal.

        Args:
            signal_id: The DCS signal ID

        Returns:
            Latest data point or None
        """
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
        """
        Get the latest values for multiple signals.

        Args:
            signal_ids: List of DCS signal IDs

        Returns:
            Dictionary mapping signal_id to latest data point
        """
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
    # DATA RANGE INFO
    # ============================================================

    async def get_data_range(self, signal_id: int) -> Dict[str, Any]:
        """
        Get the min and max timestamps for a signal.

        Args:
            signal_id: The DCS signal ID

        Returns:
            Dict with min_timestamp and max_timestamp
        """
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

    # ============================================================
    # AGGREGATION HELPERS
    # ============================================================

    async def get_raw_aggregation(
        self,
        signal_id: int,
        start_time: datetime,
        end_time: datetime,
        interval_seconds: int = 60
    ) -> List[Dict[str, Any]]:
        """
        Get aggregated raw data for a signal.

        Args:
            signal_id: The DCS signal ID
            start_time: Start of time range
            end_time: End of time range
            interval_seconds: Interval size in seconds

        Returns:
            List of aggregated data points
        """
        try:
            query = text("""
                SELECT
                    time_bucket,
                    COUNT(*) as count,
                    AVG(value) as avg_value,
                    MIN(value) as min_value,
                    MAX(value) as max_value,
                    AVG(CASE WHEN quality THEN 1 ELSE 0 END) as quality_ratio
                FROM (
                    SELECT
                        date_trunc('second', timestamp) -
                        (EXTRACT(SECOND FROM timestamp)::int % :interval_seconds) * INTERVAL '1 second'
                        AS time_bucket,
                        value,
                        quality
                    FROM dcs_signal_raw
                    WHERE signal_id = :signal_id
                    AND timestamp BETWEEN :start_time AND :end_time
                ) AS bucketed
                GROUP BY time_bucket
                ORDER BY time_bucket
            """)

            result = await self.db.execute(
                query,
                {
                    "signal_id": signal_id,
                    "start_time": start_time,
                    "end_time": end_time,
                    "interval_seconds": interval_seconds
                }
            )
            rows = result.fetchall()

            data = []
            for row in rows:
                data.append({
                    "timestamp": row[0].isoformat() if row[0] else None,
                    "count": row[1] if row[1] is not None else 0,
                    "avg_value": float(row[2]) if row[2] is not None else None,
                    "min_value": float(row[3]) if row[3] is not None else None,
                    "max_value": float(row[4]) if row[4] is not None else None,
                    "quality_ratio": float(row[5]) if row[5] is not None else 0,
                })

            return data

        except Exception as e:
            logger.error(f"Error fetching raw aggregation for signal {signal_id}: {e}")
            return []