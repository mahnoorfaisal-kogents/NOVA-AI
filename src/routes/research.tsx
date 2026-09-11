import { createFileRoute } from "@tanstack/react-router";
import { ResearchView } from "@/views/ResearchView";

export const Route = createFileRoute("/research")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "NOVA — Research" },
      { name: "description", content: "Run deep multi-step research with NOVA." },
      { property: "og:title", content: "NOVA — Research" },
      { property: "og:description", content: "Run deep multi-step research with NOVA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResearchView,
});
