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

const DEFAULT_CODE = "// \u0412\u0430\u0448 \u043a\u043e\u0434";
const LOAD_SESSION_ERROR =
  "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0438\u043d\u0442\u0435\u0440\u0432\u044c\u044e";
const FINISH_SESSION_ERROR =
  "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u044c \u0438\u043d\u0442\u0435\u0440\u0432\u044c\u044e";
const SEND_MESSAGE_ERROR =
  "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435";
const SEND_CODE_ERROR =
  "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u043a\u043e\u0434";
const CHECK_SOLUTION_MESSAGE =
  "\u041f\u0440\u043e\u0432\u0435\u0440\u044c \u043c\u043e\u0451 \u0440\u0435\u0448\u0435\u043d\u0438\u0435";
const ROOM_LABEL = "\u041a\u043e\u043c\u043d\u0430\u0442\u0430 \u0438\u043d\u0442\u0435\u0440\u0432\u044c\u044e";
const ROOM_TITLE =
  "\u0414\u043e\u0431\u0440\u043e \u043f\u043e\u0436\u0430\u043b\u043e\u0432\u0430\u0442\u044c \u043d\u0430 \u0441\u043e\u0431\u0435\u0441\u0435\u0434\u043e\u0432\u0430\u043d\u0438\u0435";
const LOADING_LABEL = "\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c...";
const OPEN_FEEDBACK_LABEL = "\u041f\u043e\u043a\u0430\u0437\u0430\u0442\u044c feedback";
const FINISHING_LABEL = "\u0417\u0430\u0432\u0435\u0440\u0448\u0430\u0435\u043c...";
const FINISH_LABEL = "\u0417\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u044c \u0438\u043d\u0442\u0435\u0440\u0432\u044c\u044e";
const FEEDBACK_TITLE = "Feedback \u043f\u043e \u0438\u043d\u0442\u0435\u0440\u0432\u044c\u044e";
const CLOSE_LABEL = "\u0417\u0430\u043a\u0440\u044b\u0442\u044c";

export default function RoomPage() {
  const params = useParams<{ id: string }>();
  const [session, setSession] = useState<SessionType | null>(null);
  const [status, setStatus] = useState<SessionStatusType>("active");
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [finishError, setFinishError] = useState("");
  const [editorCode, setEditorCode] = useState(DEFAULT_CODE);
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

        setSessionError(response.error || response.message || LOAD_SESSION_ERROR);
      } catch {
        if (isMounted) {
          setSessionError(LOAD_SESSION_ERROR);
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
      ?.filter((message) => message.role === "assistant" || message.role === "ai")
      .findLast((message) => message.metadata?.task);
  }, [session]);

  const starterCode =
    session?.result?.code || taskMessage?.metadata?.task?.starterCode || DEFAULT_CODE;

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

      setFinishError(response.error || response.message || FINISH_SESSION_ERROR);
    } catch {
      setFinishError(FINISH_SESSION_ERROR);
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
      setFinishError(response.error || response.message || SEND_MESSAGE_ERROR);
      return;
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
      content: CHECK_SOLUTION_MESSAGE,
      code,
      source: "editor",
    });

    if (response.statusCode !== 201) {
      setFinishError(response.error || response.message || SEND_CODE_ERROR);
      return;
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
          <p>{ROOM_LABEL}</p>
          <h2>{ROOM_TITLE}</h2>
        </div>
        <button
          type="button"
          className={styles.finishButton}
          onClick={handleFinishInterview}
          disabled={isLoadingSession || Boolean(sessionError) || isFinishing}
        >
          {isLoadingSession
            ? LOADING_LABEL
            : isComplited
              ? OPEN_FEEDBACK_LABEL
              : isFinishing
                ? FINISHING_LABEL
                : FINISH_LABEL}
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
          className={styles.feedbackOverlay}
          onClick={() => setIsFeedbackOpen(false)}
        >
          <div
            className={styles.feedbackModal}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.feedbackHeader}>
              <h3>{FEEDBACK_TITLE}</h3>
              <button
                type="button"
                className={styles.feedbackCloseIcon}
                onClick={() => setIsFeedbackOpen(false)}
                aria-label={`${CLOSE_LABEL} feedback`}
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
                className={styles.feedbackCloseButton}
                onClick={() => setIsFeedbackOpen(false)}
              >
                {CLOSE_LABEL}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
