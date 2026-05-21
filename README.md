# AI Creative Battle Room

This is my full-stack implementation of **AI Creative Battle Room**. I built it as a small real-time creative contest where a host creates a challenge room, another player joins with a room code, submits a creative prompt, and then watches the AI generation job update live in the room.

I focused on making the main loop complete and reviewable instead of adding too many side features. The app supports one polished battle round, persistent room state, backend permission checks, WebSocket updates, async generation jobs, and host judging.

## Tech Stack

- Frontend: Next.js, TypeScript, Tailwind CSS, Zustand
- Backend: FastAPI, SQLAlchemy, SQLite
- Realtime: FastAPI WebSockets
- AI provider: Mock AI provider by default

The mock AI provider simulates latency, returns useful generated text, and can occasionally fail so the failed-job state is visible during testing.

## How To Run Locally

Start the backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Start the frontend in another terminal:

```bash
cd frontend
npm install
npm run dev
```

Then open:

```text
http://localhost:3000
```

The backend health check is available at:

```text
http://localhost:8000/health
```

## Environment Variables

The example environment files are included in `.env.example` and `backend/.env.example`.

Important values:

- `DATABASE_URL=sqlite:///./backend/battle_room.db`
- `AI_PROVIDER=mock`
- `MOCK_AI_FAILURE_RATE=0.15`
- `MOCK_AI_MAX_ATTEMPTS=2`
- `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`
- `NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000`

For a smoother local recording or review run, I can set the mock failure rate to zero in `backend/.env`:

```env
MOCK_AI_FAILURE_RATE=0
MOCK_AI_MAX_ATTEMPTS=2
```

The backend should be restarted after changing env values.

## What The App Does

The main flow is:

- A user creates or restores a local identity.
- A host creates a room with a challenge prompt.
- Another user joins with the room code or invite link.
- The host starts the round.
- A participant submits one creative prompt.
- The backend creates a generation job and returns immediately.
- The room updates live as the job moves through `queued`, `running`, `completed`, or `failed`.
- The generated output appears inside the room.
- The host scores the submission and marks it as `survived`, `eliminated`, or `winner`.
- Refreshing the page keeps the room, participant, round, submission, job, generated output, and score state.

## Architecture

The backend is the source of truth. I used HTTP routes for mutations and WebSockets for live room updates. Important state changes are persisted first and then broadcast to connected clients.

On the frontend, the app restores the current user from localStorage, fetches the room snapshot from the backend, and then connects to the room WebSocket. Zustand is only used for local client state; durable state lives in SQLite.

## Data Model

The backend persists these entities:

- `User`: local identity
- `Room`: room title, code, challenge, host, and room status
- `Participant`: user membership in a room with host/participant role
- `Round`: the active battle round
- `Submission`: participant prompt and generated output
- `GenerationJob`: async AI job lifecycle
- `Score`: host score, decision, and optional comment
- `RoomEvent`: activity feed and realtime event history

## API Overview

Implemented routes:

- `POST /api/identity`
- `POST /api/rooms`
- `POST /api/rooms/{room_code}/join`
- `GET /api/rooms/{room_code}`
- `POST /api/rooms/{room_id}/rounds/start`
- `POST /api/rounds/{round_id}/submissions`
- `POST /api/submissions/{submission_id}/score`
- `POST /api/generation-jobs/{job_id}/retry`
- `WS /ws/rooms/{room_code}?user_id=<user_id>`

## Realtime Events

The server broadcasts room events such as:

- `room.snapshot`
- `participant.joined`
- `round.started`
- `submission.created`
- `job.status_changed`
- `submission.completed`
- `submission.failed`
- `submission.scored`
- `participant.eliminated`

These events are also stored as `RoomEvent` records so the activity feed survives refreshes.

## Permission Rules

I enforced the important rules on the backend:

- Only the host can start a round.
- Only the host can score or eliminate submissions.
- The host cannot submit as a contestant.
- Participants can submit only during an active round.
- Participants cannot start rounds or score.
- A participant can submit only once per round.

The UI hides invalid controls, but the backend checks are still the actual authority.

## Scoring

The judging system is intentionally simple. The host gives a score from 1 to 10 and chooses one decision:

- `survived`
- `eliminated`
- `winner`

The leaderboard sorts by winner first, then score, then completed submissions before failed submissions, and finally submission time.

I chose this because it is easy to understand, easy to test, and backend-enforceable. The tradeoff is that judging is subjective and host-only. In a production version, I would add rubric scoring, audience voting, or AI-assisted judging.

## Persistence

SQLite stores users, rooms, participants, rounds, submissions, generation jobs, scores, and room events. Refreshing the room page should not lose the current battle state.

## Failure Handling

I included visible handling for:

- Invalid prompts
- Permission denied actions
- Duplicate submissions
- Failed mock AI generations
- Retrying failed or timed-out jobs
- WebSocket reconnecting state

The mock provider can fail on purpose. Failed jobs do not break the room, and they can be retried from the UI.

## Known Limitations

This is not meant to be production-grade. Some things I intentionally kept out:

- Only one round is supported.
- Authentication is simple local identity, not real auth.
- The AI provider is mock-only.
- WebSocket events refetch snapshots for reliability, which is simple but a little chatty.
- SQLite is used for reviewability, not production scale.
- Spectator mode, reactions, voting, AI announcer, hidden modifiers, real media generation, and hosted deployment are not included.

## What I Would Improve With More Time

- Add a real AI provider behind the existing provider abstraction.
- Add better retry controls and job cancellation.
- Support multiple rounds and a full tournament flow.
- Add more backend tests around permission edge cases.
- Add audience voting or rubric-based scoring.
