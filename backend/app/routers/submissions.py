import asyncio

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services.permissions import require_active_contestant
from app.services.room_events import record_and_broadcast
from app.services.snapshots import job_dict, submission_dict
from app.workers.generation_worker import process_generation_job

router = APIRouter(prefix="/api/rounds", tags=["submissions"])


@router.post("/{round_id}/submissions")
async def submit_prompt(round_id: str, payload: schemas.SubmitPromptRequest, db: Session = Depends(get_db)):
    prompt = payload.prompt.strip()
    if len(prompt) < 10:
        raise HTTPException(status_code=422, detail="Prompt must be at least 10 characters.")

    round_ = db.get(models.Round, round_id)
    if not round_:
        raise HTTPException(status_code=404, detail="Round not found.")
    if round_.status != "active":
        raise HTTPException(status_code=409, detail="Participants can submit only during an active round.")

    room = round_.room
    participant = require_active_contestant(db, room, payload.user_id)

    duplicate = (
        db.query(models.Submission)
        .filter(models.Submission.round_id == round_.id, models.Submission.participant_id == participant.id)
        .first()
    )
    if duplicate:
        raise HTTPException(status_code=409, detail="You have already submitted for this round.")

    submission = models.Submission(
        room_id=room.id,
        round_id=round_.id,
        participant_id=participant.id,
        prompt=prompt,
        status="submitted",
    )
    db.add(submission)
    db.flush()
    job = models.GenerationJob(submission_id=submission.id, status="queued", provider="mock")
    db.add(job)
    db.commit()
    db.refresh(submission)
    db.refresh(job)

    await record_and_broadcast(
        db,
        room,
        "submission.created",
        {
            "submission_id": submission.id,
            "participant_id": participant.id,
            "participant_name": participant.user.display_name,
            "status": submission.status,
            "job_status": job.status,
        },
    )
    await record_and_broadcast(
        db,
        room,
        "job.status_changed",
        {"job_id": job.id, "submission_id": submission.id, "status": "queued"},
    )
    asyncio.create_task(process_generation_job(job.id))
    return {"submission": submission_dict(submission), "job": job_dict(job)}

