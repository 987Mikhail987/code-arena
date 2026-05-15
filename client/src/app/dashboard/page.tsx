"use client";
import UserGuard from "@/shared/hocs/UserGuard/UserGuard";
import Chat from "@/widgets/ChatwithAi/ChatwithAi";
import ChooseInterviewPage from "@/widgets/ChooseInterview/ui/ChooseInterview";
import Redactor from "@/widgets/Redactor/Redactor";
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
