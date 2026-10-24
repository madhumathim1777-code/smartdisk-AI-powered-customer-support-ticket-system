from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Dict, Any

from ...db.session import get_db
from ...models.ticket import Ticket
from ...models.user import User
from ...services.ticket_service import TicketService
from ...services.gemini_service import GeminiService
from ...schemas.ai import AIAnalysisOut, ConversationSummaryOut, SuggestedResponseOut
from ...dependencies import get_current_user, require_agent_or_admin

router = APIRouter(prefix="/tickets", tags=["AI"])

@router.post("/{ticket_id}/analyze", response_model=AIAnalysisOut)
def analyze_ticket(
    ticket_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_agent_or_admin)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    analysis = TicketService.run_ai_analysis(db, ticket)
    return AIAnalysisOut.model_validate(analysis)

@router.post("/{ticket_id}/summarize", response_model=ConversationSummaryOut)
def summarize_conversation(
    ticket_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_agent_or_admin)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    messages = [
        {
            "sender_name": m.sender.full_name if m.sender else "User",
            "sender_role": m.sender.role if m.sender else "customer",
            "message": m.message,
            "is_internal": m.is_internal
        }
        for m in ticket.messages
    ]

    gemini = GeminiService()
    summary_data = gemini.summarize_conversation(ticket.title, messages)

    return ConversationSummaryOut(
        ticket_id=ticket.id,
        summary=summary_data.get("summary", ""),
        main_problem=summary_data.get("main_problem", ticket.title),
        troubleshooting_steps=summary_data.get("troubleshooting_steps", []),
        unresolved_questions=summary_data.get("unresolved_questions", []),
        recommended_next_action=summary_data.get("recommended_next_action", "Review ticket status")
    )

@router.post("/{ticket_id}/draft-response", response_model=SuggestedResponseOut)
def draft_response(
    ticket_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_agent_or_admin)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    messages = [
        {"sender": m.sender.full_name if m.sender else "User", "message": m.message}
        for m in ticket.messages if not m.is_internal
    ]

    gemini = GeminiService()
    draft = gemini.draft_customer_response(ticket.title, ticket.description, messages)

    return SuggestedResponseOut(
        suggested_response=draft,
        rationale="AI-generated response tailored to the customer's reported symptoms and sentiment."
    )
