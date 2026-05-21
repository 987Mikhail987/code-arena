const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const Y = require("yjs");
const corsConfig = require("../config/corsConfig");
const MessageService = require("../services/MessageService");
const SessionService = require("../services/SessionService");

const liveDocs = new Map();
const liveConsoleResults = new Map();
const MAX_CONSOLE_LINES = 50;
const MAX_CONSOLE_LINE_LENGTH = 1000;

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

function normalizeConsoleOutput(output) {
  if (!Array.isArray(output)) {
    return ["Код выполнен без вывода."];
  }

  return output
    .slice(0, MAX_CONSOLE_LINES)
    .map((line) => String(line).slice(0, MAX_CONSOLE_LINE_LENGTH));
}

async function emitParticipantPresence(io, publicId) {
  const roomName = `live:${publicId}`;
  const sockets = await io.in(roomName).fetchSockets();
  const connectedRoles = sockets.map((currentSocket) => currentSocket.data.user?.role);

  io.to(roomName).emit("live:participants", {
    candidateConnected: connectedRoles.includes("candidate"),
    interviewerConnected: connectedRoles.includes("intervier"),
  });
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

        const joinResult = await SessionService.joinLiveSession(
          session,
          socket.data.user,
        );

        if (!joinResult.ok) {
          socket.emit("live:error", joinResult.error);
          return;
        }

        socket.join(`live:${session.public_id}`);
        socket.data.liveRoomId = session.public_id;
        socket.data.liveSessionId = session.id;
        socket.emit("live:joined", {
          roomId: session.public_id,
          sessionId: session.id,
        });

        const consoleResult = liveConsoleResults.get(session.public_id);
        if (consoleResult) {
          socket.emit("live:console:result", consoleResult);
        }

        await emitParticipantPresence(io, session.public_id);
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
            senderAvatarUrl: socket.data.user.avatar_url || null,
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

    socket.on("live:console:running", async ({ roomId }) => {
      try {
        const session = await getAccessibleLiveSession(roomId, socket.data.user);

        if (!session || session.type !== "live") {
          socket.emit("live:error", "Live-интервью не найдено");
          return;
        }

        io.to(`live:${session.public_id}`).emit("live:console:running", {
          runnerId: socket.data.user.id,
          runnerName: socket.data.user.name,
          runnerRole: socket.data.user.role,
          startedAt: new Date().toISOString(),
        });
      } catch {
        socket.emit("live:error", "Не удалось запустить код");
      }
    });

    socket.on("live:console:result", async ({ roomId, status, output, language }) => {
      try {
        const session = await getAccessibleLiveSession(roomId, socket.data.user);

        if (!session || session.type !== "live") {
          socket.emit("live:error", "Live-интервью не найдено");
          return;
        }

        const result = {
          status: status === "error" ? "error" : "success",
          output: normalizeConsoleOutput(output),
          language: typeof language === "string" ? language : null,
          runnerId: socket.data.user.id,
          runnerName: socket.data.user.name,
          runnerRole: socket.data.user.role,
          executedAt: new Date().toISOString(),
        };

        liveConsoleResults.set(session.public_id, result);
        io.to(`live:${session.public_id}`).emit("live:console:result", result);
      } catch {
        socket.emit("live:error", "Не удалось передать результат запуска");
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

    socket.on("disconnect", async () => {
      if (!socket.data.liveRoomId) {
        return;
      }

      await emitParticipantPresence(io, socket.data.liveRoomId);
    });
  });

  return io;
}

module.exports = initLiveInterviewSocket;
