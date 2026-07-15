"use client";

import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { memo } from "react";
import type { VisibilityType } from "./visibility-selector";

interface SuggestedActionsProps {
  chatId: string;
  sendMessage: (message: {
    role: string;
    parts: { type: string; text: string }[];
  }) => void | Promise<void>;
  selectedVisibilityType: VisibilityType;
}

const suggestedActions = [
  {
    title: "Could any of my meds",
    label: "interact with each other?",
    action: "Could any of my current medications interact with each other?",
  },
  {
    title: "What symptoms",
    label: "should make me seek help?",
    action: "What symptoms should make me seek help for my condition?",
  },
  {
    title: "Do my medication doses",
    label: "still look right?",
    action: "Do my current medication doses still look right for me?",
  },
  {
    title: "Is my weight and BMI",
    label: "in a healthy range?",
    action: "Is my current weight and BMI in a healthy range?",
  },
];

function PureSuggestedActions({
  chatId,
  sendMessage,
}: SuggestedActionsProps) {
  return (
    <div
      data-testid="suggested-actions"
      className="grid sm:grid-cols-2 gap-2 w-full"
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
                `/dashboard/ai/chat/${chatId}`
              );

              sendMessage({
                role: "user",
                parts: [{ type: "text", text: suggestedAction.action }],
              });
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
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
  }
);
