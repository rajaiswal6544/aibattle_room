import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def new_id() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.utcnow()


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    identity_key: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    hosted_rooms = relationship("Room", back_populates="host")
    participations = relationship("Participant", back_populates="user")


class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    code: Mapped[str] = mapped_column(String(12), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    challenge_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    host_user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="lobby", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    host = relationship("User", back_populates="hosted_rooms")
    participants = relationship("Participant", back_populates="room", cascade="all, delete-orphan")
    rounds = relationship("Round", back_populates="room", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="room", cascade="all, delete-orphan")
    events = relationship("RoomEvent", back_populates="room", cascade="all, delete-orphan")


class Participant(Base):
    __tablename__ = "participants"
    __table_args__ = (UniqueConstraint("room_id", "user_id", name="uq_participant_room_user"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    room_id: Mapped[str] = mapped_column(ForeignKey("rooms.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="active", nullable=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    room = relationship("Room", back_populates="participants")
    user = relationship("User", back_populates="participations")
    submissions = relationship("Submission", back_populates="participant")


class Round(Base):
    __tablename__ = "rounds"
    __table_args__ = (UniqueConstraint("room_id", "round_number", name="uq_round_number_room"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    room_id: Mapped[str] = mapped_column(ForeignKey("rooms.id"), nullable=False)
    round_number: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="active", nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    room = relationship("Room", back_populates="rounds")
    submissions = relationship("Submission", back_populates="round", cascade="all, delete-orphan")


class Submission(Base):
    __tablename__ = "submissions"
    __table_args__ = (UniqueConstraint("round_id", "participant_id", name="uq_submission_round_participant"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    room_id: Mapped[str] = mapped_column(ForeignKey("rooms.id"), nullable=False)
    round_id: Mapped[str] = mapped_column(ForeignKey("rounds.id"), nullable=False)
    participant_id: Mapped[str] = mapped_column(ForeignKey("participants.id"), nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    generated_output: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="submitted", nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    room = relationship("Room", back_populates="submissions")
    round = relationship("Round", back_populates="submissions")
    participant = relationship("Participant", back_populates="submissions")
    job = relationship("GenerationJob", back_populates="submission", uselist=False, cascade="all, delete-orphan")
    score = relationship("Score", back_populates="submission", uselist=False, cascade="all, delete-orphan")


class GenerationJob(Base):
    __tablename__ = "generation_jobs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    submission_id: Mapped[str] = mapped_column(ForeignKey("submissions.id"), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="queued", nullable=False)
    provider: Mapped[str] = mapped_column(String(64), default="mock", nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    submission = relationship("Submission", back_populates="job")


class Score(Base):
    __tablename__ = "scores"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    submission_id: Mapped[str] = mapped_column(ForeignKey("submissions.id"), unique=True, nullable=False)
    scored_by_user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    rank: Mapped[int | None] = mapped_column(Integer, nullable=True)
    decision: Mapped[str] = mapped_column(String(32), nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    submission = relationship("Submission", back_populates="score")
    scored_by = relationship("User")


class RoomEvent(Base):
    __tablename__ = "room_events"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    room_id: Mapped[str] = mapped_column(ForeignKey("rooms.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(80), nullable=False)
    payload_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    room = relationship("Room", back_populates="events")
