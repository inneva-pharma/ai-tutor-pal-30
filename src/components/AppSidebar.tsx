import { LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { CustomIcon } from "@/components/CustomIcon";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  { title: "Inicio", url: "/dashboard", icon: "/assets/IconHome.png" },
  { title: "Mi conocimiento", url: "/knowledge", icon: "/assets/IconKnowledge.png" },
  { title: "Explorar", url: "/explore", icon: "/assets/IconRocket.png" },
  { title: "Miniteachers", url: "/chatbots", icon: "/assets/IconChat.png" },
  { title: "Retos", url: "/challenges", icon: "/assets/IconChallenges.png" },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const isAdmin = profile && profile.role_id <= 2;

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const initials = profile
    ? ((profile.name?.[0] ?? "") + (profile.lastname?.[0] ?? "")).toUpperCase() || (profile.nick?.[0]?.toUpperCase() ?? "U")
    : "U";

  const displayName = profile
    ? [profile.name, profile.lastname].filter(Boolean).join(" ") || profile.nick || "Usuario"
    : "Usuario";

  return (
    <Sidebar>
      <SidebarHeader className="items-center px-4 pb-2 pt-4">
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex flex-col items-center gap-1 outline-none cursor-pointer">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-cta transition-transform hover:scale-105">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-lg font-bold text-primary">
                  {initials}
                </div>
              </div>
              <p className="mt-1 text-sm font-semibold text-primary" style={{ fontFamily: "'Montserrat Alternates', sans-serif" }}>{displayName}</p>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" side="bottom" align="center">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
              style={{ fontFamily: "'Montserrat Alternates', sans-serif", fontWeight: 600 }}
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </PopoverContent>
        </Popover>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                    >
                      <NavLink to={item.url}>
                        <CustomIcon
                          src={item.icon}
                          alt={item.title}
                          size={20}
                          color={active ? "#F97316" : "#1A1F5E"}
                        />
                        <span className="font-medium" style={{ fontFamily: "'Montserrat Alternates', sans-serif" }}>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {/* Admin moved to footer */}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname.startsWith("/admin")}
                    tooltip="Panel de administración"
                  >
                    <NavLink to="/admin">
                      <CustomIcon
                        src="/assets/IconTeacher.png"
                        alt="Panel de administración"
                        size={20}
                        color={location.pathname.startsWith("/admin") ? "#F97316" : "#1A1F5E"}
                      />
                      <span className="font-medium" style={{ fontFamily: "'Montserrat Alternates', sans-serif" }}>Panel de administración</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.startsWith("/settings")}
                  tooltip="Configuración"
                >
                  <NavLink to="/settings">
                    <CustomIcon
                      src="/assets/IconSettings.png"
                      alt="Configuración"
                      size={20}
                      color={location.pathname.startsWith("/settings") ? "#F97316" : "#1A1F5E"}
                    />
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
