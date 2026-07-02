import { createFileRoute, useNavigate, Link, Outlet } from "@tanstack/react-router";
import { useAuth } from "~/lib/auth-context";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const auth = useAuth();
  const navigate = useNavigate();

  if (!auth.isLoading && !auth.user) {
    navigate({ to: "/login" });
    return null;
  }

  if (auth.isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Top navigation */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              RP
            </div>
            <span className="text-lg font-bold tracking-tight">ReviewPilot</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-gray-500 sm:block">{auth.user?.email}</span>
            <button
              onClick={() => {
                auth.logout();
                navigate({ to: "/" });
              }}
              className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden w-56 flex-shrink-0 sm:block">
            <nav className="space-y-1">
              <Link
                to="/dashboard"
                activeOptions={{ exact: true }}
                className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 [&.active]:bg-indigo-50 [&.active]:text-indigo-700"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                Overview
              </Link>
              <Link
                to="/dashboard/reviews"
                className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 [&.active]:bg-indigo-50 [&.active]:text-indigo-700"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
                Reviews
              </Link>
              <Link
                to="/dashboard/settings"
                className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 [&.active]:bg-indigo-50 [&.active]:text-indigo-700"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Link>
            </nav>
          </aside>

          {/* Mobile nav tabs */}
          <div className="sm:hidden">
            <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
              <Link
                to="/dashboard"
                activeOptions={{ exact: true }}
                className="flex-1 rounded-md px-3 py-2 text-center text-xs font-medium transition [&.active]:bg-white [&.active]:shadow-sm"
              >
                Overview
              </Link>
              <Link
                to="/dashboard/reviews"
                className="flex-1 rounded-md px-3 py-2 text-center text-xs font-medium transition [&.active]:bg-white [&.active]:shadow-sm"
              >
                Reviews
              </Link>
              <Link
                to="/dashboard/settings"
                className="flex-1 rounded-md px-3 py-2 text-center text-xs font-medium transition [&.active]:bg-white [&.active]:shadow-sm"
              >
                Settings
              </Link>
            </div>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}