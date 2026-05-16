import Link from "next/link";

export default function NotFound() {
  return (
    <main className="app-container">
      <h1>404</h1>
      <p>Страница не найдена.</p>
      <p>Возможно, адрес введён неверно или страница не существует.</p>
      <Link href="/">Вернуться на главную</Link>
    </main>
  );
}
