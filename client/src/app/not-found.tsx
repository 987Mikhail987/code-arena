import Link from "next/link";
import Image from "next/image";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={`app-container ${styles.notFoundPage}`}>
      <section className={styles.card}>
        <Image
          className={styles.image}
          src="/not-found.jpeg"
          alt="Мемная иллюстрация 404"
          width={1280}
          height={646}
          priority
        />
        <div className={styles.content}>
          <p className={styles.kicker}>404</p>
          <h1>Страница упала на первом техническом вопросе.</h1>
          <p>Даже console.log не помог.</p>
          <Link href="/" className={styles.homeLink}>
            Вернуться на главную
          </Link>
        </div>
      </section>
    </main>
  );
}
