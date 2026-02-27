import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { getSubjectImage } from "@/lib/subjectImages";

interface ChallengeCardProps {
  challenge: Tables<"challenges">;
  onEdit: (challengeId: number) => void;
  onPlay: (challengeId: number) => void;
  onDelete: (challengeId: number) => void;
  playOnly?: boolean;
  teacherName?: string | null;
  subjectName?: string | null;
  reviewInfo?: { completed: number; pendingReview: number } | null;
  classrooms?: (string | null)[];
  onReview?: () => void;
}

export function ChallengeCard({
  challenge,
  onEdit,
  onPlay,
  onDelete,
  playOnly,
  teacherName,
  subjectName,
  reviewInfo,
  classrooms,
  onReview,
}: ChallengeCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const isReviewMode = !!onReview;
  const hideDelete = playOnly || isReviewMode;
  const showTag = playOnly || isReviewMode;

  const openConfirm = () => {
    setConfirmOpen(true);
    setTimeout(() => setConfirmVisible(true), 30);
  };

  const closeConfirm = () => {
    setConfirmVisible(false);
    setTimeout(() => setConfirmOpen(false), 300);
  };

  let tagText = "";
  let tagClass = "";
  if (playOnly) {
    tagText = teacherName ? `Prof. ${teacherName}` : "De tu profesor";
    tagClass = "bg-black/40 text-white backdrop-blur-sm";
  } else if (isReviewMode) {
    const letters = (classrooms ?? []).filter(Boolean).join(", ");
    tagText = letters ? `Grupo ${letters}` : "Compartido";
    tagClass = "bg-black/40 text-white backdrop-blur-sm";
  }

  const imageUrl = getSubjectImage(subjectName, challenge.id);

  return (
    <>
      {/* ── WRAPPER — h-full keeps all cards the same height ── */}
      <div className="h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex h-full flex-col">

          {/* ── IMAGE — fixed height, bigger ── */}
          <div className="relative w-full shrink-0 h-36 sm:h-40 lg:h-44 overflow-hidden bg-muted/30">
            <img
              src={imageUrl}
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            />

            {/* Overlay: tag + delete + ID */}
            <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-1 p-2">
              {showTag ? (
                <span className={`truncate max-w-[75%] rounded-full px-2 py-0.5 text-[9px] font-semibold sm:text-[10px] ${tagClass}`}>
                  {tagText}
                </span>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-1">
                {!hideDelete && (
                  <button
                    onClick={openConfirm}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-black/40 text-white/80 backdrop-blur-sm transition-colors hover:bg-destructive hover:text-white sm:h-6 sm:w-6"
                    title="Borrar reto"
                  >
                    <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </button>
                )}
                <span className="rounded-full bg-black/40 px-1.5 py-0.5 text-[9px] font-semibold text-white backdrop-blur-sm sm:text-[10px]">
                  #{challenge.id}
                </span>
              </div>
            </div>
          </div>

          {/* ── BODY — flex-1 absorbs remaining space ── */}
          <div className="flex flex-1 min-h-0 flex-col gap-2 p-3">
            <div className="min-h-0 flex-1">
              <h4 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
                {challenge.name}
              </h4>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground line-clamp-1">
                <span>{challenge.questionCount ?? 0} preguntas</span>
                {subjectName && (
                  <span className="truncate font-medium text-primary/70">{subjectName}</span>
                )}
              </div>
              {reviewInfo && (
                <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                  {reviewInfo.completed} completados · {reviewInfo.pendingReview} por revisar
                </p>
              )}
            </div>

            {/* ── FOOTER — mt-auto pins buttons to bottom ── */}
            <div className="mt-auto flex shrink-0 gap-2">
              {isReviewMode ? (
                <Button
                  size="sm"
                  onClick={onReview}
                  className="h-8 w-full rounded-full bg-primary px-2 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Revisar
                </Button>
              ) : playOnly ? (
                <Button
                  size="sm"
                  onClick={() => onPlay(challenge.id)}
                  className="h-8 w-full rounded-full bg-cta px-2 text-[11px] font-semibold text-cta-foreground hover:bg-cta/90"
                >
                  Empezar
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(challenge.id)}
                    className="h-8 flex-1 rounded-full border-border px-2 text-[11px] font-semibold"
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onPlay(challenge.id)}
                    className="h-8 flex-1 rounded-full bg-primary px-2 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Empezar
                  </Button>
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── CONFIRMATION POPUP ── */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
              confirmVisible ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeConfirm}
          />
          <div
            className={`relative z-10 w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              confirmVisible
                ? "translate-y-0 scale-100 opacity-100"
                : "translate-y-4 scale-95 opacity-0"
            }`}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-center text-base font-bold text-foreground">Borrar reto</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Vas a borrar el reto{" "}
              <span className="font-semibold text-foreground">"{challenge.name}"</span>.
              Esta acción no se puede deshacer.
            </p>
            <div className="mt-5 flex gap-3">
              <Button
                variant="secondary"
                onClick={closeConfirm}
                className="flex-1 rounded-full text-xs font-semibold"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => { closeConfirm(); onDelete(challenge.id); }}
                className="flex-1 rounded-full bg-destructive text-xs font-bold text-white hover:bg-destructive/90"
              >
                Borrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
