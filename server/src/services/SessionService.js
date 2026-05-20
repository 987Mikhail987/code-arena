const { Message, Session, SessionParticipant, User } = require("../db/models");

const userInclude = {
  model: User,
  as: "user",
  attributes: ["id", "name", "email", "role"],
};

const participantInclude = {
  model: SessionParticipant,
  as: "participants",
  include: [
    {
      model: User,
      as: "user",
      attributes: ["id", "name", "email", "role"],
    },
  ],
};

function isParticipantVisible(participant, userId) {
  return participant.user_id === userId && !participant.deleted_at;
}

function hasInterviewParticipant(session, userId) {
  return session.participants?.some((participant) =>
    isParticipantVisible(participant, userId),
  );
}

function hasAvailableInterviewSlot(session, userId) {
  const interviewer = session.participants?.find(
    (participant) => participant.role === "intervier",
  );

  return !interviewer || interviewer.user_id === userId;
}

class SessionService {
  static async createSession(sessionData) {
    return Session.create(sessionData);
  }

  static async createParticipant(sessionId, user) {
    const [participant, isCreated] = await SessionParticipant.findOrCreate({
      where: {
        session_id: sessionId,
        user_id: user.id,
      },
      defaults: {
        session_id: sessionId,
        user_id: user.id,
        role: user.role,
        deleted_at: null,
      },
    });

    if (!isCreated && participant.deleted_at) {
      participant.deleted_at = null;
      await participant.save();
    }

    return participant;
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
        include: [
          userInclude,
          {
            ...participantInclude,
            required: true,
            where: {
              user_id: user.id,
              deleted_at: null,
            },
          },
        ],
        order: [["createdAt", "DESC"]],
      });
    }

    const ownedAiSessions = await Session.findAll({
      where: {
        user_id: user.id,
        type: "ai",
      },
      include: [userInclude],
    });
    const participantSessions = await Session.findAll({
      include: [
        userInclude,
        {
          ...participantInclude,
          required: true,
          where: {
            user_id: user.id,
            deleted_at: null,
          },
        },
      ],
    });

    return [...ownedAiSessions, ...participantSessions]
      .filter(
        (session, index, sessions) =>
          sessions.findIndex((current) => current.id === session.id) === index,
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static async getActiveLiveSessionsForInterviewer(userId) {
    const sessions = await Session.findAll({
      where: {
        type: "live",
        status: "active",
      },
      include: [userInclude, participantInclude],
      order: [["createdAt", "DESC"]],
    });

    return sessions.filter((session) => hasAvailableInterviewSlot(session, userId));
  }

  static async getSessionByIdentifier(identifier, user) {
    const isNumericId = !Number.isNaN(Number(identifier));
    const sessionWhere = isNumericId
      ? { id: Number(identifier) }
      : { public_id: identifier, type: "live" };

    const session = await Session.findOne({
      where: sessionWhere,
      include: [
        userInclude,
        participantInclude,
        {
          model: Message,
          as: "messages",
          separate: true,
          order: [["createdAt", "ASC"]],
        },
      ],
    });

    if (!session) {
      return null;
    }

    if (user.role === "intervier") {
      if (session.type !== "live") {
        return null;
      }

      if (hasInterviewParticipant(session, user.id)) {
        return session;
      }

      if (session.status === "active" && hasAvailableInterviewSlot(session, user.id)) {
        return session;
      }

      return null;
    }

    if (session.user_id === user.id || hasInterviewParticipant(session, user.id)) {
      return session;
    }

    return null;
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
        userInclude,
        participantInclude,
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

  static async deleteUserSession(sessionId, user) {
    const session = await Session.findByPk(sessionId);

    if (!session) {
      return 0;
    }

    if (session.type === "live") {
      const [updatedCount] = await SessionParticipant.update(
        {
          deleted_at: new Date(),
        },
        {
          where: {
            session_id: sessionId,
            user_id: user.id,
            deleted_at: null,
          },
        },
      );

      return updatedCount;
    }

    if (session.user_id !== user.id) {
      return 0;
    }

    return Session.destroy({
      where: {
        id: sessionId,
        user_id: user.id,
      },
    });
  }

  static async deleteUserSessions(user) {
    const [hiddenLiveCount] = await SessionParticipant.update(
      {
        deleted_at: new Date(),
      },
      {
        where: {
          user_id: user.id,
          deleted_at: null,
        },
      },
    );

    if (user.role === "intervier") {
      return hiddenLiveCount;
    }

    const deletedAiCount = await Session.destroy({
      where: {
        user_id: user.id,
        type: "ai",
      },
    });

    return hiddenLiveCount + deletedAiCount;
  }

  static async joinLiveSession(session, user) {
    if (session.type !== "live" || session.status !== "active") {
      return {
        ok: false,
        error: "Live-интервью не найдено",
      };
    }

    if (user.role === "candidate") {
      if (session.user_id !== user.id) {
        return {
          ok: false,
          error: "Live-интервью уже занято",
        };
      }

      await this.createParticipant(session.id, user);
      return { ok: true };
    }

    if (user.role !== "intervier") {
      return {
        ok: false,
        error: "Нет доступа к live-интервью",
      };
    }

    const interviewer = session.participants?.find(
      (participant) => participant.role === "intervier",
    );

    if (interviewer && interviewer.user_id !== user.id) {
      return {
        ok: false,
        error: "К live-интервью уже подключен интервьюер",
      };
    }

    try {
      await this.createParticipant(session.id, user);
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: "К live-интервью уже подключен интервьюер",
      };
    }
  }
}

module.exports = SessionService;
