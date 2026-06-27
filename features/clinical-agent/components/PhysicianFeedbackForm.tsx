"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useCdsFeedback } from "../api/useCdsFeedback";

interface PhysicianFeedbackFormProps {
  patientId: number;
}

export function PhysicianFeedbackForm({ patientId }: PhysicianFeedbackFormProps) {
  const { t } = useTranslation();
  const feedbackMutation = useCdsFeedback();
  const [feedback, setFeedback] = useState("");

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast.error(t("feedback_required", "Please enter feedback before submitting"));
      return;
    }

    try {
      await feedbackMutation.mutateAsync({ patientId, feedback: feedback.trim() });
      toast.success(t("feedback_submitted", "Physician feedback submitted"));
      setFeedback("");
    } catch {
      toast.error(t("feedback_submit_failed", "Failed to submit feedback"));
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-lg sm:text-xl">{t("physician_feedback", "Physician Feedback")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4 sm:px-6">
        <Textarea
          rows={4}
          className="min-h-24 resize-y"
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          placeholder={t(
            "feedback_placeholder",
            "Share your clinical assessment of the agent's recommendations..."
          )}
        />
        <Button
          className="w-full sm:w-auto"
          onClick={handleSubmit}
          disabled={feedbackMutation.isPending}
        >
          {feedbackMutation.isPending
            ? t("submitting", "Submitting...")
            : t("submit_feedback", "Submit Feedback")}
        </Button>
      </CardContent>
    </Card>
  );
}
