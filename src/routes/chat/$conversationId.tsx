import { createFileRoute } from "@tanstack/react-router";
import { ChatView } from "@/views/ChatView";

export const Route = createFileRoute("/chat/$conversationId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "NOVA — Conversation" },
      { name: "description", content: "Continue a saved NOVA conversation." },
    ],
  }),
  component: ChatView,
});
