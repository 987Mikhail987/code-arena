"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { selectUser } from "@/entities/user/model/selectors";
import { clearUser } from "@/entities/user/model/userSlice";
import UserApi from "@/entities/user/api/UserApi";
import { setAccessToken } from "@/shared/lib/axiosInstance";
import "./Header.css";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  async function handleLogout() {
    const { statusCode } = await UserApi.logout();

    if (statusCode === 200) {
      dispatch(clearUser());
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
