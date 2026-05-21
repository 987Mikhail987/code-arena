"use strict";
const { Model } = require("sequelize");

const USER_ROLES = ["candidate", "intervier"];

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      this.hasMany(models.Session, { foreignKey: "user_id", as: "sessions" });
      this.hasMany(models.SessionParticipant, {
        foreignKey: "user_id",
        as: "sessionParticipants",
      });
    }

    static validateEmail(email) {
      const emailPattern = /^[A-z0-9!-_%.]+@[A-z0-9.-]+\.[A-z]{2,}$/;
      return emailPattern.test(email);
    }

    static validatePassword(password) {
      const hasUpperCase = /[A-Z]/;
      const hasLowerCase = /[a-z]/;
      const hasDigits = /\d/;
      const hasSpecialSymbols = /[!@#$%^&*()-+,.""<>{}]/;
      const isValidLength = password.length >= 8;

      return (
        hasUpperCase.test(password) &&
        hasLowerCase.test(password) &&
        hasDigits.test(password) &&
        hasSpecialSymbols.test(password) &&
        isValidLength
      );
    }

    static validateRegistrationData(userData) {
      const { name, email, password, role } = userData;

      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return { isValid: false, error: "Некорректное имя пользователя" };
      }

      if (!role || !USER_ROLES.includes(role)) {
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

    static validateLoginData(userData) {
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

  User.init(
    {
      name: DataTypes.TEXT,
      email: DataTypes.TEXT,
      password: DataTypes.TEXT,
      role: DataTypes.ENUM(...USER_ROLES),
      avatar_url: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "User",
      hooks: {
        beforeCreate: (newUser) => {
          newUser.email = newUser.email.toLowerCase().trim();
        },
      },
    },
  );

  return User;
};
