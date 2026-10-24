from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from .user import UserOut
from .message import MessageOut
from .ai import AIAnalysisOut

class TicketCreate(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    description: str = Field(min_length=10)
    category_id: Optional[UUID] = None
    priority: Optional[str] = "medium"

class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_agent_id: Optional[UUID] = None

class TicketAssignRequest(BaseModel):
    agent_id: UUID
    reason: Optional[str] = "Manual assignment by supervisor"

class TicketResolveRequest(BaseModel):
    resolution_note: str

class TicketReopenRequest(BaseModel):
    reason: str

class TicketListItem(BaseModel):
    id: UUID
    ticket_number: str
    title: str
    customer_id: UUID
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    category_id: Optional[UUID] = None
    category_name: Optional[str] = None
    priority: str
    status: str
    sentiment: Optional[str] = None
    urgency_score: Optional[int] = None
    assigned_agent_id: Optional[UUID] = None
    assigned_agent_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    resolution_time_minutes: Optional[int] = None

    class Config:
        from_attributes = True

class TicketDetail(TicketListItem):
    description: str
    first_response_at: Optional[datetime] = None
    reopened_at: Optional[datetime] = None
    messages: List[MessageOut] = []
    ai_analysis: Optional[AIAnalysisOut] = None

    class Config:
        from_attributes = True

class PaginatedTickets(BaseModel):
    items: List[TicketListItem]
    total: int
    page: int
    page_size: int
    total_pages: int
