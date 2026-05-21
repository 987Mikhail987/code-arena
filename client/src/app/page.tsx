import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main className={`app-container ${styles.homePage}`}>
      <section className={styles.hero}>
        <h1>GoInterview</h1>
        <p>
          Учебное приложение для подготовки разработчиков к техническим
          собеседованиям с помощью Ai.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Что умеет приложение</h2>
        <ul>
          <li>
            Тренировка разработчика перед собеседованием с помощью искусственного интелекта.
          </li>
          <li>
            Возможность провести онлайн-собеседование для двух людей в
            редакторе кода прямо на сайте.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>Для кого это приложение</h2>
        <p>
          Платформа подойдёт начинающим и практикующим разработчикам, которые
          хотят отрабатывать свои навыки, решать задачи для практики перед собеседованиями. Проходить интервью в более
          реалистичном формате(в разработке).
        </p>
      </section>
    </main>
  );
}
