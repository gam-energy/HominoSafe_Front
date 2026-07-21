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
  const { t } = useTranslation();

  const suggestedActions = [
    {
      title: t('ai_suggest_howami_title', 'How am I doing'),
      label: t('ai_suggest_howami_label', 'based on my records?'),
      action: t(
        'ai_suggest_howami_action',
        'How am I doing overall based on my health records and latest vitals?',
      ),
    },
    {
      title: t('ai_suggest_vitals_title', 'Summarize my latest'),
      label: t('ai_suggest_vitals_label', 'heart rate and blood pressure'),
      action: t(
        'ai_suggest_vitals_action',
        'Summarize my latest heart rate, blood pressure, SpO2, and temperature from my wearable data.',
      ),
    },
    {
      title: t('ai_suggest_meds_title', 'Could any of my meds'),
      label: t('ai_suggest_meds_label', 'interact with each other?'),
      action: t(
        'ai_suggest_meds_action',
        'Could any of my current medications interact with each other?',
      ),
    },
    {
      title: t('ai_suggest_symptoms_title', 'What symptoms'),
      label: t('ai_suggest_symptoms_label', 'should make me seek help?'),
      action: t(
        'ai_suggest_symptoms_action',
        'What symptoms should make me seek help for my condition?',
      ),
    },
    {
      title: t('ai_suggest_doses_title', 'Do my medication doses'),
      label: t('ai_suggest_doses_label', 'still look right?'),
      action: t(
        'ai_suggest_doses_action',
        'Do my current medication doses still look right for me?',
      ),
    },
    {
      title: t('ai_suggest_env_title', 'How is my room'),
      label: t('ai_suggest_env_label', 'temperature and air quality?'),
      action: t(
        'ai_suggest_env_action',
        'How are my latest room temperature, humidity, and air-quality readings?',
      ),
    },
    {
      title: t('ai_suggest_alerts_title', 'Any recent alerts'),
      label: t('ai_suggest_alerts_label', 'I should know about?'),
      action: t(
        'ai_suggest_alerts_action',
        'What recent health alerts or warnings do I have, and what do they mean?',
      ),
    },
    {
      title: t('ai_suggest_risk_title', 'What is my current'),
      label: t('ai_suggest_risk_label', 'health risk assessment?'),
      action: t(
        'ai_suggest_risk_action',
        'What does my latest health risk assessment say, and what should I watch for?',
      ),
    },
    {
      title: t('ai_suggest_bmi_title', 'Is my weight and BMI'),
      label: t('ai_suggest_bmi_label', 'in a healthy range?'),
      action: t(
        'ai_suggest_bmi_action',
        'Is my current weight and BMI in a healthy range?',
      ),
    },
    {
      title: t('ai_suggest_ehr_title', 'Summarize my EHR'),
      label: t('ai_suggest_ehr_label', 'diagnoses and history'),
      action: t(
        'ai_suggest_ehr_action',
        'Summarize my EHR diagnoses, medical history, and important clinical notes.',
      ),
    },
  ];

  return (
    <div
      data-testid="suggested-actions"
      className="grid w-full gap-2 sm:grid-cols-2"
      dir="auto"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.04 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 3 ? 'hidden sm:block' : 'block'}
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
