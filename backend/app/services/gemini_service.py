import os
import json
import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

class TicketAnalysisResult(BaseModel):
    category: str = Field(description="Predicted ticket category such as Technical Issue, Billing, Account Access, Feature Request, General Inquiry")
    urgency_score: int = Field(ge=1, le=10, description="Urgency score from 1 to 10")
    priority: str = Field(description="Suggested priority: low, medium, high, critical")
    sentiment: str = Field(description="Customer sentiment: Frustrated, Neutral, Satisfied, Urgent, Angry")
    summary: str = Field(description="Brief concise summary of the issue")
    suggested_solutions: List[str] = Field(description="Actionable troubleshooting steps")
    suggested_response: str = Field(description="Empathetic, professional initial response draft")
    confidence: float = Field(ge=0.0, le=1.0, description="Estimated confidence score between 0.0 and 1.0")
    reasoning: str = Field(description="Short rationale explaining the classification and urgency")

class ConversationSummaryResult(BaseModel):
    summary: str
    main_problem: str
    troubleshooting_steps: List[str]
    unresolved_questions: List[str]
    recommended_next_action: str

class GeminiService:
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.model = model or os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
        self.client = None
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Could not initialize google.genai Client: {e}")

    def analyze_ticket_complete(self, title: str, description: str, categories: List[str]) -> Dict[str, Any]:
        """Perform comprehensive structured analysis of a ticket."""
        # Check if client available and key present
        if not self.client or not self.api_key:
            return self._heuristic_fallback_analysis(title, description, categories)

        prompt = f"""You are the AI triage assistant for SmartDesk AI.
Analyze the following customer support ticket and return a JSON object.

Allowed Categories: {', '.join(categories)}

Customer Ticket:
Title: {title}
Description: {description}

Return ONLY a valid JSON object matching this schema:
{{
  "category": "One of the allowed categories",
  "urgency_score": 1-10,
  "priority": "low" | "medium" | "high" | "critical",
  "sentiment": "Frustrated" | "Neutral" | "Satisfied" | "Urgent" | "Concerned",
  "summary": "1-2 sentence issue summary",
  "suggested_solutions": ["step 1", "step 2", "step 3"],
  "suggested_response": "Empathetic, polite response to customer acknowledging the problem",
  "confidence": 0.1 to 1.0,
  "reasoning": "Reason for priority and categorization"
}}
"""
        try:
            from google.genai import types
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                )
            )
            raw_text = response.text or "{}"
            data = json.loads(raw_text)
            # Validate through Pydantic
            validated = TicketAnalysisResult(**data)
            return validated.model_dump()
        except Exception as e:
            logger.error(f"Gemini API analysis failed: {e}. Falling back to safe heuristic.")
            return self._heuristic_fallback_analysis(title, description, categories, str(e))

    def summarize_conversation(self, title: str, messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Summarize conversation history identifying main problem and next steps."""
        if not self.client or not self.api_key:
            return self._heuristic_conversation_summary(title, messages)

        dialogue = "\n".join([
            f"[{msg.get('sender_role', 'user').upper()}] {msg.get('sender_name', 'User')}: {msg.get('message', '')}"
            for msg in messages if not msg.get("is_internal")
        ])

        prompt = f"""You are SmartDesk AI's conversation summarizer.
Summarize the following support conversation for ticket "{title}".

Conversation:
{dialogue if dialogue.strip() else "[No messages yet]"}

Return ONLY a valid JSON object matching this schema:
{{
  "summary": "Concise chronological overview of what was discussed",
  "main_problem": "Core unresolved customer issue",
  "troubleshooting_steps": ["Action taken 1", "Action taken 2"],
  "unresolved_questions": ["Any pending question or missing detail"],
  "recommended_next_action": "Specific next recommendation for support staff"
}}
"""
        try:
            from google.genai import types
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                )
            )
            raw_text = response.text or "{}"
            return json.loads(raw_text)
        except Exception as e:
            logger.error(f"Gemini summarization failed: {e}")
            return self._heuristic_conversation_summary(title, messages)

    def draft_customer_response(self, ticket_title: str, ticket_description: str, messages: List[Dict[str, Any]]) -> str:
        """Draft a helpful, polite agent reply."""
        if not self.client or not self.api_key:
            return f"Hello, thank you for reaching out regarding '{ticket_title}'. We have received your update and our team is actively investigating the issue. We will update you with the next steps shortly."

        prompt = f"""You are a professional, empathetic senior support engineer at SmartDesk.
Draft a clear, courteous, and actionable public response to the customer for ticket:
Title: {ticket_title}
Original Description: {ticket_description}
Last messages: {json.dumps(messages[-3:] if messages else [])}

Provide only the drafted message text, no conversational preamble or markdown backticks."""
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
            )
            return response.text.strip()
        except Exception as e:
            logger.error(f"Draft response failed: {e}")
            return f"Hello, thank you for contacting SmartDesk support regarding '{ticket_title}'. We are reviewing your details and will assist you right away."

    def _heuristic_fallback_analysis(self, title: str, description: str, categories: List[str], error: Optional[str] = None) -> Dict[str, Any]:
        """Robust deterministic classification fallback when Gemini API key is missing or offline."""
        text = f"{title} {description}".lower()

        # Urgency & Priority Detection
        urgency = 5
        priority = "medium"
        sentiment = "Neutral"

        if any(w in text for w in ["down", "outage", "broken", "critical", "immediately", "crash", "lost data", "emergency"]):
            urgency = 9
            priority = "critical"
            sentiment = "Frustrated"
        elif any(w in text for w in ["error", "fail", "cannot access", "stuck", "urgent", "charge", "refund", "unauthorized"]):
            urgency = 7
            priority = "high"
            sentiment = "Frustrated"
        elif any(w in text for w in ["how to", "question", "feature", "suggest", "info"]):
            urgency = 3
            priority = "low"
            sentiment = "Neutral"

        # Category detection
        category = categories[0] if categories else "General Inquiry"
        if any(w in text for w in ["payment", "invoice", "charge", "bill", "refund", "credit card", "subscription"]):
            for c in categories:
                if "bill" in c.lower() or "pay" in c.lower():
                    category = c
                    break
        elif any(w in text for w in ["login", "password", "2fa", "sso", "locked", "account", "access", "auth"]):
            for c in categories:
                if "account" in c.lower() or "access" in c.lower() or "auth" in c.lower():
                    category = c
                    break
        elif any(w in text for w in ["bug", "api", "timeout", "latency", "crash", "error 500", "database", "ui"]):
            for c in categories:
                if "tech" in c.lower() or "software" in c.lower() or "bug" in c.lower():
                    category = c
                    break
        elif any(w in text for w in ["ship", "tracking", "delivery", "order", "package", "return"]):
            for c in categories:
                if "order" in c.lower() or "ship" in c.lower():
                    category = c
                    break

        return {
            "category": category,
            "urgency_score": urgency,
            "priority": priority,
            "sentiment": sentiment,
            "summary": f"Customer is reporting: {title}. Requires timely verification and technical assessment.",
            "suggested_solutions": [
                "Verify customer identity and associated account permissions.",
                "Review recent platform logs and error timestamps.",
                "Provide troubleshooting steps or escalate to specialized tier if unresolved."
            ],
            "suggested_response": f"Hi there, thanks for contacting SmartDesk support regarding '{title}'. We are reviewing this right now and will help you resolve it as quickly as possible.",
            "confidence": 0.82,
            "reasoning": f"Determined via content analysis based on keywords ({sentiment.lower()} sentiment indicators detected). {('API Note: ' + error) if error else ''}"
        }

    def _heuristic_conversation_summary(self, title: str, messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        return {
            "summary": f"Discussion regarding ticket '{title}'. Total {len(messages)} interaction messages exchanged.",
            "main_problem": f"Customer requested resolution for '{title}'.",
            "troubleshooting_steps": ["Customer described problem symptoms", "Agent acknowledged and provided preliminary verification steps"],
            "unresolved_questions": ["Awaiting customer confirmation of resolution."],
            "recommended_next_action": "Follow up with customer within SLA window."
        }
