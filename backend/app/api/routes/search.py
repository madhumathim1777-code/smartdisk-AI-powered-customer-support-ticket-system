from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from ...db.session import get_db
from ...models.user import User
from ...schemas.ai import SimilarTicketResult
from ...services.vector_search_service import VectorSearchService
from ...dependencies import get_current_user

router = APIRouter(prefix="/search", tags=["Search"])

class SimilarSearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 5

@router.post("/similar-tickets", response_model=List[SimilarTicketResult])
def search_similar_tickets(
    req: SimilarSearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not req.query.strip():
        return []

    vector_svc = VectorSearchService()
    results = vector_svc.search_similar_resolved_tickets(
        db=db,
        query_text=req.query,
        limit=req.limit or 5,
        user_id=str(current_user.id),
        role=current_user.role
    )
    return results
