from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class AIAnalysisOut(BaseModel):
    id: UUID
    ticket_id: UUID
    predicted_category: Optional[str] = None
    urgency_score: Optional[int] = Field(None, ge=1, le=10)
    suggested_priority: Optional[str] = None
    predicted_sentiment: Optional[str] = None
    summary: Optional[str] = None
    suggested_solutions: Optional[List[str]] = []
    suggested_response: Optional[str] = None
    confidence: Optional[float] = None
    reasoning: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationSummaryOut(BaseModel):
    ticket_id: UUID
    summary: str
    main_problem: str
    troubleshooting_steps: List[str]
    unresolved_questions: List[str]
    recommended_next_action: str

class SuggestedResponseOut(BaseModel):
    suggested_response: str
    rationale: str

class SimilarTicketResult(BaseModel):
    id: UUID
    ticket_number: str
    title: str
    category: Optional[str] = None
    status: str
    resolution_summary: Optional[str] = None
    similarity_score: float
    created_at: datetime
