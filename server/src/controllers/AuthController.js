const bcrypt = require("bcrypt");
const cookieConfig = require("../config/cookieConfig");
const { User } = require("../db/models");
const AuthService = require("../services/AuthService");
const formatResponse = require("../utils/formatResponse");
const generateTokens = require("../utils/generateTokens");

class AuthController {
  static async register(req, res) {
    const { name, email, password, role } = req.body;
    const { isValid, error } = User.validateRegistrationData({
      name,
      email,
      password,
      role,
    });

    if (!isValid) {
      return res
        .status(400)
        .json(formatResponse(400, "Ошибка валидации", null, error));
    }

    const normalizedEmail = email.toLowerCase().trim();

    try {
      const existingUser = await AuthService.findUserByEmail(normalizedEmail);

      if (existingUser) {
        return res
          .status(400)
          .json(formatResponse(400, "Пользователь уже зарегистрирован"));
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await AuthService.createUser({
        name,
        email,
        password: hashedPassword,
        role,
      });

      if (!newUser) {
        return res
          .status(500)
          .json(formatResponse(500, "Ошибка при создании пользователя"));
      }

      delete newUser.password;

      const { accessToken, refreshToken } = generateTokens({ user: newUser });

      return res
        .status(201)
        .cookie("refreshToken", refreshToken, cookieConfig)
        .json(
          formatResponse(201, "Регистрация успешна", {
            user: newUser,
            accessToken,
          }),
        );
    } catch (registerError) {
      console.log("======== AuthController.register =========");
      console.log(registerError);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при регистрации пользователя"));
    }
  }

  static async login(req, res) {
    const { email, password } = req.body;
    const { isValid, error } = User.validateLoginData({
      email,
      password,
    });

    if (!isValid) {
      return res
        .status(400)
        .json(formatResponse(400, "Ошибка валидации", null, error));
    }

    const normalizedEmail = email.toLowerCase().trim();

    try {
      const existingUser = await AuthService.findUserByEmail(normalizedEmail);

      if (!existingUser) {
        return res
          .status(404)
          .json(
            formatResponse(
              404,
              "Пользователь с таким адресом не зарегистрирован",
            ),
          );
      }

      const isValidPassword = await bcrypt.compare(
        password,
        existingUser.password,
      );

      if (!isValidPassword) {
        return res
          .status(400)
          .json(formatResponse(400, "Неверные данные для входа"));
      }

      delete existingUser.password;

      const { accessToken, refreshToken } = generateTokens({
        user: existingUser,
      });

      return res
        .status(200)
        .cookie("refreshToken", refreshToken, cookieConfig)
        .json(
          formatResponse(200, "Успешный вход в приложение", {
            user: existingUser,
            accessToken,
          }),
        );
    } catch (loginError) {
      console.log("======== AuthController.login =========");
      console.log(loginError);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при входе в приложение"));
    }
  }

  static async logout(req, res) {
    try {
      return res
        .status(200)
        .clearCookie("refreshToken")
        .json(formatResponse(200, "Успешный выход"));
    } catch (logoutError) {
      console.log("======== AuthController.logout =========");
      console.log(logoutError);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при выходе из приложения"));
    }
  }

  static async refreshTokens(req, res) {
    const { user } = res.locals;

    try {
      const { accessToken, refreshToken } = generateTokens({ user });

      return res
        .status(200)
        .cookie("refreshToken", refreshToken, cookieConfig)
        .json(
          formatResponse(200, "Пользовательская сессия продлена", {
            user,
            accessToken,
          }),
        );
    } catch (refreshError) {
      console.log("======== AuthController.refreshTokens =========");
      console.log(refreshError);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при продлении сессии"));
    }
  }
}

module.exports = AuthController;
