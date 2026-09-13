from typing import Dict, Any, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text, desc
from app.db.session import get_db
from app.core.config import settings
from app.core.dependencies import get_current_admin
from app.models.admin_user import AdminUser
from app.models.audit_log import AuditLog
from app.schemas.common import ApiResponse
from app.schemas.admin import SystemHealthResponse

router = APIRouter(prefix="/system", tags=["Admin System Health"])

@router.get("/health", response_model=ApiResponse[SystemHealthResponse])
def get_system_health(
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "unhealthy"

    payment_status = "configured" if settings.RAZORPAY_KEY_ID else "unconfigured"
    storage_status = "local_filesystem" if not settings.STORAGE_ENDPOINT else "s3_compatible"

    return ApiResponse(
        success=True,
        data=SystemHealthResponse(
            api_status="healthy",
            database_status=db_status,
            payment_service_status=payment_status,
            storage_status=storage_status,
            environment=settings.ENVIRONMENT,
            timestamp=datetime.now(timezone.utc)
        )
    )

@router.get("/audit-logs", response_model=ApiResponse[List[Dict[str, Any]]])
def get_audit_logs(
    limit: int = 50,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(desc(AuditLog.created_at)).limit(limit).all()
    results = [
        {
            "id": log.id,
            "admin_id": log.admin_id,
            "action": log.action,
            "entity": log.entity,
            "entity_id": log.entity_id,
            "details": log.details,
            "created_at": log.created_at.isoformat()
        } for log in logs
    ]
    return ApiResponse(success=True, data=results)
