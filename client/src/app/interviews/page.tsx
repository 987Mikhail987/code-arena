"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "../store/hooks";
import SessionApi from "@/entities/session/api/sessionApi";
import type { SessionType } from "@/entities/session/model/types";
import { selectUser } from "@/entities/user/model/selectors";
import UserGuard from "@/shared/hocs/UserGuard/UserGuard";
import styles from "./page.module.css";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getSessionKey(session: SessionType) {
  return session.public_id || session.publicId || session.id;
}

export default function InterviewsPage() {
  const router = useRouter();
  const user = useAppSelector(selectUser);
  const [sessions, setSessions] = useState<SessionType[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role === "candidate") {
      router.replace("/dashboard");
    }
  }, [router, user?.role]);

  useEffect(() => {
    let isMounted = true;

    async function loadSessions() {
      if (user?.role !== "intervier") {
        return;
      }

      setIsLoading(true);
      setMessage("");

      try {
        const response = await SessionApi.getActiveLiveSessions();

        if (!isMounted) {
          return;
        }

        if (response.statusCode === 200) {
          setSessions(response.data);
          return;
        }

        setMessage(
          response.error || response.message || "Не удалось загрузить интервью",
        );
      } catch {
        if (isMounted) {
          setMessage("Не удалось загрузить интервью");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadSessions();

    return () => {
      isMounted = false;
    };
  }, [user?.role]);

  return (
    <UserGuard mode="authenticated" redirectTo="/auth">
      <div className={`app-container ${styles.interviewsPage}`}>
        <section className={styles.heading}>
          <p>Live интервью</p>
          <h1>Активные комнаты кандидатов</h1>
        </section>

        <section className={styles.card}>
          {isLoading ? <p className={styles.message}>Загружаем интервью...</p> : null}
          {message ? <p className={styles.error}>{message}</p> : null}
          {!isLoading && sessions.length === 0 ? (
            <p className={styles.message}>Активных live-интервью пока нет.</p>
          ) : null}

          <div className={styles.sessionsList}>
            {sessions.map((session) => (
              <article className={styles.sessionCard} key={session.id}>
                <div className={styles.sessionCardHeader}>
                  <div>
                    <h2>{session.topic}</h2>
                    <p>
                      {session.user?.name
                        ? `${session.user.name} · ${formatDate(session.createdAt)}`
                        : formatDate(session.createdAt)}
                    </p>
                  </div>
                  <span className={styles.statusBadge}>Активно</span>
                </div>

                <div className={styles.sessionMeta}>
                  <span>{session.level}</span>
                  <span>
                    {session.programming_language || session.programmingLanguage}
                  </span>
                </div>

                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => router.push(`/room/${getSessionKey(session)}`)}
                >
                  Подключиться
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </UserGuard>
  );
}
