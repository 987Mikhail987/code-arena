"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
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

type SpeechRecognitionErrorEvent = {
  error:
    | "aborted"
    | "audio-capture"
    | "language-not-supported"
    | "network"
    | "no-speech"
    | "not-allowed"
    | "phrases-not-supported"
    | "service-not-allowed"
    | "bad-grammar"
    | string;
};

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
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

function getVoiceErrorMessage(errorCode: SpeechRecognitionErrorEvent["error"]) {
  switch (errorCode) {
    case "not-allowed":
    case "service-not-allowed":
      return "Браузер не получил доступ к микрофону.";
    case "audio-capture":
      return "Не удалось получить звук с микрофона.";
    case "network":
      return "Ошибка сети при голосовом вводе.";
    case "language-not-supported":
      return "Голосовой ввод для выбранного языка не поддерживается.";
    default:
      return "";
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
  const isStoppingRef = useRef(false);
  const hasRecognizedSpeechRef = useRef(false);
  const speechRecognitionCtor = useSyncExternalStore(
    () => () => {},
    () =>
      window.SpeechRecognition || window.webkitSpeechRecognition || null,
    () => null,
  );
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

  const resetVoiceState = () => {
    baseInputRef.current = "";
    hasRecognizedSpeechRef.current = false;
    setVoiceError("");
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedValue = inputValue.trim();

    if (disabled || !trimmedValue) {
      return;
    }

    isStoppingRef.current = true;
    resetVoiceState();
    recognitionRef.current?.stop();
    onSendMessage?.(trimmedValue);
    setInputValue("");
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
      isStoppingRef.current = true;
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new speechRecognitionCtor();
    const initialValue = inputValue.trim();

    baseInputRef.current = initialValue;
    isStoppingRef.current = false;
    hasRecognizedSpeechRef.current = false;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "ru-RU";

    recognition.onresult = (event) => {
      if (isStoppingRef.current) {
        return;
      }

      let transcript = "";

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        transcript += event.results[index][0]?.transcript || "";
      }

      const normalizedTranscript = transcript.trim();

      if (normalizedTranscript) {
        hasRecognizedSpeechRef.current = true;
      }

      setInputValue(
        normalizedTranscript
          ? [baseInputRef.current, normalizedTranscript].filter(Boolean).join(" ")
          : baseInputRef.current,
      );
      setVoiceError("");
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      isStoppingRef.current = false;
      setIsRecording(false);
    };

    recognition.onerror = (event) => {
      recognitionRef.current = null;
      setIsRecording(false);

      if (
        isStoppingRef.current ||
        event.error === "aborted" ||
        ((event.error === "no-speech" || event.error === "network") &&
          hasRecognizedSpeechRef.current)
      ) {
        isStoppingRef.current = false;
        return;
      }

      setVoiceError(getVoiceErrorMessage(event.error));
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
            !isVoiceSupported
              ? "Голосовой ввод недоступен в этом браузере"
              : isRecording
                ? "Остановить запись"
                : "Начать голосовой ввод"
          }
        >
          {isRecording ? "Стоп" : "Голосовой ввод"}
        </button>
        <button type="submit" disabled={disabled || !inputValue.trim()}>
          Отправить
        </button>
      </form>
    </section>
  );
}
