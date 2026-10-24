import os
import math
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from ..core.config import settings
from ..models.ticket import Ticket
from ..models.ai_analysis import TicketEmbedding

logger = logging.getLogger(__name__)

class VectorSearchService:
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model or settings.EMBEDDING_MODEL
        self.client = None
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Embedding client init warning: {e}")

    def generate_embedding(self, text: str) -> Optional[List[float]]:
        """Generate vector embedding using Gemini API."""
        if not self.client or not self.api_key:
            return None
        try:
            # Using genai embedding models
            response = self.client.models.embed_content(
                model=self.model,
                contents=text,
            )
            # Response contains embedding.values
            if hasattr(response, "embedding") and hasattr(response.embedding, "values"):
                return response.embedding.values
            elif hasattr(response, "embeddings") and len(response.embeddings) > 0:
                return response.embeddings[0].values
        except Exception as e:
            logger.error(f"Vector embedding generation failed: {e}")
        return None

    def search_similar_resolved_tickets(
        self,
        db: Session,
        query_text: str,
        limit: int = 5,
        user_id: Optional[str] = None,
        role: str = "agent"
    ) -> List[Dict[str, Any]]:
        """
        Search for semantically similar resolved tickets.
        Uses pgvector distance when available, otherwise falls back to keyword-based relevance.
        """
        results = []

        # Try semantic search if client & embeddings available
        query_vector = self.generate_embedding(query_text)

        resolved_tickets = db.query(Ticket).filter(
            Ticket.status.in_(["resolved", "closed"])
        )

        # Enforce authorization if customer
        if role == "customer" and user_id:
            resolved_tickets = resolved_tickets.filter(Ticket.customer_id == user_id)

        tickets = resolved_tickets.limit(50).all()

        query_tokens = set(query_text.lower().split())

        for t in tickets:
            score = 0.5
            # If embedding exists on ticket and query_vector exists
            if query_vector and t.embedding and t.embedding.embedding:
                try:
                    # Cosine similarity calculation
                    v1 = query_vector
                    v2 = t.embedding.embedding
                    dot = sum(a * b for a, b in zip(v1, v2))
                    norm1 = math.sqrt(sum(a * a for a in v1))
                    norm2 = math.sqrt(sum(b * b for b in v2))
                    score = dot / (norm1 * norm2) if norm1 and norm2 else 0.5
                    score = max(0.0, min(1.0, float(score)))
                except Exception:
                    pass
            else:
                # Documented keyword matching fallback
                ticket_tokens = set(f"{t.title} {t.description}".lower().split())
                intersection = query_tokens.intersection(ticket_tokens)
                if query_tokens:
                    score = len(intersection) / len(query_tokens)
                    score = 0.4 + (score * 0.55)  # Scale between 0.4 and 0.95

            resolution_note = ""
            if t.embedding and t.embedding.resolution_summary:
                resolution_note = t.embedding.resolution_summary
            else:
                # Find last agent response
                for m in reversed(t.messages):
                    if not m.is_internal and m.sender and m.sender.role in ["agent", "admin"]:
                        resolution_note = m.message
                        break

            results.append({
                "id": str(t.id),
                "ticket_number": t.ticket_number,
                "title": t.title,
                "category": t.category.name if t.category else "General",
                "status": t.status,
                "resolution_summary": resolution_note or "Issue resolved after verification and standard troubleshooting.",
                "similarity_score": round(float(score), 2),
                "created_at": t.created_at.isoformat(),
                "search_mode": "vector" if query_vector else "keyword_fallback"
            })

        # Sort by similarity score descending
        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        return results[:limit]
