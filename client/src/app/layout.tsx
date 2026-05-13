import type { Metadata } from "next";
import type { ReactNode } from "react";
import AppShell from "./AppShell";
import StoreProvider from "./providers/StoreProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Game",
  description: "Play",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
  return (
    <html lang="ru">
      <body>
        <StoreProvider>
          <AppShell>{children}</AppShell>
        </StoreProvider>
      </body>
    </html>
  );
}
