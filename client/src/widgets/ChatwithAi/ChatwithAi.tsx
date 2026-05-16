"use client";

import React, { useState } from "react";
import styles from "./ChatwithAi.module.css";

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
  disabled?: boolean;
};

export default function Chat({
  messages = [],
  onSendMessage,
  placeholder = "Напишите сообщение...",
  title = "Чат с AI",
  disabled = false,
}: ChatProps) {
  const [inputValue, setInputValue] = useState("");
  const [chatMessages, setChatMessages] = useState<Message[]>(messages);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedValue = inputValue.trim();

    if (disabled || !trimmedValue) {
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
    <section className={styles.chat}>
      <h3>{title}</h3>

      <div className={styles.messages}>
        {chatMessages.length === 0 ? (
          <div className={styles.emptyState}>Начните диалог с AI</div>
        ) : (
          chatMessages.map((message) => (
            <div
              className={
                message.role === "user" ? styles.userMessage : styles.aiMessage
              }
              key={message.id}
            >
              <strong>{message.role === "user" ? "Вы" : "AI"}:</strong>{" "}
              {message.content}
            </div>
          ))
        )}
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder={disabled ? "Интервью завершено" : placeholder}
          disabled={disabled}
        />
        <button type="submit" disabled={disabled || !inputValue.trim()}>
          Отправить
        </button>
      </form>
    </section>
  );
}
