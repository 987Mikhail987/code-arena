"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import SessionApi from "@/entities/session/api/sessionApi";
import type { MessageType, SessionType } from "@/entities/session/model/types";
import UserApi from "@/entities/user/api/UserApi";
import { selectUser } from "@/entities/user/model/selectors";
import {
  passwordChangeSchema,
  profileSchema,
  type PasswordChangeFormValues,
  type ProfileFormValues,
} from "@/entities/user/model/schemas";
import { clearUser, setUser } from "@/entities/user/model/userSlice";
import { setAccessToken } from "@/shared/lib/axiosInstance";
import FormInput from "@/shared/ui/FormInput/FormInput";
import styles from "./page.module.css";
import UserGuard from "@/shared/hocs/UserGuard/UserGuard";

export function ProfilePage(): ReactNode {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [accountMessage, setAccountMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [sessions, setSessions] = useState<SessionType[]>([]);
  const [sessionsMessage, setSessionsMessage] = useState("");
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(
    null,
  );
  const [sessionDetailsById, setSessionDetailsById] = useState<
    Record<string, SessionType>
  >({});
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(
    null,
  );
  const [isClearingHistory, setIsClearingHistory] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? "",
      role: user?.role ?? "candidate",
    },
  });

  const passwordForm = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      password: "",
      newPassword: "",
      repeatNewPassword: "",
    },
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    profileForm.reset({
      name: user.name,
      role: user.role,
    });
  }, [profileForm, user]);

  useEffect(() => {
    let isMounted = true;

    async function loadSessions() {
      setIsLoadingSessions(true);
      setSessionsMessage("");

      try {
        const response = await SessionApi.getUserSessions();

        if (!isMounted) {
          return;
        }

        if (response.statusCode === 200) {
          setSessions(response.data);
          return;
        }

        setSessionsMessage(
          response.error || response.message || "Не удалось загрузить историю",
        );
      } catch {
        if (isMounted) {
          setSessionsMessage("Не удалось загрузить историю");
        }
      } finally {
        if (isMounted) {
          setIsLoadingSessions(false);
        }
      }
    }

    void loadSessions();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!user) {
    return null;
  }

  async function saveProfileHandler(values: ProfileFormValues) {
    setAccountMessage("");
    setProfileMessage("");

    const response = await UserApi.updateProfile(values);

    if (response?.statusCode === 200) {
      dispatch(setUser(response.data));
      setProfileMessage("Профиль успешно обновлен");
      return;
    }

    profileForm.setError("root", {
      message:
        response?.error || response?.message || "Не удалось обновить профиль",
    });
  }

  async function changePasswordHandler(values: PasswordChangeFormValues) {
    setAccountMessage("");
    setPasswordMessage("");

    const response = await UserApi.changePassword({
      password: values.password,
      newPassword: values.newPassword,
    });

    if (response?.statusCode === 200) {
      passwordForm.reset({
        password: "",
        newPassword: "",
        repeatNewPassword: "",
      });
      setPasswordMessage("Пароль успешно обновлен");
      return;
    }

    passwordForm.setError("root", {
      message:
        response?.error || response?.message || "Не удалось обновить пароль",
    });
  }

  async function logoutHandler() {
    await UserApi.logout();
    dispatch(clearUser());
    setAccessToken("");
    router.replace("/auth");
  }

  async function deleteAccountHandler() {
    const isConfirmed = window.confirm(
      "Удалить аккаунт без возможности восстановления?",
    );
    if (!isConfirmed) {
      return;
    }

    setIsDeleting(true);
    setAccountMessage("");

    const response = await UserApi.deleteAccount();

    if (response?.statusCode === 200) {
      dispatch(clearUser());
      setAccessToken("");
      router.replace("/auth");
      return;
    }

    setAccountMessage(
      response?.error || response?.message || "Не удалось удалить аккаунт",
    );
    setIsDeleting(false);
  }

  async function toggleSessionDetails(session: SessionType) {
    const sessionKey = session.public_id || session.publicId || session.id;

    if (expandedSessionId === sessionKey) {
      setExpandedSessionId(null);
      return;
    }

    setExpandedSessionId(sessionKey);

    if (sessionDetailsById[sessionKey]) {
      return;
    }

    const response = await SessionApi.getSessionById(sessionKey);

    if (response.statusCode === 200) {
      setSessionDetailsById((prev) => ({
        ...prev,
        [sessionKey]: response.data,
      }));
      return;
    }

    setSessionsMessage(
      response.error || response.message || "Не удалось загрузить сообщения",
    );
  }

  async function deleteSessionHandler(sessionId: string) {
    const isConfirmed = window.confirm("Удалить это собеседование из истории?");

    if (!isConfirmed) {
      return;
    }

    setDeletingSessionId(sessionId);
    setSessionsMessage("");

    const response = await SessionApi.deleteSession(sessionId);

    if (response.statusCode === 200) {
      setSessions((prev) => prev.filter((session) => session.id !== sessionId));
      setSessionDetailsById((prev) => {
        const next = { ...prev };
        const deletedSession = sessions.find((session) => session.id === sessionId);
        const sessionKey =
          deletedSession?.public_id || deletedSession?.publicId || sessionId;

        delete next[sessionKey];
        return next;
      });

      const deletedSession = sessions.find((session) => session.id === sessionId);
      const sessionKey =
        deletedSession?.public_id || deletedSession?.publicId || sessionId;

      if (expandedSessionId === sessionKey) {
        setExpandedSessionId(null);
      }
    } else {
      setSessionsMessage(
        response.error || response.message || "Не удалось удалить сессию",
      );
    }

    setDeletingSessionId(null);
  }

  async function clearHistoryHandler() {
    const isConfirmed = window.confirm(
      "Очистить всю историю собеседований? Это действие нельзя отменить.",
    );

    if (!isConfirmed) {
      return;
    }

    setIsClearingHistory(true);
    setSessionsMessage("");

    const response = await SessionApi.deleteAllSessions();

    if (response.statusCode === 200) {
      setSessions([]);
      setSessionDetailsById({});
      setExpandedSessionId(null);
    } else {
      setSessionsMessage(
        response.error || response.message || "Не удалось очистить историю",
      );
    }

    setIsClearingHistory(false);
  }

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  function getMessageText(message: MessageType) {
    const content = message.content.trim();

    if (!content.startsWith("{")) {
      return message.content;
    }

    try {
      const parsed = JSON.parse(content) as {
        chatMessage?: unknown;
        answer?: unknown;
      };
      const visibleContent = parsed.chatMessage || parsed.answer;

      return typeof visibleContent === "string" ? visibleContent : message.content;
    } catch {
      return message.content;
    }
  }

  const historySection = (
    <section className={styles.card}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.cardTitle}>
            История собеседований
          </h2>
          <p className={styles.sectionSubtitle}>
            Прошлые сессии и сообщения внутри выбранного интервью.
          </p>
        </div>
        <button
          type="button"
          className={styles.dangerButton}
          onClick={clearHistoryHandler}
          disabled={isLoadingSessions || sessions.length === 0 || isClearingHistory}
        >
          {isClearingHistory ? "Очищаем..." : "Очистить историю"}
        </button>
      </div>

      {isLoadingSessions ? (
        <p className={styles.message}>Загружаем историю...</p>
      ) : null}
      {sessionsMessage ? (
        <p className={styles.formError}>{sessionsMessage}</p>
      ) : null}
      {!isLoadingSessions && sessions.length === 0 ? (
        <p className={styles.message}>История пока пустая.</p>
      ) : null}

      <div className={styles.sessionsList}>
        {sessions.map((session) => {
          const sessionKey = session.public_id || session.publicId || session.id;
          const isExpanded = expandedSessionId === sessionKey;
          const details = sessionDetailsById[sessionKey];
          const messages = details?.messages ?? [];
          const isDeletingSession = deletingSessionId === session.id;

          return (
            <article className={styles.sessionCard} key={session.id}>
              <div className={styles.sessionCardHeader}>
                <div>
                  <h3>{session.topic}</h3>
                  <p>
                    {session.user?.name
                      ? `${session.user.name} · ${formatDate(session.createdAt)}`
                      : formatDate(session.createdAt)}
                  </p>
                </div>
                <span className={styles.statusBadge}>
                  {session.status === "complited" ? "Завершено" : "Активно"}
                </span>
              </div>

              <div className={styles.sessionMeta}>
                <span>{session.level}</span>
                <span>
                  {session.programming_language || session.programmingLanguage}
                </span>
                <span>{session.type === "ai" ? "AI" : "Live"}</span>
              </div>

              {session.result?.feedback ? (
                <p className={styles.feedbackPreview}>
                  {session.result.feedback}
                </p>
              ) : null}

              <div className={styles.sessionActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => toggleSessionDetails(session)}
                  disabled={isDeletingSession}
                >
                  {isExpanded ? "Скрыть сообщения" : "Показать сообщения"}
                </button>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => router.push(`/room/${sessionKey}`)}
                  disabled={isDeletingSession}
                >
                  Открыть интервью
                </button>
                <button
                  type="button"
                  className={styles.dangerButton}
                  onClick={() => deleteSessionHandler(session.id)}
                  disabled={isDeletingSession}
                >
                  {isDeletingSession ? "Удаляем..." : "Удалить"}
                </button>
              </div>

              {isExpanded ? (
                <div className={styles.messagesList}>
                  {messages.length > 0 ? (
                    messages.map((message) => (
                      <div className={styles.messageItem} key={message.id}>
                        <strong>
                          {message.metadata?.senderName ||
                            (message.role === "user" ? "Вы" : "AI")}
                        </strong>
                        <p>{getMessageText(message)}</p>
                      </div>
                    ))
                  ) : (
                    <p className={styles.message}>Сообщений пока нет.</p>
                  )}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );

  return (
    <div className={`app-container ${styles.profilePage}`}>
      <section className={styles.heroCard}>
        <p className={styles.kicker}>Профиль</p>
        <h1 className={styles.title}>{user.name}</h1>
        <p className={styles.subtitle}>{user.email}</p>
        <div className={styles.badges}>
          <span className={styles.badge}>
            {user.role === "candidate" ? "Кандидат" : "Интервьюер"}
          </span>
        </div>
      </section>

      {historySection}

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Данные аккаунта</h2>
          <form
            className={styles.form}
            onSubmit={profileForm.handleSubmit(saveProfileHandler)}
          >
            <div className={styles.formField}>
              <FormInput
                placeholder=" "
                type="text"
                label="Имя"
                {...profileForm.register("name")}
              />
              {profileForm.formState.errors.name ? (
                <p className={styles.formError}>
                  {profileForm.formState.errors.name.message}
                </p>
              ) : null}
            </div>
            <div className={styles.formField}>
              <div className={styles.selectWrapper}>
                <select
                  id="role"
                  className={`${styles.select} form-input`}
                  {...profileForm.register("role")}
                >
                  <option value="candidate">Кандидат</option>
                  <option value="intervier">Интервьюер</option>
                </select>
                <label
                  className={`form-input-label ${styles.selectLabel}`}
                  htmlFor="role"
                >
                  Роль
                </label>
              </div>
              {profileForm.formState.errors.role ? (
                <p className={styles.formError}>
                  {profileForm.formState.errors.role.message}
                </p>
              ) : null}
            </div>
            {profileForm.formState.errors.root ? (
              <p className={styles.formError}>
                {profileForm.formState.errors.root.message}
              </p>
            ) : null}
            <button
              className={styles.primaryButton}
              disabled={profileForm.formState.isSubmitting}
            >
              {profileForm.formState.isSubmitting
                ? "Сохраняем..."
                : "Сохранить профиль"}
            </button>
            {profileMessage ? (
              <p className={styles.message}>{profileMessage}</p>
            ) : null}
          </form>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Безопасность</h2>
          <form
            className={styles.form}
            onSubmit={passwordForm.handleSubmit(changePasswordHandler)}
          >
            <div className={styles.formField}>
              <FormInput
                placeholder=" "
                type="password"
                label="Текущий пароль"
                {...passwordForm.register("password")}
              />
              {passwordForm.formState.errors.password ? (
                <p className={styles.formError}>
                  {passwordForm.formState.errors.password.message}
                </p>
              ) : null}
            </div>
            <div className={styles.formField}>
              <FormInput
                placeholder=" "
                type="password"
                label="Новый пароль"
                {...passwordForm.register("newPassword")}
              />
              {passwordForm.formState.errors.newPassword ? (
                <p className={styles.formError}>
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              ) : null}
            </div>
            <div className={styles.formField}>
              <FormInput
                placeholder=" "
                type="password"
                label="Повторите новый пароль"
                {...passwordForm.register("repeatNewPassword")}
              />
              {passwordForm.formState.errors.repeatNewPassword ? (
                <p className={styles.formError}>
                  {passwordForm.formState.errors.repeatNewPassword.message}
                </p>
              ) : null}
            </div>
            {passwordForm.formState.errors.root ? (
              <p className={styles.formError}>
                {passwordForm.formState.errors.root.message}
              </p>
            ) : null}
            <button
              className={styles.primaryButton}
              disabled={passwordForm.formState.isSubmitting}
            >
              {passwordForm.formState.isSubmitting
                ? "Обновляем..."
                : "Изменить пароль"}
            </button>
            {passwordMessage ? (
              <p className={styles.message}>{passwordMessage}</p>
            ) : null}
          </form>
        </section>
      </div>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Действия</h2>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={logoutHandler}
          >
            Выйти из аккаунта
          </button>
          <button
            type="button"
            className={styles.dangerButton}
            onClick={deleteAccountHandler}
            disabled={isDeleting}
          >
            {isDeleting ? "Удаляем..." : "Удалить аккаунт"}
          </button>
        </div>
        {accountMessage ? (
          <p className={styles.message}>{accountMessage}</p>
        ) : null}
      </section>

    </div>
  );
}

export default function ProfileLayout() {
  return (
    <UserGuard mode="authenticated" redirectTo="/auth">
      <ProfilePage />
    </UserGuard>
  );
}
