import RegisterForm from "../../features/RigisterForm/RegisterForm";
import type { AuthorizationProps } from "../AuthorizationPage";
import "../AuthPage.css";

export default function RegisterPage({ setUser }: AuthorizationProps) {
  return (
    <section className="page-section">
      <div className="page-shell auth-page">
        <div className="page-card auth-page__card">
          <div className="auth-page__content">
            <div className="auth-page__text">
              <span className="section-kicker">Registration</span>
              <h1>Создание аккаунта</h1>
              <p>
                Зарегистрируйтесь, чтобы сохранять запросы, ответы и работать с
                личным профилем.
              </p>
            </div>
            <RegisterForm setUser={setUser} />
          </div>
        </div>
      </div>
    </section>
  );
}
