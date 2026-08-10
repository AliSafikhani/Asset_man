# backend\app\api\v1\api.py
from fastapi import APIRouter
from app.api.v1.endpoints import auth
from app.api.v1.endpoints import companies
from app.api.v1.endpoints import sites
from app.api.v1.endpoints import assets
from app.api.v1.endpoints import generators
from app.api.v1.endpoints import transformers
from app.api.v1.endpoints import motors
from app.api.v1.endpoints import test_types
from app.api.v1.endpoints import test_fields
from app.api.v1.endpoints import test_results  # This now has the batch endpoint
from app.api.v1.endpoints import dcs_signals
from app.api.v1.endpoints import alarms
from app.api.v1.endpoints import events
from app.api.v1.endpoints import maintenance_activities  # NEW: Import maintenance activities
from app.api.v1.endpoints import diagnostics  # NEW: Import diagnostics (IEEE, IEC, etc.)
from app.api.v1.endpoints import reports  # NEW: Import transformer asset report aggregator
from app.api.algorithms import router as algorithms_router
from app.api import upload
from app.api.v1.endpoints import monitoring

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
api_router.include_router(test_results.router, prefix="/test-results")  # This now has POST /batch
api_router.include_router(dcs_signals.router, prefix="/dcs")
api_router.include_router(alarms.router, prefix="/alarms")
api_router.include_router(events.router, prefix="/events")
api_router.include_router(maintenance_activities.router, prefix="/maintenance-activities")  # NEW: Register maintenance activities
api_router.include_router(diagnostics.router, prefix="/diagnostics")  # NEW: Register diagnostics (IEEE live endpoint)
api_router.include_router(reports.router, prefix="/reports")  # NEW: Register transformer asset report aggregator

api_router.include_router(algorithms_router, prefix="/algorithms")
api_router.include_router(upload.router, prefix="/upload")
api_router.include_router(monitoring.router)
