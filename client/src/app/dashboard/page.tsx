"use client";
import UserGuard from "@/shared/hocs/UserGuard/UserGuard";
import ChooseInterview from "@/widgets/ChooseInterview/ui/ChooseInterview";
import { InterviewSetup } from "@/widgets/InterviewSetup/InterviewSetup";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import styles from "./page.module.css";
import type {InterviewType} from "@/entities/session/model/types";
import { useAppSelector } from "../store/hooks";
import { selectUser } from "@/entities/user/model/selectors";

type StepType = "choice" | "configuring";

export default function DashboardPage() {
  const router = useRouter();
  const user = useAppSelector(selectUser);
  const [step, setStep] = useState<StepType>("choice");
  const [interviewType, setInterviewType] = useState<InterviewType | null>(
    null,
  );

  const handleTypeSelect = (type: InterviewType) => {
    setInterviewType(type);
    setStep("configuring");
  };

  const handleInterviewStart = (interviewId: string) => {
    router.push(`/room/${interviewId}`);
  };

  const handleBack = () => {
    setStep("choice");
    setInterviewType(null);
  };

  useEffect(() => {
    if (user?.role === "intervier") {
      router.replace("/interviews");
    }
  }, [router, user?.role]);

  return (
    <UserGuard mode="authenticated" redirectTo="/auth">
      <div className={`app-container ${styles.dashboardPage}`}>
        <section className={styles.heading}>
          <p>Тренировка</p>
          <h1>Сможешь сделать свой выбор?</h1>
        </section>
        {step === "choice" && <ChooseInterview onSelect={handleTypeSelect} />}

        {step === "configuring" && interviewType && (
          <InterviewSetup
            interviewType={interviewType}
            onStart={handleInterviewStart}
            onBack={handleBack}
          />
        )}
      </div>
    </UserGuard>
  );
}
