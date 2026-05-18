"use client";

import React, { useState } from "react";
import styles from "./ChatwithAi.module.css";
import type { MessageType } from "@/entities/session/model/types";

export type ChatProps = {
  messages?: MessageType[];
  onSendMessage?: (message: string) => void;
  isTyping?: boolean;
  placeholder?: string;
  title?: string;
  disabled?: boolean;
  onSubmitCode?: (code: string) => void;
};

export default function Chat({
  messages = [],
  onSendMessage,
  placeholder = "Напишите сообщение...",
  title = "Чат с AI",
  disabled = false,
}: ChatProps) {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedValue = inputValue.trim();

    if (disabled || !trimmedValue) {
      return;
    }

    onSendMessage?.(trimmedValue);
    setInputValue("");
  };

  return (
    <section className={styles.chat}>
      <h3>{title}</h3>

      <div className={styles.messages}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>Начните диалог с AI</div>
        ) : (
          messages.map((message) => (
            <div
              className={
                message.role === "user" ? styles.userMessage : styles.aiMessage
              }
              key={message.id}
            >
              <strong>{message.role === "user" ? "Вы" : "AI"}:</strong>{" "}
              {message.content}
              {message.metadata?.task?.description ? (
                <div>
                  <p>{message.metadata.task.description}</p>
                </div>
              ) : null}
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
