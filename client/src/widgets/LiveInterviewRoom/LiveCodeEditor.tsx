"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import React, { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import type { MonacoLanguage } from "@/widgets/Redactor/Redactor";
import type { LiveSocket } from "@/shared/lib/liveSocket";
import styles from "./LiveInterviewRoom.module.css";

type LiveCodeEditorProps = {
  socket: LiveSocket | null;
  roomId: string;
  initialCode: string;
  language: MonacoLanguage;
  disabled?: boolean;
  onCodeChange?: (code: string) => void;
};

export function LiveCodeEditor({
  socket,
  roomId,
  initialCode,
  language,
  disabled = false,
  onCodeChange,
}: LiveCodeEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const bindingRef = useRef<{ destroy: () => void } | null>(null);
  const docRef = useRef<Y.Doc | null>(null);
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    if (!socket || !editorRef.current) {
      return;
    }

    let isDisposed = false;
    const activeSocket = socket;
    const doc = new Y.Doc();
    const text = doc.getText("code");
    docRef.current = doc;

    async function bindEditor() {
      const editor = editorRef.current;
      const model = editor?.getModel();

      if (!editor || !model || bindingRef.current) {
        return;
      }

      const { MonacoBinding } = await import("y-monaco");

      if (isDisposed || bindingRef.current) {
        return;
      }

      bindingRef.current = new MonacoBinding(text, model, new Set([editor]));
      setIsSynced(true);
      onCodeChange?.(model.getValue());
    }

    function handleCodeSync(update: number[]) {
      Y.applyUpdate(doc, Uint8Array.from(update), "remote");
      void bindEditor();
    }

    function handleCodeUpdate(update: number[]) {
      Y.applyUpdate(doc, Uint8Array.from(update), "remote");
    }

    function handleLocalUpdate(update: Uint8Array, origin: unknown) {
      if (origin === "remote") {
        return;
      }

      activeSocket.emit("live:code:update", {
        roomId,
        update: Array.from(update),
      });
    }

    doc.on("update", handleLocalUpdate);
    activeSocket.on("live:code:sync", handleCodeSync);
    activeSocket.on("live:code:update", handleCodeUpdate);

    if (activeSocket.connected) {
      activeSocket.emit("live:code:sync:request", {
        roomId,
        initialCode,
      });
    } else {
      activeSocket.once("connect", () => {
        activeSocket.emit("live:code:sync:request", {
          roomId,
          initialCode,
        });
      });
    }

    return () => {
      isDisposed = true;
      activeSocket.off("live:code:sync", handleCodeSync);
      activeSocket.off("live:code:update", handleCodeUpdate);
      doc.off("update", handleLocalUpdate);
      bindingRef.current?.destroy();
      bindingRef.current = null;
      doc.destroy();
      docRef.current = null;
      setIsSynced(false);
    };
  }, [initialCode, onCodeChange, roomId, socket]);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    onCodeChange?.(editor.getValue());

    editor.onDidChangeModelContent(() => {
      onCodeChange?.(editor.getValue());
    });
  };

  return (
    <section className={styles.editorShell}>
      <div className={styles.editorHeader}>
        <h3>Редактор кода</h3>
        <span>{isSynced ? "Синхронизирован" : "Подключаем..."}</span>
      </div>
      <div className={styles.editorViewport}>
        <Editor
          height="100%"
          width="100%"
          language={language}
          defaultValue={initialCode}
          onMount={handleMount}
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
    </section>
  );
}
