import Chat from "@/widgets/ChatwithAi/ChatwithAi";
import Redactor from "@/widgets/Redactor/Redactor";
import React from "react";

export default function RoomPage() {
  return (
    <div>
      <h2>Добро пожаловать на собеседование</h2>
      <Chat />
      <Redactor />
    </div>
  );
}
