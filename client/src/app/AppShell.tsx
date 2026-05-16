"use client";

import { useEffect, type ReactNode } from "react";
import { useAppDispatch } from "./store/hooks";
import { reloadUser } from "@/entities/user/model/userSlice";
import Header from "@/widgets/Header/Header";
import "./AppShell.css";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(reloadUser());
  }, [dispatch]);

  return (
    <div className="app-shell">
      <Header />
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
