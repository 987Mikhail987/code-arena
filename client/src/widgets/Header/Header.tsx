"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { selectUser } from "@/entities/user/model/selectors";
import { clearUser } from "@/entities/user/model/userSlice";
import UserApi from "@/entities/user/api/UserApi";
import { setAccessToken } from "@/shared/lib/axiosInstance";
import "./Header.css";

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
    <header className="site-header">
      <div className="app-container header-content">
        <nav className="header-nav">
          <Link href="/" className="navlink">
            Главная
          </Link>

          {user ? (
            <>
              <Link href="/dashboard" className="navlink">
                Интервью
              </Link>
              <Link href="/profile" className="navlink">
                Профиль
              </Link>
              <span className="user-badge">{user.name}</span>
              <button type="button" className="navlink" onClick={handleLogout}>
                Выход
              </button>
            </>
          ) : (
            <Link href="/auth" className="navlink">
              Войти
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
