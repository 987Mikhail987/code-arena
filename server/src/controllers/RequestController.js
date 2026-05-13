const formatResponse = require("../utils/formatResponse");
const RequestService = require("../services/RequestService");

class RequestController {
  static async getAllRequestsUser(req, res) {
    const { user } = res.locals;
    try {
      const sessions = await RequestService.getAllRequestsUser(user.id);

      if (sessions.length === 0) {
        return res
          .status(200)
          .json(formatResponse(200, "У пользователя нет сессий", []));
      }

      return res
        .status(200)
        .json(formatResponse(200, "Сессии пользователя", sessions));
    } catch (error) {
      console.log("======== RequestController.getAllRequestsUser =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка при получении сессий"));
    }
  }

  static async getAllRequestsAndResponsesUser(req, res) {
    const { user } = res.locals;
    try {
      const sessions = await RequestService.getAllRequestsAndResponsesUser(
        user.id,
      );

      if (sessions.length === 0) {
        return res
          .status(200)
          .json(formatResponse(200, "У пользователя нет сессий и сообщений", []));
      }

      return res
        .status(200)
        .json(formatResponse(200, "Сессии и сообщения пользователя", sessions));
    } catch (error) {
      console.log(
        "======== RequestController.getAllRequestsAndResponsesUser =========",
      );
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка при получении сессий и сообщений"));
    }
  }

  static async getOneRequestAndResponseUser(req, res) {
    const { user } = res.locals;
    const { id } = req.params;
    try {
      const session = await RequestService.getOneRequestAndResponseUser(
        Number(id),
      );

      if (!session || session.user_id !== user.id) {
        return res.status(404).json(formatResponse(404, "Сессия не найдена"));
      }

      return res
        .status(200)
        .json(formatResponse(200, "Сессия и сообщения пользователя", session));
    } catch (error) {
      console.log(
        "======== RequestController.getOneRequestAndResponseUser =========",
      );
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка при получении сессии"));
    }
  }

  static async createRequest(req, res) {
    const { user } = res.locals;
    const { content, type, level } = req.body;
    if (!content || !type || !level) {
      return res
        .status(400)
        .json(formatResponse(400, "Недостаточно данных для создания сессии"));
    }

    try {
      const session = await RequestService.createRequest({
        content,
        type,
        level,
        status: "active",
        user_id: user.id,
      });

      await RequestService.createMessages(session.id, [{ role: "user", content }]);

      return res
        .status(201)
        .json(formatResponse(201, "Сессия создана", session));
    } catch (error) {
      console.log("======== RequestController.createRequest =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка при создании сессии"));
    }
  }

  static async updateRequest(req, res) {
    const { user } = res.locals;
    const { id } = req.params;
    const { comment } = req.body;
    if (Number.isNaN(Number(id))) {
      return res
        .status(400)
        .json(formatResponse(400, "Некорректный ID сессии"));
    }

    try {
      const updatedSession = await RequestService.updateRequest(
        user.id,
        Number(id),
        comment,
      );

      if (!updatedSession) {
        return res
          .status(404)
          .json(formatResponse(404, "Сессия не найдена или доступ запрещен"));
      }

      return res
        .status(200)
        .json(formatResponse(200, "Сессия обновлена", updatedSession));
    } catch (error) {
      console.log("======== RequestController.updateRequest =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка при обновлении сессии"));
    }
  }

  static async deleteRequest(req, res) {
    const { user } = res.locals;
    const { id } = req.params;
    if (Number.isNaN(Number(id))) {
      return res
        .status(400)
        .json(formatResponse(400, "Некорректный ID сессии"));
    }

    try {
      const deletedSession = await RequestService.deleteRequest(user.id, Number(id));
      if (!deletedSession) {
        return res
          .status(404)
          .json(formatResponse(404, "Сессия не найдена или доступ запрещен"));
      }

      return res.status(200).json(formatResponse(200, "Сессия удалена"));
    } catch (error) {
      console.log("======== RequestController.deleteRequest =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка при удалении сессии"));
    }
  }
}

module.exports = RequestController;
