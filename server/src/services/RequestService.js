const { Request, Response } = require("../db/models");

class RequestService {
  static async getAllRequestsUser(userId) {
    const requests = await Request.findAll({
      where: { user_id: userId },
      order: [["createdAt", "DESC"]],
    });
    if (requests.length === 0) {
      return [];
    }
    return requests;
  }

  static async getAllRequestsAndResponsesUser(userId) {
    const requests = await Request.findAll({
      where: { user_id: userId },
      include: [{ model: Response, as: "response" }],
      order: [["createdAt", "DESC"]],
    });
    if (requests.length === 0) {
      return [];
    }
    return requests;
  }

  static async getOneRequestAndResponseUser(requestId) {
    const request = await Request.findByPk(requestId, {
      include: [{ model: Response, as: "response" }],
    });
    if (!request) {
      return null;
    }
    return request;
  }

  static async createRequest(requestData) {
    const { content, type, level } = requestData;
    if (!content || !type || !level) {
      return null;
    }
    const request = await Request.create(requestData);
    return request;
  }

  static async updateRequest(userId, requestId, comment) {
    const request = await Request.findByPk(requestId);
    if (!request) {
      return null;
    }
    if (request.user_id !== userId) {
      return null;
    }
    if (comment) {
      request.comment = comment;
    }
    await request.save();
    return request;
  }

  static async deleteRequest(userId, requestId) {
    const request = await Request.findByPk(requestId);
    if (!request) {
      return null;
    }
    if (request.user_id !== userId) {
      return null;
    }
    await request.destroy();
    return true;
  }
}

module.exports = RequestService;
