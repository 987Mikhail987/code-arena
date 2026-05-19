"use client";

import React, { useEffect, useRef, useState } from "react";
import type { MessageType } from "@/entities/session/model/types";
import styles from "./LiveInterviewRoom.module.css";

type LiveInterviewChatProps = {
  messages: MessageType[];
  disabled?: boolean;
  currentUserId?: number;
  onSendMessage: (content: string) => void;
};

export function LiveInterviewChat({
  messages,
  disabled = false,
  currentUserId,
  onSendMessage,
}: LiveInterviewChatProps) {
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
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [inputValue]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmedValue = inputValue.trim();

    if (disabled || !trimmedValue) {
      return;
    }

    onSendMessage(trimmedValue);
    setInputValue("");
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  }

  return (
    <section className={styles.chat}>
      <h3>Чат интервью</h3>

      <div ref={messagesContainerRef} className={styles.messages}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>Сообщений пока нет</div>
        ) : (
          messages.map((message) => {
            const senderName = message.metadata?.senderName || "Участник";
            const isOwnMessage = message.metadata?.senderId === currentUserId;

            return (
              <div
                className={isOwnMessage ? styles.ownMessage : styles.message}
                key={message.id}
              >
                <strong>{isOwnMessage ? "Вы" : senderName}:</strong>{" "}
                {message.content}
              </div>
            );
          })
        )}
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          rows={1}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Чат недоступен" : "Напишите сообщение..."}
          disabled={disabled}
        />
        <button type="submit" disabled={disabled || !inputValue.trim()}>
          Отправить
        </button>
      </form>
    </section>
  );
}
