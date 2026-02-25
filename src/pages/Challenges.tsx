import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { CreateChallengeDialog } from "@/components/challenges/CreateChallengeDialog";
import { ChallengeCard } from "@/components/challenges/ChallengeCard";

export default function Challenges() {
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: myChallenges = [], refetch } = useQuery({
    queryKey: ["my-challenges", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("user_id", user.id)
        .eq("isDeleted", false)
        .order("createDate", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  return (
    <div className="flex h-full w-full flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <Link to="/dashboard">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Hero banner */}
      <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/80 to-secondary shadow-lg">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-[10%] top-[20%] h-2 w-2 rounded-full bg-cta" />
          <div className="absolute left-[25%] top-[60%] h-1.5 w-1.5 rounded-full bg-primary-foreground" />
          <div className="absolute left-[50%] top-[15%] h-2.5 w-2.5 rounded-full bg-cta" />
          <div className="absolute left-[70%] top-[70%] h-1 w-1 rounded-full bg-primary-foreground" />
          <div className="absolute left-[85%] top-[30%] h-2 w-2 rounded-full bg-cta" />
        </div>
        <div className="relative flex min-h-[140px] items-center justify-between px-5 py-4 sm:min-h-[180px] sm:px-8 sm:py-6 md:min-h-[200px]">
          <div className="hidden flex-1 items-center justify-center md:flex">
            <svg viewBox="0 0 100 100" className="h-28 w-28 text-primary-foreground/30" fill="currentColor">
              <circle cx="50" cy="35" r="25" />
              <rect x="30" y="55" width="40" height="30" rx="8" />
              <circle cx="40" cy="32" r="5" fill="hsl(185, 90%, 55%)" />
              <circle cx="60" cy="32" r="5" fill="hsl(185, 90%, 55%)" />
              <text x="50" y="20" textAnchor="middle" fontSize="18" fill="hsl(var(--cta))">?</text>
            </svg>
          </div>
          <div className="ml-auto flex flex-col gap-2 sm:gap-3">
            <Button
              onClick={() => setCreateOpen(true)}
              className="gap-2 rounded-full bg-cta px-5 py-2 text-sm font-bold text-cta-foreground shadow-md transition-transform hover:scale-105 hover:bg-cta/90 sm:px-8 sm:py-3 sm:text-base"
            >
              Nuevo reto
            </Button>
            <Button
              variant="outline"
              className="gap-2 rounded-full border-primary-foreground/30 bg-primary-foreground/10 px-5 py-2 text-sm font-semibold text-primary-foreground backdrop-blur-sm transition-transform hover:scale-105 hover:bg-primary-foreground/20 sm:px-8 sm:py-3 sm:text-base"
            >
              <Search className="h-4 w-4" />
              Buscar reto
            </Button>
          </div>
        </div>
      </div>

      {/* Middle row: Teacher challenges + Introduce ID */}
      <div className="grid w-full gap-4 md:grid-cols-[1fr_240px] lg:grid-cols-[1fr_280px]">
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base text-foreground sm:text-lg">
                Retos de tu <span className="font-bold">profesor</span>
              </h2>
              <Button variant="default" size="sm" className="rounded-full px-4 text-xs font-semibold sm:px-5">
                Ver todos
              </Button>
            </div>
            <div className="mt-6 flex min-h-[60px] items-center justify-center sm:mt-8 sm:min-h-[80px]">
              <p className="text-xs text-muted-foreground sm:text-sm">No hay retos de profesor disponibles</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardContent className="flex flex-col items-center gap-2 p-4 text-center sm:gap-2.5 sm:p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground sm:h-12 sm:w-12 sm:rounded-xl sm:text-xl">
              #
            </div>
            <h3 className="text-sm font-bold text-foreground sm:text-base">Introducir ID</h3>
            <p className="text-[11px] leading-tight text-muted-foreground sm:text-xs">
              Si tienes un código específico de un profesor o compañero introdúcelo aquí
            </p>
            <input
              type="text"
              placeholder="#"
              className="w-full rounded-full border border-input bg-muted/50 px-3 py-1.5 text-center text-sm outline-none transition-all focus:ring-2 focus:ring-cta"
            />
            <Button size="sm" className="rounded-full bg-cta px-5 text-xs font-semibold text-cta-foreground hover:bg-cta/90 sm:px-6 sm:text-sm">
              Aceptar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* My created challenges */}
      <Card className="w-full overflow-hidden border-none bg-secondary/25 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base text-foreground sm:text-lg">
              Retos <span className="font-bold italic">creados</span>
            </h2>
            <Button variant="default" size="sm" className="rounded-full px-4 text-xs font-semibold sm:px-5">
              Ver todos
            </Button>
          </div>

          {myChallenges.length === 0 ? (
            <div className="mt-4 flex min-h-[80px] items-center justify-center sm:mt-6 sm:min-h-[100px]">
              <p className="text-xs text-muted-foreground sm:text-sm">Aún no has creado ningún reto</p>
            </div>
          ) : (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-2 sm:mt-4 sm:gap-4">
              {myChallenges.map((ch, i) => (
                <div
                  key={ch.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
                >
                  <ChallengeCard challenge={ch} />
                </div>
              ))}
              <button
                onClick={() => setCreateOpen(true)}
                className="flex min-w-[120px] shrink-0 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-secondary/40 bg-card/60 p-4 text-muted-foreground transition-all hover:scale-105 hover:border-cta hover:text-cta sm:min-w-[150px] sm:p-5"
              >
                <Plus className="h-8 w-8 sm:h-10 sm:w-10" />
                <span className="text-[11px] font-semibold sm:text-xs">Crear nuevo reto</span>
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateChallengeDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => refetch()}
      />
    </div>
  );
}
