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
<<<<<<< HEAD
  source?: "chat" | "editor" | "live-chat";
  code?: string | null;
  finishReason?: string;
  senderId?: number;
  senderName?: string;
  senderRole?: string;
  itemType?: "practice" | "theory";
=======
  source?: "chat" | "editor";
  code?: string | null;
>>>>>>> 54c6f02728c93576479ea158cb20330334fa53da
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
  feedback: string;
<<<<<<< HEAD
  finishReason?: string;
=======
>>>>>>> 54c6f02728c93576479ea158cb20330334fa53da
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
<<<<<<< HEAD
  public_id?: string | null;
  publicId?: string | null;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
=======
>>>>>>> 54c6f02728c93576479ea158cb20330334fa53da
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
<<<<<<< HEAD
  assistantMessage?: MessageType | null;
  session?: SessionType;
  feedback?: string;
  isFinished?: boolean;
  finishReason?: string;
=======
  assistantMessage: MessageType;
>>>>>>> 54c6f02728c93576479ea158cb20330334fa53da
};
