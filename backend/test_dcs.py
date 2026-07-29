"""
Test DCS Engine Service
"""
import asyncio
from app.core.database import DcsAsyncSessionLocal
from app.services.dcs_engine_service import DCSEngineService

async def test():
    async with DcsAsyncSessionLocal() as session:
        service = DCSEngineService(session)
        signals = await service.get_signals_by_plant(58)
        print(f"Found {len(signals)} signals:")
        for s in signals:
            print(f"  {s['id']}: {s['name']}")

if __name__ == "__main__":
    asyncio.run(test())