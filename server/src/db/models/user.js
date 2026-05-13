"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.Request, { foreignKey: "user_id", as: "requests" });
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

      if (
        !hasUpperCase.test(password) ||
        !hasLowerCase.test(password) ||
        !hasDigits.test(password) ||
        !hasSpecialSymbols.test(password) ||
        !isValidLength
      ) {
        return false;
      }
      return true;
    }

    static validateRegistrationData(userData) {
      const { name, email, password, level } = userData;

      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return { isValid: false, error: "Некорректное имя пользователя" };
      }

      if (!level || !["student", "junior", "middle", "senior"].includes(level)) {
        return { isValid: false, error: "Некорректный уровень пользователя" };
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
      level: DataTypes.ENUM("student", "junior", "middle", "senior"),
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
