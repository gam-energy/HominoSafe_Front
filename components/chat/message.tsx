'use client';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
// import type { Vote } from '@/lib/db/schema';
import { PencilEditIcon, SparklesIcon } from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import equal from 'fast-deep-equal';
import { cn, sanitizeText } from '@/lib/utils';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessages as OriginalChatMessage } from '@/lib/types';
import { normalizeMessageText } from '@/features/ai/utils/normalizeMessageText';

type MessagePart = {
  type: string;
  text?: string | { message?: string };
};

type ChatMessage = OriginalChatMessage & {
  parts?: MessagePart[];
};
import { useDataStream } from './data-stream-provider';

// Type narrowing is handled by TypeScript's control flow analysis
// The AI SDK provides proper discriminated unions for tool calls



const PurePreviewMessage = ({
  chatId,
  message,
  // vote,
  isLoading,
  setMessages,
  // regenerate,
  isReadonly,
  requiresScrollPadding,
}: {
  chatId: string;
  message: ChatMessage;
  // vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  // regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  const attachmentsFromMessage = message

  useDataStream();


  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
            {
              'w-full': mode === 'edit',
              'group-data-[role=user]/message:w-fit': mode !== 'edit',
            },
          )}
        >
          {message.role === 'assistant' && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </div>
          )}

          <div
            className={cn('flex flex-col gap-4 w-full', {
              'min-h-96': message.role === 'assistant' && requiresScrollPadding,
            })}
          >

{message.parts?.map((part, index) => {
  const key = `message-${message.id}-part-${index}`;

  if (part.type === 'text') {
    const text = normalizeMessageText(part.text ?? message.content);

    return (
      <div key={key} className="flex flex-row gap-2 items-start">
        {message.role === 'user' && !isReadonly && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                data-testid="message-edit-button"
                variant="ghost"
                className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
                onClick={() => setMode('edit')}
              >
                <PencilEditIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit message</TooltipContent>
          </Tooltip>
        )}

        <div
          data-testid="message-content"
          className={cn('flex flex-col gap-4', {
            'bg-primary text-primary-foreground px-3 py-2 rounded-xl':
              message.role === 'user',
          })}
        >
          <Markdown>{sanitizeText(text)}</Markdown>
        </div>
      </div>
    );
  }

  return null;
})}


            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                chatId={chatId}
                message={message}
                // vote={vote}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding)
      return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
    // if (!equal(prevProps.vote, nextProps.vote)) return false;

    return false;
  },
);

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message min-h-96"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          {
            'group-data-[role=user]/message:bg-muted': true,
          },
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Hmm...
          </div>
        </div>
      </div>
    </motion.div>
  );
};


// 'use client';
// import { useEffect } from 'react';
// import { cn, sanitizeText } from '@/lib/utils';
// import { Markdown } from './markdown';
// import type { ChatMessage } from '@/lib/types';

// function jsonParsed(content: string) {
//   try {
//     return JSON.parse(content);
//   } catch (e) {
//     return content; // fallback برای زمانی که JSON نیست
//   }
// }

// export const PreviewMessage = ({
//   message,
// }: {
//   message: ChatMessage;
// }) => {
//   // لاگ‌های اشکال‌زدایی
//   useEffect(() => {
//     console.log('📦 message:', message);
//     console.log('🔹 message.content:', message?.content);
//     console.log('📤 parsedContent:', jsonParsed(message?.content));
//     console.log('🧩 parts:', message?.parts);
//   }, [message]);

//   const parsedContent = jsonParsed(message?.content?.text);

//   return (
//     <div className="p-4 border rounded-md bg-muted/20 max-w-xl mx-auto mt-4">
//       <h3 className="text-sm text-muted-foreground mb-2">🔍 Message Debug</h3>

//       {message.parts?.length > 0 ? (
//         <>
//           <p className="text-xs mb-1">🔸 Rendered from <code>parts</code>:</p>
//           {message.parts.map((part, index) => (
//             <div key={index} className="mb-2 p-2 bg-white rounded">
//               <Markdown>{sanitizeText(part?.text || '⛔ no text')}</Markdown>
//             </div>
//           ))}
//         </>
//       ) : parsedContent?.content ? (
//         <>
//           <p className="text-xs mb-1">🔹 Rendered from <code>message.content</code> (JSON):</p>
//           <div className="p-2 bg-white rounded">
//             <Markdown>{sanitizeText(parsedContent.content)}</Markdown>
//           </div>
//         </>
//       ) : (
//         <p className="text-red-500">❌ پیام قابل نمایش نیست - نه <code>parts</code> و نه <code>content</code> داریم.</p>
//       )}
//     </div>
//   );
// };
