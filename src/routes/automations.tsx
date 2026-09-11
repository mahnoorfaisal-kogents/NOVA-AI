import { createFileRoute } from "@tanstack/react-router";
import { AutomationsView } from "@/views/AutomationsView";

export const Route = createFileRoute("/automations")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "NOVA — Automations" },
      { name: "description", content: "Automate NOVA with triggers, conditions and actions." },
      { property: "og:title", content: "NOVA — Automations" },
      { property: "og:description", content: "Automate NOVA with triggers, conditions and actions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AutomationsView,
});
