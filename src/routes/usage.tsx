import { createFileRoute } from "@tanstack/react-router";
import { UsageView } from "@/views/UsageView";

export const Route = createFileRoute("/usage")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "NOVA — Usage" },
      { name: "description", content: "See your NOVA usage by model and provider." },
      { property: "og:title", content: "NOVA — Usage" },
      { property: "og:description", content: "See your NOVA usage by model and provider." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UsageView,
});
