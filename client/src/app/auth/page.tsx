"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SignUpForm from "@/features/auth/ui/SignUpForm/SignUpForm";
import SignInForm from "@/features/auth/ui/SignInForm/SignInForm";
import UserApi from "@/entities/user/api/UserApi";
import { setAccessToken } from "@/shared/lib/axiosInstance";
import styles from "./page.module.css";

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return new URLSearchParams(window.location.search).get("mode") === "signup";
  });
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // при открытии страницы проверяю не вошел ли уже пользователь
  useEffect(() => {
    // тут делаю проверку авторизации
    async function checkUser() {
      try {
        const response = await UserApi.refresh();

        if (response?.statusCode === 200) {
          setAccessToken(response.data.accessToken);
          router.replace("/");
          return;
        }
      } catch {
        setAccessToken("");
      } finally {
        setIsCheckingAuth(false);
      }
    }

    void checkUser();
  }, [router]);

  if (isCheckingAuth) {
    return null;
  }

  return (
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
  );
}
