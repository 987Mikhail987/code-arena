const { Message, Session } = require("../db/models");

class SessionService {
  static async createSession(sessionData) {
    return Session.create(sessionData);
  }

  static async getUserSessions(userId) {
    return Session.findAll({
      where: { user_id: userId },
      order: [["createdAt", "DESC"]],
    });
  }

  static async getUserSessionById(sessionId, userId) {
    return Session.findOne({
      where: {
        id: sessionId,
        user_id: userId,
      },
      include: [
        {
          model: Message,
          as: "messages",
          separate: true,
          order: [["createdAt", "ASC"]],
        },
      ],
    });
  }

  static async finishSession(sessionId, userId) {
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
      return session;
    }

    session.status = "complited";
    await session.save();

    return session;
  }
}

module.exports = SessionService;
