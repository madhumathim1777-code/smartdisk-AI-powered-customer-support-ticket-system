import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
try:
    from pgvector.sqlalchemy import Vector
    HAS_PGVECTOR = True
except ImportError:
    HAS_PGVECTOR = False
from ..db.session import Base

class TicketAIAnalysis(Base):
    __tablename__ = "ticket_ai_analyses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    predicted_category = Column(String(100), nullable=True)
    urgency_score = Column(Integer, nullable=True)  # 1 to 10
    suggested_priority = Column(String(20), nullable=True)
    predicted_sentiment = Column(String(50), nullable=True)
    summary = Column(Text, nullable=True)
    suggested_solutions = Column(JSON, nullable=True)   # List of strings
    suggested_response = Column(Text, nullable=True)
    confidence = Column(Float, nullable=True)
    reasoning = Column(Text, nullable=True)
    status = Column(String(20), default="pending", nullable=False)  # pending, completed, failed
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    ticket = relationship("Ticket", back_populates="ai_analysis")

class TicketEmbedding(Base):
    __tablename__ = "ticket_embeddings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    resolution_summary = Column(Text, nullable=True)
    # If pgvector is present, use Vector(768); otherwise fallback to JSON vector list
    if HAS_PGVECTOR:
        embedding = Column(Vector(768), nullable=True)
    else:
        embedding = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    ticket = relationship("Ticket", back_populates="embedding")
