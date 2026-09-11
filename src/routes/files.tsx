import { createFileRoute } from "@tanstack/react-router";
import { FilesView } from "@/views/FilesView";

export const Route = createFileRoute("/files")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "NOVA — Files" },
      { name: "description", content: "Store and search the files NOVA works with." },
      { property: "og:title", content: "NOVA — Files" },
      { property: "og:description", content: "Store and search the files NOVA works with." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FilesView,
});
