"use client";

import SessionApi from "@/entities/session/api/sessionApi";
import { useState } from "react";
import styles from "./InterviewSetup.module.css";
import type {
  InterviewType,
  ProgrammingLanguageType,
} from "@/entities/session/model/types";

type DifficultyLevelType = "junior" | "middle" | "senior";

type InterviewSetupPropsType = {
  interviewType: InterviewType;
  onStart: (interviewId: string) => void;
  onBack: () => void;
};

export function InterviewSetup({
  interviewType,
  onStart,
  onBack,
}: InterviewSetupPropsType) {
  const [level, setLevel] = useState<DifficultyLevelType>("junior");
  const [topic, setTopic] = useState("");
  const [language, setLanguage] =
    useState<ProgrammingLanguageType>("javascript");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
<<<<<<< HEAD
const tema = [
  "Алгоритмы",
  "Структуры данных",
  "ООП",
  "SOLID",
  "Паттерны проектирования",
  "Чистый код",
  "Принципы архитектуры",
  "Асинхронность",
  "Многопоточность",
  "Работа с памятью",
  "Сборка мусора",
  "Компиляция и интерпретация",
  "Типизация",
  "Статическая и динамическая типизация",
  "Функциональное программирование",
  "Императивное программирование",
  "Рекурсия",
  "Оптимизация производительности",
  "Сложность алгоритмов",
  "Big O",
  "Сортировки",
  "Поиск",
  "Хеш-таблицы",
  "Деревья",
  "Графы",
  "SQL",
  "Нормализация данных",
  "Транзакции",
  "Индексы",
  "Кэширование",
  "REST API",
  "HTTP/HTTPS",
  "TCP/IP",
  "WebSocket",
  "Авторизация и аутентификация",
  "JWT",
  "Безопасность приложений",
  "Тестирование",
  "CI/CD",
  "Git",
  "System Design",
  "Микросервисы",
  "Монолитная архитектура",
  "Масштабирование систем",
  "Event-driven архитектура",
  "KISS",
  "DRY",
  "YAGNI"]
=======

>>>>>>> 54c6f02728c93576479ea158cb20330334fa53da
  const handleStart = async () => {
    setIsLoading(true);
    setError("");

    try {
      const interview = await SessionApi.createSession({
        type: interviewType,
        level,
<<<<<<< HEAD
        topic: topic.trim()
          ? topic.trim()
          : tema[Math.floor(Math.random() * tema.length)],
=======
        topic: topic.trim() ? topic.trim() : "Тренировочное интервью",
>>>>>>> 54c6f02728c93576479ea158cb20330334fa53da
        programmingLanguage: language,
      });

      if (interview.statusCode === 201 && interview.data?.id) {
<<<<<<< HEAD
        onStart(interview.data.public_id || interview.data.id);
=======
        onStart(interview.data.id);
>>>>>>> 54c6f02728c93576479ea158cb20330334fa53da
        return;
      }

      if (interview.statusCode === 409 && interview.data?.id) {
<<<<<<< HEAD
        onStart(interview.data.public_id || interview.data.id);
=======
        onStart(interview.data.id);
>>>>>>> 54c6f02728c93576479ea158cb20330334fa53da
        return;
      }

      setError(
        interview.error || interview.message || "Не удалось начать интервью",
      );
    } catch (currentError) {
      console.error("Ошибка создания интервью:", currentError);
      setError("Не удалось начать интервью");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className={styles.setup}>
      <button className={styles.backButton} onClick={onBack}>
        Назад к выбору собеседования
      </button>

      <div className={styles.card}>
        <h2>Настройки интервью</h2>
        <p>Тип: {interviewType === "ai" ? "AI интервью" : "Живое интервью"}</p>

        <div className={styles.field}>
          <label htmlFor="level">Сложность интервью</label>

          <select
            id="level"
            value={level}
            onChange={(event) =>
              setLevel(event.target.value as DifficultyLevelType)
            }
          >
            <option value="junior">junior</option>
            <option value="middle">middle</option>
            <option value="senior">senior</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="language">Выбор языка</label>
          <select
            id="language"
            value={language}
            onChange={(event) =>
              setLanguage(event.target.value as ProgrammingLanguageType)
            }
          >
            <option value="javascript">javascript</option>
            <option value="typescript">typescript</option>
            <option value="python">python</option>
            <option value="go">go</option>
            <option value="html">html</option>
            <option value="css">css</option>
            <option value="java">java</option>
            <option value="c">c</option>
            <option value="csharp">csharp</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="topic">Тема тренировки (необязательно)</label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="Например React"
          />
        </div>

        {error ? <p>{error}</p> : null}
      </div>

      <button
        className={styles.startButton}
        onClick={handleStart}
        disabled={isLoading}
      >
        {isLoading ? "Создаем..." : "Начать интервью"}
      </button>
    </section>
  );
}
