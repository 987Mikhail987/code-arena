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
  initialCode?: string;
  onChange?: (code: string) => void;
  language?: MonacoLanguage;
  disabled?: boolean;
};

export default function Redactor({
  initialCode = "// Ваш код",
  language = "javascript",
  onChange,
  disabled = false,
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [terminalMessage, setTerminalMessage] = useState(
    "Терминал готов к запуску.",
  );

  const handleEditorChange = (value: string | undefined) => {
    if (!disabled && value !== undefined) {
      setCode(value);
      onChange?.(value);
    }
  };

  const handleRunCode = () => {
    if (disabled) {
      return;
    }

    setTerminalMessage("Код отправлен на проверку. Логика появится позже.");
  };

  return (
    <div className={styles.editorShell}>
      <div className={styles.editorPanel}>
        <Editor
          height="420px"
          width="100%"
          language={language}
          defaultValue={initialCode}
          value={code}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            readOnly: disabled,
          }}
        />
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
