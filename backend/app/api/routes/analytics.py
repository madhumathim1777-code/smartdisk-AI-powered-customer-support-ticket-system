from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from ...db.session import get_db
from ...models.user import User
from ...schemas.analytics import AnalyticsOverview
from ...services.analytics_service import AnalyticsService
from ...dependencies import require_agent_or_admin

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview", response_model=AnalyticsOverview)
def get_analytics_overview(
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_agent_or_admin)
):
    data = AnalyticsService.get_overview(db=db, date_from=date_from, date_to=date_to)
    return data

@router.get("/ticket-trends")
def get_ticket_trends(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_agent_or_admin)
):
    overview = AnalyticsService.get_overview(db=db)
    return overview["trends"]

@router.get("/categories")
def get_category_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_agent_or_admin)
):
    overview = AnalyticsService.get_overview(db=db)
    return overview["by_category"]

@router.get("/agents")
def get_agent_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_agent_or_admin)
):
    overview = AnalyticsService.get_overview(db=db)
    return overview["agent_workload"]
