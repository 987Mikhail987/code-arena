import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Пароль должен содержать минимум 8 символов")
  .regex(/[A-Z]/, "Пароль должен содержать заглавную букву")
  .regex(/[a-z]/, "Пароль должен содержать строчную букву")
  .regex(/\d/, "Пароль должен содержать цифру")
  .regex(/[!@#$%^&*()\-+,."<>]/, "Пароль должен содержать специальный символ");

export const loginSchema = z.object({
  email: z.string().email("Некорректный адрес электронной почты"),
  password: passwordSchema,
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Некорректное имя пользователя"),
    email: z.string().email("Некорректный адрес электронной почты"),
    password: passwordSchema,
    repeatPassword: z.string().min(1, "Повторите пароль"),
    role: z.enum(["candidate", "intervier"]),
  })
  .refine((data) => data.password === data.repeatPassword, {
    message: "Пароли не совпадают",
    path: ["repeatPassword"],
  });

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Некорректное имя пользователя"),
  role: z.enum(["candidate", "intervier"]),
});

export const passwordChangeSchema = z.object({
  password: z.string().min(1, "Введите текущий пароль"),
  newPassword: passwordSchema,
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ProfileFormValues = z.infer<typeof profileSchema>;
export type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;
