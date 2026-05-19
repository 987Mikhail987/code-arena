import React from "react";
import styles from "./ChooseInterview.module.css";
import type { InterviewType } from "@/entities/session/model/types";

type ChooseInterviewPropsType = {
  onSelect: (type: InterviewType) => void;
};

export default function ChooseInterview({
  onSelect,
}: ChooseInterviewPropsType) {
  return (
    <div className={styles.choices}>
      <button
        className={styles.choiceCard}
        key="ai"
        onClick={() => onSelect("ai")}
      >
        <h2>AI Интервью</h2>
        <p>Пройдите собеседование с искусственным интеллектом</p>
      </button>
      <button
        className={styles.choiceCard}
        key="live"
        onClick={() => onSelect("live")}
      >
        <h2>Живое интервью</h2>
        <p>Реальное собеседование</p>
      </button>
    </div>
  );
}
