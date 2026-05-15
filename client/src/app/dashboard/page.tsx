"use client";
import UserGuard from "@/shared/hocs/UserGuard/UserGuard";
import ChooseInterview from "@/widgets/ChooseInterview/ui/ChooseInterview";
import { InterviewSetup } from "@/widgets/InterviewSetup/InterviewSetup";
import { useRouter } from "next/router";
import React, { useState } from "react";

type InterviewType = "ai" | "human";
type StepType = "choice" | "configuring";

export default function DashboardPage() {
  const router = useRouter();
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

  return (
    <UserGuard mode="authenticated" redirectTo="/auth">
      <div>
        <h1>Сможешь сделать свой выбор ?</h1>
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
