import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Heart,
  Video,
  FileText,
  Sparkles,
} from "lucide-react";

// Define which roles can see which navigation items
const allNavItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["chro"] },
  { path: "/departments", label: "Departments", icon: Users, roles: ["chro"] },
  { path: "/employees", label: "Employees", icon: Users, roles: ["hr_partner"] },
  {
    path: "/workforce-insights",
    label: "Workforce Insights",
    icon: TrendingUp,
    roles: ["talent_ops"]
  },
  { path: "/engagement-analytics", label: "Engagement Analytics", icon: Heart, roles: ["engagement_manager"] },
  { path: "/meeting-intelligence", label: "Meeting Intelligence", icon: Video, roles: ["hr_partner", "engagement_manager", "talent_ops"] },
  { path: "/documents", label: "Documents", icon: FileText, roles: ["chro", "hr_partner", "talent_ops", "engagement_manager"] },
  { path: "/ai-insights", label: "AI Insights", icon: Sparkles, roles: ["chro", "hr_partner", "talent_ops", "engagement_manager"] },
];

export function Sidebar() {
  const router = useRouter();
  const currentPath = (router.asPath ?? "").split("?")[0];
  const { user } = useAuth();
  
  // Default to CHRO view if role is missing (route protection redirects to role-selection when role is null)
  const userRole = user?.role ?? "chro";
  
  // Filter navigation items based on the user's role
  const visibleNavItems = allNavItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className="fixed left-0 top-20 bottom-0 w-64 bg-card border-r border-border p-4 overflow-y-auto ml-4 rounded-tl-2xl">
      <nav className="space-y-1">
        {visibleNavItems.map((item) => {
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
