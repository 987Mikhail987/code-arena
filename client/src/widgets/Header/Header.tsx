"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { selectUser } from "@/entities/user/model/selectors";
import { clearUser } from "@/entities/user/model/userSlice";
import UserApi from "@/entities/user/api/UserApi";
import { setAccessToken } from "@/shared/lib/axiosInstance";
import styles from "./Header.module.css";

export default function Header() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

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
            <>
              <Link href="/dashboard" className={styles.navLink}>
                Интервью
              </Link>
              <Link href="/profile" className={styles.navLink}>
                Профиль
              </Link>
            </>
          ) : (
            <Link href="/auth" className={styles.navLink}>
              Войти
            </Link>
          )}
        </nav>

        {user ? (
          <div className={styles.userActions}>
            <span className={styles.userBadge}>{user.name}</span>
            <button
              type="button"
              className={styles.logoutButton}
              onClick={handleLogout}
              aria-label="Выйти из аккаунта"
              title="Выйти"
            >
              <span className={styles.logoutIcon} aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
