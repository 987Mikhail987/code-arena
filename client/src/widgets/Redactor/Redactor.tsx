"use client";

import { Editor } from "@monaco-editor/react";
import React, { useState } from "react";
import styles from "./Redactor.module.css";

export type MonacoLanguage =
  | "javascript"
  | "typescript"
  | "python"
  | "go"
  | "html"
  | "css"
  | "java"
  | "c"
  | "csharp";

export type CodeEditorProps = {
  code?: string;
  initialCode?: string;
  onChange?: (code: string) => void;
  onSubmitCode?: (code: string) => void;
  language?: MonacoLanguage;
  disabled?: boolean;
};

export default function Redactor({
  code,
  initialCode = "// Ваш код",
  language = "javascript",
  onChange,
  onSubmitCode,
  disabled = false,
}: CodeEditorProps) {
  const [lastSubmittedTaskKey, setLastSubmittedTaskKey] = useState("");

  const currentCode = typeof code === "string" ? code : initialCode;
  const taskKey = `${language}:${initialCode}`;
  const terminalMessage =
    lastSubmittedTaskKey === taskKey
      ? "Код отправлен на проверку."
      : "Терминал готов к запуску.";

  const handleEditorChange = (value: string | undefined) => {
    if (!disabled && value !== undefined) {
      onChange?.(value);
    }
  };

  const handleRunCode = () => {
    if (disabled) {
      return;
    }

    onSubmitCode?.(currentCode);
    setLastSubmittedTaskKey(taskKey);
  };

  return (
    <div className={styles.editorShell}>
      <div className={styles.editorPanel}>
        <div className={styles.editorViewport}>
          <Editor
            height="100%"
            width="100%"
            language={language}
            value={currentCode}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              readOnly: disabled,
              wordWrap: "on",
              wrappingIndent: "same",
              scrollBeyondLastLine: false,
            }}
          />
        </div>
      </div>
      <section className={styles.terminal}>
        <div>
          <h3>Терминал</h3>
          <p>
            {disabled
              ? "Интервью завершено. Запуск недоступен."
              : terminalMessage}
          </p>
        </div>
        <button type="button" onClick={handleRunCode} disabled={disabled}>
          Запустить
        </button>
      </section>
    </div>
  );
}
