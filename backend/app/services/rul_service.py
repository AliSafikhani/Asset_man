"""
RUL (Remaining Useful Life) Service Layer
Thermal life estimation per IEC 60076-7.

Fetches transformer nameplate params from the webapp DB, the per-asset DCS
signal mapping from rul_signal_config, and the 3 hourly time series from the
read-only DCS engine DB, then runs the TransformerLifeEstimator algorithm.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from algorithms.transformer.rul import TransformerLifeEstimator

from app.models.assets import Assets
from app.models.transformers import Transformers
from app.models.rul_config import RULSignalConfig
from app.services.dcs_engine_service import DCSEngineService

logger = logging.getLogger(__name__)

# A far-past default when commissioning date is unknown, so we still pull all
# available hourly history from the DCS DB.
_DEFAULT_START = datetime(1990, 1, 1)
# High cap so a full multi-year hourly history is returned (30y ~ 263k rows).
_MAX_HOUR_POINTS = 300000


class RULService:
    """Service for the IEC 60076-7 thermal life (RUL) assessment."""

    DESIGN_LIFE_YEARS = 30.0

    # ========================================================================
    # Transformer nameplate parameters (webapp DB)
    # ========================================================================
    @staticmethod
    def _map_insulation_type(transformer: Transformers) -> str:
        """Map nameplate paper/insulation strings to the algorithm's enum."""
        raw = (transformer.insulation_type or transformer.paper_type or "").strip().lower()
        if not raw:
            return "STANDARD"
        if "ester" in raw or "natural" in raw:
            return "ESTER_NATURAL"
        if "tup" in raw or "thermally" in raw or "upgraded" in raw:
            return "TUP"
        return "STANDARD"

    async def get_transformer_params(
        self, db: AsyncSession, asset_id: int
    ) -> Optional[Dict[str, Any]]:
        """Build TransformerLifeEstimator kwargs from Assets + Transformers."""
        asset = (
            await db.execute(select(Assets).where(Assets.id == asset_id))
        ).scalar_one_or_none()
        if not asset:
            logger.error(f"[RUL] Asset {asset_id} not found")
            return None

        transformer = (
            await db.execute(select(Transformers).where(Transformers.asset_id == asset_id))
        ).scalar_one_or_none()
        if not transformer:
            logger.error(f"[RUL] Transformer record for asset {asset_id} not found")
            return None

        # Installation date = commissioning date (fallback to installation_date field)
        install_dt = asset.commissioning_date or asset.installation_date
        installation_date = (
            install_dt if isinstance(install_dt, datetime) else _DEFAULT_START
        )

        # Loss ratio R = load_loss / no_load_loss when both present
        loss_ratio = None
        if transformer.load_loss_w and transformer.no_load_loss_w:
            try:
                loss_ratio = float(transformer.load_loss_w) / float(transformer.no_load_loss_w)
            except (ValueError, ZeroDivisionError, TypeError):
                loss_ratio = None

        return {
            "transformer_id": asset.asset_code or str(asset.id),
            "installation_date": installation_date,
            "insulation_type": self._map_insulation_type(transformer),
            "design_life_years": self.DESIGN_LIFE_YEARS,
            "cooling_type": transformer.cooling_type,
            "rated_power_mva": transformer.power_rating_mva,
            "rated_voltage_kv": transformer.hv_voltage_kv,
            "loss_ratio": loss_ratio,
            "manufacturer": asset.manufacturer,
            "_plant_id": asset.plant_id,
            "_commissioning_date": installation_date,
        }

    # ========================================================================
    # Signal mapping config (webapp DB, read/write)
    # ========================================================================
    async def get_signal_config(
        self, db: AsyncSession, asset_id: int
    ) -> Dict[str, Any]:
        cfg = (
            await db.execute(
                select(RULSignalConfig).where(RULSignalConfig.asset_id == asset_id)
            )
        ).scalar_one_or_none()
        return {
            "asset_id": asset_id,
            "top_oil_signal_id": cfg.top_oil_signal_id if cfg else None,
            "ambient_signal_id": cfg.ambient_signal_id if cfg else None,
            "current_signal_id": cfg.current_signal_id if cfg else None,
        }

    async def save_signal_config(
        self, db: AsyncSession, asset_id: int, payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        cfg = (
            await db.execute(
                select(RULSignalConfig).where(RULSignalConfig.asset_id == asset_id)
            )
        ).scalar_one_or_none()

        if cfg is None:
            cfg = RULSignalConfig(asset_id=asset_id)
            db.add(cfg)

        cfg.top_oil_signal_id = payload.get("top_oil_signal_id")
        cfg.ambient_signal_id = payload.get("ambient_signal_id")
        cfg.current_signal_id = payload.get("current_signal_id")

        await db.commit()
        await db.refresh(cfg)
        return {
            "asset_id": asset_id,
            "top_oil_signal_id": cfg.top_oil_signal_id,
            "ambient_signal_id": cfg.ambient_signal_id,
            "current_signal_id": cfg.current_signal_id,
        }

    # ========================================================================
    # Available signals for the dropdowns (DCS DB, read-only)
    # ========================================================================
    async def get_available_signals(
        self, db: AsyncSession, dcs_db: AsyncSession, asset_id: int
    ) -> Optional[List[Dict[str, Any]]]:
        asset = (
            await db.execute(select(Assets.plant_id).where(Assets.id == asset_id))
        ).scalar_one_or_none()
        if asset is None:
            return None
        dcs_service = DCSEngineService(dcs_db)
        return await dcs_service.get_signals_by_plant(asset)

    # ========================================================================
    # Main RUL calculation
    # ========================================================================
    @staticmethod
    def _align_series(
        series: Dict[str, List[Dict[str, Any]]]
    ) -> Dict[str, List]:
        """Align top_oil / ambient / current hourly series onto a common
        timestamp axis (union of all timestamps), interpolating gaps.

        `series` maps role -> list of {"timestamp": iso, "avg_value": float}.
        Roles with no data are returned as None-valued arrays.
        """
        # Collect the union of timestamps (ISO strings) across all present roles
        all_ts = set()
        for rows in series.values():
            for r in rows:
                if r.get("timestamp"):
                    all_ts.add(r["timestamp"])
        axis = sorted(all_ts)

        aligned: Dict[str, List] = {"timestamps": axis}
        for role, rows in series.items():
            lookup = {r["timestamp"]: r.get("avg_value") for r in rows if r.get("timestamp")}
            aligned[role] = [lookup.get(ts, None) for ts in axis]
        return aligned

    async def calculate_rul(
        self, db: AsyncSession, dcs_db: AsyncSession, asset_id: int
    ) -> Optional[Dict[str, Any]]:
        # 1) Params
        params = await self.get_transformer_params(db, asset_id)
        if params is None:
            return None

        plant_id = params.pop("_plant_id", None)
        commissioning_date = params.pop("_commissioning_date", None)

        # 2) Signal mapping
        cfg = await self.get_signal_config(db, asset_id)
        signal_ids = {
            "top_oil": cfg["top_oil_signal_id"],
            "ambient": cfg["ambient_signal_id"],
            "current": cfg["current_signal_id"],
        }
        if not signal_ids["top_oil"] or not signal_ids["ambient"]:
            return {
                "error": "signals_not_configured",
                "message": "Top Oil and Ambient signals must be mapped in Settings.",
                "config": cfg,
            }

        dcs_service = DCSEngineService(dcs_db)

        # 3) Validate the mapped signals belong to the asset's plant
        wanted_ids = [sid for sid in signal_ids.values() if sid]
        meta_rows = await dcs_service.get_signals_by_ids(wanted_ids)
        meta_by_id = {m["id"]: m for m in meta_rows}
        for role, sid in signal_ids.items():
            if sid and sid in meta_by_id and plant_id is not None:
                if meta_by_id[sid].get("plant_id") != plant_id:
                    return {
                        "error": "signal_plant_mismatch",
                        "message": f"Mapped {role} signal {sid} is not in plant {plant_id}.",
                    }

        # 4) Pull hourly history for each mapped signal (all available)
        start = commissioning_date or _DEFAULT_START
        end = datetime.now()

        async def _hours(sid: Optional[int]):
            if not sid:
                return []
            return await dcs_service.get_hour_data_aggregated(
                sid, start, end, max_points=_MAX_HOUR_POINTS
            )

        raw = {
            "top_oil": await _hours(signal_ids["top_oil"]),
            "ambient": await _hours(signal_ids["ambient"]),
            "current": await _hours(signal_ids["current"]),
        }

        if not raw["top_oil"] or not raw["ambient"]:
            return {
                "error": "no_data",
                "message": "No hourly data found for the mapped Top Oil / Ambient signals.",
            }

        # 5) Align to a shared hourly axis
        aligned = self._align_series(raw)
        timestamps = aligned["timestamps"]
        top_oil = aligned["top_oil"]
        ambient = aligned["ambient"]
        current = aligned["current"] if signal_ids["current"] else None
        # Treat an all-empty current column as absent
        if current is not None and all(v is None for v in current):
            current = None

        # 6) Run algorithm
        try:
            estimator = TransformerLifeEstimator(**params)
            result = estimator.estimate_life(
                timestamps=timestamps,
                top_oil=top_oil,
                ambient=ambient,
                current=current,
            )
        except ValueError as e:
            logger.warning(f"[RUL] Validation error for asset {asset_id}: {e}")
            return {"error": "validation_failed", "message": str(e)}
        except Exception as e:
            logger.error(f"[RUL] Algorithm error for asset {asset_id}: {e}", exc_info=True)
            return {"error": "algorithm_error", "message": str(e)}

        # 7) Echo resolved signal metadata for the UI header
        result["signal_mapping"] = {
            role: (meta_by_id.get(sid) if sid else None)
            for role, sid in signal_ids.items()
        }
        result["data_summary"] = {
            "hours_used": len(timestamps),
            "start": timestamps[0] if timestamps else None,
            "end": timestamps[-1] if timestamps else None,
        }
        return result
