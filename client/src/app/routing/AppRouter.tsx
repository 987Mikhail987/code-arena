import { Routes, Route } from "react-router";
import Layout from "../Layout/Layout";
import {
  HomePage,
  AuthorizationPage,
  RegisterPage,
  NotFoundPage,
  AppPage,
  ProfilePage,
} from "../../pages/index";
// import AuthorizationGuard from "../../shared/hocs/AuthorizationGuard";
import PublicGuard from "../../shared/hocs/PublicGuard";
import type { AppRouterProps } from ".";
import AuthorizationGuard from "../../shared/hocs/AuthorizationGuard";

export default function AppRouter({ user, setUser }: AppRouterProps) {
  return (
    <Routes>
      <Route path="/" element={<Layout user={user} setUser={setUser} />}>
        <Route path="/" element={<HomePage />}></Route>

        <Route
          path="/authorization"
          element={
            <PublicGuard user={user}>
              <AuthorizationPage setUser={setUser} />
            </PublicGuard>
          }
        ></Route>
        <Route
          path="/register"
          element={
            <PublicGuard user={user}>
              <RegisterPage setUser={setUser} />
            </PublicGuard>
          }
        ></Route>
        <Route
          path="/profile"
          element={
            <AuthorizationGuard user={user}>
              <ProfilePage user={user} setUser={setUser} />
            </AuthorizationGuard>
          }
        ></Route>
        <Route
          path="/app"
          element={
            <AuthorizationGuard user={user}>
              <AppPage user={user} />
            </AuthorizationGuard>
          }
        ></Route>

        <Route path="/*" element={<NotFoundPage />}></Route>
      </Route>
    </Routes>
  );
}
