from app.services.analytics_service import AnalyticsService

def test_analytics_calculation(client, db_session):
    overview = AnalyticsService.get_overview(db_session)
    summary = overview["summary"]
    assert "total_tickets" in summary
    assert "open_tickets" in summary
    assert "avg_resolution_time_hours" in summary
    assert isinstance(overview["trends"], list)
    assert isinstance(overview["by_category"], list)
    assert isinstance(overview["agent_workload"], list)
