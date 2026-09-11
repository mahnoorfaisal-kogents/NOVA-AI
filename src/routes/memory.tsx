import { createFileRoute } from "@tanstack/react-router";
import { MemoryView } from "@/views/MemoryView";

export const Route = createFileRoute("/memory")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "NOVA — Memory" },
      { name: "description", content: "Review and curate what NOVA remembers about you." },
      { property: "og:title", content: "NOVA — Memory" },
      { property: "og:description", content: "Review and curate what NOVA remembers about you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MemoryView,
});
