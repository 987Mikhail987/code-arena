import React from "react";
import styles from "./ChooseInterview.module.css";

type InterviewType = "ai" | "human";
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
    <div className={styles.choices}>
      <button className={styles.choiceCard} key="ai" onClick={() => onSelect("ai")}>
        <h2>AI Интервью</h2>
        <p>Пройдите собеседование с искусственным интеллектом</p>
      </button>
      <button className={styles.choiceCard} key="human" onClick={handleHumanInterview}>
        <h2>Живое интервью</h2>
        <p>Реальное собеседование</p>
      </button>
    </div>
  );
}
