"use client";

import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import type { VisibilityType } from "./visibility-selector";

interface SuggestedActionsProps {
  chatId: string;
  sendMessage: (message: {
    role: string;
    parts: { type: string; text: string }[];
  }) => void | Promise<void>;
  selectedVisibilityType: VisibilityType;
}

function PureSuggestedActions({
  chatId,
  sendMessage,
}: SuggestedActionsProps) {
  const { t, i18n } = useTranslation();
  const isRtl = (i18n.language || "en").startsWith("fa");

  const suggestedActions = [
    {
      title: t("ai_suggest_meds_title", "Could any of my meds"),
      label: t("ai_suggest_meds_label", "interact with each other?"),
      action: t(
        "ai_suggest_meds_action",
        "Could any of my current medications interact with each other?",
      ),
    },
    {
      title: t("ai_suggest_symptoms_title", "What symptoms"),
      label: t("ai_suggest_symptoms_label", "should make me seek help?"),
      action: t(
        "ai_suggest_symptoms_action",
        "What symptoms should make me seek help for my condition?",
      ),
    },
    {
      title: t("ai_suggest_doses_title", "Do my medication doses"),
      label: t("ai_suggest_doses_label", "still look right?"),
      action: t(
        "ai_suggest_doses_action",
        "Do my current medication doses still look right for me?",
      ),
    },
    {
      title: t("ai_suggest_bmi_title", "Is my weight and BMI"),
      label: t("ai_suggest_bmi_label", "in a healthy range?"),
      action: t(
        "ai_suggest_bmi_action",
        "Is my current weight and BMI in a healthy range?",
      ),
    },
  ];

  return (
    <div
      data-testid="suggested-actions"
      className="grid w-full gap-2 sm:grid-cols-2"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? "hidden sm:block" : "block"}
        >
          <Button
            type="button"
            variant="ghost"
            onClick={async () => {
              window.history.replaceState(
                {},
                "",
                `/dashboard/ai/chat/${chatId}`,
              );

              sendMessage({
                role: "user",
                parts: [{ type: "text", text: suggestedAction.action }],
              });
            }}
            className="h-auto w-full flex-1 flex-col items-start justify-start gap-1 rounded-xl border px-4 py-3.5 text-sm sm:flex-col text-start"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;
    return true;
  },
);
