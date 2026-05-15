const { Message, Session } = require("../db/models");

class MessageService {
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

    return Message.create({
      session_id: sessionId,
      ...messageData,
    });
  }
}

module.exports = MessageService;
