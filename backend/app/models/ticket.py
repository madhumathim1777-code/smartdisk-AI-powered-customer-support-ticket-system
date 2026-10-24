import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..db.session import Base

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    ticket_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("ticket_categories.id", ondelete="SET NULL"), nullable=True)
    priority = Column(String(20), default="medium", nullable=False, index=True)  # low, medium, high, critical
    status = Column(String(20), default="open", nullable=False, index=True)      # open, in_progress, resolved, closed, reopened
    sentiment = Column(String(50), nullable=True)
    urgency_score = Column(Integer, nullable=True)  # 1 to 10
    assigned_agent_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    first_response_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    reopened_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    customer = relationship("User", foreign_keys=[customer_id], back_populates="customer_tickets")
    assigned_agent = relationship("User", foreign_keys=[assigned_agent_id], back_populates="assigned_tickets")
    category = relationship("TicketCategory", back_populates="tickets")
    messages = relationship("TicketMessage", back_populates="ticket", cascade="all, delete-orphan", order_by="TicketMessage.created_at")
    assignments = relationship("TicketAssignment", back_populates="ticket", cascade="all, delete-orphan", order_by="TicketAssignment.assigned_at")
    ai_analysis = relationship("TicketAIAnalysis", uselist=False, back_populates="ticket", cascade="all, delete-orphan")
    embedding = relationship("TicketEmbedding", uselist=False, back_populates="ticket", cascade="all, delete-orphan")
