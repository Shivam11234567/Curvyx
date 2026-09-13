from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog

def log_admin_action(
    db: Session,
    admin_id: str,
    action: str,
    entity: str,
    entity_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
) -> AuditLog:
    log_entry = AuditLog(
        admin_id=admin_id,
        action=action,
        entity=entity,
        entity_id=entity_id,
        details=details
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry
