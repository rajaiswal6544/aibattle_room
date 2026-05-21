import asyncio

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.models import utcnow
from app.services.permissions import get_participant
from app.services.room_events import record_and_broadcast
from app.services.snapshots import room_snapshot
from app.workers.generation_worker import process_generation_job

router = APIRouter(prefix="/api/generation-jobs", tags=["generation-jobs"])


class RetryJobRequest(BaseModel):
    user_id: str


@router.post("/{job_id}/retry")
async def retry_generation_job(job_id: str, payload: RetryJobRequest, db: Session = Depends(get_db)):
    job = db.get(models.GenerationJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Generation job not found.")

    submission = job.submission
    room = submission.room
    participant = get_participant(db, room.id, payload.user_id)
    if not participant:
        raise HTTPException(status_code=403, detail="You do not have permission to perform this action.")
    if participant.role != "host" and participant.id != submission.participant_id:
        raise HTTPException(status_code=403, detail="You do not have permission to perform this action.")
    if job.status not in {"failed", "timed_out"}:
        raise HTTPException(status_code=409, detail="Only failed or timed out jobs can be retried.")

    job.status = "queued"
    job.error_message = None
    job.started_at = None
    job.completed_at = None
    submission.status = "submitted"
    submission.error_message = None
    submission.generated_output = None
    submission.updated_at = utcnow()
    db.commit()

    await record_and_broadcast(
        db,
        room,
        "job.status_changed",
        {"job_id": job.id, "submission_id": submission.id, "status": "queued", "message": "Generation retry queued."},
    )
    asyncio.create_task(process_generation_job(job.id))
    return room_snapshot(db, room)

