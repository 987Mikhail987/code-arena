const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const Y = require("yjs");
const corsConfig = require("../config/corsConfig");
const MessageService = require("../services/MessageService");
const SessionService = require("../services/SessionService");

const liveDocs = new Map();

function getCookieValue(cookieHeader, cookieName) {
  if (!cookieHeader) {
    return "";
  }

  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${cookieName}=`))
    ?.split("=")
    .slice(1)
    .join("=") || "";
}

function verifySocketUser(socket) {
  const accessToken = socket.handshake.auth?.accessToken;
  const refreshToken = getCookieValue(socket.handshake.headers.cookie, "refreshToken");

  if (accessToken) {
    const { user } = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    return user;
  }

  if (refreshToken) {
    const { user } = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    return user;
  }

  return null;
}

async function getAccessibleLiveSession(roomId, user) {
  if (!roomId || typeof roomId !== "string") {
    return null;
  }

  return SessionService.getSessionByIdentifier(roomId, user);
}

function getLiveDoc(roomId, initialCode = "") {
  if (liveDocs.has(roomId)) {
    return liveDocs.get(roomId);
  }

  const doc = new Y.Doc();
  const text = doc.getText("code");

  if (initialCode) {
    text.insert(0, initialCode);
  }

  liveDocs.set(roomId, doc);
  return doc;
}

function normalizeUpdate(update) {
  return update instanceof Uint8Array ? update : Uint8Array.from(update || []);
}

function initLiveInterviewSocket(server) {
  const io = new Server(server, {
    cors: corsConfig,
  });

  io.use((socket, next) => {
    try {
      const user = verifySocketUser(socket);

      if (!user) {
        return next(new Error("Unauthorized"));
      }

      socket.data.user = user;
      return next();
    } catch (error) {
      return next(error);
    }
  });

  io.on("connection", (socket) => {
    socket.on("live:join", async ({ roomId }) => {
      try {
        const session = await getAccessibleLiveSession(roomId, socket.data.user);

        if (!session || session.type !== "live") {
          socket.emit("live:error", "Live-интервью не найдено");
          return;
        }

        socket.join(`live:${session.public_id}`);
        socket.data.liveRoomId = session.public_id;
        socket.data.liveSessionId = session.id;
        socket.emit("live:joined", {
          roomId: session.public_id,
          sessionId: session.id,
        });
      } catch {
        socket.emit("live:error", "Не удалось подключиться к live-интервью");
      }
    });

    socket.on("live:chat:send", async ({ roomId, content }) => {
      try {
        const normalizedContent = typeof content === "string" ? content.trim() : "";

        if (!normalizedContent) {
          return;
        }

        const session = await getAccessibleLiveSession(roomId, socket.data.user);

        if (!session || session.type !== "live") {
          socket.emit("live:error", "Live-интервью не найдено");
          return;
        }

        const message = await MessageService.createSessionMessage(session.id, {
          role: "user",
          content: normalizedContent,
          metadata: {
            source: "live-chat",
            senderId: socket.data.user.id,
            senderName: socket.data.user.name,
            senderRole: socket.data.user.role,
          },
        });

        io.to(`live:${session.public_id}`).emit("live:chat:new", {
          id: message.id,
          session_id: message.session_id,
          role: message.role,
          content: message.content,
          metadata: message.metadata,
          createdAt: message.createdAt,
        });
      } catch {
        socket.emit("live:error", "Не удалось отправить сообщение");
      }
    });

    socket.on("live:code:sync:request", async ({ roomId, initialCode }) => {
      try {
        const session = await getAccessibleLiveSession(roomId, socket.data.user);

        if (!session || session.type !== "live") {
          socket.emit("live:error", "Live-интервью не найдено");
          return;
        }

        const doc = getLiveDoc(session.public_id, initialCode);
        const update = Y.encodeStateAsUpdate(doc);

        socket.emit("live:code:sync", Array.from(update));
      } catch {
        socket.emit("live:error", "Не удалось синхронизировать редактор");
      }
    });

    socket.on("live:code:update", async ({ roomId, update }) => {
      try {
        const session = await getAccessibleLiveSession(roomId, socket.data.user);

        if (!session || session.type !== "live") {
          socket.emit("live:error", "Live-интервью не найдено");
          return;
        }

        const doc = getLiveDoc(session.public_id);
        const normalizedUpdate = normalizeUpdate(update);

        Y.applyUpdate(doc, normalizedUpdate);
        socket.to(`live:${session.public_id}`).emit(
          "live:code:update",
          Array.from(normalizedUpdate),
        );
      } catch {
        socket.emit("live:error", "Не удалось обновить код");
      }
    });
  });

  return io;
}

module.exports = initLiveInterviewSocket;
