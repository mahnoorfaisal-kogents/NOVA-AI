import { createFileRoute } from "@tanstack/react-router";
import { SecurityCenterView } from "@/views/SecurityCenterView";

export const Route = createFileRoute("/security")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "NOVA — Security center" },
      { name: "description", content: "Review NOVA audit logs, approvals and permissions." },
      { property: "og:title", content: "NOVA — Security center" },
      { property: "og:description", content: "Review NOVA audit logs, approvals and permissions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SecurityCenterView,
});
