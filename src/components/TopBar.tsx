import { useAuth } from "@/contexts/AuthContext";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLocation } from "react-router-dom";

const pageTitles: Record<string, string> = {
  "/dashboard": "Inicio",
  "/knowledge": "Mi conocimiento",
  "/explore": "Explorar",
  "/chatbots": "Miniteachers",
  "/challenges": "Retos",
  "/settings": "Configuración",
  "/admin": "Panel de administración",
};

export function TopBar() {
  const { profile } = useAuth();
  const location = useLocation();

  const pageTitle =
    Object.entries(pageTitles).find(([path]) =>
      location.pathname.startsWith(path)
    )?.[1] ?? "Inicio";

  const displayName = profile?.name || profile?.nick || "Usuario";

  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <span
          style={{
            fontFamily: "'Montserrat Alternates', sans-serif",
            fontWeight: 700,
            fontSize: 16,
            color: "#1A1F5E",
          }}
        >
          {pageTitle}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span
          style={{
            fontFamily: "'MuseoModerno', sans-serif",
            fontWeight: 700,
            fontSize: 15,
            color: "#1A1F5E",
          }}
        >
          ¡Hola {displayName}!
        </span>
        <img
          src="/assets/miniteacher-shape.png"
          alt="MiniTeacher"
          className="h-7 w-7 object-contain"
        />
      </div>
    </header>
  );
}
