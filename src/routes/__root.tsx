import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { CommandPalette } from "@/components/CommandPalette";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-app px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-primary">Page not found</h2>
        <p className="mt-2 text-sm text-secondary">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link to="/" className="btn-primary inline-flex">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-app px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-primary">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-secondary">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn-primary"
          >
            Try again
          </button>
          <a href="/" className="btn-secondary">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "NOVA — Your personal AI operating system" },
      {
        name: "description",
        content:
          "NOVA is a personal AI workspace with chat, projects, memory, agents, automations and research in one place.",
      },
      { property: "og:title", content: "NOVA — Your personal AI operating system" },
      {
        property: "og:description",
        content:
          "Chat, projects, memory, agents, automations and research in one private AI workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function NovaBooting() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-app">
      <div className="w-16 h-16 rounded-2xl nova-gradient flex items-center justify-center glow-blue animate-pulse-glow">
        <span className="text-white font-bold text-xl">N</span>
      </div>
    </div>
  );
}

function AppShell() {
  const { user, loading } = useAuth();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  if (loading) return <NovaBooting />;
  if (!user) return <AuthScreen />;

  return (
    <div className="flex min-h-screen bg-app">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onCommandPalette={() => setCommandPaletteOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          {/* Required: nested routes render here. */}
          <Outlet />
        </main>
      </div>
      <CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  return (
    <QueryClientProvider client={queryClient}>
      {hydrated ? (
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <AppShell />
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      ) : (
        <NovaBooting />
      )}
    </QueryClientProvider>
  );
}
