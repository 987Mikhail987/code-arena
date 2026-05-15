"use client";

import React, { useState } from "react";

export type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
};

export type ChatProps = {
  messages?: Message[];
  onSendMessage?: (message: string) => void;
  isTyping?: boolean;
  placeholder?: string;
  title?: string;
};

export default function Chat({
  messages = [],
  onSendMessage,
  placeholder = "Напишите сообщение...",
  title = "Чат с AI",
}: ChatProps) {
  const [inputValue, setInputValue] = useState("");
  const [chatMessages, setChatMessages] = useState<Message[]>(messages);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedValue = inputValue.trim();

    if (!trimmedValue) {
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedValue,
    };

    const aiMessage: Message = {
      id: crypto.randomUUID(),
      role: "ai",
      content: `Заглушка ответа AI: получено сообщение "${trimmedValue}".`,
    };
    //Сообщение добавляется в историю чата.
    setChatMessages((prev) => [...prev, userMessage, aiMessage]);
    //Если снаружи передали колбэк, он вызовется. ?. означает: вызвать только если функция существует.
    onSendMessage?.(trimmedValue);
    //После отправки поле очищается, и включается индикатор печати AI.
    setInputValue("");
  };

  return (
    <section
      style={{
        height: "50vh",
        width: "40vw",
        border: "1px solid #ccc",
        display: "flex",
        flexDirection: "column",
        padding: "12px",
        gap: "12px",
      }}
    >
      <h3>{title}</h3>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {chatMessages.length === 0 ? (
          <div>Начните диалог с AI</div>
        ) : (
          chatMessages.map((message) => (
            <div key={message.id}>
              <strong>{message.role === "user" ? "Вы" : "AI"}:</strong>{" "}
              {message.content}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder={placeholder}
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={!inputValue.trim()}>
          Отправить
        </button>
      </form>
    </section>
  );
}
