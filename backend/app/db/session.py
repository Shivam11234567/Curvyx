from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
from app.core.config import settings

db_uri = settings.DATABASE_URI

if not db_uri or db_uri.startswith("https://") or db_uri.startswith("http://"):
    db_uri = "sqlite:///./ecommerce.db"

connect_args = {}
if db_uri.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    db_uri,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
