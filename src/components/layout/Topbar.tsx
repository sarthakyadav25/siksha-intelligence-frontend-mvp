import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, LogOut } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logoutUser } from "@/store/slices/authSlice";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/shared/UserAvatar";

const breadcrumbMap: Record<string, string> = {
  dashboard: "Dashboard",
  admin: "Admin",
  students: "Students",
  staff: "Staff",
  settings: "Settings",
};

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  // Build breadcrumbs from path
  const segments = location.pathname
    .split("/")
    .filter(Boolean)
    .filter((s) => s !== "dashboard" && s !== "admin");

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/login", { replace: true });
    toast.success("Logged out successfully");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur-sm">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm">
        <span className="font-medium text-foreground">Admin</span>
        {segments.map((seg, i) => (
          <span key={seg} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span
              className={cn(
                i === segments.length - 1
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {breadcrumbMap[seg] ?? seg}
            </span>
          </span>
        ))}
        {segments.length === 0 && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium text-foreground">Overview</span>
          </>
        )}
      </nav>

      {/* User area */}
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-foreground leading-tight">
            {user?.username ?? "Admin"}
          </p>
          <p className="text-xs text-muted-foreground">
            {user?.roles?.[0]?.replace("ROLE_", "") ?? "ADMIN"}
          </p>
        </div>

        {/* Avatar */}
        <UserAvatar 
          name={user?.username} 
          profileUrl={user?.profileUrl} 
          className="h-9 w-9 ring-2 ring-primary/20" 
        />

        {/* Logout */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
