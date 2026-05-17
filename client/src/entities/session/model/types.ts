export type SessionStatusType = "active" | "complited";
export type DifficultyType = "junior" | "middle" | "senior";
export type InterviewType = "ai" | "live";
export type ProgrammingLanguageType =
  | "javascript"
  | "typescript"
  | "python"
  | "go"
  | "html"
  | "css"
  | "java"
  | "c"
  | "csharp";

export type SessionType = {
  id: string;
  user_id?: number;
  userId?: string;
  type: InterviewType;
  topic: string;
  status: SessionStatusType;
  level?: DifficultyType;
  programming_language?: ProgrammingLanguageType;
  programmingLanguage?: ProgrammingLanguageType;
  messages?: MessageType[];
  result?: unknown;
  createdAt: string;
};

export type MessageMetadataType = {
  source?: "chat" | "editor";
  code?: string | null;
  task?: {
    description?: string;
    starterCode?: string;
    editorLanguage?: ProgrammingLanguageType;
  } | null;
  review?: {
    summary?: string;
    improvements?: string[];
    score?: number;
  } | null;
};

export type MessageType = {
  id: string;
  session_id?: number;
  sessionId?: string;
  role: "user" | "assistant" | "ai" | "system";
  content: string;
  metadata?: MessageMetadataType | null;
  createdAt: string;
};

export type CreateSessionParamsType = {
  type: InterviewType;
  level: DifficultyType;
  topic?: string;
  programmingLanguage: ProgrammingLanguageType;
};

export type CreateMessageParamsType = {
  content?: string;
  code?: string;
  source?: "chat" | "editor";
};

export type CreateMessageResponseType = {
  userMessage: MessageType;
  assistantMessage: MessageType;
};
