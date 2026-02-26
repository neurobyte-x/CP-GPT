"""
Custom exception classes and HTTP exception handlers.
"""

from fastapi import HTTPException, status


class AppException(HTTPException):
    """Base application exception."""

    def __init__(self, detail: str, status_code: int = 500):
        super().__init__(status_code=status_code, detail=detail)


class NotFoundException(AppException):
    def __init__(self, resource: str = "Resource"):
        super().__init__(
            detail=f"{resource} not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class ConflictException(AppException):
    def __init__(self, detail: str = "Resource already exists"):
        super().__init__(
            detail=detail,
            status_code=status.HTTP_409_CONFLICT,
        )


class ForbiddenException(AppException):
    def __init__(self, detail: str = "Access denied"):
        super().__init__(
            detail=detail,
            status_code=status.HTTP_403_FORBIDDEN,
        )


class UnauthorizedException(AppException):
    def __init__(self, detail: str = "Invalid credentials"):
        super().__init__(
            detail=detail,
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class BadRequestException(AppException):
    def __init__(self, detail: str = "Bad request"):
        super().__init__(
            detail=detail,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class RateLimitException(AppException):
    def __init__(self, detail: str = "Rate limit exceeded"):
        super().__init__(
            detail=detail,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        )


class ExternalAPIException(AppException):
    def __init__(self, service: str = "external service", detail: str = ""):
        super().__init__(
            detail=f"Error communicating with {service}: {detail}",
            status_code=status.HTTP_502_BAD_GATEWAY,
        )
