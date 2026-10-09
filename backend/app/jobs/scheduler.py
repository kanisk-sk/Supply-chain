"""Lightweight scheduled alert evaluator.

A single in-process polling loop (no Celery/Redis): every
``SCHEDULER_INTERVAL_SECONDS`` it runs :func:`app.jobs.service.run_overdue_check`,
which reconciles SHIPMENT_OVERDUE alerts for the affected shipments.

Run as a standalone daemon::

    python -m app.jobs.scheduler

or enable ``SCHEDULER_ENABLED=true`` to run it on a background thread inside the
FastAPI app (see ``app.main.create_app``).
"""

from __future__ import annotations

import logging
import threading
from collections.abc import Callable

from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.database import SessionLocal
from app.jobs.service import run_overdue_check
from app.jobs.repositories import SchedulerOwnership

logger = logging.getLogger("app.jobs.scheduler")


def run_once(session_factory: sessionmaker = SessionLocal) -> dict:
    """Execute one overdue-alert check against ``session_factory``."""
    with session_factory() as db:
        from app.modules.rate_limits.service import RateLimitService
        RateLimitService(db).cleanup()
        report = run_overdue_check(db)
    logger.info(
        "Overdue alert check: checked=%s created=%s resolved=%s",
        report["checked"],
        report["created"],
        report["resolved"],
    )
    return report


def run_loop(
    *,
    interval_seconds: int | None = None,
    session_factory: sessionmaker = SessionLocal,
    stop_event: threading.Event | None = None,
    on_tick: Callable[[dict], None] | None = None,
    ownership_factory=SchedulerOwnership,
) -> None:
    """Poll forever (until ``stop_event``) running one check per interval.

    ``on_tick`` is an optional hook (logging/tests) invoked with each report.
    """
    stop = stop_event if stop_event is not None else threading.Event()
    interval = interval_seconds or settings.SCHEDULER_INTERVAL_SECONDS
    logger.info("Scheduler started (interval=%ss)", interval)

    ownership = ownership_factory(session_factory)
    owner = False
    try:
        while not stop.is_set():
            try:
                if owner and not ownership.owned():
                    logger.warning("Scheduler ownership lost; suppressing evaluation")
                    ownership.release()
                    owner = False
                if not owner:
                    owner = ownership.acquire()
                    if owner:
                        logger.info("Scheduler ownership acquired")
                if owner:
                    report = run_once(session_factory)
                    if on_tick:
                        on_tick(report)
            except Exception:
                logger.exception("Scheduler evaluation/ownership check failed")
                try:
                    ownership.release()
                except Exception:
                    logger.exception("Scheduler ownership release failed")
                owner = False
            if stop.wait(interval):
                break
    finally:
        try:
            ownership.release()
        except Exception:
            logger.exception("Scheduler ownership release failed during shutdown")
        logger.info("Scheduler stopped")


def run_owned_once(
    session_factory: sessionmaker = SessionLocal,
    ownership_factory=SchedulerOwnership,
) -> dict | None:
    """Run a bounded external job, sharing ownership with any daemon."""
    ownership = ownership_factory(session_factory)
    try:
        if not ownership.acquire():
            logger.info("Another scheduler owns this database; skipping")
            return None
        return run_once(session_factory)
    finally:
        ownership.release()


def main() -> None:
    import argparse
    # Standalone jobs must register the whole ORM relationship graph.
    import app.modules.users.models
    import app.modules.suppliers.models
    import app.modules.products.models
    import app.modules.warehouses.models
    import app.modules.inventory.models
    import app.modules.orders.models
    import app.modules.shipments.models
    import app.modules.alerts.models
    import app.modules.audit_logs.models
    import app.modules.rate_limits.models

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--once", action="store_true", help="Run one check and exit; failures exit nonzero")
    args = parser.parse_args()
    from app.core.logging import configure_logging
    configure_logging(settings.LOG_LEVEL)
    if args.once:
        try:
            run_owned_once()
        except Exception:
            logger.exception("External scheduler evaluation failed")
            raise SystemExit(1) from None
        return
    stop_event = threading.Event()

    # Use a daemon thread to keep ctrl-c clean while the loop blocks the main
    # thread; signals set the stop event so a cycle ends promptly.
    def _handle_signal(_signum, _frame) -> None:  # noqa: ANN001 - signal args
        logger.info("Signal received, shutting down")
        stop_event.set()

    import signal

    signal.signal(signal.SIGINT, _handle_signal)
    signal.signal(signal.SIGTERM, _handle_signal)

    worker = threading.Thread(
        target=run_loop,
        kwargs={"interval_seconds": settings.SCHEDULER_INTERVAL_SECONDS, "stop_event": stop_event},
        daemon=True,
        name="overdue-alert-scheduler",
    )
    worker.start()
    worker.join()


if __name__ == "__main__":
    main()
