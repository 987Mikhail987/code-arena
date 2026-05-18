"use client";

import React, { useEffect, useRef, useState } from "react";
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

function getVisibleMessageContent(content: string) {
  const trimmedContent = content.trim();

  if (!trimmedContent.startsWith("{")) {
    return content;
  }

  try {
    const parsed = JSON.parse(trimmedContent) as {
      chatMessage?: unknown;
      answer?: unknown;
    };
    const visibleContent = parsed.chatMessage || parsed.answer;

    return typeof visibleContent === "string" ? visibleContent : content;
  } catch {
    return content;
  }
}

export default function Chat({
  messages = [],
  onSendMessage,
  placeholder = "Напишите сообщение...",
  title = "Чат с AI",
  disabled = false,
}: ChatProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    const textarea = inputRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [inputValue]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedValue = inputValue.trim();

    if (disabled || !trimmedValue) {
      return;
    }

    onSendMessage?.(trimmedValue);
    setInputValue("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  return (
    <section className={styles.chat}>
      <h3>{title}</h3>

      <div ref={messagesContainerRef} className={styles.messages}>
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
              {getVisibleMessageContent(message.content)}
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
        <textarea
          ref={inputRef}
          rows={1}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
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
