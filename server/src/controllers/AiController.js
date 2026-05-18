const AiService = require("../services/AiService");
const formatResponse = require("../utils/formatResponse");

function getContextLength({ topic, message, messages }) {
  const topicLength = typeof topic === "string" ? topic.length : 0;
  const messageLength = typeof message === "string" ? message.length : 0;

  const messagesLength = Array.isArray(messages)
    ? messages.reduce((total, currentMessage) => {
        if (typeof currentMessage === "string") {
          return total + currentMessage.length;
        }

        if (
          currentMessage &&
          typeof currentMessage === "object" &&
          typeof currentMessage.content === "string"
        ) {
          return total + currentMessage.content.length;
        }

        return total;
      }, 0)
    : 0;

  return topicLength + messageLength + messagesLength;
}

class AiController {
  static async getAiAnswer(req, res) {
    const { difficulty, programmingLanguage, topic, message, messages } =
      req.body || {};

    const allowedDifficulties = ["junior", "middle", "senior"];

    if (!allowedDifficulties.includes(difficulty)) {
      return res.status(400).json(
        formatResponse(
          400,
          "Поле difficulty должно быть одним из значений: junior, middle, senior",
        ),
      );
    }

    if (
      typeof programmingLanguage !== "string" ||
      !programmingLanguage.trim()
    ) {
      return res
        .status(400)
        .json(formatResponse(400, "Поле programmingLanguage обязательно"));
    }

    if (topic !== undefined && typeof topic !== "string") {
      return res
        .status(400)
        .json(formatResponse(400, "Поле topic должно быть строкой"));
    }

    if (message !== undefined && typeof message !== "string") {
      return res
        .status(400)
        .json(formatResponse(400, "Поле message должно быть строкой"));
    }

    if (messages !== undefined && !Array.isArray(messages)) {
      return res
        .status(400)
        .json(formatResponse(400, "Поле messages должно быть массивом"));
    }

    const contextLength = getContextLength({
      topic,
      message,
      messages,
    });

    if (contextLength > 5000) {
      return res.status(400).json(
        formatResponse(
          400,
          "Превышено допустимое количество символов контекста. Максимум 5000 символов.",
        ),
      );
    }

    try {
      const data = await AiService.getAiAnswer({
        difficulty,
        programmingLanguage,
        topic,
        message,
        messages,
      });

      return res
        .status(200)
        .json(formatResponse(200, "Ответ от GigaChat успешно получен", data));
    } catch (error) {
      console.log("======== AiController.getAiAnswer =========");
      console.log(error);

      return res.status(500).json(
        formatResponse(
          500,
          "Ошибка сервера при получении ответа от GigaChat",
          null,
          error.message,
        ),
      );
    }
  }
}

module.exports = AiController;
