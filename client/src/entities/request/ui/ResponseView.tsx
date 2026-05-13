import type { RequestItem } from "..";
import "./ResponseView.css";

export default function ResponseView({ data }: { data: RequestItem }) {
  const problem = data.problem ?? data.response?.problem;
  const solution = data.solution ?? data.response?.solution;
  const explanation = data.explanation ?? data.response?.explanation;

  return (
    <div className="response-view">
      <div className="response-view__card response-view__card--question">
        <span className="response-view__label">Вопрос</span>
        <p className="response-view__text">{data.content}</p>
      </div>
      <div className="response-view__card">
        <span className="response-view__label">Проблема</span>
        <p className="response-view__text">
          {problem || "Ответ еще обрабатывается..."}
        </p>
      </div>
      <div className="response-view__card">
        <span className="response-view__label">Решение</span>
        <p className="response-view__text">
          {solution || "Ответ еще обрабатывается..."}
        </p>
      </div>
      <div className="response-view__card">
        <span className="response-view__label">Пояснение</span>
        <p className="response-view__text">
          {explanation || data.answer || "Ответ еще обрабатывается..."}
        </p>
      </div>
    </div>
  );
}
