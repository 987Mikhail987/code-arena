"use client";

import { Editor } from "@monaco-editor/react";
import React, { useState } from "react";
import { executeCodeInBrowser } from "@/shared/lib/runCode";
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
  const [terminalOutput, setTerminalOutput] = useState([
    "Терминал готов к запуску.",
  ]);

  const currentCode = typeof code === "string" ? code : initialCode;

  const handleEditorChange = (value: string | undefined) => {
    if (!disabled && value !== undefined) {
      onChange?.(value);
    }
  };

  const handleRunCode = async () => {
    if (disabled) {
      return;
    }

    setTerminalOutput(["Выполняем код..."]);
    const result = await executeCodeInBrowser(currentCode, language);
    setTerminalOutput(result.output);
  };

  const handleSubmitCode = () => {
    if (disabled) {
      return;
    }

    onSubmitCode?.(currentCode);
    setTerminalOutput(["Код отправлен на проверку AI."]);
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
        <div className={styles.terminalHeader}>
          <h3>Терминал</h3>
          <div className={styles.terminalActions}>
            <button type="button" onClick={handleRunCode} disabled={disabled}>
              Запустить
            </button>
            <button type="button" onClick={handleSubmitCode} disabled={disabled}>
              Отправить на проверку
            </button>
          </div>
        </div>
        <pre className={styles.terminalOutput}>
          {disabled
            ? "Интервью завершено. Запуск недоступен."
            : terminalOutput.join("\n")}
        </pre>
      </section>
    </div>
  );
}
