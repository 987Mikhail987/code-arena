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
import { LiveConsole } from "./LiveConsole";
import { LiveInterviewChat } from "./LiveInterviewChat";
import styles from "./LiveInterviewRoom.module.css";

type LiveInterviewRoomProps = {
  session: SessionType;
  disabled?: boolean;
  initialCode: string;
  language: ProgrammingLanguageType;
  onCodeChange?: (code: string) => void;
};

type LiveParticipantPresence = {
  candidateConnected: boolean;
  interviewerConnected: boolean;
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
  const [currentCode, setCurrentCode] = useState(initialCode);
  const [presence, setPresence] = useState<LiveParticipantPresence>({
    candidateConnected: currentUser?.role === "candidate",
    interviewerConnected: currentUser?.role === "intervier",
  });

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

    function handleParticipants(nextPresence: LiveParticipantPresence) {
      setPresence(nextPresence);
    }

    socket.on("connect", handleConnect);
    socket.on("live:joined", handleJoined);
    socket.on("disconnect", handleDisconnect);
    socket.on("live:error", handleError);
    socket.on("live:chat:new", handleNewMessage);
    socket.on("live:participants", handleParticipants);
    socket.connect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("live:joined", handleJoined);
      socket.off("disconnect", handleDisconnect);
      socket.off("live:error", handleError);
      socket.off("live:chat:new", handleNewMessage);
      socket.off("live:participants", handleParticipants);
      socket.disconnect();
    };
  }, [roomId, socket]);

  const statusText = useMemo(() => {
    if (connectionError) {
      return connectionError;
    }

    if (!isConnected) {
      return "Подключаем live-комнату...";
    }

    const candidateStatus = presence.candidateConnected
      ? "кандидат подключён"
      : "кандидат не подключён";
    const interviewerStatus = presence.interviewerConnected
      ? "интервьюер подключён"
      : "интервьюер не подключён";

    return `${candidateStatus}, ${interviewerStatus}`;
  }, [connectionError, isConnected, presence]);

  function handleSendMessage(content: string) {
    socketRef.current?.emit("live:chat:send", {
      roomId,
      content,
    });
  }

  function handleCodeChange(code: string) {
    setCurrentCode(code);
    onCodeChange?.(code);
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
        <div className={styles.codePanel}>
          <LiveCodeEditor
            socket={socket}
            roomId={roomId}
            initialCode={initialCode}
            language={language}
            disabled={disabled}
            onCodeChange={handleCodeChange}
          />
          <LiveConsole
            socket={socket}
            roomId={roomId}
            code={currentCode}
            language={language}
            disabled={disabled || !isConnected}
          />
        </div>
      </div>
    </div>
  );
}
