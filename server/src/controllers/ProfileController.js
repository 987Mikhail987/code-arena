const ProfileService = require("../services/ProfileService");
const { User } = require("../db/models");
const bcrypt = require("bcrypt");
const formatResponse = require("../utils/formatResponse");

class ProfileController {
  static async getOneProfile(req, res) {
    const { user } = res.locals;
    if (Number.isNaN(Number(user?.id))) {
      return res
        .status(400)
        .json(formatResponse(400, "Неверный формат ID пользователя"));
    }
    try {
      const profile = await ProfileService.getOneProfile(user.id);
      if (!profile) {
        return res
          .status(404)
          .json(formatResponse(404, "Профиль пользователя не найден"));
      }

      delete profile.password; // Удаляем пароль из ответа
      return res
        .status(200)
        .json(formatResponse(200, "Профиль пользователя получен", profile));
    } catch (error) {
      console.log("======== ProfileController.getOneProfile =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка при получении профиля пользователя"));
    }
  }

  static async updatePassword(req, res) {
    const { user } = res.locals;
    const { password, newPassword } = req.body;

    if (Number.isNaN(Number(user?.id))) {
      return res
        .status(400)
        .json(formatResponse(400, "Неверный формат ID пользователя"));
    }

    const isValid = User.validatePassword(newPassword);
    if (!isValid) {
      return res
        .status(400)
        .json(formatResponse(400, "Пароль не соответствует требованиям", null));
    }

    try {
      const existingUser = await ProfileService.getOneProfile(user.id);
      if (!existingUser) {
        return res
          .status(404)
          .json(formatResponse(404, "Пользователь не найден"));
      }

      const isValidPassword = await bcrypt.compare(
        password,
        existingUser.password,
      );
      if (!isValidPassword) {
        return res.status(401).json(formatResponse(401, "Неверный пароль"));
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await ProfileService.updatePassword(user.id, hashedNewPassword);
      return res
        .status(200)
        .json(formatResponse(200, "Пароль успешно обновлен"));
    } catch (error) {
      console.log("======== ProfileController.updatePassword =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка при обновлении пароля пользователя"));
    }
  }

  static async updateProfile(req, res) {
    const { user } = res.locals;
    const updateProfile = req.body;

    if (Number.isNaN(Number(user?.id))) {
      return res
        .status(400)
        .json(formatResponse(400, "Неверный формат ID пользователя"));
    }

    try {
      const updatedProfile = await ProfileService.updateProfile(
        user.id,
        updateProfile,
      );
      if (!updatedProfile) {
        return res
          .status(404)
          .json(formatResponse(404, "Профиль пользователя не найден"));
      }
      return res
        .status(200)
        .json(
          formatResponse(
            200,
            "Профиль пользователя успешно обновлен",
            updatedProfile,
          ),
        );
    } catch (error) {
      console.log("======== ProfileController.updateProfile =========");
      console.log(error);
      return res
        .status(500)
        .json(
          formatResponse(500, "Ошибка при обновлении профиля пользователя"),
        );
    }
  }

  static async deleteProfile(req, res) {
    const { user } = res.locals;
    if (Number.isNaN(Number(user?.id))) {
      return res
        .status(400)
        .json(formatResponse(400, "Неверный формат ID пользователя"));
    }
    try {
      const isDeleted = await ProfileService.deleteProfile(user.id);
      if (!isDeleted) {
        return res
          .status(404)
          .json(formatResponse(404, "Профиль пользователя не найден"));
      }
      return res
        .status(200)
        .json(formatResponse(200, "Профиль пользователя успешно удален"));
    } catch (error) {
      console.log("======== ProfileController.deleteProfile =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка при удалении профиля пользователя"));
    }
  }
}

module.exports = ProfileController;
