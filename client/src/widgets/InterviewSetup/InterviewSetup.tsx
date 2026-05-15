"use client";
import { useState } from "react";

type InterviewType = "ai" | "human";
type DifficultyLevelType = "junior" | "middle" | "senior";
type LanguageType =
  | "javascript"
  | "typescript"
  | "python"
  | "go"
  | "html"
  | "css"
  | "java"
  | "c"
  | "csharp";
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
  const [difficulty, setDifficulty] = useState<DifficultyLevelType>("junior");
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState<LanguageType>("javascript");
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      console.log("Создание комнаты" + `${onStart("1")}`);
    } catch (error) {
      console.error("Ошибка создания интервью:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button onClick={onBack}>Назад к выбору собеседования</button>

      <div>
        <h2>Настройки интервью</h2>
        <p>Тип: {interviewType === "ai" ? "AI Интервью" : "Живое интервью"}</p>

        <div>
          <label htmlFor="difficulty">Сложность интервью</label>
        </div>
        <select
          id="difficulty"
          value={difficulty}
          onChange={(event) =>
            setDifficulty(event.target.value as DifficultyLevelType)
          }
        >
          <option value="junior">junior</option>
          <option value="middle">middle</option>
          <option value="senior">senior</option>
        </select>

        <div>
          <label htmlFor="difficulty">Выбор языка</label>
        </div>
        <select
          id="language"
          value={language}
          onChange={(event) => setLanguage(event.target.value as LanguageType)}
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

        <div>
          <label htmlFor="topic">Тема тренировки (необязательно)</label>
        </div>
        <input
          id="topic"
          type="text"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          placeholder="Например React"
        />
      </div>

      <button onClick={handleStart} disabled={isLoading}>
        {isLoading ? "Создаем..." : "Начать интервью"}
      </button>
    </div>
  );
}

// export default function InterviewSessionPageGuard() {
//   return (
//     <UserGuard mode="authenticated" redirectTo="/auth">
//       <InterviewSessionPage />
//     </UserGuard>
//   );
// }
