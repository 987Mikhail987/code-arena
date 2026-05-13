import type { AuthorizationProps } from ".";
import AuthorizationForm from "../../features/AuthorizationForm/AuthorizationForm";
import "../AuthPage.css";

export default function AuthorizationPage({ setUser }: AuthorizationProps) {
  return (
    <section className="page-section">
      <div className="page-shell auth-page">
        <div className="page-card auth-page__card">
          <div className="auth-page__content">
            <div className="auth-page__text">
              <span className="section-kicker">Authorization</span>
              <h1>Вход в приложение</h1>
              <p>Вернитесь к своим запросам, истории и настройкам профиля.</p>
            </div>
            <AuthorizationForm setUser={setUser} />
          </div>
        </div>
      </div>
    </section>
  );
}
