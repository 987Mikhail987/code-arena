"use client";

import { useState } from "react";
import UserGuard from "@/shared/hocs/UserGuard/UserGuard";

type DifficultyLevel = "junior" | "middle" | "senior";

export function InterviewSessionPage() {
  const [showSettings, setShowSettings] = useState(false);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("junior");
  const [tema, setTema] = useState("");

  return (
    <div className="app-container">
      <h1>Тренировочное интервью</h1>
      <p>Здесь можно подготовиться к техническому интервью</p>

      <button type="button" onClick={() => setShowSettings((prev) => !prev)}>
        {showSettings ? "Подтвердить" : "Настройки интервью"}
      </button>

      {showSettings && (
        <div>
          <h2>Настройки интервью</h2>

          <div>
            <label htmlFor="difficulty">Сложность интервью</label>
          </div>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(event) =>
              setDifficulty(event.target.value as DifficultyLevel)
            }
          >
            <option value="junior">junior</option>
            <option value="middle">middle</option>
            <option value="senior">senior</option>
          </select>

          <div>
            <label htmlFor="topic">Тема тренировки (необязательно)</label>
          </div>
          <input
            id="topic"
            type="text"
            value={tema}
            onChange={(event) => setTema(event.target.value)}
            placeholder="Например React"
          />
        </div>
      )}

      <button type="button">Начать интервью</button>
    </div>
  );
}

export default function InterviewSessionPageGuard() {
  return (
    <UserGuard mode="authenticated" redirectTo="/auth">
      <InterviewSessionPage />
    </UserGuard>
  );
}
