"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./ChatwithAi.module.css";
import type { MessageType } from "@/entities/session/model/types";

type SpeechRecognitionAlternative = {
  transcript: string;
};

type SpeechRecognitionResult = {
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
};

type SpeechRecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResult>;
};

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

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
  const [isRecording, setIsRecording] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const baseInputRef = useRef("");

  const speechRecognitionCtor = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }, []);

  const isVoiceSupported = Boolean(speechRecognitionCtor);

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

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedValue = inputValue.trim();

    if (disabled || !trimmedValue) {
      return;
    }

    onSendMessage?.(trimmedValue);
    setInputValue("");
    setVoiceError("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  const handleToggleVoiceInput = () => {
    if (disabled || !speechRecognitionCtor) {
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new speechRecognitionCtor();
    const initialValue = inputValue.trim();

    baseInputRef.current = initialValue;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "ru-RU";

    recognition.onresult = (event) => {
      let transcript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index][0]?.transcript || "";
      }

      const normalizedTranscript = transcript.trim();

      setInputValue(
        normalizedTranscript
          ? [baseInputRef.current, normalizedTranscript].filter(Boolean).join(" ")
          : baseInputRef.current,
      );
      setVoiceError("");
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsRecording(false);
    };

    recognition.onerror = () => {
      recognitionRef.current = null;
      setIsRecording(false);
      setVoiceError("Не удалось распознать голосовой ввод.");
    };

    recognitionRef.current = recognition;
    setVoiceError("");
    setIsRecording(true);
    recognition.start();
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

      {voiceError ? <p className={styles.voiceError}>{voiceError}</p> : null}

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
        <button
          type="button"
          className={styles.voiceButton}
          onClick={handleToggleVoiceInput}
          disabled={disabled || !isVoiceSupported}
          aria-pressed={isRecording}
          title={
            isVoiceSupported
              ? isRecording
                ? "Остановить запись"
                : "Начать голосовой ввод"
              : "Голосовой ввод недоступен в этом браузере"
          }
        >
          {isRecording ? "Стоп" : "Голос"}
        </button>
        <button type="submit" disabled={disabled || !inputValue.trim()}>
          Отправить
        </button>
      </form>
    </section>
  );
}
