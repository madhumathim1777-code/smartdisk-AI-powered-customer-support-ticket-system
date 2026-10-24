from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID
from datetime import datetime, timezone

from ...db.session import get_db
from ...models.ticket import Ticket
from ...models.user import User
from ...models.category import TicketCategory
from ...models.assignment import TicketAssignment
from ...models.audit import AuditLog
from ...schemas.ticket import (
    TicketCreate,
    TicketUpdate,
    TicketListItem,
    TicketDetail,
    PaginatedTickets,
    TicketAssignRequest,
    TicketResolveRequest,
    TicketReopenRequest,
)
from ...schemas.message import MessageCreate, MessageOut
from ...services.ticket_service import TicketService
from ...dependencies import get_current_user, require_agent_or_admin

router = APIRouter(prefix="/tickets", tags=["Tickets"])

def _format_ticket_item(t: Ticket) -> TicketListItem:
    res_min = None
    if t.resolved_at and t.created_at:
        c_at = t.created_at.replace(tzinfo=timezone.utc) if t.created_at.tzinfo is None else t.created_at
        r_at = t.resolved_at.replace(tzinfo=timezone.utc) if t.resolved_at.tzinfo is None else t.resolved_at
        res_min = int((r_at - c_at).total_seconds() / 60)

    return TicketListItem(
        id=t.id,
        ticket_number=t.ticket_number,
        title=t.title,
        customer_id=t.customer_id,
        customer_name=t.customer.full_name if t.customer else "Customer",
        customer_email=t.customer.email if t.customer else "",
        category_id=t.category_id,
        category_name=t.category.name if t.category else "General",
        priority=t.priority,
        status=t.status,
        sentiment=t.sentiment,
        urgency_score=t.urgency_score,
        assigned_agent_id=t.assigned_agent_id,
        assigned_agent_name=t.assigned_agent.full_name if t.assigned_agent else None,
        created_at=t.created_at,
        updated_at=t.updated_at,
        resolved_at=t.resolved_at,
        resolution_time_minutes=res_min,
    )

@router.post("", response_model=TicketDetail, status_code=status.HTTP_201_CREATED)
def create_ticket(
    ticket_in: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = TicketService.create_ticket(
        db=db,
        customer_id=current_user.id,
        title=ticket_in.title,
        description=ticket_in.description,
        category_id=ticket_in.category_id,
        priority=ticket_in.priority or "medium"
    )
    return get_ticket_detail(ticket_id=ticket.id, db=db, current_user=current_user)

@router.get("", response_model=PaginatedTickets)
def list_tickets(
    search: Optional[str] = None,
    category_id: Optional[UUID] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    agent_id: Optional[UUID] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Ticket)

    # Access control: Customers only see their own tickets
    if current_user.role == "customer":
        query = query.filter(Ticket.customer_id == current_user.id)
    elif current_user.role == "agent" and agent_id == current_user.id:
        query = query.filter(Ticket.assigned_agent_id == current_user.id)

    if category_id:
        query = query.filter(Ticket.category_id == category_id)
    if status and status != "all":
        query = query.filter(Ticket.status == status)
    if priority and priority != "all":
        query = query.filter(Ticket.priority == priority)
    if agent_id and current_user.role != "customer":
        query = query.filter(Ticket.assigned_agent_id == agent_id)

    if search:
        s = f"%{search}%"
        query = query.filter((Ticket.title.ilike(s)) | (Ticket.ticket_number.ilike(s)) | (Ticket.description.ilike(s)))

    total = query.count()
    tickets = query.order_by(Ticket.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    items = [_format_ticket_item(t) for t in tickets]
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedTickets(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{ticket_id}", response_model=TicketDetail)
def get_ticket_detail(
    ticket_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Isolation check: customer cannot view other customer's ticket
    if current_user.role == "customer" and ticket.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this ticket")

    base = _format_ticket_item(ticket)

    # Filter messages: customers MUST NEVER see internal notes
    messages = []
    for m in ticket.messages:
        if m.is_internal and current_user.role == "customer":
            continue
        messages.append(MessageOut(
            id=m.id,
            ticket_id=m.ticket_id,
            sender_id=m.sender_id,
            sender_name=m.sender.full_name if m.sender else "User",
            sender_role=m.sender.role if m.sender else "customer",
            message=m.message,
            is_internal=m.is_internal,
            created_at=m.created_at
        ))

    return TicketDetail(
        **base.model_dump(),
        description=ticket.description,
        first_response_at=ticket.first_response_at,
        reopened_at=ticket.reopened_at,
        messages=messages,
        ai_analysis=ticket.ai_analysis
    )

@router.patch("/{ticket_id}", response_model=TicketDetail)
def update_ticket(
    ticket_id: UUID,
    update_data: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role == "customer":
        raise HTTPException(status_code=403, detail="Customers cannot modify ticket metadata")

    if update_data.priority:
        ticket.priority = update_data.priority
    if update_data.status:
        ticket.status = update_data.status
        if update_data.status in ["resolved", "closed"] and not ticket.resolved_at:
            ticket.resolved_at = datetime.now(timezone.utc)
    if update_data.category_id:
        ticket.category_id = update_data.category_id
    if update_data.assigned_agent_id:
        ticket.assigned_agent_id = update_data.assigned_agent_id

    ticket.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ticket)
    return get_ticket_detail(ticket_id=ticket.id, db=db, current_user=current_user)

@router.post("/{ticket_id}/messages", response_model=MessageOut)
def add_message(
    ticket_id: UUID,
    message_in: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role == "customer" and ticket.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to post to this ticket")

    msg = TicketService.add_message(
        db=db,
        ticket=ticket,
        sender=current_user,
        message_text=message_in.message,
        is_internal=message_in.is_internal
    )
    return MessageOut(
        id=msg.id,
        ticket_id=msg.ticket_id,
        sender_id=msg.sender_id,
        sender_name=current_user.full_name,
        sender_role=current_user.role,
        message=msg.message,
        is_internal=msg.is_internal,
        created_at=msg.created_at
    )

@router.post("/{ticket_id}/assign")
def assign_ticket(
    ticket_id: UUID,
    req: TicketAssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_agent_or_admin)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    agent = db.query(User).filter(User.id == req.agent_id, User.role.in_(["agent", "admin"])).first()
    if not agent or not agent.is_active:
        raise HTTPException(status_code=400, detail="Target agent is invalid or inactive")

    ticket.assigned_agent_id = agent.id
    ticket.updated_at = datetime.now(timezone.utc)

    assignment = TicketAssignment(
        ticket_id=ticket.id,
        assigned_by_id=current_user.id,
        assigned_to_id=agent.id,
        reason=req.reason
    )
    db.add(assignment)
    db.commit()
    return {"message": f"Assigned to {agent.full_name}", "agent_name": agent.full_name}

@router.post("/{ticket_id}/resolve")
def resolve_ticket(
    ticket_id: UUID,
    req: TicketResolveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_agent_or_admin)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket.status = "resolved"
    ticket.resolved_at = datetime.now(timezone.utc)
    ticket.updated_at = datetime.now(timezone.utc)

    # Post resolution message
    TicketService.add_message(
        db=db,
        ticket=ticket,
        sender=current_user,
        message_text=f"Resolution note: {req.resolution_note}",
        is_internal=False
    )
    return {"message": "Ticket marked as resolved", "resolved_at": ticket.resolved_at}

@router.post("/{ticket_id}/reopen")
def reopen_ticket(
    ticket_id: UUID,
    req: TicketReopenRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role == "customer" and ticket.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if ticket.status not in ["resolved", "closed"]:
        raise HTTPException(status_code=400, detail="Only resolved or closed tickets can be reopened")

    ticket.status = "reopened"
    ticket.reopened_at = datetime.now(timezone.utc)
    ticket.resolved_at = None
    ticket.updated_at = datetime.now(timezone.utc)

    TicketService.add_message(
        db=db,
        ticket=ticket,
        sender=current_user,
        message_text=f"Ticket reopened by {current_user.full_name}. Reason: {req.reason}",
        is_internal=False
    )
    return {"message": "Ticket successfully reopened", "status": "reopened"}
