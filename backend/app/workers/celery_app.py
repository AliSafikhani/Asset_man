"""
Celery application for background task processing
Handles heavy computations like test dataset analysis and report generation
"""

from celery import Celery
from celery.schedules import crontab
from kombu import Queue, Exchange
import os
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# Create Celery application
celery_app = Celery(
    "webapp",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.workers.tasks.process_dataset",
        "app.workers.tasks.generate_report",
        "app.workers.tasks.realtime_aggregator",
        "app.workers.tasks.email_tasks",
    ]
)

# Configure Celery
celery_app.conf.update(
    # Task settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    
    # Task execution
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    
    # Result settings
    result_expires=3600,  # 1 hour
    
    # Worker settings
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=100,
    
    # Rate limits
    task_annotations={
        "app.workers.tasks.process_dataset.process_large_dataset": {"rate_limit": "10/m"},
        "app.workers.tasks.generate_report.export_to_csv": {"rate_limit": "30/m"},
        "app.workers.tasks.email_tasks.send_bulk_emails": {"rate_limit": "5/m"},
    },
)

# Queue configuration for different task priorities
celery_app.conf.task_queues = (
    Queue("high_priority", Exchange("high_priority"), routing_key="high"),
    Queue("default", Exchange("default"), routing_key="default"),
    Queue("low_priority", Exchange("low_priority"), routing_key="low"),
)

celery_app.conf.task_routes = {
    "app.workers.tasks.process_dataset.*": {"queue": "high_priority"},
    "app.workers.tasks.realtime_aggregator.*": {"queue": "high_priority"},
    "app.workers.tasks.generate_report.*": {"queue": "default"},
    "app.workers.tasks.email_tasks.*": {"queue": "low_priority"},
}

# Scheduled tasks (Celery Beat)
celery_app.conf.beat_schedule = {
    # Clean up expired data every hour
    "cleanup-expired-data": {
        "task": "app.workers.tasks.realtime_aggregator.cleanup_old_data",
        "schedule": crontab(minute=0, hour="*"),
        "options": {"queue": "low_priority"},
    },
    # Generate daily reports at 1 AM
    "generate-daily-reports": {
        "task": "app.workers.tasks.generate_report.generate_daily_report",
        "schedule": crontab(minute=0, hour=1),
        "options": {"queue": "default"},
    },
    # Health check every 5 minutes
    "health-check": {
        "task": "app.workers.tasks.realtime_aggregator.system_health_check",
        "schedule": crontab(minute="*/5"),
        "options": {"queue": "low_priority"},
    },
    # Reset rate limits every minute
    "reset-rate-limits": {
        "task": "app.workers.tasks.realtime_aggregator.reset_rate_limits",
        "schedule": crontab(minute="*"),
        "options": {"queue": "low_priority"},
    },
}


@celery_app.task(bind=True)
def debug_task(self):
    """Debug task to test Celery"""
    logger.info(f"Request: {self.request!r}")
    return "Celery is working!"


def get_celery_app():
    """Get Celery app instance"""
    return celery_app