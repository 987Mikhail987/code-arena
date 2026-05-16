const MessageService = require("../services/MessageService");
const SessionService = require("../services/SessionService");
const formatResponse = require("../utils/formatResponse");

const SESSION_TYPES = ["ai", "live"];
const SESSION_LEVELS = ["junior", "middle", "senior"];
const MESSAGE_ROLES = ["user", "assistant"];

class SessionController {
  static async createSession(req, res) {
    const { user } = res.locals;
    const { content, level, type = "ai" } = req.body;
    const topic = req.body.topic ?? content;

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return res
        .status(400)
        .json(formatResponse(400, "Не указана тема тренировочной сессии"));
    }

    if (topic.length > 250) {
      return res
        .status(400)
        .json(formatResponse(400, "Слишком длинная тема. Максимальная длина - 250 символов"));
    }

    if (!SESSION_TYPES.includes(type)) {
      return res
        .status(400)
        .json(formatResponse(400, "Некорректный тип тренировочной сессии"));
    }

    if (!SESSION_LEVELS.includes(level)) {
      return res
        .status(400)
        .json(formatResponse(400, "Некорректный уровень тренировочной сессии"));
    }

    try {
      const activeSession = await SessionService.getActiveSession(user.id);

      if (activeSession) {
        return res
          .status(409)
          .json(
            formatResponse(
              409,
              "Сначала завершите активное интервью",
              activeSession,
            ),
          );
      }

      const session = await SessionService.createSession({
        user_id: user.id,
        type,
        status: "active",
        level,
        topic: topic.trim(),
      });

      return res
        .status(201)
        .json(formatResponse(201, "Тренировочная сессия создана", session));
    } catch (error) {
      console.log("======== SessionController.createSession =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка при создании тренировочной сессии"));
    }
  }

  static async getUserSessions(req, res) {
    const { user } = res.locals;

    try {
      const sessions = await SessionService.getUserSessions(user.id);

      return res
        .status(200)
        .json(formatResponse(200, "История тренировочных сессий получена", sessions));
    } catch (error) {
      console.log("======== SessionController.getUserSessions =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка при получении истории сессий"));
    }
  }

  static async getUserSessionById(req, res) {
    const { user } = res.locals;
    const { sessionId } = req.params;

    if (Number.isNaN(Number(sessionId))) {
      return res
        .status(400)
        .json(formatResponse(400, "Неверный формат ID сессии"));
    }

    try {
      const session = await SessionService.getUserSessionById(sessionId, user.id);

      if (!session) {
        return res
          .status(404)
          .json(formatResponse(404, "Тренировочная сессия не найдена"));
      }

      return res
        .status(200)
        .json(formatResponse(200, "Тренировочная сессия получена", session));
    } catch (error) {
      console.log("======== SessionController.getUserSessionById =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка при получении сессии"));
    }
  }

  static async finishSession(req, res) {
    const { user } = res.locals;
    const { sessionId } = req.params;

    if (Number.isNaN(Number(sessionId))) {
      return res
        .status(400)
        .json(formatResponse(400, "Неверный формат ID сессии"));
    }

    try {
      const session = await SessionService.finishSession(sessionId, user.id);

      if (!session) {
        return res
          .status(404)
          .json(formatResponse(404, "Тренировочная сессия не найдена"));
      }

      return res
        .status(200)
        .json(formatResponse(200, "Тренировочная сессия завершена", session));
    } catch (error) {
      console.log("======== SessionController.finishSession =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка при завершении сессии"));
    }
  }

  static async createMessage(req, res) {
    const { user } = res.locals;
    const { sessionId } = req.params;
    const { role, content } = req.body;

    if (Number.isNaN(Number(sessionId))) {
      return res
        .status(400)
        .json(formatResponse(400, "Неверный формат ID сессии"));
    }

    if (!MESSAGE_ROLES.includes(role)) {
      return res
        .status(400)
        .json(formatResponse(400, "Некорректная роль сообщения"));
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res
        .status(400)
        .json(formatResponse(400, "Пустое сообщение нельзя сохранить"));
    }

    try {
      const message = await MessageService.createMessage(sessionId, user.id, {
        role,
        content: content.trim(),
      });

      if (!message) {
        return res
          .status(404)
          .json(formatResponse(404, "Тренировочная сессия не найдена"));
      }

      if (message.isComplited) {
        return res
          .status(409)
          .json(formatResponse(409, "Тренировочная сессия уже завершена"));
      }

      return res
        .status(201)
        .json(formatResponse(201, "Сообщение сохранено", message));
    } catch (error) {
      console.log("======== SessionController.createMessage =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка при сохранении сообщения"));
    }
  }
}

module.exports = SessionController;
