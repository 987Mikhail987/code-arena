import { Link } from "react-router";
import "./NotFoundPage.css";

export default function NotFoundPage() {
  return (
    <section className="page-section">
      <div className="page-shell">
        <div className="page-card not-found-page">
          <span className="section-kicker">404</span>
          <h2>Такой страницы здесь нет</h2>
          <p>Похоже, адрес изменился или вы попали не туда.</p>
          <Link className="button-primary" to="/">
            Вернуться на главную
          </Link>
        </div>
      </div>
    </section>
  );
}
