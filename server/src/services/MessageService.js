const { Message, Session } = require("../db/models");

class MessageService {
  static async createSessionMessage(sessionId, messageData) {
    return Message.create({
      session_id: sessionId,
      ...messageData,
    });
  }

  static async createMessage(sessionId, userId, messageData) {
    const session = await Session.findOne({
      where: {
        id: sessionId,
        user_id: userId,
      },
    });

    if (!session) {
      return null;
    }

    if (session.status === "complited") {
      return { isComplited: true };
    }

    return Message.create({
      session_id: sessionId,
      ...messageData,
    });
  }
}

module.exports = MessageService;
