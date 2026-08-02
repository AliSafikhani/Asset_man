"""
DCS Engine Service – Optimized for Fixed Window Aggregations
File: app/services/dcs_engine_service.py
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, bindparam

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
                    id, plant_id, kks_code, name, description, unit,
                    alarm_level_1, alarm_level_2, alarm_level_3,
                    max_permissible, min_permissible, valid_from, valid_to,
                    created_at, updated_at
                FROM dcs_signal_characteristic
                WHERE plant_id = :plant_id
                AND valid_to = 'infinity'
                ORDER BY id
            """)
            result = await self.db.execute(query, {"plant_id": plant_id})
            rows = result.fetchall()

            return [
                {
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
                }
                for row in rows
            ]
        except Exception as e:
            logger.error(f"Error fetching signals for plant {plant_id}: {e}")
            return []

    async def get_signal_by_id(self, signal_id: int) -> Optional[Dict[str, Any]]:
        """Get a single signal by its ID."""
        try:
            query = text("""
                SELECT
                    id, plant_id, kks_code, name, description, unit,
                    alarm_level_1, alarm_level_2, alarm_level_3,
                    max_permissible, min_permissible, valid_from, valid_to
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
            logger.error(f"Error fetching signal by id {signal_id}: {e}")
            return None

    async def get_signals_by_ids(self, signal_ids: List[int]) -> List[Dict[str, Any]]:
        """Get multiple signals safely without SQL injection."""
        if not signal_ids:
            return []
        try:
            query = text("""
                SELECT
                    id, plant_id, kks_code, name, description, unit,
                    alarm_level_1, alarm_level_2, alarm_level_3,
                    max_permissible, min_permissible, valid_from, valid_to
                FROM dcs_signal_characteristic
                WHERE id IN :signal_ids
                AND valid_to = 'infinity'
                ORDER BY id
            """).bindparams(bindparam("signal_ids", expanding=True))

            result = await self.db.execute(query, {"signal_ids": signal_ids})
            rows = result.fetchall()
            return [
                {
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
                for row in rows
            ]
        except Exception as e:
            logger.error(f"Error fetching signals by IDs: {e}")
            return []

    # ============================================================
    # RAW DATA (Retention enforced: Max 30 days lookback)
    # ============================================================
    async def get_raw_data_aggregated(
        self,
        signal_id: int,
        start_time: datetime,
        end_time: datetime,
        max_points: int = 150000,
    ) -> List[Dict[str, Any]]:
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
            rows = rows[::-1]  # Chronological order

            return [
                {
                    "timestamp": row[0].isoformat() if row[0] else None,
                    "avg_value": float(row[1]) if row[1] is not None else None,
                    "min_value": float(row[2]) if row[2] is not None else None,
                    "max_value": float(row[3]) if row[3] is not None else None,
                    "quality": row[4] if row[4] is not None else True,
                }
                for row in rows
            ]
        except Exception as e:
            logger.error(f"Error fetching raw data for signal {signal_id}: {e}")
            return []

    # ============================================================
    # MINUTE DATA (Retention enforced: Max 1 year lookback)
    # ============================================================
    async def get_minute_data_aggregated(
        self,
        signal_id: int,
        start_time: datetime,
        end_time: datetime,
        max_points: int = 15000,
    ) -> List[Dict[str, Any]]:
        try:
            query = text("""
                SELECT timestamp, avg_value, min_value, max_value, rms_avg
                FROM (
                    SELECT timestamp, avg_value, min_value, max_value, rms_avg
                    FROM dcs_signal_min
                    WHERE signal_id = :signal_id
                    AND timestamp BETWEEN :start_time AND :end_time
                    ORDER BY timestamp DESC
                    LIMIT :max_points
                ) sub
                ORDER BY timestamp ASC
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
            return [
                {
                    "timestamp": row[0].isoformat() if row[0] else None,
                    "avg_value": float(row[1]) if row[1] is not None else None,
                    "min_value": float(row[2]) if row[2] is not None else None,
                    "max_value": float(row[3]) if row[3] is not None else None,
                    "rms_avg": float(row[4]) if row[4] is not None else None,
                }
                for row in rows
            ]
        except Exception as e:
            logger.error(f"Error fetching minute data for signal {signal_id}: {e}")
            return []

    # ============================================================
    # HOUR DATA (Retention: Up to 30 years)
    # ============================================================
    async def get_hour_data_aggregated(
        self,
        signal_id: int,
        start_time: datetime,
        end_time: datetime,
        max_points: int = 15000,
    ) -> List[Dict[str, Any]]:
        try:
            query = text("""
                SELECT timestamp, avg_value, min_value, max_value, rms_avg
                FROM (
                    SELECT timestamp, avg_value, min_value, max_value, rms_avg
                    FROM dcs_signal_hour
                    WHERE signal_id = :signal_id
                    AND timestamp BETWEEN :start_time AND :end_time
                    ORDER BY timestamp DESC
                    LIMIT :max_points
                ) sub
                ORDER BY timestamp ASC
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
            return [
                {
                    "timestamp": row[0].isoformat() if row[0] else None,
                    "avg_value": float(row[1]) if row[1] is not None else None,
                    "min_value": float(row[2]) if row[2] is not None else None,
                    "max_value": float(row[3]) if row[3] is not None else None,
                    "rms_avg": float(row[4]) if row[4] is not None else None,
                }
                for row in rows
            ]
        except Exception as e:
            logger.error(f"Error fetching hour data for signal {signal_id}: {e}")
            return []

    # ============================================================
    # LATEST VALUES (Optimized single-query batch execution)
    # ============================================================
    async def get_latest_values(self, signal_ids: List[int]) -> Dict[int, Dict[str, Any]]:
        """Get latest values for multiple signals in a single optimized query."""
        if not signal_ids:
            return {}
        try:
            query = text("""
                SELECT DISTINCT ON (signal_id)
                    signal_id, timestamp, value, quality, rms, rate_of_change
                FROM dcs_signal_raw
                WHERE signal_id IN :signal_ids
                ORDER BY signal_id, timestamp DESC
            """).bindparams(bindparam("signal_ids", expanding=True))

            result = await self.db.execute(query, {"signal_ids": signal_ids})
            rows = result.fetchall()

            res = {}
            for row in rows:
                res[row[0]] = {
                    "timestamp": row[1].isoformat() if row[1] else None,
                    "value": float(row[2]) if row[2] is not None else None,
                    "quality": row[3] if row[3] is not None else True,
                    "rms": float(row[4]) if row[4] is not None else None,
                    "rate_of_change": float(row[5]) if row[5] is not None else None,
                }
            return res
        except Exception as e:
            logger.error(f"Error fetching batch latest values: {e}")
            return {}