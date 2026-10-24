from pydantic import BaseModel, EmailStr
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class AgentCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    category_ids: List[UUID] = []

class AgentUpdate(BaseModel):
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    category_ids: Optional[List[UUID]] = None

class AgentOut(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    supported_categories: List[str] = []
    active_ticket_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True
