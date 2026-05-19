"use client";

import SessionApi from "@/entities/session/api/sessionApi";
import type {
  MessageType,
  SessionStatusType,
  SessionType,
} from "@/entities/session/model/types";
import Chat from "@/widgets/ChatwithAi/ChatwithAi";
import { LiveInterviewRoom } from "@/widgets/LiveInterviewRoom/LiveInterviewRoom";
import Redactor from "@/widgets/Redactor/Redactor";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

function getLatestTaskMessage(messages?: MessageType[]) {
  return messages
    ?.filter((message) => message.role === "assistant" || message.role === "ai")
    .findLast((message) => message.metadata?.task);
}

export default function RoomPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const editorStorageKey = useMemo(
    () => `code-arena:session:${params.id}:editor-code`,
    [params.id],
  );
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
  const isLiveSession = session?.type === "live";
  const isRoomDisabled =
    isLoadingSession || Boolean(sessionError) || isFinishing || isComplited;

  function updateEditorCode(code: string) {
    setEditorCode(code);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(editorStorageKey, code);
    }
  }

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
          const savedEditorCode =
            typeof window !== "undefined"
              ? window.localStorage.getItem(editorStorageKey)
              : "";
          const latestTask = getLatestTaskMessage(response.data.messages);

          setSession(response.data);
          setStatus(response.data.status);

          if (response.data.result?.feedback) {
            setFeedback(response.data.result.feedback);
          }

          if (response.data.result?.code) {
            setEditorCode(response.data.result.code);
          } else if (savedEditorCode) {
            setEditorCode(savedEditorCode);
          } else if (latestTask?.metadata?.task?.starterCode) {
            setEditorCode(latestTask.metadata.task.starterCode);
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
  }, [editorStorageKey, params.id]);

  const taskMessage = useMemo(() => {
    return getLatestTaskMessage(session?.messages);
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
      const response = await SessionApi.finishSession(
        session?.public_id || session?.publicId || params.id,
        {
          code: editorCode,
          programmingLanguage: editorLanguage,
        },
      );

      if (response.statusCode === 200) {
        setSession(response.data.session);
        setStatus(response.data.session.status);
        setFeedback(response.data.feedback);
        window.localStorage.removeItem(editorStorageKey);
        setIsFeedbackOpen(Boolean(response.data.feedback));
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

  function handleProcessedMessage(
    response: Awaited<ReturnType<typeof SessionApi.createMessage>>,
  ) {
    const assistantMessage = response.data.assistantMessage;
    const assistantTask = assistantMessage?.metadata?.task;

    if (assistantTask?.starterCode) {
      updateEditorCode(assistantTask.starterCode);
    }

    setSession((prev) => {
      const messages = [
        ...(prev?.messages ?? []),
        response.data.userMessage,
        ...(assistantMessage ? [assistantMessage] : []),
      ];

      if (response.data.isFinished && response.data.session) {
        return {
          ...response.data.session,
          messages,
        };
      }

      return prev
        ? {
            ...prev,
            messages,
          }
        : prev;
    });

    if (response.data.isFinished && response.data.session) {
      setStatus(response.data.session.status);
      setFeedback(response.data.feedback || "");
      window.localStorage.removeItem(editorStorageKey);

      if (response.data.feedback) {
        setIsFeedbackOpen(true);
      }
    }
  }

  async function handleSendChatMessage(content: string) {
    const response = await SessionApi.createMessage(params.id, {
      content,
      source: "chat",
    });

    if (response.statusCode !== 201 && response.statusCode !== 200) {
      setFinishError(
        response.error || response.message || "Не удалось отправить сообщение",
      );
      return;
    }

    handleProcessedMessage(response);
  }

  async function handleSubmitCode(code: string) {
    updateEditorCode(code);

    const response = await SessionApi.createMessage(params.id, {
      content: "Проверь моё решение",
      code,
      source: "editor",
    });

    if (response.statusCode !== 201 && response.statusCode !== 200) {
      setFinishError(
        response.error || response.message || "Не удалось отправить код",
      );
      return;
    }

    handleProcessedMessage(response);
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

      {session && isLiveSession ? (
        <LiveInterviewRoom
          session={session}
          disabled={isRoomDisabled}
          initialCode={editorCode || starterCode}
          language={editorLanguage}
          onCodeChange={updateEditorCode}
        />
      ) : (
        <div className={styles.workspace}>
          <Chat
            messages={session?.messages ?? []}
            disabled={isRoomDisabled}
            onSendMessage={handleSendChatMessage}
          />
          <Redactor
            code={editorCode}
            disabled={isRoomDisabled}
            initialCode={starterCode}
            language={editorLanguage}
            onChange={updateEditorCode}
            onSubmitCode={handleSubmitCode}
          />
        </div>
      )}

      {isFeedbackOpen ? (
        <div
          className={styles.feedbackOverlay}
          onClick={() => setIsFeedbackOpen(false)}
        >
          <div
            className={styles.feedbackModal}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.feedbackHeader}>
              <h3>Feedback по интервью</h3>
              <button
                type="button"
                className={styles.feedbackCloseIcon}
                onClick={() => setIsFeedbackOpen(false)}
                aria-label="Закрыть feedback"
              >
                x
              </button>
            </div>
            <div className={styles.feedbackBody}>
              <p>{feedback}</p>
            </div>
            <div className={styles.feedbackFooter}>
              <button
                type="button"
                className={styles.feedbackSecondaryButton}
                onClick={() => router.push("/dashboard")}
              >
                Начать новое собеседование
              </button>
              <button
                type="button"
                className={styles.feedbackCloseButton}
                onClick={() => setIsFeedbackOpen(false)}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
