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

export type MessageMetadataType = {
  source?: "chat" | "editor" | "live-chat";
  code?: string | null;
  finishReason?: string;
  senderId?: number;
  senderName?: string;
  senderRole?: string;
  senderAvatarUrl?: string | null;
  itemType?: "practice" | "theory";
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

export type SessionResultType = {
  messages: MessageType[];
  code: string;
  feedback?: string;
  finishReason?: string;
};

export type SessionType = {
  id: string;
  user_id?: number;
  userId?: string;
  type: InterviewType;
  level?: DifficultyType;
  topic: string;
  status: SessionStatusType;
  programming_language?: ProgrammingLanguageType;
  programmingLanguage?: ProgrammingLanguageType;
  public_id?: string | null;
  publicId?: string | null;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar_url?: string | null;
    avatarUrl?: string | null;
  };
  participants?: {
    id: number;
    session_id: number;
    user_id: number;
    role: "candidate" | "intervier";
    deleted_at?: string | null;
    user?: {
      id: number;
      name: string;
      email: string;
      role: string;
      avatar_url?: string | null;
      avatarUrl?: string | null;
    };
  }[];
  messages?: MessageType[];
  result?: SessionResultType;
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
  assistantMessage?: MessageType | null;
  session?: SessionType;
  feedback?: string;
  isFinished?: boolean;
  finishReason?: string;
};
