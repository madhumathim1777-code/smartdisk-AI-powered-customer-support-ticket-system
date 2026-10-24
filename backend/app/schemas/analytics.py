from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from uuid import UUID

class MetricSummary(BaseModel):
    total_tickets: int
    open_tickets: int
    in_progress_tickets: int
    resolved_tickets: int
    high_priority_tickets: int
    avg_resolution_time_hours: float
    overdue_tickets: int
    reopened_tickets: int

class TrendDataPoint(BaseModel):
    date: str
    created: int
    resolved: int

class CategoryCount(BaseModel):
    category: str
    count: int

class PriorityCount(BaseModel):
    priority: str
    count: int

class AgentWorkload(BaseModel):
    agent_id: UUID
    agent_name: str
    assigned_count: int
    resolved_count: int
    avg_resolution_time_hours: float

class AnalyticsOverview(BaseModel):
    summary: MetricSummary
    trends: List[TrendDataPoint]
    by_category: List[CategoryCount]
    by_priority: List[PriorityCount]
    agent_workload: List[AgentWorkload]
