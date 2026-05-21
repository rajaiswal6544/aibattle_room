import json
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app import models


def iso(value: datetime | None) -> str | None:
    return value.isoformat() + "Z" if value else None


def user_dict(user: models.User) -> dict[str, Any]:
    return {
        "id": user.id,
        "display_name": user.display_name,
        "identity_key": user.identity_key,
    }


def participant_dict(participant: models.Participant) -> dict[str, Any]:
    return {
        "id": participant.id,
        "room_id": participant.room_id,
        "user_id": participant.user_id,
        "display_name": participant.user.display_name,
        "role": participant.role,
        "status": participant.status,
        "joined_at": iso(participant.joined_at),
    }


def round_dict(round_: models.Round | None) -> dict[str, Any] | None:
    if not round_:
        return None
    return {
        "id": round_.id,
        "room_id": round_.room_id,
        "round_number": round_.round_number,
        "status": round_.status,
        "started_at": iso(round_.started_at),
        "ended_at": iso(round_.ended_at),
    }


def job_dict(job: models.GenerationJob | None) -> dict[str, Any] | None:
    if not job:
        return None
    return {
        "id": job.id,
        "submission_id": job.submission_id,
        "status": job.status,
        "provider": job.provider,
        "error_message": job.error_message,
        "started_at": iso(job.started_at),
        "completed_at": iso(job.completed_at),
        "created_at": iso(job.created_at),
    }


def score_dict(score: models.Score | None) -> dict[str, Any] | None:
    if not score:
        return None
    return {
        "id": score.id,
        "submission_id": score.submission_id,
        "scored_by_user_id": score.scored_by_user_id,
        "score": score.score,
        "rank": score.rank,
        "decision": score.decision,
        "comment": score.comment,
        "created_at": iso(score.created_at),
    }


def submission_dict(submission: models.Submission) -> dict[str, Any]:
    return {
        "id": submission.id,
        "room_id": submission.room_id,
        "round_id": submission.round_id,
        "participant_id": submission.participant_id,
        "participant_name": submission.participant.user.display_name,
        "prompt": submission.prompt,
        "generated_output": submission.generated_output,
        "status": submission.status,
        "error_message": submission.error_message,
        "created_at": iso(submission.created_at),
        "updated_at": iso(submission.updated_at),
        "job": job_dict(submission.job),
        "score": score_dict(submission.score),
    }


def event_dict(event: models.RoomEvent) -> dict[str, Any]:
    return {
        "id": event.id,
        "room_id": event.room_id,
        "type": event.type,
        "payload": json.loads(event.payload_json),
        "created_at": iso(event.created_at),
    }


def room_snapshot(db: Session, room: models.Room) -> dict[str, Any]:
    current_round = (
        db.query(models.Round)
        .filter(models.Round.room_id == room.id)
        .order_by(models.Round.round_number.desc())
        .first()
    )
    submissions = (
        db.query(models.Submission)
        .filter(models.Submission.room_id == room.id)
        .order_by(models.Submission.created_at.asc())
        .all()
    )
    events = (
        db.query(models.RoomEvent)
        .filter(models.RoomEvent.room_id == room.id)
        .order_by(models.RoomEvent.created_at.desc())
        .limit(50)
        .all()
    )
    return {
        "room": {
            "id": room.id,
            "code": room.code,
            "title": room.title,
            "challenge_prompt": room.challenge_prompt,
            "host_user_id": room.host_user_id,
            "status": room.status,
            "created_at": iso(room.created_at),
            "updated_at": iso(room.updated_at),
        },
        "host": user_dict(room.host),
        "participants": [participant_dict(item) for item in room.participants],
        "current_round": round_dict(current_round),
        "submissions": [submission_dict(item) for item in submissions],
        "events": [event_dict(item) for item in reversed(events)],
    }

