"use client";
// import { useRouter } from "next/router";
import React from "react";

export default function ChooseInterviewPage() {
  //   const router = useRouter();

  const handleHumanInterview = () => {
    alert("Скоро будет доступно!");
  };

  return (
    <div>
      <button
        key="ai"
        // onClick={() => router.push("/interview/ai")}
      >
        <h2>Начать интервью</h2>
        <p>Пройдите собеседование как кандидат</p>
      </button>
      <button key="human" onClick={handleHumanInterview}>
        <h2>Начать интервью</h2>
        <p>Проведите собеседование как интервьюер</p>
      </button>
    </div>
  );
}
