import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, ArrowLeft, Target } from "lucide-react";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex gap-3">
          <Button
            onClick={() => setCreateOpen(true)}
            className="gap-2 rounded-full bg-cta px-6 font-semibold text-cta-foreground hover:bg-cta/90"
          >
            Nuevo reto
          </Button>
          <Button variant="outline" className="gap-2 rounded-full px-6 font-semibold">
            <Search className="h-4 w-4" />
            Buscar reto
          </Button>
        </div>
      </div>

      {/* Hero banner */}
      <Card className="overflow-hidden border-none bg-gradient-to-r from-primary via-primary/90 to-secondary shadow-lg">
        <CardContent className="flex items-center justify-between p-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-primary-foreground">Retos</h1>
            <p className="text-primary-foreground/80">
              Estudia y aprende resolviendo divertidos retos
            </p>
          </div>
          <div className="hidden md:block">
            <div className="flex h-32 w-32 items-center justify-center rounded-2xl">
              <Target className="h-20 w-20 text-cta" strokeWidth={1.2} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teacher challenges section (placeholder) */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              Retos de tu <span className="font-bold">profesor</span>
            </h2>
            <Button variant="default" size="sm" className="rounded-full px-5 text-sm font-semibold">
              Ver todos
            </Button>
          </div>
          <div className="mt-6 flex min-h-[100px] items-center justify-center">
            <p className="text-sm text-muted-foreground">No hay retos de profesor disponibles</p>
          </div>
        </CardContent>
      </Card>

      {/* My created challenges */}
      <Card className="border-none bg-secondary/30 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              Retos <span className="font-bold italic">creados</span>
            </h2>
            <Button variant="default" size="sm" className="rounded-full px-5 text-sm font-semibold">
              Ver todos
            </Button>
          </div>

          {myChallenges.length === 0 ? (
            <div className="mt-6 flex min-h-[120px] items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Aún no has creado ningún reto
              </p>
            </div>
          ) : (
            <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
              {myChallenges.map((ch) => (
                <ChallengeCard key={ch.id} challenge={ch} />
              ))}
              {/* Create new card */}
              <button
                onClick={() => setCreateOpen(true)}
                className="flex min-w-[160px] shrink-0 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-secondary/50 bg-card p-6 text-muted-foreground transition-colors hover:border-cta hover:text-cta"
              >
                <Plus className="h-10 w-10" />
                <span className="text-sm font-semibold">Crear nuevo reto</span>
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Introduce ID card */}
      <Card className="border-border shadow-sm">
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-primary-foreground">
            #
          </div>
          <h3 className="text-lg font-bold text-foreground">Introducir ID</h3>
          <p className="text-sm text-muted-foreground">
            Si tienes un código específico de un profesor o compañero introdúcelo aquí
          </p>
          <input
            type="text"
            placeholder="#"
            className="w-40 rounded-full border border-input bg-muted/50 px-4 py-2 text-center text-sm outline-none focus:ring-2 focus:ring-cta"
          />
          <Button className="rounded-full bg-cta px-6 font-semibold text-cta-foreground hover:bg-cta/90">
            Aceptar
          </Button>
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
