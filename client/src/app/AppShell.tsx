"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { User } from "@/entities/user/model/types";
import UserApi from "@/entities/user/api/UserApi";
import { setAccessToken } from "@/shared/lib/axiosInstance";
import Header from "@/widgets/Header/Header";
import "./AppShell.css";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await UserApi.refresh();

        if (response?.statusCode === 200) {
          setAccessToken(response.data.accessToken);
          setUser(response.data.user);
        }
      } catch {
        setAccessToken("");
      }
    }

    void loadUser();
  }, []);

  return (
    <div className="app-shell">
      <Header user={user} setUser={setUser} />
      <main className="layout-content">{children}</main>
      <footer className="app-footer">
        <div className="app-container footer-content">
     
        </div>
      </footer>
    </div>
  );
}
