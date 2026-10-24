from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models.ticket import Ticket
from ..models.message import TicketMessage
from ..models.ai_analysis import TicketAIAnalysis, TicketEmbedding
from ..models.category import TicketCategory
from ..models.audit import AuditLog
from ..models.user import User
from .gemini_service import GeminiService
from .assignment_service import AssignmentService
from .vector_search_service import VectorSearchService

class TicketService:
    @staticmethod
    def generate_ticket_number(db: Session) -> str:
        count = db.query(func.count(Ticket.id)).scalar() or 0
        return f"TICK-{1001 + count}"

    @staticmethod
    def create_ticket(
        db: Session,
        customer_id: UUID,
        title: str,
        description: str,
        category_id: Optional[UUID] = None,
        priority: str = "medium"
    ) -> Ticket:
        ticket_number = TicketService.generate_ticket_number(db)
        ticket = Ticket(
            ticket_number=ticket_number,
            customer_id=customer_id,
            title=title,
            description=description,
            category_id=category_id,
            priority=priority,
            status="open"
        )
        db.add(ticket)
        db.commit()
        db.refresh(ticket)

        # Audit log
        audit = AuditLog(
            user_id=customer_id,
            action="CREATE_TICKET",
            target_type="Ticket",
            target_id=str(ticket.id),
            details={"ticket_number": ticket_number, "title": title}
        )
        db.add(audit)
        db.commit()

        # Execute AI analysis safely (do not lose ticket if AI fails)
        try:
            TicketService.run_ai_analysis(db, ticket)
        except Exception as e:
            pass

        # Execute auto-assignment
        try:
            AssignmentService.auto_assign_ticket(db, ticket)
        except Exception:
            pass

        db.refresh(ticket)
        return ticket

    @staticmethod
    def run_ai_analysis(db: Session, ticket: Ticket) -> TicketAIAnalysis:
        categories = [c.name for c in db.query(TicketCategory).filter(TicketCategory.is_active == True).all()]
        gemini = GeminiService()
        vector_svc = VectorSearchService()

        # Look for existing analysis record
        ai_rec = db.query(TicketAIAnalysis).filter(TicketAIAnalysis.ticket_id == ticket.id).first()
        if not ai_rec:
            ai_rec = TicketAIAnalysis(ticket_id=ticket.id, status="pending")
            db.add(ai_rec)
            db.commit()
            db.refresh(ai_rec)

        try:
            result = gemini.analyze_ticket_complete(ticket.title, ticket.description, categories)
            ai_rec.predicted_category = result.get("category")
            ai_rec.urgency_score = result.get("urgency_score", 5)
            ai_rec.suggested_priority = result.get("priority", "medium")
            ai_rec.predicted_sentiment = result.get("sentiment", "Neutral")
            ai_rec.summary = result.get("summary")
            ai_rec.suggested_solutions = result.get("suggested_solutions", [])
            ai_rec.suggested_response = result.get("suggested_response")
            ai_rec.confidence = result.get("confidence", 0.8)
            ai_rec.reasoning = result.get("reasoning")
            ai_rec.status = "completed"

            # Update ticket metadata if matching category exists and ticket priority wasn't hard-locked
            ticket.urgency_score = ai_rec.urgency_score
            ticket.sentiment = ai_rec.predicted_sentiment
            if ai_rec.suggested_priority and ticket.priority == "medium":
                ticket.priority = ai_rec.suggested_priority

            if not ticket.category_id and ai_rec.predicted_category:
                matched_cat = db.query(TicketCategory).filter(
                    func.lower(TicketCategory.name) == func.lower(ai_rec.predicted_category)
                ).first()
                if matched_cat:
                    ticket.category_id = matched_cat.id

            db.commit()
            db.refresh(ai_rec)
            return ai_rec
        except Exception as e:
            ai_rec.status = "failed"
            ai_rec.error_message = str(e)
            db.commit()
            return ai_rec

    @staticmethod
    def add_message(
        db: Session,
        ticket: Ticket,
        sender: User,
        message_text: str,
        is_internal: bool = False
    ) -> TicketMessage:
        # Customers can NEVER write internal notes
        if sender.role == "customer":
            is_internal = False

        msg = TicketMessage(
            ticket_id=ticket.id,
            sender_id=sender.id,
            message=message_text,
            is_internal=is_internal
        )
        db.add(msg)

        now = datetime.now(timezone.utc)
        # Check first response time if agent/admin replying publicly
        if not is_internal and sender.role in ["agent", "admin"] and not ticket.first_response_at:
            ticket.first_response_at = now
            if ticket.status == "open":
                ticket.status = "in_progress"

        ticket.updated_at = now
        db.commit()
        db.refresh(msg)
        return msg
