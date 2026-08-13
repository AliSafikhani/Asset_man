"""
Oil Quality Control Service Layer (IEC 60296 + IEC 60422:2024)

Mirrors IEEEService conventions: reads the generic test_results / test_parameters
storage for a transformer's "Oil Quality" tests and runs the algorithm package
LIVE (nothing is stored). Feeds three endpoints:

    per_test_statuses -> list columns (60296 / 60422 status per test)
    assess_one        -> full analyze dashboard for one test (+ embedded trend)
    trend             -> trend analysis over the whole series
"""

from typing import List, Dict, Any, Optional
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.test_results import TestResult
from app.models.test_parameters import TestParameter
from app.models.tests import TestTypes
from app.models.assets import Assets
from app.models.transformers import Transformers

from algorithms.transformer.oil_quality_control import (
    assess_60296,
    assess_60422,
    analyze_trend,
    derive_category,
    PARAM_BY_NAME,
)

logger = logging.getLogger(__name__)


class OilQualityService:
    """Live IEC 60296 / IEC 60422 assessment for transformer oil quality tests."""

    async def _get_test_type(self, db: AsyncSession) -> Optional[TestTypes]:
        result = await db.execute(
            select(TestTypes).where(
                and_(
                    TestTypes.asset_type == "transformer",
                    TestTypes.test_name.ilike("%oil quality%"),
                )
            )
        )
        return result.scalar_one_or_none()

    async def _load_tests(self, db: AsyncSession, asset_id: int) -> List[Dict[str, Any]]:
        """Load the asset's Oil Quality tests as canonical sample dicts, oldest first.

        Each item: {test_result_id, test_date, lab_name, notes, operating_state,
        values:{canonical_field_name: value}}.
        """
        test_type = await self._get_test_type(db)
        if not test_type:
            logger.warning("No 'Oil Quality' transformer test type found")
            return []

        results_result = await db.execute(
            select(TestResult)
            .where(
                and_(
                    TestResult.asset_id == asset_id,
                    TestResult.test_type_id == test_type.id,
                )
            )
            .order_by(TestResult.test_date.asc())
        )
        test_results = results_result.scalars().all()
        if not test_results:
            return []

        tests = []
        for tr in test_results:
            params_result = await db.execute(
                select(TestParameter).where(TestParameter.test_result_id == tr.id)
            )
            parameters = params_result.scalars().all()

            values: Dict[str, Any] = {}
            operating_state = "in_service"
            for p in parameters:
                if p.field_name == "operating_state":
                    operating_state = p.field_value_text or "in_service"
                    continue

                meta = PARAM_BY_NAME.get(p.field_name)
                if meta is None:
                    continue

                if meta["data_type"] in ("select", "text"):
                    if p.field_value_text is not None:
                        values[p.field_name] = p.field_value_text
                else:
                    val = p.field_value
                    if val is None and p.field_value_text not in (None, ""):
                        try:
                            val = float(p.field_value_text)
                        except (ValueError, TypeError):
                            val = None
                    if val is not None:
                        values[p.field_name] = val

            tests.append({
                "test_result_id": tr.id,
                "test_date": tr.test_date,
                "lab_name": tr.lab_name,
                "notes": tr.notes,
                "operating_state": operating_state,
                "values": values,
            })
        return tests

    async def _transformer(self, db: AsyncSession, asset_id: int) -> Optional[Transformers]:
        result = await db.execute(
            select(Transformers).where(Transformers.asset_id == asset_id)
        )
        return result.scalar_one_or_none()

    async def _asset(self, db: AsyncSession, asset_id: int) -> Optional[Assets]:
        result = await db.execute(select(Assets).where(Assets.id == asset_id))
        return result.scalar_one_or_none()

    async def _equipment(self, db: AsyncSession, asset_id: int) -> Dict[str, Any]:
        transformer = await self._transformer(db, asset_id)
        asset = await self._asset(db, asset_id)
        hv = transformer.hv_voltage_kv if transformer else None
        oil_type = (transformer.oil_type if transformer else None) or "Mineral Insulating Oil"
        return {
            "asset_id": asset_id,
            "asset_name": asset.asset_name if asset else None,
            "asset_code": asset.asset_code if asset else None,
            "category": derive_category(hv),
            "category_source": "hv_voltage_kv",
            "hv_voltage_kv": hv,
            "oil_type": oil_type,
        }

    def _canonical_sample(self, values: Dict[str, Any]) -> Dict[str, Any]:
        return dict(values)

    # ---- Public API ------------------------------------------------------ #

    async def per_test_statuses(
        self, db: AsyncSession, asset_id: int
    ) -> Optional[List[Dict[str, Any]]]:
        """Per-test 60296 / 60422 statuses for the list table. None if no tests."""
        tests = await self._load_tests(db, asset_id)
        if not tests:
            return None

        equipment = await self._equipment(db, asset_id)
        category = equipment["category"]

        out = []
        for t in tests:
            sample = t["values"]
            r296 = assess_60296(sample, oil_type="A")
            r422 = assess_60422(sample, category, t["operating_state"])
            out.append({
                "test_result_id": t["test_result_id"],
                "test_date": t["test_date"].isoformat() if t["test_date"] else None,
                "operating_state": t["operating_state"],
                "iec60296_status": r296["final_status"],
                "iec60422_status": r422["final_status"],
            })
        return out

    async def assess_one(
        self, db: AsyncSession, asset_id: int, test_result_id: int
    ) -> Optional[Dict[str, Any]]:
        """Full analyze-dashboard payload for one test (with embedded trend)."""
        tests = await self._load_tests(db, asset_id)
        if not tests:
            return None

        target = next((t for t in tests if t["test_result_id"] == test_result_id), None)
        if target is None:
            return None

        equipment = await self._equipment(db, asset_id)
        category = equipment["category"]
        sample = target["values"]
        operating_state = target["operating_state"]

        iec60296 = assess_60296(sample, oil_type="A")
        iec60422 = assess_60422(sample, category, operating_state)

        # Trend over the full series (matches the mockup's embedded trend panel).
        history = [
            {"date": t["test_date"], "values": t["values"]}
            for t in tests
        ]
        trend = analyze_trend(history)

        priority_actions = {
            "action": iec60422["counts"].get("poor", 0),
            "attention": iec60422["counts"].get("fair", 0),
            "dangerous_trends": len(trend.get("dangerous_trends", [])),
        }

        ruleset_label = (
            "IEC 60422:2024 > Table 3"
            if str(operating_state).lower() == "before_energization"
            else "IEC 60422:2024 > Table 5"
        )

        final_recommendation = (
            "ACTION REQUIRED"
            if iec60422["final_status"] == "ACTION" or trend["trend_risk"] == "DANGEROUS"
            else "ATTENTION" if iec60422["final_status"] == "ATTENTION"
            else "NO ACTION"
        )

        return {
            "sample": {
                "test_result_id": target["test_result_id"],
                "test_date": target["test_date"].isoformat() if target["test_date"] else None,
                "lab_name": target["lab_name"],
                "notes": target["notes"],
                "operating_state": operating_state,
                "values": sample,
            },
            "equipment": equipment,
            "routing": {
                "operating_state": operating_state,
                "category": category,
                "ruleset": ruleset_label,
                "oil_type": equipment["oil_type"],
            },
            "iec60296": iec60296,
            "iec60422": iec60422,
            "priority_actions": priority_actions,
            "trend": trend,
            "summary": {
                "sample_condition": iec60422["final_status"],
                "trend_risk": trend["trend_risk"],
                "final_recommendation": final_recommendation,
            },
        }

    async def trend(
        self, db: AsyncSession, asset_id: int
    ) -> Optional[Dict[str, Any]]:
        """Trend analysis over the whole series of the asset's Oil Quality tests."""
        tests = await self._load_tests(db, asset_id)
        if not tests or len(tests) < 2:
            return None

        equipment = await self._equipment(db, asset_id)
        history = [
            {"date": t["test_date"], "values": t["values"]}
            for t in tests
        ]
        result = analyze_trend(history)
        result["equipment"] = equipment
        return result
