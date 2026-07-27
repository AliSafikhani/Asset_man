from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.ieee_service import IEEEService
from app.services.iec62874_service import IEC62874Service

router = APIRouter(tags=["Diagnostics"])

# ============================================
# IEEE C57.104-2019 Endpoint (Live)
# ============================================

@router.get("/transformer/{asset_id}/ieee")
async def get_ieee_status_live(
    asset_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get live IEEE C57.104-2019 status for a transformer.
    Calculated on-demand using all DGA samples. Not stored.
    """
    service = IEEEService()
    results = await service.calculate_ieee_status(db, asset_id)
    if results is None:
        raise HTTPException(
            status_code=404,
            detail="Insufficient DGA samples (min 2) or transformer not found"
        )
    return {
        "asset_id": asset_id,
        "status": "success",
        "data": results
    }

# ============================================
# IEC TR 62874:2015 Endpoint (Live)
# ============================================

@router.get("/transformer/{asset_id}/iec62874")
async def get_iec62874_status(
    asset_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get live IEC TR 62874:2015 paper thermal degradation assessment.

    This is calculated on-demand using:
    - Transformer configuration (type, breathing, oil, paper)
    - DGA samples (CO2)
    - Furan samples (2-FAL)
    - Maintenance activities (oil changes, reconditioning, reclamation)

    Results are NOT stored in the database.
    """
    service = IEC62874Service()
    result = await service.calculate_iec_status(db, asset_id)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Transformer not found or configuration error"
        )

    # Check if there was an error in the calculation
    if "error" in result:
        raise HTTPException(
            status_code=400,
            detail=result.get("message", "IEC calculation failed")
        )

    return {
        "asset_id": asset_id,
        "status": "success",
        "data": result
    }

# ============================================
# Debug Endpoints (for development/testing)
# ============================================

@router.get("/test")
async def test():
    return {"message": "Diagnostics router is working!"}

@router.get("/ping")
async def ping():
    return {"message": "pong"}

@router.get("/transformer/{asset_id}/iec-config-debug")
async def debug_iec_config(
    asset_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Debug endpoint for IEC config - shows detailed error if any
    """
    service = IEC62874Service()
    
    try:
        from app.models.assets import Assets
        from app.models.transformers import Transformers
        from sqlalchemy import select
        
        asset_result = await db.execute(select(Assets).where(Assets.id == asset_id))
        asset = asset_result.scalar_one_or_none()
        
        if not asset:
            return {"error": "Asset not found", "asset_id": asset_id}
        
        transformer_result = await db.execute(select(Transformers).where(Transformers.asset_id == asset_id))
        transformer = transformer_result.scalar_one_or_none()
        
        if not transformer:
            return {
                "error": "Transformer record not found",
                "asset_id": asset_id,
                "asset_name": asset.asset_name,
                "asset_type": asset.asset_type
            }
        
        try:
            config = await service.get_transformer_config(db, asset_id)
            return {"asset_id": asset_id, "config": config}
        except Exception as e:
            return {
                "error": "Error in get_transformer_config",
                "asset_id": asset_id,
                "exception": str(e),
                "exception_type": type(e).__name__
            }
            
    except Exception as e:
        return {
            "error": "Unexpected error",
            "asset_id": asset_id,
            "exception": str(e),
            "exception_type": type(e).__name__
        }

@router.get("/transformer/{asset_id}/db-check")
async def db_check(
    asset_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Check if both asset and transformer records exist
    """
    from app.models.assets import Assets
    from app.models.transformers import Transformers
    from sqlalchemy import select
    
    asset_result = await db.execute(select(Assets).where(Assets.id == asset_id))
    asset = asset_result.scalar_one_or_none()
    
    if not asset:
        return {"error": "Asset not found", "asset_id": asset_id}
    
    transformer_result = await db.execute(select(Transformers).where(Transformers.asset_id == asset_id))
    transformer = transformer_result.scalar_one_or_none()
    
    return {
        "asset_id": asset_id,
        "asset_name": asset.asset_name,
        "asset_type": asset.asset_type,
        "asset_commissioning_date": str(asset.commissioning_date) if asset.commissioning_date else None,
        "transformer_exists": transformer is not None,
        "transformer_data": {
            "transformer_type": transformer.transformer_type if transformer else None,
            "breathing": transformer.breathing if transformer else None,
            "oil_inhibition": transformer.oil_inhibition if transformer else None,
            "paper_type": transformer.paper_type if transformer else None
        } if transformer else None
    }

@router.get("/transformer/{asset_id}/iec-config-debug-verbose")
async def debug_iec_config_verbose(
    asset_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Verbose debug endpoint to find exactly what's failing.
    Shows each step of the config fetching process.
    """
    try:
        from app.models.assets import Assets
        from app.models.transformers import Transformers
        from sqlalchemy import select
        
        asset_result = await db.execute(select(Assets).where(Assets.id == asset_id))
        asset = asset_result.scalar_one_or_none()
        
        if not asset:
            return {"step": "asset_not_found", "asset_id": asset_id}
        
        transformer_result = await db.execute(select(Transformers).where(Transformers.asset_id == asset_id))
        transformer = transformer_result.scalar_one_or_none()
        
        if not transformer:
            return {"step": "transformer_not_found", "asset_id": asset_id}
        
        try:
            commissioning_date_str = asset.commissioning_date.strftime("%Y-%m-%d") if asset.commissioning_date else None
            
            config = {
                "name": asset.asset_name,
                "commissioning_date": commissioning_date_str,
                "family": transformer.transformer_type,
                "breathing": transformer.breathing,
                "oil_type": transformer.oil_inhibition or "uninhibited",
                "insulation_type": transformer.paper_type or "Kraft"
            }
            
            return {
                "step": "success",
                "asset_id": asset_id,
                "raw_data": {
                    "asset_name": asset.asset_name,
                    "commissioning_date_raw": str(asset.commissioning_date),
                    "commissioning_date_formatted": commissioning_date_str,
                    "transformer_type": transformer.transformer_type,
                    "breathing": transformer.breathing,
                    "oil_inhibition": transformer.oil_inhibition,
                    "paper_type": transformer.paper_type
                },
                "config": config
            }
            
        except Exception as e:
            return {
                "step": "config_build_error",
                "asset_id": asset_id,
                "error": str(e),
                "error_type": type(e).__name__
            }
            
    except Exception as e:
        return {
            "step": "unexpected_error",
            "asset_id": asset_id,
            "error": str(e),
            "error_type": type(e).__name__
        }

@router.get("/transformer/{asset_id}/iec-test-data")
async def debug_iec_test_data(
    asset_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Debug endpoint to test IEC test data fetching
    """
    service = IEC62874Service()
    
    try:
        test_data = await service.get_test_data(db, asset_id)
        config = await service.get_transformer_config(db, asset_id)
        
        return {
            "asset_id": asset_id,
            "config": config,
            "test_data": test_data,
            "dga_count": len([t for t in test_data if t.get('co2') is not None]),
            "furan_count": len([t for t in test_data if t.get('fal') is not None])
        }
    except Exception as e:
        return {
            "error": str(e),
            "exception_type": type(e).__name__
        }