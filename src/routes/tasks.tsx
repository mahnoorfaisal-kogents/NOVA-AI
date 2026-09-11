import { createFileRoute } from "@tanstack/react-router";
import { TasksView } from "@/views/TasksView";

export const Route = createFileRoute("/tasks")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "NOVA — Tasks" },
      { name: "description", content: "Track NOVA tasks with priorities, due dates and subtasks." },
      { property: "og:title", content: "NOVA — Tasks" },
      { property: "og:description", content: "Track NOVA tasks with priorities, due dates and subtasks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TasksView,
});
