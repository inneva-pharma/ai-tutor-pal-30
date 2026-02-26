import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const OPTION_LABELS = ["A", "B", "C", "D"];
const QUESTIONS_PER_PAGE = 10;

interface Props {
  challengeId: number;
  onBack: () => void;
}

type ResultDetail = {
  question: Tables<"challenge_questions">;
  selected: number;
  isCorrect: boolean;
};

type ResultsState = {
  correctAnswers: number;
  totalQuestions: number;
  score: number;
  details: ResultDetail[];
};

export function ChallengePlayPage({ challengeId, onBack }: Props) {
  const { user } = useAuth();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [page, setPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<ResultsState | null>(null);

  const { data: challenge } = useQuery({
    queryKey: ["challenge", challengeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("id", challengeId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["challenge-questions-play", challengeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenge_questions")
        .select("*")
        .eq("challenge_id", challengeId)
        .order("id");
      if (error) throw error;
      return data ?? [];
    },
  });

  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const pageStart = (page - 1) * QUESTIONS_PER_PAGE;
  const pageQuestions = questions.slice(pageStart, pageStart + QUESTIONS_PER_PAGE);
  const answeredCount = Object.keys(selectedAnswers).length;

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const correctAnswers = questions.filter(
        (q, i) => selectedAnswers[i] === q.correctAnswer
      ).length;
      const totalQuestions = questions.length;
      const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      const answersLists = questions.map((_, i) => selectedAnswers[i] ?? -1).join(",");

      const { data: result, error: resultError } = await supabase
        .from("challenge_results")
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
          totalQuestions,
          correctAnswers,
          score,
          answersLists,
          isCompleted: true,
        })
        .select()
        .single();
      if (resultError) throw resultError;

      const details = questions.map((q, i) => ({
        challengeResult_id: result.id,
        question_id: q.id,
        selectedAnswer: selectedAnswers[i] ?? -1,
        isCorrect: selectedAnswers[i] === q.correctAnswer,
      }));

      const { error: detailsError } = await supabase
        .from("challenge_result_details")
        .insert(details);
      if (detailsError) throw detailsError;

      setResults({
        correctAnswers,
        totalQuestions,
        score,
        details: questions.map((q, i) => ({
          question: q,
          selected: selectedAnswers[i] ?? -1,
          isCorrect: selectedAnswers[i] === q.correctAnswer,
        })),
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al enviar el reto");
    } finally {
      setSubmitting(false);
    }
  };

  // ── RESULTS VIEW ──
  if (results) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col bg-background">

        {/* Header */}
        <div className="shrink-0 bg-primary px-4 py-4 sm:px-6 sm:py-5">
          <h1 className="truncate text-base font-extrabold text-primary-foreground sm:text-lg">
            Resultados: {challenge?.name}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-bold text-primary-foreground">
              {results.correctAnswers}/{results.totalQuestions} correctas
            </span>
            <span className="rounded-full bg-cta px-3 py-1 text-xs font-bold text-cta-foreground">
              {results.score}%
            </span>
          </div>
        </div>

        {/* Scrollable results */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4 px-4 py-4 sm:px-6">
            {results.details.map((d, i) => (
              <div
                key={i}
                className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${
                  d.isCorrect
                    ? "border-green-300 bg-green-50 dark:bg-green-950/20"
                    : "border-red-300 bg-red-50 dark:bg-red-950/20"
                }`}
              >
                {/* Question */}
                <div className="mb-2 flex items-start gap-2">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      d.isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"
                    }`}
                  >
                    {d.isCorrect
                      ? <Check className="h-3 w-3" />
                      : <X className="h-3 w-3" />}
                  </span>
                  <p className="text-sm font-medium leading-snug text-foreground sm:text-base">
                    {d.question.question}
                  </p>
                </div>

                {/* Explanation — justo debajo de la pregunta */}
                {d.question.explanation && (
                  <div className="mb-3 ml-7 rounded-xl bg-primary/10 px-3 py-2">
                    <p className="text-xs leading-relaxed text-foreground/80">
                      {d.question.explanation}
                    </p>
                  </div>
                )}

                {/* Options */}
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {[d.question.answer1, d.question.answer2, d.question.answer3, d.question.answer4].map(
                    (opt, optIdx) => {
                      const isCorrectAnswer = d.question.correctAnswer === optIdx;
                      const isSelectedWrong = d.selected === optIdx && !isCorrectAnswer;
                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs ${
                            isCorrectAnswer
                              ? "bg-green-500 font-semibold text-white"
                              : isSelectedWrong
                              ? "bg-red-400 font-semibold text-white"
                              : "bg-muted/60 text-muted-foreground"
                          }`}
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
                            {OPTION_LABELS[optIdx]}
                          </span>
                          <span className="leading-tight">{opt}</span>
                        </div>
                      );
                    }
                  )}
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border bg-card px-4 py-3 sm:px-6">
          <Button
            onClick={onBack}
            className="w-full rounded-full font-semibold sm:w-auto sm:min-w-[160px]"
          >
            Volver a retos
          </Button>
        </div>
      </div>
    );
  }

  // ── PLAY VIEW ──
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">

      {/* Header */}
      <div className="shrink-0 bg-primary px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="truncate text-base font-extrabold text-primary-foreground sm:text-lg">
              {isLoading ? "Cargando..." : challenge?.name ?? ""}
            </h1>
            <p className="mt-0.5 text-xs text-primary-foreground/60">
              {answeredCount} de {questions.length} respondidas
            </p>
          </div>
          <button
            onClick={onBack}
            className="shrink-0 rounded-full bg-primary-foreground/10 px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-foreground/20"
          >
            Salir
          </button>
        </div>
      </div>

      {/* Scrollable questions */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 px-4 py-4 sm:px-6">
          {pageQuestions.map((q, localIdx) => {
            const globalIdx = pageStart + localIdx;
            const selected = selectedAnswers[globalIdx] ?? null;
            return (
              <div
                key={q.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
              >
                <span className="text-xs font-semibold text-primary">
                  Pregunta {globalIdx + 1}
                </span>
                <p className="mb-3 mt-1.5 text-sm font-medium leading-snug text-foreground sm:text-base">
                  {q.question}
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[q.answer1, q.answer2, q.answer3, q.answer4].map((opt, optIdx) => (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() =>
                        setSelectedAnswers((prev) => ({ ...prev, [globalIdx]: optIdx }))
                      }
                      className={`flex items-center gap-2 rounded-full px-3 py-2 text-left text-sm transition-all ${
                        selected === optIdx
                          ? "bg-primary font-semibold text-primary-foreground shadow-md"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          selected === optIdx
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-background/60 text-foreground"
                        }`}
                      >
                        {OPTION_LABELS[optIdx]}
                      </span>
                      <span className="leading-tight">{opt}</span>
                    </button>
                  ))}
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
      </div>

      {/* Footer — Enviar */}
      <div className="shrink-0 border-t border-border bg-card px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {answeredCount < questions.length
              ? `Faltan ${questions.length - answeredCount} preguntas sin responder`
              : "¡Todas respondidas!"}
          </span>
          <Button
            onClick={handleSubmit}
            disabled={submitting || questions.length === 0}
            className="rounded-full border-2 border-cta bg-cta text-xs font-bold text-cta-foreground shadow-md hover:bg-cta/90 sm:min-w-[120px] sm:text-sm"
          >
            {submitting ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
