from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services.permissions import require_host
from app.services.room_events import record_and_broadcast
from app.services.snapshots import room_snapshot

router = APIRouter(prefix="/api/submissions", tags=["scores"])


@router.post("/{submission_id}/score")
async def score_submission(
    submission_id: str,
    payload: schemas.ScoreSubmissionRequest,
    db: Session = Depends(get_db),
):
    submission = db.get(models.Submission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found.")
    room = submission.room
    require_host(db, room, payload.host_user_id)
    if submission.status not in {"completed", "failed"}:
        raise HTTPException(status_code=409, detail="Submission is not ready for judging.")

    score = submission.score
    if not score:
        score = models.Score(submission_id=submission.id, scored_by_user_id=payload.host_user_id)
        db.add(score)
    score.score = payload.score
    score.decision = payload.decision
    score.comment = payload.comment

    if payload.decision == "eliminated":
        submission.status = "eliminated"
        submission.participant.status = "eliminated"
    db.commit()
    db.refresh(score)

    await record_and_broadcast(
        db,
        room,
        "submission.scored",
        {
            "submission_id": submission.id,
            "score": score.score,
            "decision": score.decision,
            "comment": score.comment,
        },
    )
    if payload.decision == "eliminated":
        await record_and_broadcast(
            db,
            room,
            "participant.eliminated",
            {"participant_id": submission.participant_id, "submission_id": submission.id},
        )
    return room_snapshot(db, room)

