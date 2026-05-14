"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/app/store/hooks";
import { selectUser, selectUserStatus } from "@/entities/user/model/selectors";

type UserGuardProps = {
  children: ReactNode;
  mode: "guest" | "authenticated";
  redirectTo: string;
};

export default function UserGuard({
  children,
  mode,
  redirectTo,
}: UserGuardProps) {
  const router = useRouter();
  const user = useAppSelector(selectUser);
  const status = useAppSelector(selectUserStatus);

  useEffect(() => {
    if (status === "loading" || status === "idle") {
      return;
    }

    if (mode === "authenticated" && !user) {
      router.replace(redirectTo);
      return;
    }

    if (mode === "guest" && user) {
      router.replace(redirectTo);
    }
  }, [mode, redirectTo, router, status, user]);

  if (status === "loading" || status === "idle") {
    return null;
  }

  if (mode === "authenticated" && !user) {
    return null;
  }

  if (mode === "guest" && user) {
    return null;
  }

  return <>{children}</>;
}
