"use client";

import React, { useEffect, useState } from "react";
import type { ProgrammingLanguageType } from "@/entities/session/model/types";
import { executeCodeInBrowser, type CodeRunResult } from "@/shared/lib/runCode";
import type { LiveSocket } from "@/shared/lib/liveSocket";
import styles from "./LiveInterviewRoom.module.css";

type LiveConsoleEvent = CodeRunResult & {
  runnerName?: string;
  executedAt?: string;
};

type LiveConsoleProps = {
  socket: LiveSocket | null;
  roomId: string;
  code: string;
  language: ProgrammingLanguageType;
  disabled?: boolean;
};

export function LiveConsole({
  socket,
  roomId,
  code,
  language,
  disabled = false,
}: LiveConsoleProps) {
  const [output, setOutput] = useState<string[]>(["Терминал готов к запуску."]);
  const [runnerName, setRunnerName] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!socket) {
      return;
    }

    function handleRunning(event: { runnerName?: string }) {
      setRunnerName(event.runnerName || "");
      setIsRunning(true);
      setOutput(["Выполняем код..."]);
    }

    function handleResult(event: LiveConsoleEvent) {
      setRunnerName(event.runnerName || "");
      setIsRunning(false);
      setOutput(event.output?.length ? event.output : ["Код выполнен без вывода."]);
    }

    socket.on("live:console:running", handleRunning);
    socket.on("live:console:result", handleResult);

    return () => {
      socket.off("live:console:running", handleRunning);
      socket.off("live:console:result", handleResult);
    };
  }, [socket]);

  async function handleRunCode() {
    if (!socket || disabled || isRunning) {
      return;
    }

    socket.emit("live:console:running", { roomId });
    const result = await executeCodeInBrowser(code, language);
    socket.emit("live:console:result", {
      roomId,
      status: result.status,
      output: result.output,
      language,
    });
  }

  return (
    <section className={styles.liveConsole}>
      <div className={styles.consoleHeader}>
        <div>
          <h3>Терминал</h3>
          {runnerName ? <span>Последний запуск: {runnerName}</span> : null}
        </div>
        <div className={styles.consoleActions}>
          <button
            type="button"
            onClick={handleRunCode}
            disabled={disabled || isRunning}
          >
            {isRunning ? "Запускаем..." : "Запустить"}
          </button>
        </div>
      </div>
      <pre className={styles.consoleOutput}>
        {disabled ? "Интервью завершено. Запуск недоступен." : output.join("\n")}
      </pre>
    </section>
  );
}
