# test_models.py
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.test_results import TestResult
from app.models.test_parameters import TestParameter

async def test():
    # Just import to check if models load
    print("✅ TestResult imported successfully")
    print("✅ TestParameter imported successfully")
    
    # Check if relationship exists
    if hasattr(TestResult, 'parameters'):
        print("✅ TestResult has 'parameters' relationship")
    else:
        print("❌ TestResult does NOT have 'parameters' relationship")
    
    if hasattr(TestParameter, 'test_result'):
        print("✅ TestParameter has 'test_result' relationship")
    else:
        print("❌ TestParameter does NOT have 'test_result' relationship")

asyncio.run(test())