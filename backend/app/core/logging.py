import json
import logging
import sys
import traceback
from datetime import datetime, timezone


class JsonFormatter(logging.Formatter):
    def format(self, record):
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        for field in ("request_id", "method", "status", "duration_ms", "error_type"):
            if hasattr(record, field):
                payload[field] = getattr(record, field)
        if record.exc_info:
            payload["error_type"] = record.exc_info[0].__name__
            # Frames locate failures without dumping SQL parameters or request values.
            payload["stack"] = traceback.format_tb(record.exc_info[2])
        return json.dumps(payload)


def configure_logging(level):
    logger = logging.getLogger("app")
    logger.setLevel(level.upper())
    logger.propagate = False
    if not any(getattr(handler, "supply_chain", False) for handler in logger.handlers):
        handler = logging.StreamHandler(sys.stdout)
        handler.supply_chain = True
        handler.setFormatter(JsonFormatter())
        logger.addHandler(handler)
