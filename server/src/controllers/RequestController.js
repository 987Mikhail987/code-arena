const formatResponse = require("../utils/formatResponse");
const RequestService = require("../services/RequestService");

class RequestController {
  static async getAllRequestsUser(req, res) {
    const { user } = res.locals;
    try {
      const requests = await RequestService.getAllRequestsUser(user.id);

      if (requests.length === 0) {
        return res
          .status(200)
          .json(formatResponse(200, "У пользователя нет запросов", []));
      }
      return res
        .status(200)
        .json(formatResponse(200, "Запросы пользователя", requests));
    } catch (error) {
      console.log("======== RequestController.getAllRequestsUser =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка при получении запросов"));
    }
  }

  static async getAllRequestsAndResponsesUser(req, res) {
    const { user } = res.locals;
    try {
      const requests = await RequestService.getAllRequestsAndResponsesUser(
        user.id,
      );
      if (requests.length === 0) {
        return res
          .status(200)
          .json(
            formatResponse(200, "У пользователя нет запросов и ответов", []),
          );
      }
      return res
        .status(200)
        .json(formatResponse(200, "Запросы и ответы пользователя", requests));
    } catch (error) {
      console.log(
        "======== RequestController.getAllRequestsAndResponsesUser =========",
      );
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка при получении запросов и ответов"));
    }
  }

  static async getOneRequestAndResponseUser(req, res) {
    const { user } = res.locals;
    const { id } = req.params;
    try {
      const request = await RequestService.getOneRequestAndResponseUser(
        Number(id),
      );
      if (request.user_id !== user.id) {
        return res.status(404).json(formatResponse(404, "Запрос не найден"));
      }
      if (!request) {
        return res.status(404).json(formatResponse(404, "Запрос не найден"));
      }
      return res
        .status(200)
        .json(formatResponse(200, "Запрос и ответ пользователя", request));
    } catch (error) {
      console.log(
        "======== RequestController.getOneRequestAndResponseUser =========",
      );
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка при получении запроса и ответа"));
    }
  }

  static async createRequest(req, res) {
    const { user } = res.locals;
    const { content, type, level } = req.body;
    if (!content || !type || !level) {
      return res
        .status(400)
        .json(formatResponse(400, "Недостаточно данных для создания запроса"));
    }

    try {
      const request = await RequestService.createRequest({
        content,
        type,
        level,
        user_id: user.id,
      });
      return res
        .status(201)
        .json(formatResponse(201, "Запрос создан", request));
    } catch (error) {
      console.log("======== RequestController.createRequest =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка при создании запроса"));
    }
  }

  static async updateRequest(req, res) {
    const { user } = res.locals;
    const { id } = req.params;
    const { comment } = req.body;
    if (Number.isNaN(Number(id))) {
      return res
        .status(400)
        .json(formatResponse(400, "Некорректный ID запроса"));
    }
    try {
      const updatedRequest = await RequestService.updateRequest(
        user.id,
        Number(id),
        comment,
      );
      if (!updatedRequest) {
        return res
          .status(404)
          .json(formatResponse(404, "Запрос не найден или доступ запрещен"));
      }
      return res
        .status(200)
        .json(formatResponse(200, "Запрос обновлен", updatedRequest));
    } catch (error) {
      console.log("======== RequestController.updateRequest =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка при обновлении запроса"));
    }
  }

  static async deleteRequest(req, res) {
    const { user } = res.locals;
    const { id } = req.params;
    if (Number.isNaN(Number(id))) {
      return res
        .status(400)
        .json(formatResponse(400, "Некорректный ID запроса"));
    }
    try {
      const deletedRequest = await RequestService.deleteRequest(
        user.id,
        Number(id),
      );
      if (!deletedRequest) {
        return res
          .status(404)
          .json(formatResponse(404, "Запрос не найден или доступ запрещен"));
      }
      return res.status(200).json(formatResponse(200, "Запрос удален"));
    } catch (error) {
      console.log("======== RequestController.deleteRequest =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка при удалении запроса"));
    }
  }
}

module.exports = RequestController;
