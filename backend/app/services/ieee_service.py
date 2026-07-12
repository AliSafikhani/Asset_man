"""
IEEE Algorithm Service Layer
Handles fetching DGA samples for a transformer and running the IEEE algorithm
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

import logging

from app.models.test_results import TestResult
from app.models.tests import TestTypes
from app.models.assets import Assets
from app.models.transformers import Transformers
from app.models.test_parameters import TestParameter
from algorithms.transformer.dga.ieee_algorithm import IEEEAlgorithm
from algorithms.transformer.dga.zones import IEEEStatus

logger = logging.getLogger(__name__)


class IEEEService:
    """Service for IEEE algorithm calculations"""
    
    def __init__(self):
        self.algorithm = IEEEAlgorithm()
        # Gas indices expected by the IEEE algorithm
        self.GAS_INDICES = {
            'h2': 0, 'ch4': 1, 'c2h2': 2, 'c2h4': 3, 'c2h6': 4,
            'co': 5, 'co2': 6, 'o2': 7, 'n2': 8
        }
    
    async def get_transformer_dga_samples(
        self, 
        db: AsyncSession, 
        transformer_id: int
    ) -> List[Dict[str, Any]]:
        """
        Get all DGA samples for a specific transformer
        
        Args:
            db: Database session
            transformer_id: Transformer asset ID
            
        Returns:
            List of samples with gas data and dates
        """
        # Get DGA test type ID
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
            logger.warning(f"No DGA test type found for transformer {transformer_id}")
            return []
        
        # Get all DGA test results for this transformer
        results_result = await db.execute(
            select(TestResult)
            .where(
                and_(
                    TestResult.asset_id == transformer_id,
                    TestResult.test_type_id == test_type.id
                )
            )
            .order_by(TestResult.test_date.asc())
        )
        test_results = results_result.scalars().all()
        
        if not test_results:
            logger.info(f"No DGA samples found for transformer {transformer_id}")
            return []
        
        # Build samples list - fetch parameters separately for each result
        samples = []
        for result in test_results:
            # Get parameters for this test result
            params_result = await db.execute(
                select(TestParameter)
                .where(TestParameter.test_result_id == result.id)
            )
            parameters = params_result.scalars().all()
            
            # Extract gas data from parameters
            gas_data = {}
            for param in parameters:
                if param.field_name in self.GAS_INDICES:
                    # Use field_value (numeric) or field_value_text if numeric is null
                    value = param.field_value
                    if value is None and param.field_value_text:
                        try:
                            value = float(param.field_value_text)
                        except (ValueError, TypeError):
                            value = 0
                    gas_data[param.field_name] = value or 0
            
            # Only include if we have at least some gas data
            if any(gas_data.values()):
                samples.append({
                    'id': result.id,
                    'sample_date': result.test_date.isoformat() if result.test_date else None,
                    'gas_data': gas_data
                })
        
        logger.info(f"Found {len(samples)} DGA samples for transformer {transformer_id}")
        return samples
    
    async def get_transformer_age(
        self,
        db: AsyncSession,
        asset_id: int
    ) -> int:
        """
        Calculate transformer age in years from commissioning date
        
        Args:
            db: Database session
            asset_id: Transformer asset ID
            
        Returns:
            Age in years (integer)
        """
        # Get transformer details
        transformer_result = await db.execute(
            select(Transformers)
            .where(Transformers.asset_id == asset_id)
        )
        transformer = transformer_result.scalar_one_or_none()
        
        if not transformer:
            logger.warning(f"Transformer {asset_id} not found")
            return 0
        
        # Get commissioning date from asset
        asset_result = await db.execute(
            select(Assets)
            .where(Assets.id == asset_id)
        )
        asset = asset_result.scalar_one_or_none()
        
        if not asset or not asset.commissioning_date:
            logger.warning(f"No commissioning date for transformer {asset_id}")
            return 0
        
        # Calculate age
        today = datetime.now().date()
        age = today.year - asset.commissioning_date.year
        
        # Adjust if birthday hasn't occurred yet this year
        if (today.month, today.day) < (asset.commissioning_date.month, asset.commissioning_date.day):
            age -= 1
        
        logger.info(f"Transformer {asset_id} age: {age} years")
        return max(0, age)
    
    async def calculate_ieee_status(
        self,
        db: AsyncSession,
        asset_id: int
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Calculate IEEE status for all DGA samples of a transformer
        
        Args:
            db: Database session
            asset_id: Transformer asset ID
            
        Returns:
            List of results for each sample, or None if error
        """
        try:
            # Get all DGA samples
            samples = await self.get_transformer_dga_samples(db, asset_id)
            
            if len(samples) < 2:
                logger.info(f"Not enough samples ({len(samples)}) for IEEE algorithm on transformer {asset_id}")
                return None
            
            # Get transformer age
            tfr_age = await self.get_transformer_age(db, asset_id)
            
            # Add transformer age to samples (for the algorithm)
            for sample in samples:
                sample['transformer_age'] = tfr_age
            
            # Run the algorithm
            logger.info(f"Running IEEE algorithm on {len(samples)} samples for transformer {asset_id}")
            results = self.algorithm.calculate_batch(samples)
            
            if results:
                logger.info(f"IEEE algorithm completed with {len(results)} results")
                
                # Update database with IEEE status
                await self.update_ieee_results(db, asset_id, results)
                
                return results
            else:
                logger.warning(f"IEEE algorithm returned no results for transformer {asset_id}")
                return None
                
        except Exception as e:
            logger.error(f"Error calculating IEEE status for transformer {asset_id}: {str(e)}", exc_info=True)
            return None
    
    async def update_ieee_results(
        self,
        db: AsyncSession,
        asset_id: int,
        results: List[Dict[str, Any]]
    ) -> None:
        """
        Update test results with IEEE status
        
        Args:
            db: Database session
            asset_id: Transformer asset ID
            results: List of IEEE results with sample IDs
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
                logger.error(f"DGA test type not found for transformer {asset_id}")
                return
            
            # Get all DGA test results for this transformer
            results_result = await db.execute(
                select(TestResult)
                .where(
                    and_(
                        TestResult.asset_id == asset_id,
                        TestResult.test_type_id == test_type.id
                    )
                )
            )
            test_results = results_result.scalars().all()
            
            # Create a mapping of test result ID to result object
            result_map = {str(r.id): r for r in test_results}
            
            # Update each sample with IEEE status
            for result in results:
                sample_id = result.get('id')
                if sample_id and str(sample_id) in result_map:
                    test_result = result_map[str(sample_id)]
                    
                    # Get IEEE status data
                    status_code = result.get('status', 0)
                    status_name = result.get('status_name', 'Unknown')
                    status_color = result.get('zone_color', '#95A5A6')
                    status_description = result.get('status_description', '')
                    days_from_latest = result.get('days_from_latest', 0)
                    fault_zone = result.get('fault_zone', str(status_code))
                    fault_name = result.get('fault_name', status_name)
                    
                    # Check if IEEE status already exists in parameters
                    params_result = await db.execute(
                        select(TestParameter)
                        .where(
                            and_(
                                TestParameter.test_result_id == test_result.id,
                                TestParameter.field_name == 'ieee_status'
                            )
                        )
                    )
                    existing_param = params_result.scalar_one_or_none()
                    
                    if existing_param:
                        # Update existing IEEE status
                        existing_param.field_value = float(status_code)
                        existing_param.field_value_text = status_name
                    else:
                        # Create new parameter for IEEE status
                        new_param = TestParameter(
                            test_result_id=test_result.id,
                            field_name='ieee_status',
                            field_value=float(status_code),
                            field_value_text=status_name,
                            unit=None
                        )
                        db.add(new_param)
                    
                    # Also store additional IEEE data as separate parameters
                    ieee_details = {
                        'ieee_status_color': status_color,
                        'ieee_status_description': status_description,
                        'ieee_days_from_latest': days_from_latest,
                        'ieee_fault_zone': fault_zone,
                        'ieee_fault_name': fault_name
                    }
                    
                    for key, value in ieee_details.items():
                        # Check if this detail already exists
                        detail_result = await db.execute(
                            select(TestParameter)
                            .where(
                                and_(
                                    TestParameter.test_result_id == test_result.id,
                                    TestParameter.field_name == key
                                )
                            )
                        )
                        existing_detail = detail_result.scalar_one_or_none()
                        
                        if existing_detail:
                            # Update existing detail
                            if isinstance(value, (int, float)):
                                existing_detail.field_value = float(value)
                            else:
                                existing_detail.field_value_text = str(value)
                        else:
                            # Create new detail
                            new_detail = TestParameter(
                                test_result_id=test_result.id,
                                field_name=key,
                                field_value=float(value) if isinstance(value, (int, float)) else None,
                                field_value_text=str(value) if not isinstance(value, (int, float)) else None,
                                unit=None
                            )
                            db.add(new_detail)
            
            await db.commit()
            logger.info(f"Updated IEEE status for {len(results)} samples of transformer {asset_id}")
            
        except Exception as e:
            logger.error(f"Error updating IEEE results: {str(e)}", exc_info=True)
            await db.rollback()
    
    async def get_ieee_status_for_sample(
        self,
        db: AsyncSession,
        sample_id: int
    ) -> Optional[Dict[str, Any]]:
        """
        Get IEEE status for a specific sample
        
        Args:
            db: Database session
            sample_id: Test result ID
            
        Returns:
            IEEE status dict or None
        """
        try:
            # Get all parameters for this test result
            params_result = await db.execute(
                select(TestParameter)
                .where(TestParameter.test_result_id == sample_id)
            )
            parameters = params_result.scalars().all()
            
            if not parameters:
                return None
            
            # Extract IEEE status from parameters
            ieee_status = None
            ieee_details = {}
            
            for param in parameters:
                if param.field_name == 'ieee_status':
                    status_code = int(param.field_value) if param.field_value else 0
                    ieee_status = {
                        'status': status_code,
                        'status_name': IEEEStatus.STATUS_NAMES.get(status_code, 'Unknown'),
                        'status_color': IEEEStatus.STATUS_COLORS.get(status_code, '#95A5A6'),
                        'status_description': IEEEStatus.STATUS_DESCRIPTIONS.get(status_code, '')
                    }
                elif param.field_name == 'ieee_status_color':
                    ieee_details['status_color'] = param.field_value_text or param.field_value
                elif param.field_name == 'ieee_status_description':
                    ieee_details['status_description'] = param.field_value_text
                elif param.field_name == 'ieee_days_from_latest':
                    ieee_details['days_from_latest'] = int(param.field_value) if param.field_value else 0
                elif param.field_name == 'ieee_fault_zone':
                    ieee_details['fault_zone'] = param.field_value_text or str(param.field_value)
                elif param.field_name == 'ieee_fault_name':
                    ieee_details['fault_name'] = param.field_value_text
            
            if ieee_status:
                ieee_status.update(ieee_details)
                return ieee_status
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting IEEE status for sample {sample_id}: {str(e)}")
            return None
    
    async def get_ieee_status_for_asset(
        self,
        db: AsyncSession,
        asset_id: int
    ) -> Dict[int, Dict[str, Any]]:
        """
        Get IEEE status for all DGA samples of a transformer
        
        Args:
            db: Database session
            asset_id: Transformer asset ID
            
        Returns:
            Dictionary mapping sample ID to IEEE status
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
                return {}
            
            # Get all DGA test results for this transformer
            results_result = await db.execute(
                select(TestResult)
                .where(
                    and_(
                        TestResult.asset_id == asset_id,
                        TestResult.test_type_id == test_type.id
                    )
                )
            )
            test_results = results_result.scalars().all()
            
            status_map = {}
            for test_result in test_results:
                status = await self.get_ieee_status_for_sample(db, test_result.id)
                if status:
                    status_map[test_result.id] = status
            
            return status_map
            
        except Exception as e:
            logger.error(f"Error getting IEEE status for asset {asset_id}: {str(e)}")
            return {}