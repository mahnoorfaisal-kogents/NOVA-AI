import { createFileRoute } from "@tanstack/react-router";
import { KnowledgeGraphView } from "@/views/KnowledgeGraphView";

export const Route = createFileRoute("/knowledge")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "NOVA — Knowledge graph" },
      { name: "description", content: "Explore the people, projects and ideas NOVA has connected." },
      { property: "og:title", content: "NOVA — Knowledge graph" },
      { property: "og:description", content: "Explore the people, projects and ideas NOVA has connected." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: KnowledgeGraphView,
});
