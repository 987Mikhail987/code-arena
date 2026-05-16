const AiService = require("../services/AiService");
const formatResponse = require("../utils/formatResponse");

class AiController {
  static async getAiAnswer(req, res) {
    const { difficulty, programmingLanguage, topic, message, messages } =
      req.body;

    const allowedDifficulties = ["junior", "middle", "senior"];

    if (!allowedDifficulties.includes(difficulty)) {
      return res
        .status(400)
        .json(
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
