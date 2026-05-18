const { Message, Session } = require("../db/models");

class SessionService {
  static async createSession(sessionData) {
    return Session.create(sessionData);
  }

  static async getActiveSession(userId) {
    return Session.findOne({
      where: {
        user_id: userId,
        status: "active",
      },
      order: [["createdAt", "DESC"]],
    });
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

  static async finishSession(sessionId, userId, result) {
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
    session.result = result;
    await session.save();

    return session;
  }

  static async saveSessionResult(sessionId, userId, result) {
    const session = await Session.findOne({
      where: {
        id: sessionId,
        user_id: userId,
      },
    });

    if (!session) {
      return null;
    }

    session.result = result;
    session.status = "complited";
    await session.save();

    return session;
  }

  static async deleteUserSession(sessionId, userId) {
    return Session.destroy({
      where: {
        id: sessionId,
        user_id: userId,
      },
    });
  }

  static async deleteUserSessions(userId) {
    return Session.destroy({
      where: {
        user_id: userId,
      },
    });
  }
}

module.exports = SessionService;
