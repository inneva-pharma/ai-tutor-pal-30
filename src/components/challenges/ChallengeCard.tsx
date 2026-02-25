import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";

interface ChallengeCardProps {
  challenge: Tables<"challenges">;
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  return (
    <div className="flex min-w-[170px] shrink-0 flex-col items-center gap-3 rounded-xl border border-border bg-card p-5 shadow-sm">
      <span className="text-xs text-muted-foreground">#{challenge.id}</span>
      <h4 className="text-center text-sm font-bold text-foreground leading-tight">
        {challenge.name}
      </h4>
      <div className="mt-auto flex gap-2">
        <Button variant="outline" size="sm" className="rounded-full text-xs px-3">
          Editar
        </Button>
        <Button size="sm" className="rounded-full bg-primary text-xs px-3 text-primary-foreground">
          Empezar
        </Button>
      </div>
    </div>
  );
}
