import { z } from "zod";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Paperclip, Send, X } from "lucide-react";
import { Form, FormField, FormItem } from "../ui/form";
import { Input } from "../ui/input";
import { useMatrixSendMessage } from "@/features/chat/api/use-send-chat-messages";

interface Props {
  chatId: string | null;
  currentUserId: string | null;
}

const ChatFooter = ({ chatId }: Props) => {
  const messageSchema = z.object({
    message: z.string().optional(),
  });

  const { sendMessage, sendImage } = useMatrixSendMessage();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      message: "",
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image must be under 20MB");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const onSubmit = async (values: { message?: string }) => {
    if (!chatId || isSending) return;
    const text = values.message?.trim() || "";
    if (!text && !imageFile) {
      toast.error("Please enter a message or select an image");
      return;
    }

    setIsSending(true);
    try {
      if (imageFile) {
        await sendImage(chatId, imageFile, text || undefined);
      } else {
        await sendMessage(chatId, text);
      }
      handleRemoveImage();
      form.reset();
    } catch (err: any) {
      console.error("Send failed", err);
      toast.error(err?.response?.data?.detail || err?.message || "Failed to send");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="sticky bottom-0 inset-x-0 z-[999] bg-card border-t border-border py-4">
      {imagePreview && (
        <div className="max-w-6xl mx-auto px-8.5 mb-2">
          <div className="relative w-fit">
            <img
              src={imagePreview}
              alt="Upload preview"
              className="object-contain h-16 bg-muted min-w-16 rounded"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-px right-1 bg-black/50 text-white rounded-full cursor-pointer"
              onClick={handleRemoveImage}
              disabled={isSending}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="max-w-6xl px-8.5 mx-auto flex items-end gap-2"
        >
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={isSending}
              className="rounded-full"
              onClick={() => imageInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              disabled={isSending}
              ref={imageInputRef}
              onChange={handleImageChange}
            />
          </div>
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem className="flex-1">
                <Input
                  {...field}
                  autoComplete="off"
                  placeholder="Type new message"
                  disabled={isSending}
                  className="min-h-[40px] bg-background"
                />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            size="icon"
            className="rounded-lg"
            disabled={isSending}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ChatFooter;
