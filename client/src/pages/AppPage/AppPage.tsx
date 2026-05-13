import { useEffect, useState } from "react";
import type { AppProps } from ".";
import RequestForm from "../../features/RequestForm/RequestForm";
import type { RequestItem } from "../../entities/request";
import ResponseView from "../../entities/request/ui/ResponseView";
import RequestList from "../../widgets/RequestList/ui/RequestList";
import RequestApi from "../../entities/request/api/RequestApi";
import "./AppPage.css";

function normalizeRequestItem(
  item: Partial<RequestItem> & { response?: RequestItem["response"] },
): RequestItem {
  return {
    id: Number(item.id ?? Date.now()),
    content: item.content ?? "",
    level: (item.level ?? "student") as RequestItem["level"],
    type: (item.type ?? "explain") as RequestItem["type"],
    answer: item.answer,
    problem: item.problem ?? item.response?.problem,
    solution: item.solution ?? item.response?.solution,
    explanation: item.explanation ?? item.response?.explanation,
    response: item.response ?? null,
    createdAt: item.createdAt ?? new Date().toISOString(),
  };
}

export default function AppPage({ user }: AppProps) {
  const [response, setResponse] = useState<RequestItem | null>(null);
  const [history, setHistory] = useState<RequestItem[]>([]);

  const handleNewRequest = (
    newRequest: Pick<
      RequestItem,
      "content" | "level" | "type" | "problem" | "solution" | "explanation"
    >,
  ) => {
    const nextItem = normalizeRequestItem({
      id: Date.now(),
      ...newRequest,
    });

    setResponse(nextItem);
    setHistory((prev) =>
      [nextItem, ...prev.filter((item) => item.id !== nextItem.id)].slice(0, 5),
    );
  };

  const handleSelectHistoryItem = (item: RequestItem) => {
    setResponse(normalizeRequestItem(item));
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const apiResponse = await RequestApi.getAllRequestsAndResponses();
        if (apiResponse.statusCode === 200 && Array.isArray(apiResponse.data)) {
          const recentHistory = apiResponse.data
            .slice(0, 5)
            .map((item: RequestItem) => normalizeRequestItem(item));

          setHistory(recentHistory);
          setResponse(recentHistory[0] ?? null);
        }
      } catch (error) {
        console.error("Ошибка при загрузке истории запросов:", error);
      }
    };

    fetchHistory();
  }, []);

  if (!user) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="app-page">
      <h2 className="app-page__title">Ваш личный AI-ассистент</h2>
      <div className="app-page__layout">
        <section className="app-page__panel">
          <h3 className="app-page__panel-title">Добавить новый запрос</h3>
          <RequestForm onSuccess={handleNewRequest} />
        </section>

        <section className="app-page__panel">
          <h3 className="app-page__panel-title">
            Показать текущий запрос и ответ
          </h3>
          {response ? (
            <ResponseView data={response} />
          ) : (
            <p>Отправьте новый запрос или выберите один из последних.</p>
          )}
        </section>

        <section className="app-page__panel">
          <h3 className="app-page__panel-title">Последние 5 запросов</h3>
          <RequestList items={history} onSelect={handleSelectHistoryItem} />
        </section>
      </div>
    </div>
  );
}
