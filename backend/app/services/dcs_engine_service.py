"""
DCS Engine Service – Simplified for Raw, Minute, Hour
File: app/services/dcs_engine_service.py
Description: Service for querying the DCS engine database.
Raw always returns the newest points. Minute and Hour are direct queries with LIMIT.
"""

import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

logger = logging.getLogger(__name__)


class DCSEngineService:
    """Service for querying the DCS engine database (read‑only)."""

    def __init__(self, db: AsyncSession):
        self.db = db

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
    # RAW DATA – Always returns the newest points (ignores time range)
    # ============================================================
    async def get_raw_data_aggregated(
        self,
        signal_id: int,
        start_time: datetime,
        end_time: datetime,
        max_points: int = 10000,
    ) -> List[Dict[str, Any]]:
        """Get raw data – always returns the most recent `max_points` points."""
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
            rows = rows[::-1]  # chronological order for chart
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

    # ============================================================
    # MINUTE DATA – Simple query with LIMIT (no downsampling)
    # ============================================================
    async def get_minute_data_aggregated(
        self,
        signal_id: int,
        start_time: datetime,
        end_time: datetime,
        max_points: int = 10000,
    ) -> List[Dict[str, Any]]:
        """
        Get minute data – returns the newest points within the time range,
        limited by max_points.
        """
        try:
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
                ORDER BY timestamp DESC
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
            rows = rows[::-1]  # chronological order
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
            logger.error(f"Error fetching minute data for signal {signal_id}: {e}")
            return []

    # ============================================================
    # HOUR DATA – Simple query with LIMIT (no downsampling)
    # ============================================================
    async def get_hour_data_aggregated(
        self,
        signal_id: int,
        start_time: datetime,
        end_time: datetime,
        max_points: int = 10000,
    ) -> List[Dict[str, Any]]:
        """
        Get hour data – returns the newest points within the time range,
        limited by max_points.
        """
        try:
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
                ORDER BY timestamp DESC
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
            rows = rows[::-1]
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
            logger.error(f"Error fetching hour data for signal {signal_id}: {e}")
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
        result = {}
        for signal_id in signal_ids:
            val = await self.get_latest_value(signal_id)
            if val:
                result[signal_id] = val
        return result

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