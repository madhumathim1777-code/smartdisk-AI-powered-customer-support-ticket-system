from app.services.gemini_service import GeminiService

def test_heuristic_fallback_offline():
    svc = GeminiService(api_key="")  # Empty API key triggers graceful deterministic fallback
    result = svc.analyze_ticket_complete(
        title="Payment gateway critical outage",
        description="All credit card charges are failing with 500 error",
        categories=["Billing & Payments", "Technical Issue"]
    )
    assert result["urgency_score"] >= 8
    assert result["priority"] in ["high", "critical"]
    assert "Billing" in result["category"] or "Technical" in result["category"]
    assert len(result["suggested_solutions"]) >= 1

def test_summarize_fallback():
    svc = GeminiService(api_key="")
    summary = svc.summarize_conversation(
        title="API rate limit exceeded",
        messages=[{"sender_role": "customer", "message": "Why is my key throttled?"}]
    )
    assert "summary" in summary
    assert "main_problem" in summary
    assert len(summary["troubleshooting_steps"]) > 0
