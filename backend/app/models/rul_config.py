# backend\app\models\rul_config.py
from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin


class RULSignalConfig(Base, TimestampMixin):
    """Per-asset mapping of the 3 DCS signals consumed by the RUL algorithm.

    The *_signal_id columns are logical references to
    dcs_db.dcs_signal_characteristic.id (a separate, read-only database), so
    they are plain integers rather than ForeignKeys.
    """
    __tablename__ = "rul_signal_config"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, unique=True)

    top_oil_signal_id = Column(Integer)
    ambient_signal_id = Column(Integer)
    current_signal_id = Column(Integer)

    # Relationships
    asset = relationship("Assets", foreign_keys=[asset_id])
