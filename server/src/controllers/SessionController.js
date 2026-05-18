const AiService = require("../services/AiService");
const MessageService = require("../services/MessageService");
const SessionService = require("../services/SessionService");
const formatResponse = require("../utils/formatResponse");

const SESSION_TYPES = ["ai", "live"];
const SESSION_LEVELS = ["junior", "middle", "senior"];
const PROGRAMMING_LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "go",
  "html",
  "css",
  "java",
  "c",
  "csharp",
];

function buildFallbackFirstMessage(level, programmingLanguage, topic) {
  return [
    "Привет! Начинаем тренировочное интервью.",
    `Уровень: ${level}.`,
    `Язык программирования: ${programmingLanguage}.`,
    topic ? `Тема: ${topic}.` : "",
    "Первая задача:",
    "Опиши, как бы ты решил задачу по выбранной теме, и затем напиши рабочее решение в редакторе.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildFallbackFirstTask(programmingLanguage, topic) {
  return {
    description: [
      topic
        ? `Реши практическую задачу по теме "${topic}".`
        : "Реши практическую задачу по выбранной теме.",
      "Опиши подход и напиши рабочее решение в редакторе.",
    ].join(" "),
    starterCode: "// Напишите решение здесь",
    editorLanguage: programmingLanguage,
  };
}

function buildSessionMessages(session) {
  return (session.messages || []).map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    metadata: message.metadata || null,
    createdAt: message.createdAt,
  }));
}

function getLatestEditorCode(messages, fallbackCode = "") {
  const messageWithCode = [...messages]
    .reverse()
    .find((message) => typeof message.metadata?.code === "string");

  return messageWithCode?.metadata?.code || fallbackCode || "";
}

async function finishSessionWithFeedback({
  session,
  sessionId,
  userId,
  messages,
  code,
  finishReason = "manual",
}) {
  const programmingLanguage = session.programming_language || "javascript";
  const feedback = await AiService.generateInterviewFeedback({
    difficulty: session.level,
    programmingLanguage,
    topic: session.topic,
    messages,
    code,
  });

  const finishedSession = await SessionService.finishSession(
    sessionId,
    userId,
    {
      messages,
      code: typeof code === "string" ? code : "",
      feedback,
      finishReason,
    },
  );

  return {
    finishedSession,
    feedback,
  };
}

class SessionController {
  static async createSession(req, res) {
    const { user } = res.locals;
    const { content, level, type = "ai", programmingLanguage } = req.body || {};
    const topic = req.body?.topic ?? content;

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return res
        .status(400)
        .json(formatResponse(400, "Не указана тема тренировочной сессии"));
    }

    if (topic.length > 250) {
      return res
        .status(400)
        .json(
          formatResponse(
            400,
            "Слишком длинная тема. Максимальная длина - 250 символов",
          ),
        );
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

    if (!PROGRAMMING_LANGUAGES.includes(programmingLanguage)) {
      return res
        .status(400)
        .json(formatResponse(400, "Некорректный язык программирования"));
    }

    try {
      const activeSession = await SessionService.getActiveSession(user.id);

      if (activeSession) {
        return res.status(409).json(
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
        programming_language: programmingLanguage,
      });

      let firstMessage = null;

      if (type === "ai") {
        let aiData;

        try {
          aiData = await AiService.getAiAnswer({
            difficulty: level,
            programmingLanguage,
            topic: topic.trim(),
          });

          firstMessage = await MessageService.createSessionMessage(session.id, {
            role: "assistant",
            content: aiData.answer,
            metadata: aiData.metadata || null,
          });
        } catch (aiError) {
          console.log("======== SessionController.createSession.ai =========");
          console.log(aiError);

          firstMessage = await MessageService.createSessionMessage(session.id, {
            role: "assistant",
            content: buildFallbackFirstMessage(
              level,
              programmingLanguage,
              topic.trim(),
            ),
            metadata: {
              itemType: "practice",
              task: buildFallbackFirstTask(programmingLanguage, topic.trim()),
            },
          });
        }
      }

      return res.status(201).json(
        formatResponse(201, "Тренировочная сессия создана", {
          ...session.get(),
          messages: firstMessage ? [firstMessage] : [],
        }),
      );
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

  static async deleteUserSessions(req, res) {
    const { user } = res.locals;

    try {
      const deletedCount = await SessionService.deleteUserSessions(user.id);

      return res.status(200).json(
        formatResponse(200, "История тренировочных сессий очищена", {
          deletedCount,
        }),
      );
    } catch (error) {
      console.log("======== SessionController.deleteUserSessions =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка при очистке истории сессий"));
    }
  }

  static async deleteUserSession(req, res) {
    const { user } = res.locals;
    const { sessionId } = req.params;

    if (Number.isNaN(Number(sessionId))) {
      return res
        .status(400)
        .json(formatResponse(400, "Неверный формат ID сессии"));
    }

    try {
      const deletedCount = await SessionService.deleteUserSession(
        sessionId,
        user.id,
      );

      if (deletedCount === 0) {
        return res
          .status(404)
          .json(formatResponse(404, "Тренировочная сессия не найдена"));
      }

      return res
        .status(200)
        .json(formatResponse(200, "Тренировочная сессия удалена"));
    } catch (error) {
      console.log("======== SessionController.deleteUserSession =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка при удалении сессии"));
    }
  }

  static async finishSession(req, res) {
    const { user } = res.locals;
    const { sessionId } = req.params;
    const { code = "", programmingLanguage } = req.body || {};

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

      if (session.status === "complited") {
        return res.status(200).json(
          formatResponse(200, "Тренировочная сессия завершена", {
            session,
            feedback: session.result?.feedback || "",
          }),
        );
      }

      const resultMessages = buildSessionMessages(session);
      const { finishedSession, feedback } = await finishSessionWithFeedback({
        session: {
          ...session.get(),
          programming_language:
            session.programming_language || programmingLanguage || "javascript",
        },
        sessionId,
        userId: user.id,
        messages: resultMessages,
        code,
      });

      return res.status(200).json(
        formatResponse(200, "Тренировочная сессия завершена", {
          session: {
            ...finishedSession.get(),
            messages: resultMessages,
          },
          feedback,
        }),
      );
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
    const { content = "", code = "", source = "chat" } = req.body || {};

    if (Number.isNaN(Number(sessionId))) {
      return res
        .status(400)
        .json(formatResponse(400, "Неверный формат ID сессии"));
    }

    if (!content.trim() && !code.trim()) {
      return res
        .status(400)
        .json(formatResponse(400, "Нельзя отправить пустое сообщение"));
    }

    try {
      const userMessage = await MessageService.createMessage(sessionId, user.id, {
        role: "user",
        content: content.trim() || "Проверь моё решение",
        metadata: {
          source,
          code: code.trim() || null,
        },
      });

      if (!userMessage) {
        return res
          .status(404)
          .json(formatResponse(404, "Тренировочная сессия не найдена"));
      }

      if (userMessage.isComplited) {
        return res
          .status(409)
          .json(formatResponse(409, "Тренировочная сессия уже завершена"));
      }

      const session = await SessionService.getUserSessionById(sessionId, user.id);

      if (!session) {
        return res
          .status(404)
          .json(formatResponse(404, "Тренировочная сессия не найдена"));
      }

      const resultMessages = buildSessionMessages(session);
      const contextLength = AiService.getContextLength({
        topic: session.topic,
        messages: resultMessages,
      });

      if (contextLength >= AiService.AI_CONTEXT_SOFT_LIMIT) {
        const assistantMessage = await MessageService.createSessionMessage(
          sessionId,
          {
            role: "assistant",
            content:
              "Контекст интервью подошёл к лимиту, поэтому я завершаю интервью и готовлю feedback.",
            metadata: {
              finishReason: "context_limit",
            },
          },
        );
        const messagesWithLimitNotice = [
          ...resultMessages,
          {
            id: assistantMessage.id,
            role: assistantMessage.role,
            content: assistantMessage.content,
            metadata: assistantMessage.metadata || null,
            createdAt: assistantMessage.createdAt,
          },
        ];
        const { finishedSession, feedback } = await finishSessionWithFeedback({
          session,
          sessionId,
          userId: user.id,
          messages: messagesWithLimitNotice,
          code: getLatestEditorCode(resultMessages, code.trim()),
          finishReason: "context_limit",
        });

        return res.status(200).json(
          formatResponse(200, "Интервью завершено из-за лимита контекста", {
            userMessage,
            assistantMessage,
            session: {
              ...finishedSession.get(),
              messages: messagesWithLimitNotice,
            },
            feedback,
            isFinished: true,
            finishReason: "context_limit",
          }),
        );
      }

      const aiData = await AiService.getAiAnswer({
        difficulty: session.level,
        programmingLanguage: session.programming_language,
        topic: session.topic,
        messages: session.messages,
      });

      const assistantMessage = await MessageService.createSessionMessage(sessionId, {
        role: "assistant",
        content: aiData.answer,
        metadata: aiData.metadata || null,
      });

      return res.status(201).json(
        formatResponse(201, "Сообщение обработано", {
          userMessage,
          assistantMessage,
        }),
      );
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
