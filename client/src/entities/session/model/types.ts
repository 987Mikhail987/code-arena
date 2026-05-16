export type SessionStatusType = "active" | "complited";
export type DifficultyType = "junior" | "middle" | "senior";
export type InterviewType = "ai" | "live";

export type SessionType = {
  id: string;
  userId: string;
  type: InterviewType;
  topic: string;
  status: SessionStatusType;
  createdAt: string;
};

export type MessageType = {
  id: string;
  sessionId: string;
  role: "user" | "ai" | "system";
  content: string;
  code?: string;
  createdAt: string;
};

export type CreateSessionParamsType = {
  type: InterviewType;
  level: DifficultyType;
  topic?: string;
};

export type CreateMessageParamsType = {
  content: string;
  code?: string;
};
