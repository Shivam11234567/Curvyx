from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel

T = TypeVar("T")

class PaginationMeta(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int

class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    message: Optional[str] = None
    code: Optional[str] = None
    pagination: Optional[PaginationMeta] = None

class ApiErrorResponse(BaseModel):
    success: bool = False
    message: str
    code: str
