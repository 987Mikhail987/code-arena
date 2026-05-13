import { Navigate } from "react-router";
import type { HocsProps } from ".";

export default function AuthorizationGuard({ children, user}: HocsProps) {
  if (!user) {
    return <Navigate to="/authorization" replace />;
  }
  return children;
}
