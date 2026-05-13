export type UserType = {
  id: number;
  name: string;
  email: string;
  level: "student" | "junior" | "middle" | "senior";
  createdAt: string;
  updatedAt: string;
};

export type UserValidatorType = {
  name?: string;
  email: string;
  level?: "student" | "junior" | "middle" | "senior";
  password: string;
  confirmPassword?: string;
};

export type ValidateNewPassword = {
  password: string;
  newPassword: string;
  confirmNewPassword: string;
};
