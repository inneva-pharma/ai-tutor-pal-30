import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";

interface ChallengeCardProps {
  challenge: Tables<"challenges">;
  onEdit: (challengeId: number) => void;
  onPlay: (challengeId: number) => void;
}

export function ChallengeCard({ challenge, onEdit, onPlay }: ChallengeCardProps) {
  return (
    /*
     * aspect-square → la card es siempre cuadrada (alto = ancho del track).
     * w-full → ocupa el ancho de su celda de grid.
     * Eliminado: min-w-[170px], flex-1, cualquier width fijo.
     */
    <div className="aspect-square w-full min-w-0 flex flex-col justify-between rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-3.5">

      {/* Parte superior: tag + ID */}
      <div className="flex items-center justify-between gap-1 shrink-0">
        <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold text-muted-foreground sm:text-[10px]">
          Borrador
        </span>
        <span className="text-[9px] font-medium text-muted-foreground/60 sm:text-[10px]">
          #{challenge.id}
        </span>
      </div>

      {/* Parte central: nombre + conteo */}
      <div className="min-h-0 flex-1 flex flex-col justify-center py-1">
        <h4 className="line-clamp-3 text-xs font-bold leading-snug text-foreground sm:text-[13px]">
          {challenge.name}
        </h4>
        <p className="mt-1 text-[10px] text-muted-foreground sm:text-[11px]">
          {challenge.questionCount ?? 0} preguntas
        </p>
      </div>

      {/* Parte inferior: botones */}
      <div className="flex shrink-0 gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(challenge.id)}
          className="h-6 flex-1 rounded-full border-border px-1 text-[10px] font-semibold sm:h-7 sm:text-[11px]"
        >
          Editar
        </Button>
        <Button
          size="sm"
          onClick={() => onPlay(challenge.id)}
          className="h-6 flex-1 rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground hover:bg-primary/90 sm:h-7 sm:text-[11px]"
        >
          Empezar
        </Button>
      </div>
    </div>
  );
}
