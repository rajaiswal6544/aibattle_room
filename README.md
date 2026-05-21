# AI Creative Battle Room

A small full-stack creative battle room where a host creates a challenge, a participant joins by room code, submits a prompt, and watches a mock AI generation job move live through the room. The host then scores the submission as survived, eliminated, or winner.

This is intentionally scoped to one polished battle round. The goal is a reviewable vertical slice with durable state, backend-enforced permissions, realtime updates, and visible failure states.

## Stack

- Frontend: Next.js, TypeScript, Tailwind CSS, Zustand, native WebSocket
- Backend: FastAPI, SQLAlchemy, SQLite, FastAPI WebSockets
- AI: `MockAIProvider` by default with latency, useful generated text, and occasional failure

## Local Setup

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` for local values. The important defaults are:

- `DATABASE_URL=sqlite:///./backend/battle_room.db`
- `AI_PROVIDER=mock`
- `MOCK_AI_FAILURE_RATE=0.15`
- `MOCK_AI_MAX_ATTEMPTS=2`
- `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`
- `NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000`

For a smooth recorded demo, create `backend/.env` and set:

```env
MOCK_AI_FAILURE_RATE=0
MOCK_AI_MAX_ATTEMPTS=2
```

Restart the backend after changing environment values.

## Architecture Overview

The backend is the source of truth. Mutations happen through HTTP routes and every important state transition is persisted before being broadcast over WebSocket.

The frontend restores `user_id` from localStorage, fetches a room snapshot on page load, opens `/ws/rooms/{room_code}?user_id=...`, and refetches snapshots after server events. Zustand is used for client convenience, not as durable state.

## Entity Model

- `User`: persistent local identity
- `Room`: room code, title, challenge, host, status
- `Participant`: user membership, role, active/eliminated status
- `Round`: one battle round with status
- `Submission`: participant prompt, generated output, status, error
- `GenerationJob`: queued/running/completed/failed/timed_out lifecycle
- `Score`: host score, decision, comment
- `RoomEvent`: persisted activity feed and websocket event history

## API Routes

- `POST /api/identity`
- `POST /api/rooms`
- `POST /api/rooms/{room_code}/join`
- `GET /api/rooms/{room_code}`
- `POST /api/rooms/{room_id}/rounds/start`
- `POST /api/rounds/{round_id}/submissions`
- `POST /api/submissions/{submission_id}/score`
- `POST /api/generation-jobs/{job_id}/retry`
- `WS /ws/rooms/{room_code}?user_id=<user_id>`

## Realtime Event Model

The server broadcasts:

- `room.snapshot`
- `participant.joined`
- `round.started`
- `submission.created`
- `job.status_changed`
- `submission.completed`
- `submission.failed`
- `submission.scored`
- `participant.eliminated`

Room events are persisted so refresh keeps the activity feed visible.

## Generation Job Lifecycle

When a participant submits a prompt, the API validates permission, creates a submission, creates a queued generation job, broadcasts the event, and returns immediately. A background task updates the job to `running`, calls the mock provider, then persists either `completed` with generated output or `failed`/`timed_out` with an error message.

## Permission Rules

The backend enforces:

- Host can start rounds.
- Host can score and eliminate submissions.
- Host cannot submit as contestant.
- Participants can submit only during an active round.
- Participants cannot start rounds or score.
- One submission per participant per round.

The frontend hides or disables invalid controls, but backend service checks are the authority.

## Scoring Mechanism

The host gives a score from 1 to 10 and marks each submission as `survived`, `eliminated`, or `winner`.

Leaderboard sorting:

1. Winner first
2. Score descending
3. Completed submissions before failed submissions
4. Submission time

This is simple, backend-enforceable, and easy for reviewers to understand. The weakness is that judging is subjective and host-only. A production version should add rubric scoring, audience voting, and AI-assisted judging.

## Persisted State

SQLite persists users, rooms, participants, rounds, submissions, generation jobs, scores, and room events. Refreshing the page should preserve the room, current round, submissions, generated output, job state, and score.

## Failure Handling

- Invalid prompts return and display `Prompt must be at least 10 characters.`
- Permission errors return and display a denied message.
- Mock AI failures persist as failed jobs and keep the room usable.
- Failed or timed-out jobs can be retried, and the worker uses simple retry/backoff before marking a job failed.
- WebSocket disconnects keep the last snapshot visible and reconnect.
- Duplicate submissions are rejected by backend validation.

## Known Limitations

- The app intentionally supports one round.
- Mock AI is the only implemented provider.
- Authentication is local identity, not production auth.
- WebSocket events trigger snapshot refetches for reliability, which is simple but chatty.
- SQLite is chosen for reviewability, not production scale.
- Hosted deployment, spectator reactions/voting, AI announcer commentary, hidden round modifiers, and real media generation are not included.

## What I Would Improve

- Add real provider implementations behind the existing provider abstraction.
- Add richer retry controls and cancellation.
- Add multi-round tournament state.
- Add stronger automated tests around permission edge cases.
- Add a rubric and optional audience voting.

## Demo Script

1. Open the frontend as Host.
2. Create identity, for example `Raj`.
3. Create a room with the default cyberpunk perfume challenge.
4. Copy the room code or invite link.
5. Open a second browser/incognito as Participant.
6. Create identity, for example `Aman`.
7. Join with the room code.
8. Host starts the round.
9. Participant submits: `Make a neon luxury perfume campaign with Blade Runner visuals, influencer drops, and mysterious street billboards.`
10. Watch the job move through queued/running and complete or fail.
11. Host scores the submission and marks survived, eliminated, or winner.
12. Refresh both tabs and confirm the room state persists.
