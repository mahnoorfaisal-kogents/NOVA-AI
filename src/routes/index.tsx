import { createFileRoute } from "@tanstack/react-router";
import { HomeView } from "@/views/HomeView";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "NOVA — Your personal AI operating system" },
      { name: "description", content: "Your NOVA home: recent conversations, projects, tasks and activity at a glance." },
      { property: "og:title", content: "NOVA — Your personal AI operating system" },
      { property: "og:description", content: "Your NOVA home: recent conversations, projects, tasks and activity at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomeView,
});
