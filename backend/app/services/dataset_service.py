"""
Service layer for test dataset operations
Handles 100+ parameters, validation, processing, and analytics
"""

import json
import asyncio
import uuid
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_, or_, func
from fastapi import UploadFile, HTTPException
import pandas as pd
import numpy as np

from app.models.test_dataset import TestDataset, DatasetRun, DatasetParameterTemplate, DatasetStatus
from app.schemas.test_dataset import TestDatasetCreate, TestDatasetUpdate, ValidationResult
from app.core.redis import redis_client
from app.core.database import get_mongodb
from app.services.websocket_manager import connection_manager

import logging

logger = logging.getLogger(__name__)


class DatasetService:
    """
    Service for managing test datasets with 100+ parameters
    """
    
    def __init__(self):
        self.batch_size = 100  # Batch size for bulk operations
        self.max_parameters = 500  # Maximum allowed parameters per dataset
    
    async def create_dataset(
        self,
        db: AsyncSession,
        dataset_data: TestDatasetCreate,
        user_id: int
    ) -> TestDataset:
        """
        Create a new test dataset
        
        Args:
            db: Database session
            dataset_data: Dataset creation data
            user_id: ID of creating user
        
        Returns:
            Created dataset
        """
        # Validate parameters
        validation = await self.validate_parameters(dataset_data.parameters)
        if not validation.is_valid:
            raise HTTPException(
                status_code=400,
                detail=f"Parameter validation failed: {validation.errors}"
            )
        
        # Check for duplicate name and version
        existing = await db.execute(
            select(TestDataset).where(
                and_(
                    TestDataset.name == dataset_data.name,
                    TestDataset.version == dataset_data.version,
                    TestDataset.is_deleted == False
                )
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail=f"Dataset with name '{dataset_data.name}' and version '{dataset_data.version}' already exists"
            )
        
        # Create dataset
        dataset = TestDataset(
            name=dataset_data.name,
            version=dataset_data.version,
            description=dataset_data.description,
            parameters=dataset_data.parameters,
            parameter_schema=dataset_data.parameter_schema or {},
            metadata=dataset_data.metadata,
            tags=dataset_data.tags,
            created_by=user_id,
            updated_by=user_id,
            status=DatasetStatus.PENDING
        )
        
        db.add(dataset)
        await db.commit()
        await db.refresh(dataset)
        
        # Cache dataset in Redis
        await self._cache_dataset(dataset)
        
        # Notify via WebSocket
        await connection_manager.broadcast_to_stream(
            "dataset_updates",
            {
                "type": "dataset_created",
                "dataset_id": dataset.id,
                "name": dataset.name,
                "created_by": user_id,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        logger.info(f"Dataset created: {dataset.id} - {dataset.name}")
        return dataset
    
    async def get_dataset(
        self,
        db: AsyncSession,
        dataset_id: int,
        user_id: Optional[int] = None
    ) -> Optional[TestDataset]:
        """
        Get a dataset by ID with caching
        
        Args:
            db: Database session
            dataset_id: Dataset ID
            user_id: Optional user ID for permission check
        
        Returns:
            Dataset or None
        """
        # Try cache first
        cache_key = f"dataset:{dataset_id}"
        cached = await redis_client.get(cache_key)
        if cached:
            return cached
        
        # Query database
        result = await db.execute(
            select(TestDataset).where(
                and_(
                    TestDataset.id == dataset_id,
                    TestDataset.is_deleted == False
                )
            )
        )
        dataset = result.scalar_one_or_none()
        
        if dataset:
            await self._cache_dataset(dataset)
        
        return dataset
    
    async def update_dataset(
        self,
        db: AsyncSession,
        dataset_id: int,
        update_data: TestDatasetUpdate,
        user_id: int
    ) -> Optional[TestDataset]:
        """
        Update an existing dataset
        
        Args:
            db: Database session
            dataset_id: Dataset ID
            update_data: Update data
            user_id: ID of updating user
        
        Returns:
            Updated dataset
        """
        dataset = await self.get_dataset(db, dataset_id)
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        # Validate updated parameters if provided
        if update_data.parameters:
            validation = await self.validate_parameters(update_data.parameters)
            if not validation.is_valid:
                raise HTTPException(
                    status_code=400,
                    detail=f"Parameter validation failed: {validation.errors}"
                )
        
        # Update fields
        update_dict = update_data.dict(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(dataset, field, value)
        
        dataset.updated_by = user_id
        dataset.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(dataset)
        
        # Invalidate cache
        await redis_client.delete(f"dataset:{dataset_id}")
        await self._cache_dataset(dataset)
        
        # Notify via WebSocket
        await connection_manager.broadcast_to_stream(
            "dataset_updates",
            {
                "type": "dataset_updated",
                "dataset_id": dataset.id,
                "updated_by": user_id,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        return dataset
    
    async def delete_dataset(
        self,
        db: AsyncSession,
        dataset_id: int,
        user_id: int,
        hard_delete: bool = False
    ) -> bool:
        """
        Delete a dataset (soft or hard delete)
        
        Args:
            db: Database session
            dataset_id: Dataset ID
            user_id: ID of deleting user
            hard_delete: If True, permanently delete
        
        Returns:
            True if deleted
        """
        dataset = await self.get_dataset(db, dataset_id)
        if not dataset:
            return False
        
        if hard_delete:
            # Hard delete
            await db.delete(dataset)
            await redis_client.delete(f"dataset:{dataset_id}")
        else:
            # Soft delete
            dataset.is_deleted = True
            dataset.updated_by = user_id
            await db.commit()
        
        # Notify via WebSocket
        await connection_manager.broadcast_to_stream(
            "dataset_updates",
            {
                "type": "dataset_deleted",
                "dataset_id": dataset_id,
                "hard_delete": hard_delete,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        return True
    
    async def list_datasets(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None,
        user_id: Optional[int] = None
    ) -> Tuple[List[TestDataset], int]:
        """
        List datasets with pagination and filtering
        
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum records to return
            filters: Filter criteria
            user_id: Optional user ID for permission filtering
        
        Returns:
            Tuple of (datasets, total_count)
        """
        query = select(TestDataset).where(TestDataset.is_deleted == False)
        count_query = select(func.count()).select_from(TestDataset).where(TestDataset.is_deleted == False)
        
        # Apply filters
        if filters:
            if filters.get("status"):
                query = query.where(TestDataset.status == filters["status"])
                count_query = count_query.where(TestDataset.status == filters["status"])
            
            if filters.get("created_by"):
                query = query.where(TestDataset.created_by == filters["created_by"])
                count_query = count_query.where(TestDataset.created_by == filters["created_by"])
            
            if filters.get("search"):
                search_term = f"%{filters['search']}%"
                query = query.where(
                    or_(
                        TestDataset.name.ilike(search_term),
                        TestDataset.description.ilike(search_term)
                    )
                )
                count_query = count_query.where(
                    or_(
                        TestDataset.name.ilike(search_term),
                        TestDataset.description.ilike(search_term)
                    )
                )
            
            if filters.get("tags"):
                # Filter by tags (any match)
                for tag in filters["tags"]:
                    query = query.where(TestDataset.tags.contains([tag]))
                    count_query = count_query.where(TestDataset.tags.contains([tag]))
            
            if filters.get("is_archived"):
                query = query.where(TestDataset.is_archived == filters["is_archived"])
                count_query = count_query.where(TestDataset.is_archived == filters["is_archived"])
        
        # Get total count
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Get paginated results
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        datasets = result.scalars().all()
        
        return datasets, total
    
    async def validate_parameters(
        self,
        parameters: Dict[str, Any],
        schema: Optional[Dict[str, Any]] = None
    ) -> ValidationResult:
        """
        Validate dataset parameters against schema
        
        Args:
            parameters: Parameters to validate
            schema: Optional validation schema
        
        Returns:
            ValidationResult with errors and warnings
        """
        errors = []
        warnings = []
        
        # Check parameter count
        if len(parameters) > self.max_parameters:
            errors.append(f"Too many parameters: {len(parameters)} (max {self.max_parameters})")
        
        # Check for empty values
        for key, value in parameters.items():
            if value is None:
                warnings.append(f"Parameter '{key}' has null value")
            
            # Type checking
            if schema and key in schema:
                expected_type = schema[key].get("type")
                if expected_type:
                    actual_type = type(value).__name__
                    if expected_type != actual_type:
                        errors.append(
                            f"Parameter '{key}' expected type '{expected_type}' but got '{actual_type}'"
                        )
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            parameter_count=len(parameters),
            missing_parameters=[],
            invalid_parameters=[]
        )
    
    async def process_dataset(
        self,
        db: AsyncSession,
        dataset_id: int,
        user_id: int
    ) -> Dict[str, Any]:
        """
        Process a dataset - analyze parameters, generate statistics
        This is a heavy operation that runs in background
        
        Args:
            db: Database session
            dataset_id: Dataset ID
            user_id: User ID
        
        Returns:
            Processing results
        """
        dataset = await self.get_dataset(db, dataset_id)
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        # Update status
        dataset.status = DatasetStatus.PROCESSING
        await db.commit()
        
        try:
            # Simulate heavy processing (in production, this would be a Celery task)
            # Analyze parameters
            parameter_stats = await self._analyze_parameters(dataset.parameters)
            
            # Calculate quality score
            quality_score = await self._calculate_quality_score(dataset.parameters, parameter_stats)
            
            # Store results in MongoDB for flexible querying
            mongo_db = get_mongodb()
            await mongo_db.processed_datasets.insert_one({
                "dataset_id": dataset_id,
                "original_name": dataset.name,
                "parameters": dataset.parameters,
                "statistics": parameter_stats,
                "quality_score": quality_score,
                "processed_at": datetime.utcnow(),
                "processed_by": user_id
            })
            
            # Update dataset with results
            dataset.status = DatasetStatus.COMPLETED
            dataset.processing_progress = 100.0
            dataset.quality_score = quality_score
            dataset.processed_at = datetime.utcnow()
            await db.commit()
            
            # Create a run record
            run = DatasetRun(
                dataset_id=dataset_id,
                run_number=await self._get_next_run_number(db, dataset_id),
                executed_by=user_id,
                status=DatasetStatus.COMPLETED,
                results=parameter_stats,
                execution_time_ms=0  # Would be actual time in production
            )
            db.add(run)
            await db.commit()
            
            # Invalidate cache
            await redis_client.delete(f"dataset:{dataset_id}")
            
            return {
                "status": "completed",
                "quality_score": quality_score,
                "parameter_stats": parameter_stats,
                "run_id": run.id
            }
            
        except Exception as e:
            logger.error(f"Error processing dataset {dataset_id}: {e}")
            dataset.status = DatasetStatus.FAILED
            dataset.processing_progress = 0
            await db.commit()
            
            raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
    
    async def _analyze_parameters(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze parameter distribution and statistics
        
        Args:
            parameters: Dictionary of parameters
        
        Returns:
            Statistics for each parameter
        """
        stats = {}
        
        for key, value in parameters.items():
            if isinstance(value, (int, float)):
                # Numerical parameter
                stats[key] = {
                    "type": "numeric",
                    "value": value,
                    "is_null": False
                }
            elif isinstance(value, list):
                # Array parameter
                stats[key] = {
                    "type": "array",
                    "length": len(value),
                    "has_nulls": any(v is None for v in value),
                    "value": value
                }
            elif isinstance(value, dict):
                # Object parameter
                stats[key] = {
                    "type": "object",
                    "keys": list(value.keys()),
                    "value": value
                }
            else:
                # String or other type
                stats[key] = {
                    "type": type(value).__name__,
                    "value": value,
                    "is_null": value is None
                }
        
        return stats
    
    async def _calculate_quality_score(
        self,
        parameters: Dict[str, Any],
        stats: Dict[str, Any]
    ) -> float:
        """
        Calculate dataset quality score (0-100)
        
        Args:
            parameters: Original parameters
            stats: Parameter statistics
        
        Returns:
            Quality score (0-100)
        """
        score = 100.0
        
        # Penalize for missing/null values
        null_count = sum(1 for v in parameters.values() if v is None)
        score -= (null_count / len(parameters)) * 30
        
        # Penalize for overly large arrays
        for key, stat in stats.items():
            if stat.get("type") == "array" and stat.get("length", 0) > 100:
                score -= 5
        
        # Penalize for empty strings
        empty_strings = sum(
            1 for v in parameters.values() 
            if isinstance(v, str) and len(v.strip()) == 0
        )
        score -= (empty_strings / len(parameters)) * 20
        
        return max(0, min(100, score))
    
    async def _get_next_run_number(self, db: AsyncSession, dataset_id: int) -> int:
        """Get next run number for a dataset"""
        result = await db.execute(
            select(func.max(DatasetRun.run_number))
            .where(DatasetRun.dataset_id == dataset_id)
        )
        max_run = result.scalar() or 0
        return max_run + 1
    
    async def _cache_dataset(self, dataset: TestDataset):
        """Cache dataset in Redis"""
        await redis_client.setex(
            f"dataset:{dataset.id}",
            3600,  # 1 hour TTL
            {
                "id": dataset.id,
                "name": dataset.name,
                "version": dataset.version,
                "parameter_count": len(dataset.parameters),
                "status": dataset.status,
                "created_at": dataset.created_at.isoformat() if dataset.created_at else None
            }
        )
    
    async def export_dataset_to_json(
        self,
        db: AsyncSession,
        dataset_id: int,
        include_results: bool = False
    ) -> Dict[str, Any]:
        """
        Export dataset to JSON format
        
        Args:
            db: Database session
            dataset_id: Dataset ID
            include_results: Include run results
        
        Returns:
            JSON export
        """
        dataset = await self.get_dataset(db, dataset_id)
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        export_data = {
            "id": dataset.id,
            "name": dataset.name,
            "version": dataset.version,
            "description": dataset.description,
            "parameters": dataset.parameters,
            "metadata": dataset.metadata,
            "tags": dataset.tags,
            "created_at": dataset.created_at.isoformat() if dataset.created_at else None,
            "quality_score": dataset.quality_score
        }
        
        if include_results:
            # Get recent runs
            result = await db.execute(
                select(DatasetRun)
                .where(DatasetRun.dataset_id == dataset_id)
                .order_by(DatasetRun.executed_at.desc())
                .limit(5)
            )
            runs = result.scalars().all()
            export_data["recent_runs"] = [
                {
                    "run_number": run.run_number,
                    "executed_at": run.executed_at.isoformat() if run.executed_at else None,
                    "status": run.status,
                    "results": run.results
                }
                for run in runs
            ]
        
        return export_data
    
    async def import_dataset_from_json(
        self,
        db: AsyncSession,
        import_data: Dict[str, Any],
        user_id: int
    ) -> TestDataset:
        """
        Import dataset from JSON export
        
        Args:
            db: Database session
            import_data: JSON data to import
            user_id: User ID
        
        Returns:
            Created dataset
        """
        # Prepare creation data
        create_data = TestDatasetCreate(
            name=import_data.get("name"),
            version=import_data.get("version", "1.0.0"),
            description=import_data.get("description"),
            parameters=import_data.get("parameters", {}),
            metadata=import_data.get("metadata", {}),
            tags=import_data.get("tags", [])
        )
        
        return await self.create_dataset(db, create_data, user_id)
    
    async def compare_datasets(
        self,
        db: AsyncSession,
        dataset_ids: List[int]
    ) -> Dict[str, Any]:
        """
        Compare multiple datasets by their parameters
        
        Args:
            db: Database session
            dataset_ids: List of dataset IDs to compare
        
        Returns:
            Comparison results
        """
        datasets = []
        for dataset_id in dataset_ids:
            dataset = await self.get_dataset(db, dataset_id)
            if dataset:
                datasets.append(dataset)
        
        if len(datasets) < 2:
            raise HTTPException(status_code=400, detail="Need at least 2 datasets to compare")
        
        # Find common parameters
        all_parameters = set()
        for dataset in datasets:
            all_parameters.update(dataset.parameters.keys())
        
        comparison = {
            "datasets": [
                {
                    "id": d.id,
                    "name": d.name,
                    "version": d.version,
                    "parameter_count": len(d.parameters)
                }
                for d in datasets
            ],
            "common_parameters": list(all_parameters),
            "parameter_comparison": {},
            "similarity_score": 0
        }
        
        # Compare each parameter
        for param in all_parameters:
            param_values = {}
            for dataset in datasets:
                param_values[dataset.id] = dataset.parameters.get(param)
            
            # Check if all values are equal
            unique_values = set(str(v) for v in param_values.values() if v is not None)
            comparison["parameter_comparison"][param] = {
                "values": param_values,
                "is_identical": len(unique_values) <= 1,
                "unique_count": len(unique_values)
            }
        
        # Calculate similarity score (percentage of identical parameters)
        identical_count = sum(
            1 for comp in comparison["parameter_comparison"].values()
            if comp["is_identical"]
        )
        if all_parameters:
            comparison["similarity_score"] = (identical_count / len(all_parameters)) * 100
        
        return comparison


# Global service instance
dataset_service = DatasetService()