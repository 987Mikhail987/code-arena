import type { Metadata } from "next";
import AppShell from "./AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Game",
  description: "Play",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
