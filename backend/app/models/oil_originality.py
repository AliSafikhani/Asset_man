# backend/app/models/oil_originality.py
# Oil-originality (اصالت روغن) history records, one row per submitted analysis.
# Each record belongs to a plant and stores the submitted DSC/DTA sample curves,
# the combined authenticity verdict, and the full engine output used to render
# the detail page (feature tables + curve-comparison charts).

from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin


class OilOriginalityRecord(Base, TimestampMixin):
    __tablename__ = "oil_originality_records"

    id = Column(Integer, primary_key=True, index=True)

    # Hierarchy — a record belongs to a plant.
    plant_id = Column(Integer, ForeignKey("plants.id", ondelete="CASCADE"), nullable=False)

    # Per-plant running number shown in the list (1, 2, 3, ... within a plant).
    record_number = Column(Integer, nullable=False)

    # User-supplied metadata.
    custom_name = Column(String(255), nullable=False)
    sample_date = Column(DateTime)  # the analysis date the user enters

    # Combined verdict.
    final_status = Column(String(20))   # original / suspicious / fake
    total_score = Column(Integer)

    # Per-method verdicts + delta metrics.
    dsc_status = Column(String(20))
    dta_status = Column(String(20))
    dsc_details = Column(JSON, default={})   # {delta_tonset, delta_tmax, delta_area}
    dta_details = Column(JSON, default={})   # {delta_tonset, delta_tmax, delta_delta_t}

    # Raw submitted sample curves: {dsc:{temperature,signal}, dta:{temperature,signal}}.
    input_data = Column(JSON, default={})

    # Full engine output (sample/reference features, evaluations, aligned curves)
    # so the detail page can render feature tables and comparison charts.
    result_data = Column(JSON, default={})

    notes = Column(Text)
    created_by = Column(Integer)

    # Relationships
    plant = relationship("Plants", foreign_keys=[plant_id])
