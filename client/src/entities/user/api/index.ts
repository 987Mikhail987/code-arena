export type UserDataApi = {
  email: string;
  password: string;
  name?: string;
  level?: "student" | "junior" | "middle" | "senior" | "";
};
