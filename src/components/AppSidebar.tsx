import { Home, Bot, Target, Search, BookOpen, Settings, Shield } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Inicio", url: "/dashboard", icon: Home },
  { title: "Mi conocimiento", url: "/knowledge", icon: BookOpen },
  { title: "Explorar", url: "/explore", icon: Search },
  { title: "Miniteachers", url: "/chatbots", icon: Bot },
  { title: "Retos", url: "/challenges", icon: Target },
];

export function AppSidebar() {
  const location = useLocation();
  const { profile } = useAuth();
  const isAdmin = profile && profile.role_id <= 2;

  const initials = profile
    ? ((profile.name?.[0] ?? "") + (profile.lastname?.[0] ?? "")).toUpperCase() || (profile.nick?.[0]?.toUpperCase() ?? "U")
    : "U";

  const displayName = profile
    ? [profile.name, profile.lastname].filter(Boolean).join(" ") || profile.nick || "Usuario"
    : "Usuario";

  return (
    <Sidebar>
      <SidebarHeader className="items-center px-4 pb-2 pt-4">
        {/* Orange avatar ring like reference */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-cta">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-lg font-bold text-primary">
            {initials}
          </div>
        </div>
        <p className="mt-1 text-sm font-semibold text-primary" style={{ fontFamily: "'Montserrat Alternates', sans-serif" }}>{displayName}</p>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname.startsWith(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink to={item.url}>
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium" style={{ fontFamily: "'Montserrat Alternates', sans-serif" }}>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname.startsWith("/admin")}
                    tooltip="Admin"
                  >
                    <NavLink to="/admin">
                      <Shield className="h-5 w-5" />
                      <span className="font-medium" style={{ fontFamily: "'Montserrat Alternates', sans-serif" }}>Admin</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.startsWith("/settings")}
                  tooltip="Configuración"
                >
                  <NavLink to="/settings">
                    <Settings className="h-5 w-5" />
                    <span className="font-medium" style={{ fontFamily: "'Montserrat Alternates', sans-serif" }}>Configuración</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
