"use client";

import { useRouter, usePathname } from "next/navigation";
import { forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { BotIcon, ChevronDownIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type FloatingAssistantButtonProps = { "data-state"?: "open" | "closed" };

const FloatingAssistantButton = forwardRef<
  HTMLButtonElement,
  FloatingAssistantButtonProps
>(({ "data-state": state, ...rest }, forwardedRef) => {
  const router = useRouter();
  const pathname = usePathname(); // مسیر فعلی
  const tooltip = state === "open" ? "Close Assistant" : "Open Assistant";

  // اگر مسیر شروعش /dashboard/ai بود، کامپوننت رندر نشود
  if (pathname.startsWith("/dashboard/ai")) return null;
  if (pathname.startsWith("/dashboard/chat")) return null;
  if (pathname.startsWith("/dashboard/users")) return null;

  const handleClick = () => {
    router.push("/dashboard/ai");
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-4 right-4 size-12 rounded-full shadow transition-transform hover:scale-110 active:scale-90 hidden md:flex"
          {...rest}
          ref={forwardedRef}
          onClick={handleClick}
          style={{ zIndex: 1000 }}
        >
          <BotIcon
            className={cn(
              "absolute size-6 transition-all",
              state === "open" && "rotate-90 scale-0",
              state === "closed" && "rotate-0 scale-100",
            )}
          />
          <ChevronDownIcon
            className={cn(
              "absolute size-6 transition-all",
              state === "open" && "rotate-0 scale-100",
              state === "closed" && "-rotate-90 scale-0",
            )}
          />
          <span className="sr-only">{tooltip}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">{tooltip}</TooltipContent>
    </Tooltip>
  );
});

FloatingAssistantButton.displayName = "FloatingAssistantButton";

export default FloatingAssistantButton;
