import { createFileRoute } from "@tanstack/react-router";
import { SearchView } from "@/views/SearchView";

export const Route = createFileRoute("/search")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "NOVA — Search" },
      { name: "description", content: "Search across your NOVA conversations, projects, files and memory." },
      { property: "og:title", content: "NOVA — Search" },
      { property: "og:description", content: "Search across your NOVA conversations, projects, files and memory." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchView,
});
