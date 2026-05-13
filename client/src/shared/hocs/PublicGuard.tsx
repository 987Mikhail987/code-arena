import { Navigate } from "react-router";
import type { HocsProps } from ".";

export default function PublicGuard({ children, user }: HocsProps) {
  if (user) {
    return <Navigate to="/" replace />;
  }
  return children;
}
