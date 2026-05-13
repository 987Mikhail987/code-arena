"use client";

import { useState } from "react";
import SignUpForm from "@/features/auth/ui/SignUpForm/SignUpForm";
import SignInForm from "@/features/auth/ui/SignInForm/SignInForm";
import UserGuard from "@/features/auth/ui/UserGuard/UserGuard";
import styles from "./page.module.css";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return new URLSearchParams(window.location.search).get("mode") === "signup";
  });

  return (
    <UserGuard mode="guest" redirectTo="/">
      <div className={`app-container ${styles.authPage}`}>
        <section className={styles.authIntro}>
          <p className={styles.authKicker}>Аккаунт</p>
          <h1>Авторизуйтесь, чтобы играть</h1>
        </section>

        <div className={styles.formContainer}>
          {isSignUp ? <SignUpForm /> : <SignInForm />}

          {isSignUp ? (
            <>
              <p>Уже есть учетная запись?</p>
              <span className={styles.authLink} onClick={() => setIsSignUp(false)}>
                Войти
              </span>
            </>
          ) : (
            <>
              <p>Еще нет учетной записи?</p>
              <span className={styles.authLink} onClick={() => setIsSignUp(true)}>
                Создать
              </span>
            </>
          )}
        </div>
      </div>
    </UserGuard>
  );
}
