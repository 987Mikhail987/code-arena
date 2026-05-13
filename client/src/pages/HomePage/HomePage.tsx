import { Link } from "react-router";
import "./HomePage.css";

export default function HomePage() {
  return (
    <section className="page-section">
      <div className="page-shell home-page">
        <div className="page-card home-page__hero">
          <span className="section-kicker">Learning Workspace</span>
          <h1>AI-помощник для учебных задач и повседневной разработки</h1>
          <p className="home-page__lead">
            Формулируйте вопрос, просите объяснение, исправление или ревью и
            держите под рукой последние запросы. Интерфейс собран вокруг
            спокойной работы, а не вокруг лишнего шума.
          </p>
          <div className="home-page__actions">
            <Link className="button-primary" to="/app">
              Открыть ассистента
            </Link>
            <Link className="button-secondary" to="/register">
              Создать аккаунт
            </Link>
          </div>
          <div className="home-page__stats">
            <div className="home-page__stat">
              <strong>3</strong>
              <span>формата помощи: explain, fix, review</span>
            </div>
            <div className="home-page__stat">
              <strong>5</strong>
              <span>последних запросов всегда рядом</span>
            </div>
            <div className="home-page__stat">
              <strong>1</strong>
              <span>рабочее пространство без лишних переходов</span>
            </div>
          </div>
        </div>

        <div className="page-card page-card--strong home-page__visual">
          <img className="home-page__image" src="/i.webp" alt="Рабочее пространство React" />
        </div>
      </div>
    </section>
  );
}
