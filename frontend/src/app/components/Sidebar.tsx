import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { useState, useRef } from "react";
import { uploadTranscript } from "@/lib/api";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Heart,
  Video,
  FileText,
  Sparkles,
  Calendar,
  Upload,
  Loader2,
  CheckCircle2,
  ClipboardList,
  Shield,
  History,
} from "lucide-react";

// Define which roles can see which navigation items
const allNavItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["chro"] },
  { path: "/departments", label: "Departments", icon: Users, roles: ["chro"] },
  {
    path: "/employees",
    label: "Employees",
    icon: Users,
    roles: ["hr_partner"],
  },
  {
    path: "/attendance",
    label: "Employee Attendance",
    icon: ClipboardList,
    roles: ["hr_partner"],
  },
  {
    path: "/workforce-insights",
    label: "Workforce Insights",
    icon: TrendingUp,
    roles: ["talent_ops"],
  },
  { 
    path: "/employee-insights", 
    label: "Employee Insights", 
    icon: Sparkles, 
    roles: ["talent_ops"] 
  },
  { path: "/events", label: "Events", icon: Calendar, roles: ["engagement_manager"] },
  { path: "/past-events", label: "Past Events", icon: History, roles: ["engagement_manager"] },
  {
    path: "/engagement-analytics",
    label: "Engagement Analytics",
    icon: Heart,
    roles: ["engagement_manager"],
  },
  {
    path: "/meeting-intelligence",
    label: "Meeting Intelligence",
    icon: Video,
    roles: ["hr_partner"],
  },
  {
    path: "/documents",
    label: "Documents",
    icon: FileText,
    roles: ["chro", "hr_partner"],
  },
  {
    path: "/ai-insights",
    label: "AI Insights",
    icon: Sparkles,
    roles: ["chro", "hr_partner", "talent_ops", "engagement_manager"],
  },
  {
    path: "action:upload_transcript",
    label: "Upload Transcript",
    icon: Upload,
    roles: ["chro", "hr_partner"],
  },
  {
    path: "/security",
    label: "Migrations",
    icon: Shield,
    roles: ["chro"],
  },
];

export function Sidebar() {
  const router = useRouter();
  const currentPath = (router.asPath ?? "").split("?")[0];
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default to CHRO view if role is missing (route protection redirects to role-selection when role is null)
  const userRole = user?.role ?? "chro";

  // Filter navigation items based on the user's role
  const visibleNavItems = allNavItems.filter((item) =>
    item.roles.includes(userRole),
  );

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadSuccess(false);

    try {
      await uploadTranscript(file);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload transcript. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <aside className="fixed left-0 top-20 bottom-0 w-64 bg-card border-r border-border p-4 flex flex-col overflow-hidden ml-4 rounded-tl-2xl">
      <nav className="flex-1 space-y-1 overflow-y-auto pr-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".txt"
          className="hidden"
        />

        {visibleNavItems.map((item) => {
          if (item.path === "action:upload_transcript") {
            return (
              <div key="upload-transcript" className="py-1 my-1 border-y border-border/50">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isUploading
                      ? "bg-accent opacity-70 cursor-not-allowed"
                      : uploadSuccess
                        ? "bg-green-500/10 text-green-600 border border-green-500/20"
                        : "text-foreground hover:bg-accent"
                  }`}
                >
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  ) : uploadSuccess ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Upload className="w-5 h-5 text-primary" />
                  )}
                  <span className="text-sm">
                    {isUploading
                      ? "Uploading..."
                      : uploadSuccess
                        ? "Success!"
                        : "Upload Transcript"}
                  </span>
                </button>
              </div>
            );
          }

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
