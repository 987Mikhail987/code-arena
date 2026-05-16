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

  const handleStart = async () => {
    setIsLoading(true);
    try {
      const interview = await SessionApi.createSession({
        type: interviewType,
        level,
        topic: topic ? topic : "реальное собеседование",
        programmingLanguage: language,
      });
      if (interview.statusCode === 201) {
        onStart(interview.data.id);
      }
    } catch (error) {
      console.error("Ошибка создания интервью:", error);
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
        <p>Тип: {interviewType === "ai" ? "AI Интервью" : "Живое интервью"}</p>

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
