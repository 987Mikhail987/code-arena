"use client";

import { useCallback, useEffect, type ReactNode } from "react";
import { useAppDispatch } from "./store/hooks";
import { reloadUser } from "@/entities/user/model/userSlice";
import Header from "@/widgets/Header/Header";
import "./AppShell.css";

type AppShellProps = {
  children: ReactNode;
};

type Theme = "dark" | "light";

const THEME_STORAGE_KEY = "code-arena-theme";

export default function AppShell({ children }: AppShellProps) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(reloadUser());
  }, [dispatch]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const nextTheme: Theme = savedTheme === "light" ? "light" : "dark";

    document.documentElement.dataset.theme = nextTheme;
  }, []);

  const toggleTheme = useCallback(() => {
    const currentTheme =
      document.documentElement.dataset.theme === "light" ? "light" : "dark";
    const nextTheme: Theme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  }, []);

  return (
    <div className="app-shell">
      <Header onToggleTheme={toggleTheme} />
      <main className="layout-content">{children}</main>
      <footer className="app-footer">
        <div className="app-container footer-content">
          <p>
            Не обращайте внимания, это просто подвал, в котором цыгане держат детей и инвалидов.
          </p>
        </div>
      </footer>
    </div>
  );
}
