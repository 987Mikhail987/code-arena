export type RequestItem = {
  id: number;
  content: string;
  level: "student" | "junior" | "middle" | "senior";
  type: "explain" | "fix" | "review";
  answer?: string;
  problem?: string;
  solution?: string;
  explanation?: string;
  response?: {
    id?: number;
    problem?: string;
    solution?: string;
    explanation?: string;
    createdAt?: string;
    updatedAt?: string;
    request_id?: number;
  } | null;
  createdAt: Date | string;
};
