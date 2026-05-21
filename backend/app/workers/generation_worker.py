import asyncio
import os

from app import models
from app.database import SessionLocal
from app.models import utcnow
from app.services.ai_provider import get_ai_provider
from app.services.room_events import record_and_broadcast


async def process_generation_job(job_id: str) -> None:
    provider = get_ai_provider()
    timeout = float(os.getenv("JOB_TIMEOUT_SECONDS", "15"))
    max_attempts = max(1, int(os.getenv("MOCK_AI_MAX_ATTEMPTS", "2")))

    db = SessionLocal()
    try:
        job = db.get(models.GenerationJob, job_id)
        if not job:
            return
        submission = job.submission
        room = submission.room

        job.status = "running"
        job.started_at = utcnow()
        submission.status = "generating"
        db.commit()
        await record_and_broadcast(
            db,
            room,
            "job.status_changed",
            {"job_id": job.id, "submission_id": submission.id, "status": "running"},
        )

        result = None
        last_error: Exception | None = None
        for attempt in range(1, max_attempts + 1):
            try:
                result = await asyncio.wait_for(provider.generate(submission.prompt), timeout=timeout)
                break
            except asyncio.TimeoutError as exc:
                last_error = RuntimeError("AI generation timed out. The room is still active.")
                if attempt == max_attempts:
                    raise last_error from exc
            except Exception as exc:
                last_error = exc
                if attempt == max_attempts:
                    raise

            await record_and_broadcast(
                db,
                room,
                "job.status_changed",
                {
                    "job_id": job.id,
                    "submission_id": submission.id,
                    "status": "running",
                    "attempt": attempt + 1,
                    "message": "Retrying generation after a transient mock failure.",
                },
            )
            await asyncio.sleep(min(2 ** attempt, 5))

        if result is None:
            raise RuntimeError(str(last_error or "AI generation failed. The room is still active."))

        job.status = "completed"
        job.completed_at = utcnow()
        submission.status = "completed"
        submission.generated_output = result.text
        submission.error_message = None
        db.commit()
        await record_and_broadcast(
            db,
            room,
            "job.status_changed",
            {"job_id": job.id, "submission_id": submission.id, "status": "completed"},
        )
        await record_and_broadcast(
            db,
            room,
            "submission.completed",
            {"submission_id": submission.id, "generated_output": result.text},
        )
    except Exception as exc:
        db.rollback()
        job = db.get(models.GenerationJob, job_id)
        if not job:
            return
        submission = job.submission
        room = submission.room
        job.status = "timed_out" if "timed out" in str(exc).lower() else "failed"
        job.completed_at = utcnow()
        job.error_message = str(exc)
        submission.status = "failed"
        submission.error_message = str(exc)
        db.commit()
        await record_and_broadcast(
            db,
            room,
            "job.status_changed",
            {"job_id": job.id, "submission_id": submission.id, "status": job.status},
        )
        await record_and_broadcast(
            db,
            room,
            "submission.failed",
            {"submission_id": submission.id, "error_message": str(exc)},
        )
    finally:
        db.close()
