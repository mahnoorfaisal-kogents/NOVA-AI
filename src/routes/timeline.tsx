import { createFileRoute } from "@tanstack/react-router";
import { TimelineView } from "@/views/TimelineView";

export const Route = createFileRoute("/timeline")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "NOVA — Timeline" },
      { name: "description", content: "Browse a semantic timeline of everything you did in NOVA." },
      { property: "og:title", content: "NOVA — Timeline" },
      { property: "og:description", content: "Browse a semantic timeline of everything you did in NOVA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TimelineView,
});
