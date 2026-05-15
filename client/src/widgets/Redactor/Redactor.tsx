"use client";
import { Editor } from "@monaco-editor/react";
import React, { useState } from "react";


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
};

export default function Redactor({
  initialCode = "// Ваш код",
  language = "javascript",
  onChange,
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
      onChange?.(value);
    }
  };

  return (
    <div>
      <Editor
        height="50vh"
        width="40vw"
        language={language} 
        defaultValue={initialCode} 
        value={code}
        onChange={handleEditorChange}
        theme="vs-dark"
        options={{
          fontSize: 14,
          minimap: { enabled: false },
        }}
      />
    </div>
  );
}
