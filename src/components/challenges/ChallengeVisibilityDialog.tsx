import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Share2, Globe, Lock, ChevronLeft } from "lucide-react";

interface ClassroomGroup {
  letter: string;
  studentCount: number;
}

interface VisibilityResult {
  accessPermissions: number;
  selectedClassrooms: string[];
}

interface Props {
  open: boolean;
  gradeId: number;
  gradeName: string;
  schoolId: number;
  onConfirm: (result: VisibilityResult) => void;
  onCancel: () => void;
}

export function ChallengeVisibilityDialog({
  open,
  gradeId,
  gradeName,
  schoolId,
  onConfirm,
  onCancel,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<"choose" | "groups">("choose");
  const [selectedLetters, setSelectedLetters] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setMode("choose");
      setSelectedLetters(new Set());
      const t = setTimeout(() => setVisible(true), 30);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [open]);

  const { data: classroomGroups = [], isLoading } = useQuery<ClassroomGroup[]>({
    queryKey: ["classroom-groups", gradeId, schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students_enrollments")
        .select("classroomLetter, user_id, profiles!inner(schools_id)")
        .eq("grade_id", gradeId)
        .eq("profiles.schools_id", schoolId);

      if (error) throw error;

      const map = new Map<string, Set<string>>();
      for (const row of (data ?? []) as any[]) {
        const letter = row.classroomLetter as string;
        if (!letter) continue;
        if (!map.has(letter)) map.set(letter, new Set());
        map.get(letter)!.add(row.user_id as string);
      }

      return Array.from(map.entries())
        .map(([letter, users]) => ({ letter, studentCount: users.size }))
        .sort((a, b) => a.letter.localeCompare(b.letter));
    },
    enabled: open,
  });

  const toggleLetter = (letter: string) => {
    setSelectedLetters((prev) => {
      const next = new Set(prev);
      if (next.has(letter)) next.delete(letter);
      else next.add(letter);
      return next;
    });
  };

  const handlePublic = () => {
    onConfirm({ accessPermissions: 1, selectedClassrooms: [] });
  };

  const handlePrivateConfirm = () => {
    onConfirm({
      accessPermissions: 1,
      selectedClassrooms: Array.from(selectedLetters),
    });
  };

  const close = () => {
    setVisible(false);
    setTimeout(onCancel, 300);
  };

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-4 scale-95 opacity-0"
        }`}
      >
        {mode === "choose" ? (
          <>
            {/* Screen 1: Publico / Privado */}
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Share2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="text-center text-lg font-bold text-foreground">
              Visibilidad del reto
            </h3>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Elige quien puede ver este reto
            </p>

            <div className="mt-5 space-y-3">
              <button
                onClick={handlePublic}
                className="flex w-full items-center gap-3 rounded-xl border-2 border-cta bg-cta/10 p-4 text-left transition-colors hover:bg-cta/20"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cta">
                  <Globe className="h-5 w-5 text-cta-foreground" />
                </div>
                <div>
                  <span className="text-sm font-bold text-foreground">Publico</span>
                  <p className="text-xs text-muted-foreground">Visible para todo tu colegio</p>
                </div>
              </button>

              <button
                onClick={() => setMode("groups")}
                className="flex w-full items-center gap-3 rounded-xl border-2 border-primary bg-primary/10 p-4 text-left transition-colors hover:bg-primary/20"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary">
                  <Lock className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <span className="text-sm font-bold text-foreground">Privado</span>
                  <p className="text-xs text-muted-foreground">Selecciona grupos concretos</p>
                </div>
              </button>
            </div>

            <button
              onClick={close}
              className="mt-4 w-full text-center text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancelar
            </button>
          </>
        ) : (
          <>
            {/* Screen 2: Group selector */}
            <div className="mb-4 flex items-center gap-2">
              <button
                onClick={() => setMode("choose")}
                className="flex h-8 w-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h3 className="text-lg font-bold text-foreground">Selecciona los grupos</h3>
            </div>

            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {gradeName}
            </span>

            <div className="mt-4 max-h-[240px] space-y-2 overflow-y-auto scrollbar-blue">
              {isLoading ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Cargando grupos...
                </p>
              ) : classroomGroups.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No hay grupos con alumnos matriculados para este curso
                </p>
              ) : (
                classroomGroups.map((g) => (
                  <label
                    key={g.letter}
                    className="flex cursor-pointer items-center gap-3 rounded-xl bg-muted/40 p-3 transition-colors hover:bg-muted/60"
                  >
                    <Checkbox
                      checked={selectedLetters.has(g.letter)}
                      onCheckedChange={() => toggleLetter(g.letter)}
                    />
                    <span className="flex-1 text-sm font-semibold text-foreground">
                      Grupo {g.letter}
                    </span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {g.studentCount} {g.studentCount === 1 ? "alumno" : "alumnos"}
                    </span>
                  </label>
                ))
              )}
            </div>

            <div className="mt-5 flex gap-3">
              <Button
                variant="secondary"
                onClick={close}
                className="flex-1 rounded-full text-sm font-semibold"
              >
                Cancelar
              </Button>
              <Button
                onClick={handlePrivateConfirm}
                disabled={selectedLetters.size === 0}
                className="flex-1 rounded-full bg-cta text-sm font-bold text-cta-foreground hover:bg-cta/90"
              >
                Compartir con {selectedLetters.size} grupo{selectedLetters.size !== 1 ? "s" : ""}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
