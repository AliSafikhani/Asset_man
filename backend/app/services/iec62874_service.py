"""
IEC TR 62874:2015 Service Layer
Handles fetching transformer data and running the IEC 62874 paper thermal degradation assessment
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

import logging

# Import your IEC algorithm
from algorithms.transformer.iec62784.iec62874 import (
    create_transformer_from_database,
    Transformer,
    Family,
    Breathing,
    OilType,
    InsulationType,
    MaintenanceType
)

from app.models.assets import Assets
from app.models.transformers import Transformers
from app.models.test_results import TestResult
from app.models.tests import TestTypes
from app.models.test_parameters import TestParameter
from app.models.maintenance_activities import MaintenanceActivities

logger = logging.getLogger(__name__)


class IEC62874Service:
    """Service for IEC TR 62874:2015 paper thermal degradation assessment"""
    
    def __init__(self):
        self.algorithm = None  # Will be created per transformer
        # Furan test type ID (from your database)
        self.FURAN_TEST_TYPE_ID = 129
        # Field name for 2-FAL in test_parameters
        self.FAL_FIELD_NAME = 'fal'
        # Field name for CO2 in test_parameters
        self.CO2_FIELD_NAME = 'co2'
        # Field name for maintenance oil detail
        self.OIL_DETAIL_FIELD = 'oil_detail'
    
    # ========================================================================
    # STEP 2: Fetch Transformer Configuration
    # ========================================================================
    async def get_transformer_config(
        self,
        db: AsyncSession,
        asset_id: int
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch transformer configuration from Assets and Transformers tables.
        
        Returns:
            Dict with: name, commissioning_date, family, breathing, 
            oil_type, insulation_type
            Returns None if asset or transformer not found.
        """
        try:
            # Fetch asset
            asset_result = await db.execute(
                select(Assets).where(Assets.id == asset_id)
            )
            asset = asset_result.scalar_one_or_none()
            
            if not asset:
                logger.error(f"Asset {asset_id} not found")
                return None
            
            # Fetch transformer
            transformer_result = await db.execute(
                select(Transformers).where(Transformers.asset_id == asset_id)
            )
            transformer = transformer_result.scalar_one_or_none()
            
            if not transformer:
                logger.error(f"Transformer {asset_id} not found")
                return None
            
            # Build config with safe date handling
            commissioning_date_str = None
            if asset.commissioning_date:
                if hasattr(asset.commissioning_date, 'strftime'):
                    commissioning_date_str = asset.commissioning_date.strftime("%Y-%m-%d")
                else:
                    commissioning_date_str = str(asset.commissioning_date)
            
            config = {
                "name": asset.asset_name,
                "commissioning_date": commissioning_date_str,
                "family": transformer.transformer_type,
                "breathing": transformer.breathing,
                "oil_type": transformer.oil_inhibition or "uninhibited",
                "insulation_type": transformer.paper_type or "Kraft"
            }
            
            logger.info(f"Transformer config fetched for asset {asset_id}: {config['name']}")
            return config
            
        except Exception as e:
            logger.error(f"Error fetching transformer config for asset {asset_id}: {str(e)}", exc_info=True)
            return None
    
    # ========================================================================
    # STEP 3: Fetch Test Data (CO2 and 2-FAL)
    # ========================================================================
    async def get_dga_samples(
        self,
        db: AsyncSession,
        asset_id: int
    ) -> List[Dict[str, Any]]:
        """
        Fetch all DGA samples for CO2.
        
        Returns:
            List of dicts with: date, co2 (float)
        """
        try:
            # Get DGA test type
            test_type_result = await db.execute(
                select(TestTypes).where(
                    and_(
                        TestTypes.asset_type == 'transformer',
                        TestTypes.test_name.ilike('%dga%')
                    )
                )
            )
            test_type = test_type_result.scalar_one_or_none()
            
            if not test_type:
                logger.warning(f"No DGA test type found for transformer {asset_id}")
                return []
            
            # Get all DGA test results for this asset
            results_result = await db.execute(
                select(TestResult)
                .where(
                    and_(
                        TestResult.asset_id == asset_id,
                        TestResult.test_type_id == test_type.id
                    )
                )
                .order_by(TestResult.test_date.asc())
            )
            test_results = results_result.scalars().all()
            
            if not test_results:
                logger.info(f"No DGA samples found for transformer {asset_id}")
                return []
            
            # Extract CO2 from parameters
            samples = []
            for result in test_results:
                # Get parameters for this result
                params_result = await db.execute(
                    select(TestParameter)
                    .where(TestParameter.test_result_id == result.id)
                )
                parameters = params_result.scalars().all()
                
                # Find CO2
                co2_value = None
                for param in parameters:
                    if param.field_name == self.CO2_FIELD_NAME:
                        co2_value = param.field_value
                        if co2_value is None and param.field_value_text:
                            try:
                                co2_value = float(param.field_value_text)
                            except (ValueError, TypeError):
                                pass
                        break
                
                samples.append({
                    'date': result.test_date.isoformat(),
                    'co2': co2_value
                })
            
            logger.info(f"Found {len(samples)} DGA samples for transformer {asset_id}")
            return samples
            
        except Exception as e:
            logger.error(f"Error fetching DGA samples for asset {asset_id}: {str(e)}")
            return []
    
    async def get_furan_samples(
        self,
        db: AsyncSession,
        asset_id: int
    ) -> List[Dict[str, Any]]:
        """
        Fetch all Furan samples for 2-FAL.
        
        Returns:
            List of dicts with: date, fal (float)
        """
        try:
            # Get Furan test type (using the specific ID 129)
            test_type_result = await db.execute(
                select(TestTypes).where(TestTypes.id == self.FURAN_TEST_TYPE_ID)
            )
            test_type = test_type_result.scalar_one_or_none()
            
            if not test_type:
                logger.warning(f"No Furan test type found (ID {self.FURAN_TEST_TYPE_ID})")
                return []
            
            # Get all Furan test results for this asset
            results_result = await db.execute(
                select(TestResult)
                .where(
                    and_(
                        TestResult.asset_id == asset_id,
                        TestResult.test_type_id == test_type.id
                    )
                )
                .order_by(TestResult.test_date.asc())
            )
            test_results = results_result.scalars().all()
            
            if not test_results:
                logger.info(f"No Furan samples found for transformer {asset_id}")
                return []
            
            # Extract FAL from parameters
            samples = []
            for result in test_results:
                # Get parameters for this result
                params_result = await db.execute(
                    select(TestParameter)
                    .where(TestParameter.test_result_id == result.id)
                )
                parameters = params_result.scalars().all()
                
                # Find FAL
                fal_value = None
                for param in parameters:
                    if param.field_name == self.FAL_FIELD_NAME:
                        fal_value = param.field_value
                        if fal_value is None and param.field_value_text:
                            try:
                                fal_value = float(param.field_value_text)
                            except (ValueError, TypeError):
                                pass
                        break
                
                samples.append({
                    'date': result.test_date.isoformat(),
                    'fal': fal_value
                })
            
            logger.info(f"Found {len(samples)} Furan samples for transformer {asset_id}")
            return samples
            
        except Exception as e:
            logger.error(f"Error fetching Furan samples for asset {asset_id}: {str(e)}")
            return []
    
    async def get_test_data(
        self,
        db: AsyncSession,
        asset_id: int
    ) -> List[Dict[str, Any]]:
        """
        Combine DGA (CO2) and Furan (2-FAL) test data.
        
        Returns:
            Combined test data for the algorithm
        """
        # Get both datasets
        dga_samples = await self.get_dga_samples(db, asset_id)
        furan_samples = await self.get_furan_samples(db, asset_id)
        
        # Combine by date
        combined = {}
        
        # Add DGA samples
        for sample in dga_samples:
            date = sample['date']
            if date not in combined:
                combined[date] = {'date': date, 'fal': None, 'co2': None}
            combined[date]['co2'] = sample['co2']
        
        # Add Furan samples
        for sample in furan_samples:
            date = sample['date']
            if date not in combined:
                combined[date] = {'date': date, 'fal': None, 'co2': None}
            combined[date]['fal'] = sample['fal']
        
        # Convert to list and sort by date
        result = sorted(combined.values(), key=lambda x: x['date'])
        
        logger.info(f"Combined {len(dga_samples)} DGA and {len(furan_samples)} Furan samples "
                    f"into {len(result)} unique dates for asset {asset_id}")
        return result
    
    # ========================================================================
    # STEP 4: Fetch Maintenance Data
    # ========================================================================
    async def get_maintenance_data(
        self,
        db: AsyncSession,
        asset_id: int
    ) -> List[Dict[str, Any]]:
        """
        Fetch oil maintenance activities.
        
        Returns:
            List of dicts with: date, mtype
        """
        try:
            # Get all maintenance activities for this asset with oil changes
            results_result = await db.execute(
                select(MaintenanceActivities)
                .where(
                    and_(
                        MaintenanceActivities.asset_id == asset_id,
                        MaintenanceActivities.oil_detail.isnot(None)
                    )
                )
                .order_by(MaintenanceActivities.scheduled_date.asc())
            )
            maintenance_records = results_result.scalars().all()
            
            if not maintenance_records:
                logger.info(f"No maintenance records found for transformer {asset_id}")
                return []
            
            # Extract maintenance data
            maintenance_data = []
            for record in maintenance_records:
                # Only include oil-related maintenance
                if record.oil_detail in ['oil_change', 'reconditioning', 'reclamation']:
                    maintenance_data.append({
                        'date': record.scheduled_date.isoformat() if record.scheduled_date else None,
                        'mtype': record.oil_detail
                    })
            
            logger.info(f"Found {len(maintenance_data)} oil maintenance records for transformer {asset_id}")
            return maintenance_data
            
        except Exception as e:
            logger.error(f"Error fetching maintenance data for asset {asset_id}: {str(e)}")
            return []
    
    # ========================================================================
    # STEP 5: Calculate IEC Status
    # ========================================================================
    async def calculate_iec_status(
        self,
        db: AsyncSession,
        asset_id: int
    ) -> Optional[Dict[str, Any]]:
        """
        Calculate IEC TR 62874:2015 status for a transformer.
        
        This is a LIVE calculation - results are NOT stored in the database.
        
        Returns:
            Full analysis output from the algorithm including test_history for charts
        """
        try:
            logger.info(f"Starting IEC 62874 calculation for transformer {asset_id}")
            
            # Step 1: Get transformer configuration
            config = await self.get_transformer_config(db, asset_id)
            if not config:
                logger.error(f"Failed to get transformer config for asset {asset_id}")
                return None
            
            logger.info(f"Config retrieved for {config['name']}: family={config['family']}, oil={config['oil_type']}")
            
            # Step 2: Get test data
            tests_data = await self.get_test_data(db, asset_id)
            if not tests_data:
                logger.warning(f"No test data found for transformer {asset_id}")
                return {
                    "error": "No test data found",
                    "message": "At least 2 valid test records are required (CO₂ and/or 2-FAL)"
                }
            
            logger.info(f"Test data retrieved: {len(tests_data)} records")
            
            # Step 3: Get maintenance data
            maintenance_data = await self.get_maintenance_data(db, asset_id)
            logger.info(f"Maintenance data retrieved: {len(maintenance_data)} records")
            
            # Step 4: Create transformer instance from config
            try:
                transformer = create_transformer_from_database(config)
                logger.info(f"Transformer instance created for {config['name']}")
            except Exception as e:
                logger.error(f"Error creating transformer instance: {str(e)}")
                return {
                    "error": "Invalid transformer configuration",
                    "message": str(e),
                    "config": config
                }
            
            # Step 5: Load data into transformer
            try:
                transformer.load_from_database(tests_data, maintenance_data)
                logger.info(f"Data loaded into transformer: {len(transformer.tests)} test records")
            except Exception as e:
                logger.error(f"Error loading data into transformer: {str(e)}")
                return {
                    "error": "Error loading test/maintenance data",
                    "message": str(e)
                }
            
            # Step 6: Run analysis
            try:
                result = transformer.analyze()
                logger.info(f"IEC 62874 analysis complete for transformer {asset_id}")
                logger.info(f"Final decision: {result.get('final_decision')}")
                logger.info(f"Validation status: {result.get('validation', {}).get('status')}")
                
                # ============================================================
                # 🔥 ADD TEST HISTORY FOR CHARTS
                # ============================================================
                result['test_history'] = tests_data
                result['maintenance_history'] = maintenance_data
                
                return result
                
            except ValueError as e:
                # Validation failed (e.g., insufficient tests, invalid insulation type)
                logger.warning(f"Validation failed: {str(e)}")
                return {
                    "error": "Validation failed",
                    "message": str(e),
                    "config": config
                }
            except Exception as e:
                logger.error(f"Error during analysis: {str(e)}", exc_info=True)
                return {
                    "error": "Analysis error",
                    "message": str(e)
                }
                
        except Exception as e:
            logger.error(f"Error calculating IEC status for transformer {asset_id}: {str(e)}", exc_info=True)
            return {
                "error": "Service error",
                "message": str(e)
            }