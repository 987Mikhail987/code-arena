import type { RequestItem } from "../../../entities/request";
import "./RequestList.css";

type Props = {
  items: RequestItem[];
  onSelect: (item: RequestItem) => void;
};

const levelLabels: Record<RequestItem["level"], string> = {
  student: "Студент",
  junior: "Junior",
  middle: "Middle",
  senior: "Senior",
};

const typeLabels: Record<RequestItem["type"], string> = {
  explain: "Объяснение",
  fix: "Исправление",
  review: "Ревью",
};

export default function RequestList({ items, onSelect }: Props) {
  if (items.length === 0) {
    return <p className="request-list__empty">История запросов пока пуста.</p>;
  }

  return (
    <ul className="request-list">
      {items.map((item) => (
        <li className="request-list__item" key={item.id}>
          <section className="request-list__card">
            <div className="request-list__meta">
              <span className="request-list__tag">{levelLabels[item.level]}</span>
              <span className="request-list__tag request-list__tag--accent">
                {typeLabels[item.type]}
              </span>
            </div>
            <p className="request-list__content">{item.content.slice(0, 120)}</p>
            <button
              className="request-list__button"
              type="button"
              onClick={() => onSelect(item)}
            >
              Открыть
            </button>
          </section>
        </li>
      ))}
    </ul>
  );
}
