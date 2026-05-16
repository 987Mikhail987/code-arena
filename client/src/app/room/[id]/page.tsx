"use client";

import SessionApi from "@/entities/session/api/sessionApi";
import type { SessionStatusType } from "@/entities/session/model/types";
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

  const isComplited = status === "complited";
  const isRoomDisabled = isLoadingSession || Boolean(sessionError) || isComplited;

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
          setStatus(response.data.status);
          return;
        }

        setSessionError(response.error || response.message || "Не удалось загрузить интервью");
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

  async function handleFinishInterview() {
    if (isComplited) {
      return;
    }

    setIsFinishing(true);
    setFinishError("");

    try {
      const response = await SessionApi.finishSession(params.id);

      if (response.statusCode === 200) {
        setStatus(response.data.status);
        return;
      }

      setFinishError(response.error || response.message || "Не удалось завершить интервью");
    } catch {
      setFinishError("Не удалось завершить интервью");
    } finally {
      setIsFinishing(false);
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
          disabled={isLoadingSession || Boolean(sessionError) || isFinishing || isComplited}
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
        <Chat disabled={isRoomDisabled} />
        <Redactor disabled={isRoomDisabled} />
      </div>
    </div>
  );
}
