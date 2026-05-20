"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { selectUser } from "@/entities/user/model/selectors";
import { clearUser } from "@/entities/user/model/userSlice";
import UserApi from "@/entities/user/api/UserApi";
import SessionApi from "@/entities/session/api/sessionApi";
import { setAccessToken } from "@/shared/lib/axiosInstance";
import styles from "./Header.module.css";

type HeaderProps = {
  onToggleTheme: () => void;
};

export default function Header({ onToggleTheme }: HeaderProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const [isCheckingSession, setIsCheckingSession] = useState(false);

  async function handleInterviewClick() {
<<<<<<< HEAD
    if (user?.role === "intervier") {
      router.push("/profile");
      return;
    }

=======
>>>>>>> 54c6f02728c93576479ea158cb20330334fa53da
    setIsCheckingSession(true);

    try {
      const response = await SessionApi.getUserSessions();
      const activeSession = response.data?.find(
        (session) => session.status === "active",
      );

      if (response.statusCode === 200 && activeSession) {
        router.push(`/room/${activeSession.id}`);
        return;
      }

      router.push("/dashboard");
    } catch {
      router.push("/dashboard");
    } finally {
      setIsCheckingSession(false);
    }
  }

  async function handleLogout() {
    const { statusCode } = await UserApi.logout();

    if (statusCode === 200) {
      dispatch(clearUser());
      setAccessToken("");
      router.push("/auth");
    }
  }

  return (
    <header className={styles.siteHeader}>
      <div className={`app-container ${styles.headerContent}`}>
        <nav className={styles.headerNav}>
          <Link href="/" className={styles.navLink}>
            Главная
          </Link>

          {user ? (
            <button
              type="button"
              className={styles.navLink}
              onClick={handleInterviewClick}
              disabled={isCheckingSession}
            >
              Интервью
            </button>
          ) : (
            <Link href="/auth" className={styles.navLink}>
              Войти
            </Link>
          )}
        </nav>

        <div className={styles.userActions}>
          <button
            type="button"
            className={styles.themeSwitch}
            onClick={onToggleTheme}
            aria-label="Переключить тему"
            title="Переключить тему"
          >
            <span className={styles.themeTrack} aria-hidden="true">
              <span className={styles.themeThumb} />
            </span>
          </button>
          {user ? (
            <>
              <Link href="/profile" className={styles.userBadge}>
                {user.name}
              </Link>
              <button
                type="button"
                className={styles.logoutButton}
                onClick={handleLogout}
                aria-label="Выйти из аккаунта"
                title="Выйти"
              >
                <span className={styles.logoutIcon} aria-hidden="true" />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
