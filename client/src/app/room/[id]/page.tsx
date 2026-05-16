import Chat from "@/widgets/ChatwithAi/ChatwithAi";
import Redactor from "@/widgets/Redactor/Redactor";
import React from "react";
import styles from "./page.module.css";

export default function RoomPage() {
  return (
    <div className={`app-container ${styles.roomPage}`}>
      <section className={styles.heading}>
        <p>Комната интервью</p>
        <h2>Добро пожаловать на собеседование</h2>
      </section>
      <div className={styles.workspace}>
        <Chat />
        <Redactor />
      </div>
    </div>
  );
}
