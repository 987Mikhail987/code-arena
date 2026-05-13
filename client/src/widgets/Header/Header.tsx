"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";
import type { User } from "@/entities/user/model/types";
import "./Header.css";
import UserApi from "../../entities/user/api/UserApi";
import { setAccessToken } from "../../shared/lib/axiosInstance";

type HeaderProps = {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
};

export default function Header({ user, setUser }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const { statusCode } = await UserApi.logout();

    if (statusCode === 200) {
      setUser(null);
      setAccessToken("");
      router.push("/auth?mode=signup");
    }
  }

  function getNavLinkClassName(href: string, accent = false) {
    let className = "navlink";

    if (accent) {
      className += " navlink-accent";
    }

    if (pathname === href) {
      className += " active";
    }

    return className;
  }

  return (
    <header className="site-header">
      <div className="app-container header-content">

        <nav className="header-nav">
          <Link href="/" className={getNavLinkClassName("/")}>
            Главная
          </Link>

          <Link href="/game" className={getNavLinkClassName("/game")}>
            Игра
          </Link>

          {user ? (
            <>
              <Link href="/profile" className={getNavLinkClassName("/profile")}>
                Профиль
              </Link>
              <span className="user-badge">{user.name}</span>
              <button
                type="button"
                className={getNavLinkClassName("/auth", true)}
                onClick={handleLogout}
              >
                Выход
              </button>
            </>
          ) : (
            <Link href="/auth" className={getNavLinkClassName("/auth", true)}>
              Войти
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
