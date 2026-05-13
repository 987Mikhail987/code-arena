const AiService = require("../services/AiService");
const RequestService = require("../services/RequestService");
const ResponseService = require("../services/ResponseService");
const formatResponse = require("../utils/formatResponse");

class AiController {
  static async getAiAnswer(req, res) {
    const { content, type, level } = req.body;
    const { user } = res.locals;

    if (!content || !type || !level) {
      return res
        .status(400)
        .json(formatResponse(400, "Недостаточно данных для генерации ответа"));
    }

    if (content.length > 250) {
      return res
        .status(400)
        .json(
          formatResponse(
            400,
            "Слишком длинный запрос. Максимальная длина - 250 символов",
          ),
        );
    }

    try {
      const request = await RequestService.createRequest({
        content,
        type,
        level,
        user_id: user.id,
      });

      const answer = await AiService.generateAnswer({ content, type, level });
      if (!answer) {
        return res
          .status(500)
          .json(
            formatResponse(
              500,
              "Ошибка при генерации ответа, попробуйте позже",
            ),
          );
      }

      const { problem, solution, explanation } = answer;
      const response = await ResponseService.createResponse({
        problem,
        solution,
        explanation,
        request_id: request.id,
      });

      return res
        .status(200)
        .json(formatResponse(200, "Ответ успешно сгенерирован", response));
    } catch (error) {
      console.log(error);

      return res
        .status(500)
        .json(
          formatResponse(
            500,
            "Ошибка при генерации ответа, ошибка на стороне сервера",
            null,
            error.message,
          ),
        );
    }
  }
}
module.exports = AiController;
