import type { LoginData, RegisterData } from "./types";

export class UserValidator {
  static validateEmail(email: string) {
    const emailPattern = /^[A-z0-9!-_%.]+@[A-z0-9.-]+\.[A-z]{2,}$/;
    return emailPattern.test(email);
  }

  static validatePassword(password: string) {
    const hasUpperCase = /[A-Z]/;
    const hasLowerCase = /[a-z]/;
    const hasDigits = /\d/;
    const hasSpecialSymbols = /[!@#$%^&*()-+,.\""<>{}]/;
    const isValidLength = password.length >= 8;

    return (
      hasUpperCase.test(password) &&
      hasLowerCase.test(password) &&
      hasDigits.test(password) &&
      hasSpecialSymbols.test(password) &&
      isValidLength
    );
  }

  static validateRegistrationData(userData: RegisterData) {
    const { name, email, password, role } = userData;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return { isValid: false, error: "Некорректное имя пользователя" };
    }

    if (!role || !["candidate", "intervier"].includes(role)) {
      return { isValid: false, error: "Некорректная роль пользователя" };
    }

    if (
      !email ||
      typeof email !== "string" ||
      email.trim().length === 0 ||
      !this.validateEmail(email)
    ) {
      return {
        isValid: false,
        error: "Некорректный адрес электронной почты",
      };
    }

    if (
      !password ||
      typeof password !== "string" ||
      password.trim().length === 0 ||
      !this.validatePassword(password)
    ) {
      return {
        isValid: false,
        error: "Пароль не соответствует критериям валидации",
      };
    }

    return { isValid: true, error: null };
  }

  static validateLoginData(userData: LoginData) {
    const { email, password } = userData;

    if (
      !email ||
      typeof email !== "string" ||
      email.trim().length === 0 ||
      !this.validateEmail(email)
    ) {
      return {
        isValid: false,
        error: "Некорректный адрес электронной почты",
      };
    }

    if (
      !password ||
      typeof password !== "string" ||
      password.trim().length === 0 ||
      !this.validatePassword(password)
    ) {
      return {
        isValid: false,
        error: "Пароль не соответствует критериям валидации",
      };
    }

    return { isValid: true, error: null };
  }
}
