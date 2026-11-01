from typing import Generic, TypeVar, Optional, Any, Dict
from pydantic import BaseModel, Field
from datetime import datetime, timezone

T = TypeVar("T")


class ErrorDetail(BaseModel):
    code: str
    message: str
    field: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class ResponseMetadata(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    request_id: Optional[str] = None
    page: Optional[int] = None
    page_size: Optional[int] = None
    total_count: Optional[int] = None


class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[ErrorDetail] = None
    metadata: ResponseMetadata = Field(default_factory=ResponseMetadata)

    @classmethod
    def ok(cls, data: T, metadata: Optional[ResponseMetadata] = None) -> "ApiResponse[T]":
        return cls(
            success=True,
            data=data,
            error=None,
            metadata=metadata or ResponseMetadata(),
        )

    @classmethod
    def fail(
        cls,
        code: str,
        message: str,
        field: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None,
    ) -> "ApiResponse[None]":
        meta = ResponseMetadata(request_id=request_id)
        return cls(
            success=False,
            data=None,
            error=ErrorDetail(code=code, message=message, field=field, details=details),
            metadata=meta,
        )
