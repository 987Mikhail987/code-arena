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
  onSubmitCode?: (code: string) => void;
  language?: MonacoLanguage;
  disabled?: boolean;
};

const DEFAULT_CODE = "// \u0412\u0430\u0448 \u043a\u043e\u0434";
const DEFAULT_TERMINAL_MESSAGE =
  "\u0422\u0435\u0440\u043c\u0438\u043d\u0430\u043b \u0433\u043e\u0442\u043e\u0432 \u043a \u0437\u0430\u043f\u0443\u0441\u043a\u0443.";
const CODE_SENT_MESSAGE =
  "\u041a\u043e\u0434 \u043e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d \u043d\u0430 \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0443.";
const TERMINAL_TITLE = "\u0422\u0435\u0440\u043c\u0438\u043d\u0430\u043b";
const DISABLED_MESSAGE =
  "\u0418\u043d\u0442\u0435\u0440\u0432\u044c\u044e \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u043e. \u0417\u0430\u043f\u0443\u0441\u043a \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d.";
const RUN_BUTTON_LABEL = "\u0417\u0430\u043f\u0443\u0441\u0442\u0438\u0442\u044c";

export default function Redactor({
  initialCode = DEFAULT_CODE,
  language = "javascript",
  onChange,
  onSubmitCode,
  disabled = false,
}: CodeEditorProps) {
  return (
    <RedactorContent
      key={`${language}:${initialCode}`}
      initialCode={initialCode}
      language={language}
      onChange={onChange}
      onSubmitCode={onSubmitCode}
      disabled={disabled}
    />
  );
}

function RedactorContent({
  initialCode = DEFAULT_CODE,
  language = "javascript",
  onChange,
  onSubmitCode,
  disabled = false,
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [terminalMessage, setTerminalMessage] = useState(DEFAULT_TERMINAL_MESSAGE);

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

    onSubmitCode?.(code);
    setTerminalMessage(CODE_SENT_MESSAGE);
  };

  return (
    <div className={styles.editorShell}>
      <div className={styles.editorPanel}>
        <div className={styles.editorViewport}>
          <Editor
            height="100%"
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
      </div>
      <section className={styles.terminal}>
        <div>
          <h3>{TERMINAL_TITLE}</h3>
          <p>{disabled ? DISABLED_MESSAGE : terminalMessage}</p>
        </div>
        <button type="button" onClick={handleRunCode} disabled={disabled}>
          {RUN_BUTTON_LABEL}
        </button>
      </section>
    </div>
  );
}
