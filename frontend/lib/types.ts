export type Role = "host" | "participant";
export type RoomStatus = "lobby" | "round_active" | "judging" | "completed";
export type RoundStatus = "pending" | "active" | "judging" | "completed";
export type JobStatus = "queued" | "running" | "completed" | "failed" | "timed_out";
export type SubmissionStatus = "submitted" | "generating" | "completed" | "failed" | "eliminated";
export type Decision = "survived" | "eliminated" | "winner";

export type User = {
  id: string;
  display_name: string;
  identity_key: string;
};

export type Participant = {
  id: string;
  room_id: string;
  user_id: string;
  display_name: string;
  role: Role;
  status: "active" | "eliminated";
  joined_at: string;
};

export type Room = {
  id: string;
  code: string;
  title: string;
  challenge_prompt: string;
  host_user_id: string;
  status: RoomStatus;
  created_at: string;
  updated_at: string;
};

export type Round = {
  id: string;
  room_id: string;
  round_number: number;
  status: RoundStatus;
  started_at: string;
  ended_at?: string | null;
};

export type GenerationJob = {
  id: string;
  submission_id: string;
  status: JobStatus;
  provider: string;
  error_message?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
};

export type Score = {
  id: string;
  submission_id: string;
  scored_by_user_id: string;
  score: number;
  rank?: number | null;
  decision: Decision;
  comment?: string | null;
  created_at: string;
};

export type Submission = {
  id: string;
  room_id: string;
  round_id: string;
  participant_id: string;
  participant_name: string;
  prompt: string;
  generated_output?: string | null;
  status: SubmissionStatus;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
  job?: GenerationJob | null;
  score?: Score | null;
};

export type RoomEvent = {
  id: string;
  room_id: string;
  type: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export type RoomSnapshot = {
  room: Room;
  host: User;
  participants: Participant[];
  current_round?: Round | null;
  submissions: Submission[];
  events: RoomEvent[];
};

export type Identity = {
  user_id: string;
  display_name: string;
  identity_key: string;
};

export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "offline";

