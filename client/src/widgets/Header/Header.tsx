import { NavLink } from "react-router";
import UserApi from "../../entities/user/api/UserApi";
import { setAccessToken } from "../../shared/lib/axiosInstance";
import type { AppRouterProps } from "../../app/routing";
import "./Header.css";

export default function Header({ user, setUser }: AppRouterProps) {
  async function handleLogout() {
    const { statusCode } = await UserApi.logout();
    if (statusCode === 200) {
      setUser(null);
      setAccessToken("");
    }
  }

  return (
    <header className="header">
      <div className="page-shell header__inner">
        <div className="header__brand">
          <NavLink className="header__logo" to="/">
            Dev Assistant
          </NavLink>
          <span className="header__caption">
            Учебный AI-помощник для вопросов, фиксов и ревью
          </span>
        </div>

        <nav className="header__nav">
          <NavLink className="header__link" to="/">
            Главная
          </NavLink>

          {user ? (
            <>
              <NavLink className="header__link" to="/app">
                Ассистент
              </NavLink>
              <NavLink className="header__link" to="/profile">
                Профиль
              </NavLink>
              <button className="header__button" onClick={handleLogout}>
                Выйти
              </button>
              <span className="header__user">{user.name}</span>
            </>
          ) : (
            <>
              <NavLink className="header__link" to="/authorization">
                Войти
              </NavLink>
              <NavLink className="header__link" to="/register">
                Регистрация
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
