import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Sparkles, Share2, RefreshCw, Check, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import type { ReviewQuestion } from "./QuestionReviewScreen";
import type { ChallengeFormSnapshot } from "./CreateChallengeDialog";

const DIFFICULTY_COLOR: Record<string, string> = {
  Fácil: "bg-green-500",
  Medio: "bg-yellow-400",
  Difícil: "bg-orange-500",
  Experto: "bg-red-500",
};

const OPTION_LABELS = ["A", "B", "C", "D"];

const QUESTIONS_PER_PAGE = 10;

interface Props {
  questions: ReviewQuestion[];
  form: ChallengeFormSnapshot;
  challengeId?: number; // if provided → edit mode (UPDATE existing)
  onSaved: () => void;
  onDiscard: () => void;
  onRegenerate: () => void;
}

export function ChallengeReviewPage({ questions: initial, form, challengeId, onSaved, onDiscard, onRegenerate }: Props) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<ReviewQuestion[]>(initial);
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const pageStart = (page - 1) * QUESTIONS_PER_PAGE;
  const pageQuestions = questions.slice(pageStart, pageStart + QUESTIONS_PER_PAGE);

  const updateQuestion = (globalIdx: number, patch: Partial<ReviewQuestion>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === globalIdx ? { ...q, ...patch } : q))
    );
  };

  const updateOption = (globalIdx: number, optIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== globalIdx) return q;
        const newOpts = [...q.opciones];
        newOpts[optIdx] = value;
        return { ...q, opciones: newOpts };
      })
    );
  };

  const deleteQuestion = (globalIdx: number) => {
    if (questions.length <= 1) return;
    const newQ = questions.filter((_, i) => i !== globalIdx);
    setQuestions(newQ);
    const newTotal = Math.ceil(newQ.length / QUESTIONS_PER_PAGE);
    if (page > newTotal) setPage(newTotal);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (challengeId) {
        // ── EDIT MODE: UPDATE challenge + replace questions ──
        const { error: updateError } = await supabase
          .from("challenges")
          .update({
            name: form.name,
            topic: form.topic || null,
            questionCount: questions.length,
            difficulty: form.difficulty,
            accessPermissions: form.shareWithStudents ? 1 : 0,
            lastModificationDate: new Date().toISOString(),
          })
          .eq("id", challengeId);
        if (updateError) throw updateError;

        const { error: deleteError } = await supabase
          .from("challenge_questions")
          .delete()
          .eq("challenge_id", challengeId);
        if (deleteError) throw deleteError;

        const questionsToInsert = questions.map((q) => ({
          challenge_id: challengeId,
          question: q.pregunta,
          answer1: q.opciones[0] ?? "",
          answer2: q.opciones[1] ?? "",
          answer3: q.opciones[2] ?? "",
          answer4: q.opciones[3] ?? "",
          correctAnswer: q.correctAnswerIndex,
          explanation: q.explanation ?? null,
          isInvalidQuestion: false,
        }));
        const { error } = await supabase.from("challenge_questions").insert(questionsToInsert);
        if (error) throw error;

      } else {
        // ── CREATE MODE: INSERT new challenge + questions ──
        const accessPermissions = form.shareWithStudents ? 1 : 0;
        const { data: challenge, error: challengeError } = await supabase
          .from("challenges")
          .insert({
            name: form.name,
            topic: form.topic || null,
            grade_id: parseInt(form.gradeId),
            subject_id: parseInt(form.subjectId),
            language: form.language === "Español" ? "ES" : form.language === "English" ? "EN" : "FR",
            questionCount: questions.length,
            difficulty: form.difficulty,
            accessPermissions,
            user_id: user.id,
          })
          .select()
          .single();
        if (challengeError) throw challengeError;

        const questionsToInsert = questions.map((q) => ({
          challenge_id: challenge.id,
          question: q.pregunta,
          answer1: q.opciones[0] ?? "",
          answer2: q.opciones[1] ?? "",
          answer3: q.opciones[2] ?? "",
          answer4: q.opciones[3] ?? "",
          correctAnswer: q.correctAnswerIndex,
          explanation: q.explanation ?? null,
          isInvalidQuestion: false,
        }));

        const { error } = await supabase.from("challenge_questions").insert(questionsToInsert);
        if (error) throw error;
      }

      toast.success(challengeId ? "¡Reto actualizado con éxito!" : "¡Reto guardado con éxito!");
      onSaved();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al guardar el reto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">

      {/* ── HEADER ── */}
      <div className="shrink-0 bg-primary px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-primary-foreground/50">
                {challengeId ? "Editando reto:" : "Reto:"}
              </span>
              <h1 className="truncate text-base font-extrabold text-primary-foreground sm:text-lg md:text-xl">
                {form.name}
              </h1>
            </div>
            {form.topic && (
              <p className="mt-0.5 text-xs text-primary-foreground/60">{form.topic}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary-foreground/15 px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                {form.subjectName}
              </span>
              <span className="rounded-full bg-primary-foreground/15 px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                {form.gradeName}
              </span>
              <div className="flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-2.5 py-0.5">
                <span className="text-xs font-semibold text-primary-foreground">{form.difficulty}</span>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${DIFFICULTY_COLOR[form.difficulty] ?? "bg-gray-400"}`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Section title */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cta" />
            <span className="text-sm font-semibold text-foreground">
              {challengeId ? "Preguntas del reto" : "Preguntas generadas por IA"}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {questions.length} {questions.length === 1 ? "Pregunta" : "Preguntas"}
          </span>
        </div>

        {/* Question cards */}
        <div className="space-y-4 px-4 pb-4 sm:px-6">
          {pageQuestions.map((q, localIdx) => {
            const globalIdx = pageStart + localIdx;
            const isEditing = editingIdx === globalIdx;

            return (
              <div
                key={globalIdx}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
              >
                {/* Question header */}
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-primary">
                    Pregunta {globalIdx + 1}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingIdx(isEditing ? null : globalIdx)}
                      className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title="Editar pregunta"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteQuestion(globalIdx)}
                      disabled={questions.length <= 1}
                      className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                      title="Eliminar pregunta"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Question text */}
                {isEditing ? (
                  <Textarea
                    value={q.pregunta}
                    onChange={(e) => updateQuestion(globalIdx, { pregunta: e.target.value })}
                    className="mb-3 min-h-[60px] resize-none rounded-xl border-border bg-muted/40 text-sm shadow-inner focus:ring-2 focus:ring-cta"
                  />
                ) : (
                  <p className="mb-3 text-sm font-medium leading-snug text-foreground sm:text-base">
                    {q.pregunta}
                  </p>
                )}

                {/* Options — 2-column grid */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {q.opciones.map((opt, optIdx) => {
                    const isCorrect = q.correctAnswerIndex === optIdx;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => updateQuestion(globalIdx, { correctAnswerIndex: optIdx })}
                        className={`flex items-center gap-2 rounded-full px-3 py-2 text-left text-sm transition-all ${
                          isCorrect
                            ? "bg-primary font-semibold text-primary-foreground shadow-md"
                            : "bg-muted/60 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            isCorrect
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-background/60 text-foreground"
                          }`}
                        >
                          {isCorrect ? <Check className="h-3.5 w-3.5" /> : OPTION_LABELS[optIdx]}
                        </span>
                        {isEditing ? (
                          <Input
                            value={opt}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateOption(globalIdx, optIdx, e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className={`h-7 border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 ${
                              isCorrect ? "text-primary-foreground placeholder:text-primary-foreground/50" : ""
                            }`}
                          />
                        ) : (
                          <span className="leading-tight">{opt}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-4 pb-4 sm:px-6">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  page === i + 1
                    ? "bg-cta text-cta-foreground shadow-md scale-110"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Regenerate section */}
        <div className="mx-4 mb-6 rounded-2xl bg-primary px-4 py-5 text-center sm:mx-6 sm:px-6">
          <p className="text-sm font-bold text-primary-foreground">
            ¿Estás conforme con las preguntas?
          </p>
          <p className="mt-0.5 text-xs text-primary-foreground/60">
            Puedes regenerarlas si no te gustan o modificarlas después.
          </p>
          <Button
            variant="secondary"
            onClick={onRegenerate}
            className="mt-3 gap-2 rounded-full bg-cta px-5 text-xs font-bold text-cta-foreground hover:bg-cta/90"
          >
            <RefreshCw className="h-4 w-4" />
            Regenerar preguntas con IA
          </Button>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="shrink-0 border-t border-border bg-card px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <Share2 className="h-3.5 w-3.5 shrink-0" />
            <span>¿Con quién quieres compartir este reto?<br />Selecciona profesores y grupos</span>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              variant="secondary"
              onClick={onDiscard}
              disabled={saving}
              className="flex-1 rounded-full text-xs font-semibold sm:flex-none sm:min-w-[80px]"
            >
              {challengeId ? "Cancelar" : "Borrar"}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-full border-2 border-cta bg-cta text-xs font-bold text-cta-foreground shadow-md hover:bg-cta/90 sm:flex-none sm:min-w-[120px]"
            >
              {saving
                ? "Guardando..."
                : challengeId
                ? "Guardar cambios"
                : "Guardar Reto"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
