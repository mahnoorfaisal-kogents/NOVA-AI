import { createFileRoute } from "@tanstack/react-router";
import { AgentsView } from "@/views/AgentsView";

export const Route = createFileRoute("/agents")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "NOVA — Agents" },
      { name: "description", content: "Create specialised NOVA agents with their own instructions and tools." },
      { property: "og:title", content: "NOVA — Agents" },
      { property: "og:description", content: "Create specialised NOVA agents with their own instructions and tools." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgentsView,
});
