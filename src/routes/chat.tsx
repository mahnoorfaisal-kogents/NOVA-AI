import { createFileRoute } from "@tanstack/react-router";
import { ChatView } from "@/views/ChatView";

export const Route = createFileRoute("/chat")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "NOVA — Chat" },
      { name: "description", content: "Talk with NOVA, switch models and keep every conversation organised." },
      { property: "og:title", content: "NOVA — Chat" },
      { property: "og:description", content: "Talk with NOVA, switch models and keep every conversation organised." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatView,
});
