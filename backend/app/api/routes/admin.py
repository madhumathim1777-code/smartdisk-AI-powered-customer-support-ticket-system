from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from ...db.session import get_db
from ...models.user import User
from ...models.category import TicketCategory
from ...models.ticket import Ticket
from ...models.assignment import TicketAssignment
from ...schemas.admin import AgentCreate, AgentUpdate, AgentOut
from ...core.security import get_password_hash
from ...dependencies import require_admin

router = APIRouter(prefix="/admin", tags=["Administration"])

@router.get("/agents", response_model=List[AgentOut])
def list_agents(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    agents = db.query(User).filter(User.role.in_(["agent", "admin"])).all()
    out = []
    for ag in agents:
        active_count = db.query(Ticket).filter(
            Ticket.assigned_agent_id == ag.id,
            Ticket.status.in_(["open", "in_progress", "reopened"])
        ).count()
        out.append(AgentOut(
            id=ag.id,
            email=ag.email,
            full_name=ag.full_name,
            role=ag.role,
            is_active=ag.is_active,
            supported_categories=[c.name for c in ag.supported_categories],
            active_ticket_count=active_count,
            created_at=ag.created_at
        ))
    return out

@router.post("/agents", response_model=AgentOut, status_code=status.HTTP_201_CREATED)
def create_agent(agent_in: AgentCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    existing = db.query(User).filter(User.email == agent_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    new_agent = User(
        email=agent_in.email,
        full_name=agent_in.full_name,
        hashed_password=get_password_hash(agent_in.password),
        role="agent",
        is_active=True
    )

    if agent_in.category_ids:
        categories = db.query(TicketCategory).filter(TicketCategory.id.in_(agent_in.category_ids)).all()
        new_agent.supported_categories = categories

    db.add(new_agent)
    db.commit()
    db.refresh(new_agent)

    return AgentOut(
        id=new_agent.id,
        email=new_agent.email,
        full_name=new_agent.full_name,
        role=new_agent.role,
        is_active=new_agent.is_active,
        supported_categories=[c.name for c in new_agent.supported_categories],
        active_ticket_count=0,
        created_at=new_agent.created_at
    )

@router.patch("/agents/{agent_id}", response_model=AgentOut)
def update_agent(
    agent_id: UUID,
    agent_in: AgentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    agent = db.query(User).filter(User.id == agent_id, User.role.in_(["agent", "admin"])).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if agent_in.full_name is not None:
        agent.full_name = agent_in.full_name
    if agent_in.is_active is not None:
        agent.is_active = agent_in.is_active
    if agent_in.category_ids is not None:
        categories = db.query(TicketCategory).filter(TicketCategory.id.in_(agent_in.category_ids)).all()
        agent.supported_categories = categories

    db.commit()
    db.refresh(agent)

    active_count = db.query(Ticket).filter(
        Ticket.assigned_agent_id == agent.id,
        Ticket.status.in_(["open", "in_progress", "reopened"])
    ).count()

    return AgentOut(
        id=agent.id,
        email=agent.email,
        full_name=agent.full_name,
        role=agent.role,
        is_active=agent.is_active,
        supported_categories=[c.name for c in agent.supported_categories],
        active_ticket_count=active_count,
        created_at=agent.created_at
    )

@router.get("/assignments")
def list_assignments(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    assignments = db.query(TicketAssignment).order_by(TicketAssignment.assigned_at.desc()).limit(50).all()
    return [
        {
            "id": str(a.id),
            "ticket_id": str(a.ticket_id),
            "ticket_number": a.ticket.ticket_number if a.ticket else None,
            "assigned_to": a.assigned_to.full_name if a.assigned_to else "Unassigned",
            "assigned_by": a.assigned_by.full_name if a.assigned_by else "System Auto-Assign",
            "reason": a.reason,
            "assigned_at": a.assigned_at.isoformat()
        }
        for a in assignments
    ]

@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    cats = db.query(TicketCategory).all()
    return [{"id": str(c.id), "name": c.name, "description": c.description, "is_active": c.is_active} for c in cats]
