import Link from "next/link";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Heart,
  Video,
  FileText,
  Sparkles,
} from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/employees", label: "Employees", icon: Users },
  {
    path: "/workforce-insights",
    label: "Workforce Insights",
    icon: TrendingUp,
  },
  { path: "/engagement-analytics", label: "Engagement Analytics", icon: Heart },
  { path: "/meeting-intelligence", label: "Meeting Intelligence", icon: Video },
  { path: "/documents", label: "Documents", icon: FileText },
  { path: "/ai-insights", label: "AI Insights", icon: Sparkles },
];

export function Sidebar() {
  const router = useRouter();
  const currentPath = (router.asPath ?? "").split("?")[0];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-card border-r border-border p-4 overflow-y-auto">
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground hover:bg-accent"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
