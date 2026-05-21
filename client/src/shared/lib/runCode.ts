export type CodeRunStatus = "success" | "error";

export type CodeRunResult = {
  status: CodeRunStatus;
  output: string[];
};

const javascriptLanguages = new Set(["javascript"]);

export function executeCodeInBrowser(
  code: string,
  language: string,
): Promise<CodeRunResult> {
  if (!javascriptLanguages.has(language)) {
    return Promise.resolve({
      status: "error",
      output: ["Локальный запуск пока доступен только для JavaScript."],
    });
  }

  return new Promise((resolve) => {
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
    const cleanup = () => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
    };
    const timeoutId = window.setTimeout(() => {
      cleanup();
      resolve({
        status: "error",
        output: ["Выполнение остановлено: превышен лимит 3 секунды."],
      });
    }, 3000);

    worker.onmessage = (event: MessageEvent<CodeRunResult>) => {
      window.clearTimeout(timeoutId);
      cleanup();
      resolve(event.data);
    };

    worker.onerror = (event) => {
      window.clearTimeout(timeoutId);
      cleanup();
      resolve({
        status: "error",
        output: [event.message || "Не удалось выполнить код."],
      });
    };

    worker.postMessage(code);
  });
}
