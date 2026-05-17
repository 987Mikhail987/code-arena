"use client";

import SessionApi from "@/entities/session/api/sessionApi";
import type {
  SessionStatusType,
  SessionType,
} from "@/entities/session/model/types";
import Chat from "@/widgets/ChatwithAi/ChatwithAi";
import Redactor from "@/widgets/Redactor/Redactor";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import styles from "./page.module.css";

export default function RoomPage() {
  const params = useParams<{ id: string }>();
  const [status, setStatus] = useState<SessionStatusType>("active");
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [finishError, setFinishError] = useState("");
  const [session, setSession] = useState<SessionType | null>(null);
  const [editorCode, setEditorCode] = useState("");

  const isComplited = status === "complited";
  const isRoomDisabled =
    isLoadingSession || Boolean(sessionError) || isComplited;

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      setIsLoadingSession(true);
      setSessionError("");
      setFinishError("");

      try {
        const response = await SessionApi.getSessionById(params.id);

        if (!isMounted) {
          return;
        }

        if (response.statusCode === 200) {
          setSession(response.data);
          setStatus(response.data.status);
          return;
        }

        setSessionError(
          response.error || response.message || "Не удалось загрузить интервью",
        );
      } catch {
        if (isMounted) {
          setSessionError("Не удалось загрузить интервью");
        }
      } finally {
        if (isMounted) {
          setIsLoadingSession(false);
        }
      }
    }

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const taskMessage = session?.messages
    ?.filter((message) => message.role === "assistant" || message.role === "ai")
    .findLast((message) => message.metadata?.task);

  const starterCode = taskMessage?.metadata?.task?.starterCode || "// Ваш код";

  const editorLanguage =
    taskMessage?.metadata?.task?.editorLanguage ||
    session?.programming_language ||
    "javascript";

  async function handleFinishInterview() {
    if (isComplited) {
      return;
    }

    setIsFinishing(true);
    setFinishError("");

    try {
      const response = await SessionApi.finishSession(params.id);

      if (response.statusCode === 200) {
        setSession(response.data);
        setStatus(response.data.status);
        return;
      }

      setFinishError(
        response.error || response.message || "Не удалось завершить интервью",
      );
    } catch {
      setFinishError("Не удалось завершить интервью");
    } finally {
      setIsFinishing(false);
    }
  }

  async function handleSendChatMessage(content: string) {
    const response = await SessionApi.createMessage(params.id, {
      content,
      source: "chat",
    });

    if (response.statusCode === 201) {
      setSession((prev) =>
        prev
          ? {
              ...prev,
              messages: [
                ...(prev.messages ?? []),
                response.data.userMessage,
                response.data.assistantMessage,
              ],
            }
          : prev,
      );
    }
  }

  async function handleSubmitCode(code: string) {
    const response = await SessionApi.createMessage(params.id, {
      content: "Проверь мое решение",
      code,
      source: "editor",
    });

    if (response.statusCode === 201) {
      setSession((prev) =>
        prev
          ? {
              ...prev,
              messages: [
                ...(prev.messages ?? []),
                response.data.userMessage,
                response.data.assistantMessage,
              ],
            }
          : prev,
      );
    }
  }

  return (
    <div className={`app-container ${styles.roomPage}`}>
      <section className={styles.heading}>
        <div>
          <p>Комната интервью</p>
          <h2>Добро пожаловать на собеседование</h2>
        </div>
        <button
          type="button"
          className={styles.finishButton}
          onClick={handleFinishInterview}
          disabled={
            isLoadingSession ||
            Boolean(sessionError) ||
            isFinishing ||
            isComplited
          }
        >
          {isLoadingSession
            ? "Загружаем..."
            : isComplited
              ? "Интервью завершено"
              : isFinishing
                ? "Завершаем..."
                : "Завершить интервью"}
        </button>
      </section>
      {sessionError ? <p className={styles.error}>{sessionError}</p> : null}
      {finishError ? <p className={styles.error}>{finishError}</p> : null}
      <div className={styles.workspace}>
        <Chat
          messages={session?.messages ?? []}
          disabled={isRoomDisabled}
          onSendMessage={handleSendChatMessage}
        />
        <Redactor
          disabled={isRoomDisabled}
          initialCode={starterCode}
          language={editorLanguage}
          onChange={setEditorCode}
          onSubmitCode={handleSubmitCode}
        />
      </div>
    </div>
  );
}
