import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTopBar } from "@/contexts/TopBarContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Sparkles, Share2, RefreshCw, Check, ChevronLeft, ChevronRight, Pencil, Trash2, Loader2, Plus } from "lucide-react";
import type { ReviewQuestion } from "./QuestionReviewScreen";
import type { ChallengeFormSnapshot } from "./CreateChallengeDialog";
import { ChallengeVisibilityDialog } from "./ChallengeVisibilityDialog";

const DIFFICULTY_COLOR: Record<string, string> = {
  Fácil: "bg-green-500",
  Medio: "bg-yellow-400",
  Difícil: "bg-orange-500",
  Experto: "bg-red-500",
};

const OPTION_LABELS = ["A", "B", "C", "D"];

const QUESTIONS_PER_PAGE = 10;

function getEtapa(gradeName: string): string {
  if (gradeName.includes("Primaria")) return "Primaria";
  if (gradeName.includes("ESO")) return "ESO";
  if (gradeName.includes("Bachillerato")) return "Bachillerato";
  return gradeName;
}

interface Props {
  questions: ReviewQuestion[];
  form: ChallengeFormSnapshot;
  challengeId?: number; // if provided → edit mode (UPDATE existing)
  onSaved: () => void;
  onDiscard: () => void;
  onRegenerate: () => void;
}

export function ChallengeReviewPage({ questions: initial, form, challengeId, onSaved, onDiscard }: Props) {
  const { user, profile } = useAuth();
  const { setBackAction } = useTopBar();
  const [questions, setQuestions] = useState<ReviewQuestion[]>(initial);

  useEffect(() => {
    setBackAction(onDiscard);
    return () => setBackAction(undefined);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [regenerateConfirmVisible, setRegenerateConfirmVisible] = useState(false);
  const [regeneratingAll, setRegeneratingAll] = useState(false);
  const [regeneratingIdx, setRegeneratingIdx] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [showVisibilityDialog, setShowVisibilityDialog] = useState(false);

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
    if (editingIdx === globalIdx) setEditingIdx(null);
  };

  const addBlankQuestion = () => {
    const newIdx = questions.length;
    setQuestions((prev) => [
      ...prev,
      { pregunta: "", opciones: ["", "", "", ""], correctAnswerIndex: 0, explanation: null },
    ]);
    const newPage = Math.ceil((newIdx + 1) / QUESTIONS_PER_PAGE);
    setPage(newPage);
    setEditingIdx(newIdx);
  };

  const callN8n = async (count: number): Promise<ReviewQuestion[]> => {
    const webhookBase = import.meta.env.VITE_N8N_CHALLENGE_WEBHOOK;
    const response = await fetch(`${webhookBase}/generar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accion: "generar",
        user_id: user?.id,
        name: form.name,
        topic: form.topic,
        etapa: getEtapa(form.gradeName),
        grade: form.gradeName,
        subject: form.subjectName,
        subject_id: parseInt(form.subjectId),
        language: form.language,
        questionCount: count,
        difficulty: form.difficulty,
      }),
    });
    const rawText = await response.text();
    if (!response.ok || !rawText.trim()) throw new Error("Error al llamar a n8n");
    const result = JSON.parse(rawText);
    return (result?.preguntas ?? []).map((p: any) => ({
      pregunta: p.pregunta ?? "",
      opciones: [p.opciones?.[0] ?? "", p.opciones?.[1] ?? "", p.opciones?.[2] ?? "", p.opciones?.[3] ?? ""],
      correctAnswerIndex: p.correctAnswerIndex ?? 0,
      explanation: p.explanation ?? null,
    }));
  };

  const regenerateQuestion = async (globalIdx: number) => {
    setRegeneratingIdx(globalIdx);
    try {
      const generated = await callN8n(1);
      if (generated.length === 0) { toast.error("No se generó la pregunta"); return; }
      updateQuestion(globalIdx, generated[0]);
      toast.success("Pregunta regenerada con IA");
    } catch (err: any) {
      toast.error(err.message || "Error al regenerar la pregunta");
    } finally {
      setRegeneratingIdx(null);
    }
  };

  const openRegenerateConfirm = () => {
    setShowRegenerateConfirm(true);
    setTimeout(() => setRegenerateConfirmVisible(true), 30);
  };

  const closeRegenerateConfirm = () => {
    setRegenerateConfirmVisible(false);
    setTimeout(() => setShowRegenerateConfirm(false), 300);
  };

  const regenerateAll = async () => {
    setRegenerateConfirmVisible(false);
    setShowRegenerateConfirm(false);
    setRegeneratingAll(true);
    try {
      const generated = await callN8n(questions.length);
      if (generated.length === 0) { toast.error("No se generaron preguntas"); return; }
      setQuestions(generated);
      setPage(1);
      toast.success("¡Todas las preguntas regeneradas con IA!");
    } catch (err: any) {
      toast.error(err.message || "Error al regenerar las preguntas");
    } finally {
      setRegeneratingAll(false);
    }
  };

  const openDeleteConfirm = () => {
    setShowDeleteConfirm(true);
    setTimeout(() => setDeleteConfirmVisible(true), 30);
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirmVisible(false);
    setTimeout(() => setShowDeleteConfirm(false), 300);
  };

  const handleDelete = async () => {
    if (!challengeId) return;
    closeDeleteConfirm();
    try {
      const { error } = await supabase
        .from("challenges")
        .update({ isDeleted: true })
        .eq("id", challengeId);
      if (error) throw error;
      toast.success("Reto borrado");
      onSaved();
    } catch (err: any) {
      toast.error(err.message || "Error al borrar el reto");
    }
  };

  const handleSave = () => {
    if (!user) return;
    // Teachers see the visibility dialog before saving
    if (profile?.role_id === 2) {
      setShowVisibilityDialog(true);
      return;
    }
    // Non-teachers save directly
    performSave({ accessPermissions: form.shareWithStudents ? 1 : 0, selectedClassrooms: [] });
  };

  const handleVisibilityConfirm = (result: { accessPermissions: number; selectedClassrooms: string[] }) => {
    setShowVisibilityDialog(false);
    performSave(result);
  };

  const performSave = async (visibility: { accessPermissions: number; selectedClassrooms: string[] }) => {
    if (!user) return;
    setSaving(true);
    try {
      let savedChallengeId = challengeId;

      if (challengeId) {
        // ── EDIT MODE: UPDATE challenge + replace questions ──
        const { error: updateError } = await supabase
          .from("challenges")
          .update({
            name: form.name,
            topic: form.topic || null,
            questionCount: questions.length,
            difficulty: form.difficulty,
            accessPermissions: visibility.accessPermissions,
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
            accessPermissions: visibility.accessPermissions,
            user_id: user.id,
          })
          .select()
          .single();
        if (challengeError) throw challengeError;

        savedChallengeId = challenge.id;

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

      // ── Write share_content for teachers ──
      if (profile?.role_id === 2 && savedChallengeId) {
        console.log("[performSave] Writing share_content for challenge", savedChallengeId, "visibility:", visibility);

        // Remove previous share_content entries for this challenge
        const { error: delError } = await supabase
          .from("share_content")
          .delete()
          .eq("challenge_id", savedChallengeId)
          .eq("user_id", user.id);
        if (delError) console.warn("[performSave] delete old share_content error:", delError);

        if (visibility.selectedClassrooms.length > 0) {
          // Private: one row per selected classroom
          const rows = visibility.selectedClassrooms.map((letter) => ({
            challenge_id: savedChallengeId!,
            classroomLetter: letter,
            shareContentType: 5,
            user_id: user.id,
          }));
          console.log("[performSave] Inserting private share_content rows:", rows);
          const { error: shareError } = await supabase.from("share_content").insert(rows);
          if (shareError) { console.error("[performSave] share_content insert error:", shareError); throw shareError; }
          console.log("[performSave] share_content inserted OK");
        } else {
          // Public: one row for the whole school
          const row = {
            challenge_id: savedChallengeId,
            classroomLetter: null,
            shareContentType: 4,
            user_id: user.id,
          };
          console.log("[performSave] Inserting public share_content row:", row);
          const { error: shareError } = await supabase.from("share_content").insert(row);
          if (shareError) { console.error("[performSave] share_content insert error:", shareError); throw shareError; }
          console.log("[performSave] share_content inserted OK");
        }
      } else {
        console.log("[performSave] Skipping share_content: role_id=", profile?.role_id, "challengeId=", savedChallengeId);
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
    <div className="relative flex flex-col flex-1 min-h-0 w-full overflow-hidden rounded-2xl font-museo">

      {/* ── HEADER ── */}
      <div className="shrink-0 bg-primary px-4 py-4 sm:px-6 sm:py-5">
        <div className="min-w-0">
            <span className="text-sm font-medium text-primary-foreground/50">
              {challengeId ? "Editando reto:" : "Reto:"}
            </span>
            <h1 className="truncate font-montserrat text-lg font-extrabold text-primary-foreground sm:text-xl md:text-2xl">
              {form.name}
            </h1>
            {form.topic && (
              <p className="mt-0.5 text-sm text-primary-foreground/60">{form.topic}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary-foreground/15 px-3.5 py-1.5 text-sm font-semibold text-primary-foreground">
                {form.subjectName}
              </span>
              <span className="rounded-full bg-primary-foreground/15 px-3.5 py-1.5 text-sm font-semibold text-primary-foreground">
                {form.gradeName}
              </span>
              <div className="flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3.5 py-1.5">
                <span className="text-sm font-semibold text-primary-foreground">{form.difficulty}</span>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${DIFFICULTY_COLOR[form.difficulty] ?? "bg-gray-400"}`}
                />
              </div>
            </div>
        </div>
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div className="flex-1 overflow-y-auto scrollbar-blue">

        {/* Section title */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cta" />
            <span className="text-base font-semibold text-foreground">
              {challengeId ? "Preguntas del reto" : "Preguntas generadas por IA"}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
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
                  <span className="text-sm font-semibold text-primary">
                    Pregunta {globalIdx + 1}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => regenerateQuestion(globalIdx)}
                      disabled={regeneratingIdx === globalIdx}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-cta/10 hover:text-cta disabled:opacity-40"
                      title="Regenerar con IA"
                    >
                      {regeneratingIdx === globalIdx
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Sparkles className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => setEditingIdx(isEditing ? null : globalIdx)}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title="Editar pregunta"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteQuestion(globalIdx)}
                      disabled={questions.length <= 1}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                      title="Eliminar pregunta"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Question text */}
                {isEditing ? (
                  <Textarea
                    value={q.pregunta}
                    onChange={(e) => updateQuestion(globalIdx, { pregunta: e.target.value })}
                    className="mb-3 min-h-[60px] resize-none rounded-xl border-border bg-muted/40 text-base shadow-inner focus:ring-2 focus:ring-cta"
                  />
                ) : (
                  <p className="mb-3 text-base font-medium leading-snug text-foreground sm:text-lg">
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
                        className={`flex items-center gap-2 rounded-full px-3 py-2.5 text-left text-base transition-all ${
                          isCorrect
                            ? "bg-primary font-semibold text-primary-foreground shadow-md"
                            : "bg-muted/60 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            isCorrect
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-background/60 text-foreground"
                          }`}
                        >
                          {isCorrect ? <Check className="h-4 w-4" /> : OPTION_LABELS[optIdx]}
                        </span>
                        {isEditing ? (
                          <Input
                            value={opt}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateOption(globalIdx, optIdx, e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className={`h-7 border-none bg-transparent p-0 text-base shadow-none focus-visible:ring-0 ${
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

        {/* ── ADD NEW QUESTION ── */}
        <div className="mx-4 mb-4 sm:mx-6">
          <div className="mb-3 flex items-center gap-2">
            <Plus className="h-5 w-5 text-cta" />
            <span className="text-base font-semibold text-cta">Añade nuevas preguntas</span>
          </div>
          <button
            onClick={addBlankQuestion}
            className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/40 py-8 transition-all hover:border-cta hover:bg-cta/5 active:scale-[0.99]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-muted-foreground/40 text-muted-foreground transition-colors hover:border-cta hover:text-cta">
              <Plus className="h-5 w-5" />
            </span>
            <span className="text-sm text-muted-foreground">Escribe tus propias preguntas</span>
          </button>
        </div>

        {/* Regenerate section */}
        <div className="mx-4 mb-6 rounded-2xl bg-primary px-4 py-5 text-center sm:mx-6 sm:px-6">
          <p className="text-base font-bold text-primary-foreground">
            ¿Estás conforme con las preguntas?
          </p>
          <p className="mt-0.5 text-sm text-primary-foreground/60">
            Puedes regenerarlas si no te gustan o modificarlas después.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Button
              variant="secondary"
              onClick={openRegenerateConfirm}
              className="gap-2 rounded-full bg-cta px-5 text-sm font-bold text-cta-foreground hover:bg-cta/90"
            >
              <RefreshCw className="h-4 w-4" />
              Regenerar preguntas con IA
            </Button>
            {challengeId && (
              <Button
                variant="secondary"
                onClick={openDeleteConfirm}
                className="gap-2 rounded-full bg-destructive/10 px-5 text-sm font-bold text-destructive hover:bg-destructive/20"
              >
                <Trash2 className="h-4 w-4" />
                Borrar reto
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="shrink-0 border-t border-border bg-card px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
            <Share2 className="h-4 w-4 shrink-0" />
            <span>¿Con quién quieres compartir este reto?<br />Selecciona profesores y grupos</span>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              variant="secondary"
              onClick={onDiscard}
              disabled={saving}
              className="flex-1 rounded-full text-sm font-semibold sm:flex-none sm:min-w-[90px]"
            >
              {challengeId ? "Cancelar" : "Borrar"}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-full border-2 border-cta bg-cta text-sm font-bold text-cta-foreground shadow-md hover:bg-cta/90 sm:flex-none sm:min-w-[140px]"
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

      {/* ── CONFIRMATION DIALOG — Regenerate All ── */}
      {showRegenerateConfirm && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className={`w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              regenerateConfirmVisible
                ? "translate-y-0 scale-100 opacity-100"
                : "translate-y-4 scale-95 opacity-0"
            }`}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cta">
              <RefreshCw className="h-6 w-6 text-cta-foreground" />
            </div>
            <h3 className="text-center text-lg font-bold text-foreground">
              ¿Regenerar todas las preguntas?
            </h3>
            <p className="mt-2 text-center text-base text-muted-foreground">
              Se generarán nuevas preguntas <span className="font-semibold text-foreground">y respuestas</span> con IA usando los mismos parámetros del reto. Las preguntas actuales se perderán.
            </p>
            <div className="mt-5 flex gap-3">
              <Button
                variant="secondary"
                onClick={closeRegenerateConfirm}
                className="flex-1 rounded-full text-sm font-semibold"
              >
                Cancelar
              </Button>
              <Button
                onClick={regenerateAll}
                className="flex-1 rounded-full bg-cta text-sm font-bold text-cta-foreground hover:bg-cta/90"
              >
                Sí, regenerar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── LOADING OVERLAY — Regenerating All ── */}
      {regeneratingAll && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-base font-semibold text-foreground">Regenerando preguntas con IA...</p>
        </div>
      )}

      {/* ── VISIBILITY DIALOG — Teacher only ── */}
      <ChallengeVisibilityDialog
        open={showVisibilityDialog}
        gradeId={parseInt(form.gradeId)}
        gradeName={form.gradeName}
        schoolId={profile?.schools_id ?? 0}
        onConfirm={handleVisibilityConfirm}
        onCancel={() => setShowVisibilityDialog(false)}
      />

      {/* ── CONFIRMATION DIALOG — Delete Challenge ── */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className={`w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              deleteConfirmVisible
                ? "translate-y-0 scale-100 opacity-100"
                : "translate-y-4 scale-95 opacity-0"
            }`}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-center text-lg font-bold text-foreground">Borrar reto</h3>
            <p className="mt-2 text-center text-base text-muted-foreground">
              Vas a borrar el reto{" "}
              <span className="font-semibold text-foreground">"{form.name}"</span>.
              Esta acción no se puede deshacer.
            </p>
            <div className="mt-5 flex gap-3">
              <Button
                variant="secondary"
                onClick={closeDeleteConfirm}
                className="flex-1 rounded-full text-sm font-semibold"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDelete}
                className="flex-1 rounded-full bg-destructive text-sm font-bold text-white hover:bg-destructive/90"
              >
                Borrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
