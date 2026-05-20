"use client";

import { Editor } from "@monaco-editor/react";
import React, { useEffect, useState } from "react";
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
<<<<<<< HEAD
  const [terminalOutput, setTerminalOutput] = useState([
    "Терминал готов к запуску.",
  ]);

  const currentCode = typeof code === "string" ? code : initialCode;

  const handleEditorChange = (value: string | undefined) => {
    if (!disabled && value !== undefined) {
=======
  const [code, setCode] = useState(initialCode);
  const [terminalMessage, setTerminalMessage] = useState(
    "Терминал готов к запуску.",
  );

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  const handleEditorChange = (value: string | undefined) => {
    if (!disabled && value !== undefined) {
      setCode(value);
>>>>>>> 54c6f02728c93576479ea158cb20330334fa53da
      onChange?.(value);
    }
  };

  const handleRunCode = () => {
    if (disabled) {
      return;
    }

<<<<<<< HEAD
    if (language !== "javascript") {
      setTerminalOutput([
        "Локальный запуск пока доступен только для JavaScript.",
      ]);
      return;
    }

    setTerminalOutput(["Выполняем код..."]);

    const workerCode = `
      const formatValue = (value) => {
        if (typeof value === "undefined") {
          return "undefined";
        }

        if (typeof value === "string") {
          return value;
        }

        try {
          return JSON.stringify(value, null, 2);
        } catch {
          return String(value);
        }
      };

      self.onmessage = (event) => {
        const logs = [];
        const consoleProxy = {
          log: (...args) => logs.push(args.map(formatValue).join(" ")),
          info: (...args) => logs.push(args.map(formatValue).join(" ")),
          warn: (...args) => logs.push(args.map(formatValue).join(" ")),
          error: (...args) => logs.push(args.map(formatValue).join(" ")),
        };

        try {
          const result = new Function("console", '"use strict";\\n' + event.data)(consoleProxy);

          if (typeof result !== "undefined") {
            logs.push(formatValue(result));
          }

          self.postMessage({
            status: "success",
            output: logs.length > 0 ? logs : ["Код выполнен без вывода."],
          });
        } catch (error) {
          self.postMessage({
            status: "error",
            output: [error instanceof Error ? error.message : String(error)],
          });
        }
      };
    `;
    const workerBlob = new Blob([workerCode], { type: "text/javascript" });
    const workerUrl = URL.createObjectURL(workerBlob);
    const worker = new Worker(workerUrl);
    const timeoutId = window.setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      setTerminalOutput(["Выполнение остановлено: превышен лимит 3 секунды."]);
    }, 3000);

    worker.onmessage = (
      event: MessageEvent<{ status: "success" | "error"; output: string[] }>,
    ) => {
      window.clearTimeout(timeoutId);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      setTerminalOutput(event.data.output);
    };

    worker.onerror = (event) => {
      window.clearTimeout(timeoutId);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      setTerminalOutput([event.message || "Не удалось выполнить код."]);
    };

    worker.postMessage(currentCode);
  };

  const handleSubmitCode = () => {
    if (disabled) {
      return;
    }

    onSubmitCode?.(currentCode);
    setTerminalOutput(["Код отправлен на проверку AI."]);
=======
    onSubmitCode?.(code);
    setTerminalMessage("Код отправлен на проверку.");
>>>>>>> 54c6f02728c93576479ea158cb20330334fa53da
  };

  return (
    <div className={styles.editorShell}>
      <div className={styles.editorPanel}>
<<<<<<< HEAD
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
=======
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
>>>>>>> 54c6f02728c93576479ea158cb20330334fa53da
      </section>
    </div>
  );
}
