from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from ..models.ticket import Ticket
from ..models.category import TicketCategory
from ..models.user import User

class AnalyticsService:
    @staticmethod
    def get_overview(db: Session, date_from: datetime = None, date_to: datetime = None) -> Dict[str, Any]:
        query = db.query(Ticket)
        if date_from:
            query = query.filter(Ticket.created_at >= date_from)
        if date_to:
            query = query.filter(Ticket.created_at <= date_to)

        all_tickets = query.all()

        total = len(all_tickets)
        open_count = sum(1 for t in all_tickets if t.status == "open")
        in_progress_count = sum(1 for t in all_tickets if t.status == "in_progress")
        resolved_count = sum(1 for t in all_tickets if t.status in ["resolved", "closed"])
        high_priority_count = sum(1 for t in all_tickets if t.priority in ["high", "critical"])
        reopened_count = sum(1 for t in all_tickets if t.status == "reopened")

        # Overdue tickets: Open or in progress created more than 48 hours ago
        now = datetime.now(timezone.utc)
        overdue_threshold = now - timedelta(hours=48)
        overdue_count = sum(
            1 for t in all_tickets
            if t.status in ["open", "in_progress", "reopened"] and (t.created_at.replace(tzinfo=timezone.utc) if t.created_at.tzinfo is None else t.created_at) < overdue_threshold
        )

        # Average resolution time in hours for resolved tickets
        durations = []
        for t in all_tickets:
            if t.resolved_at and t.created_at:
                c_at = t.created_at.replace(tzinfo=timezone.utc) if t.created_at.tzinfo is None else t.created_at
                r_at = t.resolved_at.replace(tzinfo=timezone.utc) if t.resolved_at.tzinfo is None else t.resolved_at
                diff = (r_at - c_at).total_seconds() / 3600.0
                if diff >= 0:
                    durations.append(diff)
        avg_resolution_hours = round(sum(durations) / len(durations), 1) if durations else 0.0

        # Trends over last 7 days
        trends_map: Dict[str, Dict[str, int]] = {}
        for i in range(6, -1, -1):
            day_str = (now - timedelta(days=i)).strftime("%b %d")
            trends_map[day_str] = {"created": 0, "resolved": 0}

        for t in all_tickets:
            c_str = t.created_at.strftime("%b %d")
            if c_str in trends_map:
                trends_map[c_str]["created"] += 1
            if t.resolved_at:
                r_str = t.resolved_at.strftime("%b %d")
                if r_str in trends_map:
                    trends_map[r_str]["resolved"] += 1

        trends = [{"date": k, "created": v["created"], "resolved": v["resolved"]} for k, v in trends_map.items()]

        # Category distribution
        categories = db.query(TicketCategory).all()
        cat_map = {c.id: c.name for c in categories}
        cat_counts: Dict[str, int] = {}
        for t in all_tickets:
            name = cat_map.get(t.category_id, "General / Other")
            cat_counts[name] = cat_counts.get(name, 0) + 1
        by_category = [{"category": k, "count": v} for k, v in cat_counts.items()]

        # Priority distribution
        priority_counts: Dict[str, int] = {}
        for t in all_tickets:
            p = t.priority.capitalize()
            priority_counts[p] = priority_counts.get(p, 0) + 1
        by_priority = [{"priority": k, "count": v} for k, v in priority_counts.items()]

        # Agent Workload
        agents = db.query(User).filter(User.role.in_(["agent", "admin"])).all()
        agent_workload = []
        for ag in agents:
            assigned = sum(1 for t in all_tickets if t.assigned_agent_id == ag.id and t.status in ["open", "in_progress", "reopened"])
            ag_resolved = [
                (t.resolved_at - t.created_at).total_seconds() / 3600.0
                for t in all_tickets
                if t.assigned_agent_id == ag.id and t.resolved_at and t.created_at
            ]
            ag_avg = round(sum(ag_resolved) / len(ag_resolved), 1) if ag_resolved else 0.0
            agent_workload.append({
                "agent_id": str(ag.id),
                "agent_name": ag.full_name,
                "assigned_count": assigned,
                "resolved_count": len(ag_resolved),
                "avg_resolution_time_hours": ag_avg
            })

        return {
            "summary": {
                "total_tickets": total,
                "open_tickets": open_count,
                "in_progress_tickets": in_progress_count,
                "resolved_tickets": resolved_count,
                "high_priority_tickets": high_priority_count,
                "avg_resolution_time_hours": avg_resolution_hours,
                "overdue_tickets": overdue_count,
                "reopened_tickets": reopened_count
            },
            "trends": trends,
            "by_category": by_category,
            "by_priority": by_priority,
            "agent_workload": agent_workload
        }
