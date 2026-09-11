import { createFileRoute } from "@tanstack/react-router";
import { SettingsView } from "@/views/SettingsView";

export const Route = createFileRoute("/settings")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "NOVA — Settings" },
      { name: "description", content: "Configure your NOVA account, providers and preferences." },
      { property: "og:title", content: "NOVA — Settings" },
      { property: "og:description", content: "Configure your NOVA account, providers and preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsView,
});
