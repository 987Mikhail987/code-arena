const { Op } = require("sequelize");
const { Message, Session, User } = require("../db/models");

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

  static async getUserSessions(user) {
    if (user.role === "intervier") {
      return Session.findAll({
        where: {
          type: "live",
          status: "active",
        },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "email", "role"],
            where: {
              role: "candidate",
            },
          },
        ],
        order: [["createdAt", "DESC"]],
      });
    }

    return Session.findAll({
      where: { user_id: user.id },
      order: [["createdAt", "DESC"]],
    });
  }

  static async getSessionByIdentifier(identifier, user) {
    const isNumericId = !Number.isNaN(Number(identifier));
    const sessionWhere = isNumericId
      ? { id: Number(identifier) }
      : { public_id: identifier, type: "live" };

    const accessWhere =
      user.role === "intervier"
        ? {
            ...sessionWhere,
            type: "live",
            status: "active",
          }
        : {
            ...sessionWhere,
            [Op.or]: [{ user_id: user.id }, { public_id: identifier }],
          };

    return Session.findOne({
      where: accessWhere,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "role"],
          ...(user.role === "intervier"
            ? {
                where: {
                  role: "candidate",
                },
              }
            : {}),
        },
        {
          model: Message,
          as: "messages",
          separate: true,
          order: [["createdAt", "ASC"]],
        },
      ],
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
