"""Request limits, shared abuse protection and safe request diagnostics."""
import logging
import re
import time
from uuid import uuid4

from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool

from app.common.responses import build_error_response
from app.core.config import settings
from app.core.database import SessionLocal
from app.modules.rate_limits.service import RateLimitService

logger = logging.getLogger("app.requests")


def consume_limit(group, client, limit, session_factory=SessionLocal):
    with session_factory() as db:
        return RateLimitService(db).consume(group, client, limit, settings.RATE_LIMIT_WINDOW_SECONDS)


class ProductionMiddleware:
    def __init__(self, app, session_factory=SessionLocal):
        self.app = app
        self.session_factory = session_factory

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        headers = dict(scope.get("headers", []))
        supplied_id = headers.get(b"x-request-id", b"").decode("ascii", errors="ignore")
        request_id = supplied_id if re.fullmatch(r"[A-Za-z0-9_-]{1,64}", supplied_id) else uuid4().hex
        scope.setdefault("state", {})["request_id"] = request_id
        started = time.monotonic()
        status = 500

        async def instrument_send(message):
            nonlocal status
            if message["type"] == "http.response.start":
                status = message["status"]
                response_headers = list(message.get("headers", []))
                response_headers.extend([
                    (b"x-request-id", request_id.encode()),
                    (b"x-content-type-options", b"nosniff"),
                    (b"referrer-policy", b"no-referrer"),
                    (b"cache-control", b"no-store"),
                ])
                message = {**message, "headers": response_headers}
            await send(message)

        async def reject(code, message, http_status, extra_headers=None):
            await JSONResponse(build_error_response(code, message), status_code=http_status, headers=extra_headers)(scope, receive, instrument_send)

        try:
            raw_length = headers.get(b"content-length")
            if raw_length is not None:
                try:
                    length = int(raw_length)
                except ValueError:
                    return await reject("VALIDATION_ERROR", "Invalid Content-Length", 400)
                if length < 0:
                    return await reject("VALIDATION_ERROR", "Invalid Content-Length", 400)
                if length > settings.MAX_REQUEST_BODY_BYTES:
                    return await reject("PAYLOAD_TOO_LARGE", "Request body exceeds permitted size", 413)
            path = scope.get("path", "")
            group = "login" if path.rstrip("/") == "/api/v1/auth/login" and scope["method"] == "POST" else "tracking" if path.startswith("/api/v1/public/tracking/") and scope["method"] == "GET" else None
            if group:
                # Uvicorn resolves proxy headers only from explicitly trusted proxies.
                # Never trust caller-supplied X-Forwarded-For in application code.
                client = scope.get("client") or ("unknown", 0)
                limit = settings.LOGIN_RATE_LIMIT if group == "login" else settings.TRACKING_RATE_LIMIT
                try:
                    allowed, retry_after = await run_in_threadpool(consume_limit, group, client[0], limit, self.session_factory)
                except Exception as exc:
                    logger.error("Rate limit store unavailable", extra={"request_id": request_id, "error_type": type(exc).__name__})
                    return await reject("SERVICE_UNAVAILABLE", "Service temporarily unavailable", 503)
                if not allowed:
                    return await reject("TOO_MANY_REQUESTS", "Too many requests; retry later", 429, {"Retry-After": str(retry_after)})

            bounded_receive = receive
            if scope["method"] in {"POST", "PUT", "PATCH"}:
                chunks = []
                total = 0
                while True:
                    message = await receive()
                    if message["type"] == "http.disconnect":
                        return
                    chunk = message.get("body", b"")
                    total += len(chunk)
                    if total > settings.MAX_REQUEST_BODY_BYTES:
                        return await reject("PAYLOAD_TOO_LARGE", "Request body exceeds permitted size", 413)
                    chunks.append(chunk)
                    if not message.get("more_body", False):
                        break
                body = b"".join(chunks)
                delivered = False

                async def bounded_receive():
                    nonlocal delivered
                    if not delivered:
                        delivered = True
                        return {"type": "http.request", "body": body, "more_body": False}
                    return await receive()
            await self.app(scope, bounded_receive, instrument_send)
        finally:
            logger.info("Request completed", extra={"request_id": request_id, "method": scope["method"], "status": status, "duration_ms": round((time.monotonic() - started) * 1000, 2)})
