export type UserRole = "candidate" | "intervier";

export type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

export type LoginData = {
  email: string;
  password: string;
};

export type RegisterData = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};
