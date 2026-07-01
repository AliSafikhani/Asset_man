from fastapi import APIRouter
from app.api.v1.endpoints import auth, companies, sites, assets
from app.api.v1.endpoints import generators, transformers, motors
from app.api.v1.endpoints import test_types, test_fields, test_results
from app.api.v1.endpoints import dcs_signals, alarms, events
from app.api.algorithms import router as algorithms_router

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth")
api_router.include_router(companies.router, prefix="/companies")
api_router.include_router(sites.router, prefix="/sites")
api_router.include_router(assets.router, prefix="/assets")
api_router.include_router(generators.router, prefix="/generators")
api_router.include_router(transformers.router, prefix="/transformers")
api_router.include_router(motors.router, prefix="/motors")
api_router.include_router(test_types.router, prefix="/test-types")
api_router.include_router(test_fields.router, prefix="/test-fields")
api_router.include_router(test_results.router, prefix="/test-results")
api_router.include_router(dcs_signals.router, prefix="/dcs-signals")
api_router.include_router(alarms.router, prefix="/alarms")
api_router.include_router(events.router, prefix="/events")
api_router.include_router(algorithms_router, prefix="/algorithms")