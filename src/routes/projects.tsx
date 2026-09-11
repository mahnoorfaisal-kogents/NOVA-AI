import { createFileRoute } from "@tanstack/react-router";
import { ProjectsView } from "@/views/ProjectsView";

export const Route = createFileRoute("/projects")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "NOVA — Projects" },
      { name: "description", content: "Group work into NOVA projects with their own instructions and files." },
      { property: "og:title", content: "NOVA — Projects" },
      { property: "og:description", content: "Group work into NOVA projects with their own instructions and files." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectsView,
});
