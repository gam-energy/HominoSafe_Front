import { memo } from "react";
import { cn } from "@/lib/utils";
import type { MessageType } from "@/features/chat/types/chat.type";
import AvatarWithBadge from "../avatar-with-badge";
import { formatChatTime } from "@/lib/realtime-chat/helper";
import { Button } from "../ui/button";
import { ReplyIcon } from "lucide-react";
import { useGetCurrentUser } from "@/features/chat/api/use-get-current-info";
import MatrixImage from "./matrix-image";

interface Props {
  message: MessageType;
  onReply: (message: MessageType) => void;
}
const ChatMessageBody = memo(({ message, onReply }: Props) => {
  // const { user } = useAuth();
  const {data:user} = useGetCurrentUser()

  const userId = user?._id || null;
  const isCurrentUser = message.sender?._id === userId;
  const senderName = isCurrentUser ? "You" : message.sender?.name;

  // const replySendername =
  //   message.replyTo?.sender?._id === userId
  //     ? "You"
  //     : message.replyTo?.sender?.name;

  const containerClass = cn(
    "group flex gap-2 py-3 px-4",
    isCurrentUser && "flex-row-reverse text-left"
  );

  const contentWrapperClass = cn(
    "max-w-[70%]  flex flex-col relative",
    isCurrentUser && "items-end"
  );

  const messageClass = cn(
    "min-w-[200px] px-3 py-2 text-sm break-words shadow-sm",
    isCurrentUser
      ? "bg-accent dark:bg-primary/40 rounded-tr-xl rounded-l-xl"
      : "bg-[#F5F5F5] dark:bg-accent rounded-bl-xl rounded-r-xl"
  );

  const replyBoxClass = cn(
    `mb-2 p-2 text-xs rounded-md border-l-4 shadow-md !text-left`,
    isCurrentUser
      ? "bg-primary/20 border-l-primary"
      : "bg-gray-200 dark:bg-secondary border-l-[#CC4A31]"
  );
  return (
    <div className={containerClass}>
      {!isCurrentUser && (
        <div className="flex-shrink-0 flex items-start">
          <AvatarWithBadge
            name={message.sender?.name || "No name"}
            src={message.sender?.avatar || ""}
          />
        </div>
      )}

      <div className={contentWrapperClass}>
        <div
          className={cn(
            "flex items-center gap-1",
            isCurrentUser && "flex-row-reverse"
          )}
        >
          <div className={messageClass}>
            {/* {Header} */}

            <div className="flex items-center gap-2 mb-0.5 pb-1">
              <span className="text-xs font-semibold">{senderName}</span>
              <span className="text-[11px] text-gray-700 dark:text-gray-300">
                {formatChatTime(message?.createdAt)}
              </span>
            </div>

            {/* ReplyToBox */}
            {/* {message.replyTo && (
              <div className={replyBoxClass}>
                <h5 className="font-medium">{replySendername}</h5>
                <p
                  className="font-normal text-muted-foreground
                 max-w-[250px]  truncate
                "
                >
                  {message?.replyTo?.content ||
                    (message?.replyTo?.image ? "📷 Photo" : "")}
                </p>
              </div>
            )} */}

            {message?.image && (
              <MatrixImage
                mxcUrl={message.image}
                className="rounded-lg max-w-xs"
              />
            )}

            {message.text &&
              !(
                message.image &&
                message.text === message.matrixContent?.body &&
                message.matrixContent?.msgtype === "m.image"
              ) && <p>{message.text}</p>}
          </div>

          {/* {Reply Icon Button} */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onReply(message)}
            className="flex opacity-0 group-hover:opacity-100
            transition-opacity rounded-full !size-8
            "
          >
            <ReplyIcon
              size={16}
              className={cn(
                "text-gray-500 dark:text-white !stroke-[1.9]",
                isCurrentUser && "scale-x-[-1]"
              )}
            />
          </Button>
        </div>

        {message.status && (
          <span
            className="block
           text-[10px] text-gray-400 mt-0.5"
          >
            {message.status}
          </span>
        )}
      </div>
    </div>
  );
});

ChatMessageBody.displayName = "ChatMessageBody";

export default ChatMessageBody;

