"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import GameApi from "@/entities/game/api/GameApi";
import type { GameState } from "@/entities/game/api/GameApi";
import UserApi from "@/entities/user/api/UserApi";
import type { User } from "@/entities/user/model/types";
import { setAccessToken } from "@/shared/lib/axiosInstance";
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null); // текущий пользователь или null
  const [isLoading, setIsLoading] = useState(true); // кнопка в загрузке пока проверяется сессия
  const [hasStartedGame, setHasStartedGame] = useState(false); // начал ли пользователь игру

  useEffect(() => {
    // При открытии главной страницы загрузить пользователя и его активныую игру
    async function loadHomePage() {
      setIsLoading(true);

      try {
        const authResponse = await UserApi.refresh();

        if (authResponse?.statusCode !== 200) {
          setAccessToken("");
          setUser(null);
          setHasStartedGame(false);
          return;
        }

        setAccessToken(authResponse.data.accessToken);
        setUser(authResponse.data.user);

        // проверка на активную игру
        const gameResponse = await GameApi.getActiveGame();

        if (gameResponse?.statusCode === 200 && gameResponse.data) {
          const game = gameResponse.data as GameState;

          // игра начинается только , если карточки начали открывать
          const started = game.board.categories.some((category) =>
            category.questions.some((question) => question.status !== "pending"),
          );

          setHasStartedGame(started);
        } else {
          setHasStartedGame(false);
        }
      } catch {
        setAccessToken("");
        setUser(null);
        setHasStartedGame(false);
      } finally {
        setIsLoading(false);
      }
    }

    function updateHomePage() {
      void loadHomePage();
    }

    // запуск проверки при открытии стр
    void loadHomePage();

    // пользователь возвращается на главную, обновить состояние страницы
    window.addEventListener("pageshow", updateHomePage);

    return () => {
      window.removeEventListener("pageshow", updateHomePage);
    };
  }, []);

  // одна кнопка ведет либо на авторизацию, либо сразу в игру
  function handleGameAction() {
    if (!user) {
      router.push("/auth");
      return;
    }

    router.push("/game");
  }

  return (
    <div className={`app-container ${styles.homePage}`}>
      <section className={styles.hero}>
        <div className={styles.copyColumn}>
          <h1 className={styles.title}>
            <span className={styles.titleLead}>Веб-версия игры</span>
            <span className={styles.titleAccent}>«Своя игра»</span>
          </h1>

          <p className={styles.description}>
            Выбирай тему и стоимость вопроса, отвечай в модальном окне и следи за
            счётом. Прогресс сохраняется на сервере, поэтому к партии можно
            вернуться позже.
          </p>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={handleGameAction}
              disabled={isLoading}
            >
          
              {isLoading
                ? "Загружаем..."
                : !user
                  ? "Войти и играть"
                  : hasStartedGame
                    ? "Продолжить игру"
                    : "Начать новую игру"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
