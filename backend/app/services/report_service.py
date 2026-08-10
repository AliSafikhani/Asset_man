"""
Report Service Layer
File: backend/app/services/report_service.py

Aggregates everything the transformer *asset report* (PDF) needs into a single
JSON payload, so the frontend does one fetch and just renders:

  cover      — company / plant / transformer nameplate (always present)
  dga        — gas trend + multi-method diagnostic table (if requested)
  iec62874   — IEC TR 62874:2015 assessment, unchanged (if requested)
  rul        — IEC 60076-7 thermal-life (RUL) assessment, unchanged (if requested)

It adds no new physics — it reuses the existing services/engines:
  IEEEService, IEC62874Service, RULService, AlgorithmManager.

Each module block is computed under its own try/except: a failing module
degrades to {"error": "..."} in its own block rather than failing the whole
report.
"""

from typing import Any, Dict, List, Optional
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assets import Assets
from app.models.transformers import Transformers
from app.models.hierarchy import Plants, Companies

from app.services.ieee_service import IEEEService
from app.services.iec62874_service import IEC62874Service
from app.services.rul_service import RULService
from algorithms.algorithm_manager import AlgorithmManager

logger = logging.getLogger(__name__)

# All nine gases the DGA algorithms understand (order matters only for defaults).
GAS_KEYS = ["h2", "ch4", "c2h2", "c2h4", "c2h6", "co", "co2", "o2", "n2"]
# Gases shown on the report's trend chart (the report page uses a log Y axis).
TREND_GAS_KEYS = ["h2", "ch4", "c2h2", "c2h4", "c2h6", "co", "co2"]

# DGA diagnostic methods rendered as columns of the report table, in order.
# key   -> the column key the frontend reads
# algo  -> AlgorithmManager algorithm_id
# field -> which result field holds the fault code (Duval use fault_zone,
#          the ratio/ML methods use fault_type)
DGA_METHODS = [
    {"key": "duval_1", "algo": "duval_triangle_1", "field": "fault_zone"},
    {"key": "duval_4", "algo": "duval_triangle_4", "field": "fault_zone"},
    {"key": "duval_5", "algo": "duval_triangle_5", "field": "fault_zone"},
    {"key": "duval_6", "algo": "duval_triangle_6", "field": "fault_zone"},
    {"key": "pentagon_1", "algo": "duval_pentagon_1", "field": "fault_zone"},
    {"key": "pentagon_2", "algo": "duval_pentagon_2", "field": "fault_zone"},
    {"key": "iec60599", "algo": "iec60599_ratio", "field": "fault_type"},
    {"key": "rogers", "algo": "rogers_ratio", "field": "fault_type"},
    {"key": "doernenburg", "algo": "doernenburg_ratio", "field": "fault_type"},
    {"key": "ml", "algo": "ml_dga_1", "field": "fault_type"},
]


class ReportService:
    """Builds the transformer asset-report payload from existing services."""

    def __init__(self):
        self.ieee_service = IEEEService()
        self.iec62874_service = IEC62874Service()
        self.rul_service = RULService()
        self.algorithm_manager = AlgorithmManager()

    # ------------------------------------------------------------------ #
    # Public entry point
    # ------------------------------------------------------------------ #
    async def build_transformer_report(
        self,
        db: AsyncSession,
        dcs_db: AsyncSession,
        asset_id: int,
        modules: List[str],
    ) -> Optional[Dict[str, Any]]:
        """
        Assemble the report payload. Returns None if the asset is not a
        transformer (or does not exist) — the endpoint turns that into a 404.
        """
        cover = await self._build_cover(db, asset_id)
        if cover is None:
            return None

        report: Dict[str, Any] = {
            "cover": cover,
            "modules_requested": modules,
        }

        wanted = set(modules)

        if "dga" in wanted:
            report["dga"] = await self._build_dga(db, asset_id)

        if "iec62874" in wanted:
            report["iec62874"] = await self._build_iec62874(db, asset_id)

        if "rul" in wanted:
            report["rul"] = await self._build_rul(db, dcs_db, asset_id)

        return report

    # ------------------------------------------------------------------ #
    # Cover page — company / plant / transformer nameplate
    # ------------------------------------------------------------------ #
    async def _build_cover(self, db: AsyncSession, asset_id: int) -> Optional[Dict[str, Any]]:
        asset = (
            await db.execute(select(Assets).where(Assets.id == asset_id))
        ).scalar_one_or_none()
        if not asset or asset.asset_type != "transformer":
            return None

        transformer = (
            await db.execute(
                select(Transformers).where(Transformers.asset_id == asset_id)
            )
        ).scalar_one_or_none()

        plant = None
        company = None
        if asset.plant_id:
            plant = (
                await db.execute(select(Plants).where(Plants.id == asset.plant_id))
            ).scalar_one_or_none()
            if plant and plant.company_id:
                company = (
                    await db.execute(
                        select(Companies).where(Companies.id == plant.company_id)
                    )
                ).scalar_one_or_none()

        def iso(dt):
            return dt.isoformat() if dt else None

        cover: Dict[str, Any] = {
            "company_name": getattr(company, "name", None),
            "plant_name": getattr(plant, "name", None),
            "asset": {
                "asset_name": asset.asset_name,
                "asset_code": asset.asset_code,
                "asset_tag": asset.asset_tag,
                "manufacturer": asset.manufacturer,
                "model": asset.model,
                "serial_number": asset.serial_number,
                "manufacturing_year": asset.manufacturing_year,
                "installation_date": iso(asset.installation_date),
                "commissioning_date": iso(asset.commissioning_date),
                "operational_status": asset.operational_status,
                "criticality_level": asset.criticality_level,
                "location_within_plant": asset.location_within_plant,
            },
            "transformer": None,
        }

        if transformer:
            cover["transformer"] = {
                "transformer_type": transformer.transformer_type,
                "cooling_type": transformer.cooling_type,
                "number_of_windings": transformer.number_of_windings,
                "power_rating_mva": transformer.power_rating_mva,
                "power_rating_mva_forced": transformer.power_rating_mva_forced,
                "hv_voltage_kv": transformer.hv_voltage_kv,
                "lv_voltage_kv": transformer.lv_voltage_kv,
                "tertiary_voltage_kv": transformer.tertiary_voltage_kv,
                "impedance_percent": transformer.impedance_percent,
                "vector_group": transformer.vector_group,
                "frequency_hz": transformer.frequency_hz,
                "oil_type": transformer.oil_type,
                "paper_type": transformer.paper_type,
                "insulation_type": transformer.insulation_type,
                "insulation_class": transformer.insulation_class,
                "oil_volume_liters": transformer.oil_volume_liters,
                "weight_kg": transformer.weight_kg,
                "no_load_loss_w": transformer.no_load_loss_w,
                "load_loss_w": transformer.load_loss_w,
                "efficiency_percent": transformer.efficiency_percent,
                "has_on_load_tap_changer": transformer.has_on_load_tap_changer,
                "has_buchholz_relay": transformer.has_buchholz_relay,
                "has_pressure_relief": transformer.has_pressure_relief,
            }

        return cover

    # ------------------------------------------------------------------ #
    # DGA — gas trend + multi-method diagnostic table
    # ------------------------------------------------------------------ #
    async def _build_dga(self, db: AsyncSession, asset_id: int) -> Dict[str, Any]:
        try:
            # Reuse the IEEE service's DGA-sample fetch: [{id, sample_date, gas_data}]
            samples = await self.ieee_service.get_transformer_dga_samples(db, asset_id)
            if not samples:
                return {
                    "gas_trend": [],
                    "results_table": [],
                    "recommendations": [],
                    "note": "No DGA samples found for this transformer.",
                }

            # Normalise gas_data so every sample carries all nine gas keys.
            for s in samples:
                gd = s.get("gas_data") or {}
                s["gas_data"] = {k: self._to_float(gd.get(k)) for k in GAS_KEYS}

            gas_trend = self._build_gas_trend(samples)
            results_table = await self._build_dga_table(db, asset_id, samples)

            return {
                "gas_trend": gas_trend,
                "results_table": results_table,
                "recommendations": [],  # blank for now, per spec — layout stays stable
            }
        except Exception as e:
            logger.error(f"DGA report block failed for asset {asset_id}: {e}", exc_info=True)
            return {"error": f"DGA computation failed: {e}"}

    def _build_gas_trend(self, samples: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """One row per test date with the trended gases (log-scale friendly)."""
        rows = []
        for s in samples:
            gd = s["gas_data"]
            row = {"date": s.get("sample_date")}
            for k in TREND_GAS_KEYS:
                row[k] = gd.get(k)
            rows.append(row)
        # Chronological — get_transformer_dga_samples already sorts asc, but be safe.
        rows.sort(key=lambda r: r.get("date") or "")
        return rows

    async def _build_dga_table(
        self, db: AsyncSession, asset_id: int, samples: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """One row per test date, one column per diagnostic method + IEEE/IEC status."""
        # Seed a row per sample keyed by sample id.
        rows: Dict[Any, Dict[str, Any]] = {}
        for s in samples:
            rows[s["id"]] = {"date": s.get("sample_date")}

        # --- Duval / Pentagon / ratio / ML diagnostic columns ---
        for method in DGA_METHODS:
            try:
                batch = self.algorithm_manager.calculate_batch(
                    "transformer", "dga", method["algo"], samples
                )
            except Exception as e:
                logger.warning(f"DGA method {method['algo']} failed: {e}")
                batch = None

            if not batch:
                continue

            for res in batch:
                rid = res.get("id")
                if rid not in rows:
                    continue
                code = res.get(method["field"]) or res.get("fault_zone") or res.get("fault_type")
                rows[rid][method["key"]] = {
                    "code": code,
                    "name": res.get("fault_name"),
                    "color": res.get("zone_color"),
                }

        # --- IEEE status column (live service; needs >= 2 samples) ---
        try:
            ieee_results = await self.ieee_service.calculate_ieee_status(db, asset_id)
            if ieee_results:
                for res in ieee_results:
                    rid = res.get("id")
                    if rid in rows:
                        rows[rid]["ieee"] = {
                            "status": res.get("status_name") or res.get("fault_name"),
                            "color": res.get("zone_color"),
                        }
        except Exception as e:
            logger.warning(f"IEEE status for report failed: {e}")

        # --- IEC status column (batch algorithm) ---
        try:
            iec_batch = self.algorithm_manager.calculate_batch(
                "transformer", "dga", "iec_algorithm", samples
            )
            if iec_batch:
                for res in iec_batch:
                    rid = res.get("id")
                    if rid in rows:
                        rows[rid]["iec"] = {
                            "status": res.get("status"),
                            "color": res.get("zone_color"),
                        }
        except Exception as e:
            logger.warning(f"IEC status for report failed: {e}")

        table = list(rows.values())
        table.sort(key=lambda r: r.get("date") or "")
        return table

    # ------------------------------------------------------------------ #
    # IEC 62874 — pass-through of the existing assessment
    # ------------------------------------------------------------------ #
    async def _build_iec62874(self, db: AsyncSession, asset_id: int) -> Dict[str, Any]:
        try:
            result = await self.iec62874_service.calculate_iec_status(db, asset_id)
            if result is None:
                return {"error": "Transformer not found or configuration error"}
            if "error" in result:
                return {"error": result.get("message", "IEC 62874 calculation failed")}
            return {"status": "success", "data": result}
        except Exception as e:
            logger.error(f"IEC62874 report block failed for asset {asset_id}: {e}", exc_info=True)
            return {"error": f"IEC 62874 computation failed: {e}"}

    # ------------------------------------------------------------------ #
    # RUL — pass-through of the existing assessment
    # ------------------------------------------------------------------ #
    async def _build_rul(
        self, db: AsyncSession, dcs_db: AsyncSession, asset_id: int
    ) -> Dict[str, Any]:
        try:
            result = await self.rul_service.calculate_rul(db, dcs_db, asset_id)
            if result is None:
                return {"error": "Transformer not found or configuration error"}
            if "error" in result:
                if result["error"] == "signals_not_configured":
                    return {"status": "not_configured", "data": result}
                return {"error": result.get("message", "RUL calculation failed")}
            return {"status": "success", "data": result}
        except Exception as e:
            logger.error(f"RUL report block failed for asset {asset_id}: {e}", exc_info=True)
            return {"error": f"RUL computation failed: {e}"}

    # ------------------------------------------------------------------ #
    # Helpers
    # ------------------------------------------------------------------ #
    @staticmethod
    def _to_float(v) -> float:
        try:
            if v is None:
                return 0.0
            return float(v)
        except (ValueError, TypeError):
            return 0.0
