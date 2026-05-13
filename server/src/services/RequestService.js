const { Message, Session } = require("../db/models");

class RequestService {
  static async getAllRequestsUser(userId) {
    return Session.findAll({
      where: { user_id: userId },
      order: [["createdAt", "DESC"]],
    });
  }

  static async getAllRequestsAndResponsesUser(userId) {
    return Session.findAll({
      where: { user_id: userId },
      include: [{ model: Message, as: "messages" }],
      order: [["createdAt", "DESC"]],
    });
  }

  static async getOneRequestAndResponseUser(requestId) {
    return Session.findByPk(requestId, {
      include: [{ model: Message, as: "messages" }],
    });
  }

  static async createRequest(requestData) {
    const { topic, content, type, level } = requestData;
    const sessionTopic = topic || content;

    if (!sessionTopic || !type || !level) {
      return null;
    }

    return Session.create({
      ...requestData,
      topic: sessionTopic,
    });
  }

  static async createMessages(sessionId, messages) {
    if (!messages.length) {
      return [];
    }

    const createdMessages = await Message.bulkCreate(
      messages.map((message) => ({
        ...message,
        session_id: sessionId,
      })),
      { returning: true },
    );

    return createdMessages.map((message) => message.get());
  }

  static async updateRequest(userId, requestId, comment) {
    const session = await Session.findByPk(requestId);
    if (!session || session.user_id !== userId) {
      return null;
    }

    if (comment) {
      session.result = {
        ...(session.result || {}),
        comment,
      };
    }

    await session.save();
    return session;
  }

  static async deleteRequest(userId, requestId) {
    const session = await Session.findByPk(requestId);
    if (!session || session.user_id !== userId) {
      return null;
    }

    await session.destroy();
    return true;
  }
}

module.exports = RequestService;
