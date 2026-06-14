"""
Test Dataset models for handling 1000+ datasets with 100+ parameters each
Supports flexible schema, versioning, and large dataset storage
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, Text, ForeignKey, Float, Index
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import ARRAY
from app.models.user import Base
from datetime import datetime
import enum


class DatasetStatus(str, enum.Enum):
    """Dataset processing status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    ARCHIVED = "archived"


class TestDataset(Base):
    """
    Test Dataset model - stores metadata and parameters for test datasets
    Supports 100+ parameters per dataset using JSONB
    """
    __tablename__ = "test_datasets"
    
    # Primary identifiers
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    version = Column(String(50), nullable=False, default="1.0.0")
    description = Column(Text, nullable=True)
    
    # Parameters storage (100+ parameters as key-value pairs)
    # Example: {"param1": 23.5, "param2": "test", "param3": [1,2,3]}
    parameters = Column(JSONB, nullable=False, default=dict)
    
    # Parameter schema for validation
    parameter_schema = Column(JSONB, default=dict)  # Defines expected parameters and types
    
    # Dataset metadata
    extra_metadata = Column(JSONB, default=dict)
    tags = Column(ARRAY(String), default=list)
    
    # Status tracking
    status = Column(String(20), default=DatasetStatus.PENDING)
    processing_progress = Column(Float, default=0.0)  # 0-100%
    
    # Dataset statistics
    data_points_count = Column(Integer, default=0)
    file_size_bytes = Column(Integer, default=0)
    file_path = Column(String(500), nullable=True)  # Path to large dataset file
    
    # Quality metrics
    quality_score = Column(Float, nullable=True)  # 0-100 quality score
    validation_errors = Column(JSONB, default=list)
    
    # Ownership and auditing
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)
    archived_at = Column(DateTime(timezone=True), nullable=True)
    
    # Soft delete and archiving
    is_deleted = Column(Boolean, default=False, index=True)
    is_archived = Column(Boolean, default=False, index=True)
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_dataset_name_version', 'name', 'version'),
        Index('idx_dataset_created_by_status', 'created_by', 'status'),
        Index('idx_dataset_tags', 'tags', postgresql_using='gin'),
        Index('idx_dataset_parameters', 'parameters', postgresql_using='gin'),
        Index('idx_dataset_metadata', 'metadata', postgresql_using='gin'),
    )
    
    def __repr__(self):
        return f"<TestDataset {self.name} v{self.version}>"


class DatasetRun(BaseModel):
    """
    Model for tracking individual runs/executions of a test dataset
    Useful for storing results when a dataset is executed
    """
    __tablename__ = "dataset_runs"
    
    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("test_datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Run metadata
    run_name = Column(String(255), nullable=True)
    run_number = Column(Integer, nullable=False)  # Sequential run number for dataset
    
    # Execution details
    executed_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    executed_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    execution_time_ms = Column(Integer, nullable=True)  # Execution duration
    
    # Results storage
    results = Column(JSONB, default=dict)  # Flexible results storage
    output_files = Column(JSONB, default=list)  # List of output file paths
    
    # Status
    status = Column(String(20), default=DatasetStatus.PENDING)
    error_message = Column(Text, nullable=True)
    
    # Performance metrics
    cpu_usage_percent = Column(Float, nullable=True)
    memory_usage_mb = Column(Float, nullable=True)
    
    # Indexes
    __table_args__ = (
        Index('idx_run_dataset_executed', 'dataset_id', 'executed_at'),
        Index('idx_run_executed_by', 'executed_by'),
    )
    
    def __repr__(self):
        return f"<DatasetRun dataset_id={self.dataset_id} run={self.run_number}>"


class DatasetParameterTemplate(BaseModel):
    """
    Template for common parameter sets - helps manage 100+ parameters
    Allows reusing parameter configurations across multiple datasets
    """
    __tablename__ = "dataset_parameter_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    
    # Template parameters
    parameters = Column(JSONB, nullable=False, default=dict)
    parameter_schema = Column(JSONB, default=dict)  # Validation schema
    
    # Category and tags
    category = Column(String(100), nullable=True, index=True)
    tags = Column(ARRAY(String), default=list)
    
    # Usage count (for analytics)
    usage_count = Column(Integer, default=0)
    
    # Ownership
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Indexes
    __table_args__ = (
        Index('idx_template_parameters', 'parameters', postgresql_using='gin'),
        Index('idx_template_tags', 'tags', postgresql_using='gin'),
    )
    
    def __repr__(self):
        return f"<ParameterTemplate {self.name}>"


class DatasetComparison(BaseModel):
    """
    Model for comparing results between different dataset runs
    """
    __tablename__ = "dataset_comparisons"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Runs being compared
    run_ids = Column(ARRAY(Integer), nullable=False)  # List of DatasetRun IDs
    
    # Comparison results
    comparison_data = Column(JSONB, default=dict)
    summary = Column(JSONB, default=dict)
    
    # Created by
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('idx_comparison_runs', 'run_ids', postgresql_using='gin'),
    )