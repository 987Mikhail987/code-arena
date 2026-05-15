"use client";
import UserGuard from "@/shared/hocs/UserGuard/UserGuard";
import ChooseInterviewPage from "@/widgets/ChooseInterview/ui/ChooseInterview";
import React from "react";

export default function DashboardPage() {
  return (
    <UserGuard mode="authenticated" redirectTo="/auth">
      <div>
        <h1>Сможешь сделать свой выбор ?</h1>
        <ChooseInterviewPage />
      </div>
    </UserGuard>
  );
}
