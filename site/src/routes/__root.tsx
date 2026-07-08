import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AuthProvider } from "~/lib/auth-context";

import appCss from "~/styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ReviewPilot — AI-powered review responses for local businesses" },
      {
        name: "description",
        content:
          "ReviewPilot automatically monitors Google Business Profile and Yelp, drafts AI-powered responses, and flags negative reviews — so you never miss a review again.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  notFoundComponent: () => (
    <div className="flex min-h-dvh items-center justify-center bg-[#0b0d11] text-center">
      <div>
        <div className="text-6xl font-extrabold gradient-text">404</div>
        <p className="mt-4 text-lg font-semibold text-white">Page not found</p>
        <p className="mt-2 text-sm text-slate-500">The page you're looking for doesn't exist.</p>
        <a href="/" className="btn-primary mt-6 inline-flex items-center gap-2">Go home</a>
      </div>
    </div>
  ),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <HeadContent />
        <style>{`body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }`}</style>
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}