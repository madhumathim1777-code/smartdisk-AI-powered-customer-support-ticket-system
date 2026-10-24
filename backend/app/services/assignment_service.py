import logging
from typing import Optional, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models.user import User
from ..models.ticket import Ticket
from ..models.category import TicketCategory
from ..models.assignment import TicketAssignment

logger = logging.getLogger(__name__)

class AssignmentService:
    @staticmethod
    def auto_assign_ticket(db: Session, ticket: Ticket) -> Tuple[Optional[User], str]:
        """
        Deterministic workload-based algorithm:
        1. Find all active agents.
        2. Match agents who support the ticket's category.
        3. If matching agents found, pick the one with the lowest open ticket workload.
        4. If no category-specific agent found, pick the overall least loaded active agent.
        5. If no active agent exists, leave unassigned.
        """
        active_agents = db.query(User).filter(
            User.role.in_(["agent", "admin"]),
            User.is_active == True
        ).all()

        if not active_agents:
            return None, "No active support agents available in the system."

        # Compute workload (count of open/in_progress tickets) for each agent
        agent_workloads = {}
        for agent in active_agents:
            count = db.query(func.count(Ticket.id)).filter(
                Ticket.assigned_agent_id == agent.id,
                Ticket.status.in_(["open", "in_progress", "reopened"])
            ).scalar() or 0
            agent_workloads[agent.id] = count

        # Check for category matches
        candidate_agents = []
        if ticket.category_id:
            for agent in active_agents:
                category_ids = [c.id for c in agent.supported_categories]
                if ticket.category_id in category_ids:
                    candidate_agents.append(agent)

        chosen_agent = None
        reason = ""

        if candidate_agents:
            # Sort by workload ascending
            candidate_agents.sort(key=lambda a: agent_workloads[a.id])
            chosen_agent = candidate_agents[0]
            reason = f"Category match ({ticket.category.name if ticket.category else 'Category'}) with lowest active workload ({agent_workloads[chosen_agent.id]} tickets)"
        else:
            # Fall back to overall least loaded agent
            active_agents.sort(key=lambda a: agent_workloads[a.id])
            chosen_agent = active_agents[0]
            reason = f"General pool assignment to agent with lowest active workload ({agent_workloads[chosen_agent.id]} tickets)"

        # Apply assignment
        ticket.assigned_agent_id = chosen_agent.id
        assignment_record = TicketAssignment(
            ticket_id=ticket.id,
            assigned_by_id=None,  # System automated
            assigned_to_id=chosen_agent.id,
            reason=reason
        )
        db.add(assignment_record)
        db.commit()
        db.refresh(ticket)

        return chosen_agent, reason
