from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class MessageCreate(BaseModel):
    message: str
    is_internal: bool = False

class MessageOut(BaseModel):
    id: UUID
    ticket_id: UUID
    sender_id: UUID
    sender_name: Optional[str] = None
    sender_role: Optional[str] = None
    message: str
    is_internal: bool
    created_at: datetime

    class Config:
        from_attributes = True
