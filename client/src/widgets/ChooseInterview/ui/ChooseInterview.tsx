import React from "react";
import type { InterviewType } from "@/entities/session/model/types";

type ChooseInterviewPropsType = {
  onSelect: (type: InterviewType) => void;
};

export default function ChooseInterview({
  onSelect,
}: ChooseInterviewPropsType) {
  const handleHumanInterview = () => {
    alert("Сейчас в разработке, НОО, очень скоро будет доступно!");
  };

  return (
    <div>
      <button key="ai" onClick={() => onSelect("ai")}>
        <h2>AI Интервью</h2>
        <p>Пройдите собеседование с искусственным интеллектом</p>
      </button>
      <button key="live" onClick={handleHumanInterview}>
        <h2>Живое интервью</h2>
        <p>Реальное собеседование</p>
      </button>
    </div>
  );
}
