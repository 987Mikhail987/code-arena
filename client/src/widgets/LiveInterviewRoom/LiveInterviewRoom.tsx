"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAppSelector } from "@/app/store/hooks";
import type {
  MessageType,
  ProgrammingLanguageType,
  SessionType,
} from "@/entities/session/model/types";
import { selectUser } from "@/entities/user/model/selectors";
import { createLiveSocket, type LiveSocket } from "@/shared/lib/liveSocket";
import { LiveCodeEditor } from "./LiveCodeEditor";
import { LiveInterviewChat } from "./LiveInterviewChat";
import styles from "./LiveInterviewRoom.module.css";

type LiveInterviewRoomProps = {
  session: SessionType;
  disabled?: boolean;
  initialCode: string;
  language: ProgrammingLanguageType;
  onCodeChange?: (code: string) => void;
};

function appendMessage(messages: MessageType[], message: MessageType) {
  if (messages.some((currentMessage) => currentMessage.id === message.id)) {
    return messages;
  }

  return [...messages, message];
}

export function LiveInterviewRoom({
  session,
  disabled = false,
  initialCode,
  language,
  onCodeChange,
}: LiveInterviewRoomProps) {
  const currentUser = useAppSelector(selectUser);
  const roomId = session.public_id || session.publicId || session.id;
  const [socket] = useState<LiveSocket>(() => createLiveSocket());
  const socketRef = useRef<LiveSocket>(socket);
  const [messages, setMessages] = useState<MessageType[]>(
    session.messages?.filter((message) => message.metadata?.source === "live-chat") ?? [],
  );
  const [connectionError, setConnectionError] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    function handleConnect() {
      setConnectionError("");
      socket.emit("live:join", { roomId });
    }

    function handleJoined() {
      setIsConnected(true);
    }

    function handleDisconnect() {
      setIsConnected(false);
    }

    function handleError(error: string) {
      setConnectionError(error);
    }

    function handleNewMessage(message: MessageType) {
      setMessages((prevMessages) => appendMessage(prevMessages, message));
    }

    socket.on("connect", handleConnect);
    socket.on("live:joined", handleJoined);
    socket.on("disconnect", handleDisconnect);
    socket.on("live:error", handleError);
    socket.on("live:chat:new", handleNewMessage);
    socket.connect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("live:joined", handleJoined);
      socket.off("disconnect", handleDisconnect);
      socket.off("live:error", handleError);
      socket.off("live:chat:new", handleNewMessage);
      socket.disconnect();
    };
  }, [roomId, socket]);

  const statusText = useMemo(() => {
    if (connectionError) {
      return connectionError;
    }

    return isConnected ? "Участники подключены к live-комнате" : "Подключаем live-комнату...";
  }, [connectionError, isConnected]);

  function handleSendMessage(content: string) {
    socketRef.current?.emit("live:chat:send", {
      roomId,
      content,
    });
  }

  return (
    <div className={styles.liveRoom}>
      <div className={connectionError ? styles.errorStatus : styles.status}>
        {statusText}
      </div>

      <div className={styles.workspace}>
        <LiveInterviewChat
          messages={messages}
          disabled={disabled || !isConnected}
          currentUserId={currentUser?.id}
          onSendMessage={handleSendMessage}
        />
        <LiveCodeEditor
          socket={socket}
          roomId={roomId}
          initialCode={initialCode}
          language={language}
          disabled={disabled}
          onCodeChange={onCodeChange}
        />
      </div>
    </div>
  );
}
