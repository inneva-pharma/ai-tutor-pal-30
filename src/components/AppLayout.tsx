import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { MobileNav } from "@/components/MobileNav";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(false);
    const timeout = setTimeout(() => setIsVisible(true), 30);
    return () => clearTimeout(timeout);
  }, [location.pathname]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <TopBar />
          <main className="flex flex-1 flex-col overflow-auto pb-20 md:pb-6"
            style={{ padding: "clamp(12px, 2.5vw, 24px)" }}>
            <div
              className={`flex w-full min-w-0 flex-1 flex-col transition-all duration-300 ease-out ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-3"
              }`}
            >
              {children}
            </div>
          </main>
        </div>
      </div>
      <MobileNav />
    </SidebarProvider>
  );
}
