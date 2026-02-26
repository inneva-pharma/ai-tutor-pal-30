import { useAuth } from "@/contexts/AuthContext";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function TopBar() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <button onClick={() => navigate(-1)} className="rounded-lg p-1.5 text-primary hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <img
          src="/assets/miniteacher-shape.png"
          alt="MiniTeacher"
          className="h-8 w-8 rounded-full object-contain"
        />
      </div>
    </header>
  );
}
