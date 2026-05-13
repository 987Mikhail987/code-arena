import { Outlet } from "react-router";
import Header from "../../widgets/Header/Header";
import type { AppRouterProps } from "../routing/index";
import "./Layout.css";

export default function Layout({ user, setUser }: AppRouterProps) {
  return (
    <div className="layout">
      <Header user={user} setUser={setUser} />
      <main className="layout__main">
        <Outlet />
      </main>
      <footer className="layout__footer">
        <div className="page-shell layout__footer-inner">
          <span>AI assistant for learning and code review</span>
          <span>Built with React and a lot of persistence</span>
        </div>
      </footer>
    </div>
  );
}
