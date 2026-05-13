"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UserApi from "@/entities/user/api/UserApi";
import ResultApi, {
  type MyResultsResponse,
} from "@/entities/result/api/ResultApi";
import { setAccessToken } from "@/shared/lib/axiosInstance";
import type { User } from "@/entities/user/model/types";
import styles from "./page.module.css";

const LAST_FINISHED_SCORE_KEY = "lastFinishedGameScore";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [lastFinishedScore, setLastFinishedScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await UserApi.refresh();

        if (response?.statusCode !== 200) {
          router.replace("/auth");
          return;
        }

        setAccessToken(response.data.accessToken);
        setUser(response.data.user);

        const savedScore = localStorage.getItem(LAST_FINISHED_SCORE_KEY);

        if (savedScore !== null) {
          setLastFinishedScore(Number(savedScore));
        }

        const resultsResponse = await ResultApi.getMyResults();

        if (resultsResponse?.statusCode === 200) {
          const results = resultsResponse.data as MyResultsResponse;
          const finishedGame = results.games.find((game) => game.status === "finished");

          if (finishedGame && savedScore === null) {
            setLastFinishedScore(finishedGame.score);
          }
        }
      } catch {
        router.replace("/auth");
      } finally {
        setIsLoading(false);
      }
    }

    void loadProfile();
  }, [router]);

  if (isLoading || !user) {
    return null;
  }

  return (
    <div className={`app-container ${styles.profilePage}`}>
      <div className={styles.scoreCard}>
        <p className={styles.scoreLabel}>Очки последней игры</p>
        <h1 className={styles.scoreValue}>{lastFinishedScore}</h1>
        <p className={styles.scoreEmail}>{user.name}</p>
      </div>
    </div>
  );
}
