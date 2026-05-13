"use client";

import type { ReactNode } from "react";
import UserGuard from "@/features/auth/ui/UserGuard/UserGuard";

type ProfileLayoutProps = {
  children: ReactNode;
};

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  return (
    <UserGuard mode="authenticated" redirectTo="/auth">
      {children}
    </UserGuard>
  );
}
