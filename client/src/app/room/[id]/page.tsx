"use client";

import SessionApi from "@/entities/session/api/sessionApi";
import type {
  SessionStatusType,
  SessionType,
} from "@/entities/session/model/types";
import Chat from "@/widgets/ChatwithAi/ChatwithAi";
import Redactor from "@/widgets/Redactor/Redactor";
import { useParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

export default function RoomPage() {
  const params = useParams<{ id: string }>();
  const [session, setSession] = useState<SessionType | null>(null);
  const [status, setStatus] = useState<SessionStatusType>("active");
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [finishError, setFinishError] = useState("");
  const [editorCode, setEditorCode] = useState("// Ваш код");
  const [feedback, setFeedback] = useState("");
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const isComplited = status === "complited";
  const isRoomDisabled =
    isLoadingSession || Boolean(sessionError) || isFinishing || isComplited;

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

          if (response.data.result?.feedback) {
            setFeedback(response.data.result.feedback);
          }

          if (response.data.result?.code) {
            setEditorCode(response.data.result.code);
          }

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

  const taskMessage = useMemo(() => {
    return session?.messages
      ?.filter(
        (message) => message.role === "assistant" || message.role === "ai",
      )
      .findLast((message) => message.metadata?.task);
  }, [session]);

  const starterCode =
    session?.result?.code ||
    taskMessage?.metadata?.task?.starterCode ||
    "// Ваш код";

  const editorLanguage =
    taskMessage?.metadata?.task?.editorLanguage ||
    session?.programming_language ||
    "javascript";

  async function handleFinishInterview() {
    if (isComplited) {
      if (feedback) {
        setIsFeedbackOpen(true);
      }
      return;
    }

    setIsFinishing(true);
    setFinishError("");

    try {
      const response = await SessionApi.finishSession(params.id, {
        code: editorCode,
        programmingLanguage: editorLanguage,
      });

      if (response.statusCode === 200) {
        setSession(response.data.session);
        setStatus(response.data.session.status);
        setFeedback(response.data.feedback);
        setIsFeedbackOpen(true);
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

    if (response.statusCode !== 201) {
      setFinishError(
        response.error || response.message || "Не удалось отправить сообщение",
      );
      return;
    }

    const assistantTask = response.data.assistantMessage.metadata?.task;

    if (assistantTask?.starterCode) {
      setEditorCode(assistantTask.starterCode);
    }

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

  async function handleSubmitCode(code: string) {
    setEditorCode(code);

    const response = await SessionApi.createMessage(params.id, {
      content: "Проверь моё решение",
      code,
      source: "editor",
    });

    if (response.statusCode !== 201) {
      setFinishError(
        response.error || response.message || "Не удалось отправить код",
      );
      return;
    }

    const assistantTask = response.data.assistantMessage.metadata?.task;

    if (assistantTask?.starterCode) {
      setEditorCode(assistantTask.starterCode);
    }

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
          disabled={isLoadingSession || Boolean(sessionError) || isFinishing}
        >
          {isLoadingSession
            ? "Загружаем..."
            : isComplited
              ? "Показать feedback"
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

      {isFeedbackOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              color: "#111111",
              width: "100%",
              maxWidth: "720px",
              padding: "24px",
            }}
          >
            <h3>Feedback по интервью</h3>
            <p style={{ whiteSpace: "pre-wrap" }}>{feedback}</p>
            <button type="button" onClick={() => setIsFeedbackOpen(false)}>
              Закрыть
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
