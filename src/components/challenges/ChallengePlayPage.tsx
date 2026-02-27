import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTopBar } from "@/contexts/TopBarContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const OPTION_LABELS = ["A", "B", "C", "D"];
const QUESTIONS_PER_PAGE = 10;

const DIFFICULTY_COLOR: Record<string, string> = {
  Fácil: "bg-green-500",
  Medio: "bg-yellow-400",
  Difícil: "bg-orange-500",
  Experto: "bg-red-500",
};

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
  const queryClient = useQueryClient();
  const { setBackAction } = useTopBar();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  useEffect(() => {
    setBackAction(onBack);
    return () => setBackAction(undefined);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [page, setPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<ResultsState | null>(null);

  const { data: challenge } = useQuery({
    queryKey: ["challenge", challengeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenges")
        .select("*, grades(name), subjects(name)")
        .eq("id", challengeId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const gradeName = (challenge as any)?.grades?.name ?? "";
  const subjectName = (challenge as any)?.subjects?.name ?? "";

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

      // Invalidate caches so completed challenge disappears from student's list
      queryClient.invalidateQueries({ queryKey: ["completed-challenge-ids"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-challenges"] });
      queryClient.invalidateQueries({ queryKey: ["shared-challenge-stats"] });
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
      <div className="flex flex-col flex-1 min-h-0 w-full overflow-hidden rounded-2xl font-museo">

        {/* Header */}
        <div className="shrink-0 bg-primary px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <span className="text-sm font-medium text-primary-foreground/50">
              Resultados:
            </span>
            <h1 className="truncate font-montserrat text-lg font-extrabold text-primary-foreground sm:text-xl md:text-2xl">
              {challenge?.name}
            </h1>
            {challenge?.topic && (
              <p className="mt-0.5 text-sm text-primary-foreground/60">{challenge.topic}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {subjectName && (
                <span className="rounded-full bg-primary-foreground/15 px-3.5 py-1.5 text-sm font-semibold text-primary-foreground">
                  {subjectName}
                </span>
              )}
              {gradeName && (
                <span className="rounded-full bg-primary-foreground/15 px-3.5 py-1.5 text-sm font-semibold text-primary-foreground">
                  {gradeName}
                </span>
              )}
              {challenge?.difficulty && (
                <div className="flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3.5 py-1.5">
                  <span className="text-sm font-semibold text-primary-foreground">{challenge.difficulty}</span>
                  <span className={`h-2.5 w-2.5 rounded-full ${DIFFICULTY_COLOR[challenge.difficulty] ?? "bg-gray-400"}`} />
                </div>
              )}
              <span className="rounded-full bg-cta px-3.5 py-1.5 text-sm font-bold text-cta-foreground">
                {results.correctAnswers}/{results.totalQuestions} · {results.score}%
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable results */}
        <div className="flex-1 overflow-y-auto scrollbar-blue">
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
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      d.isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"
                    }`}
                  >
                    {d.isCorrect
                      ? <Check className="h-3.5 w-3.5" />
                      : <X className="h-3.5 w-3.5" />}
                  </span>
                  <p className="text-base font-medium leading-snug text-foreground sm:text-lg">
                    {d.question.question}
                  </p>
                </div>

                {/* Explanation — justo debajo de la pregunta */}
                {d.question.explanation && (
                  <div className="mb-3 ml-8 rounded-xl bg-primary/10 px-3 py-2">
                    <p className="text-sm leading-relaxed text-foreground/80">
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
                          className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm ${
                            isCorrectAnswer
                              ? "bg-green-500 font-semibold text-white"
                              : isSelectedWrong
                              ? "bg-red-400 font-semibold text-white"
                              : "bg-muted/60 text-muted-foreground"
                          }`}
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
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
            className="w-full rounded-full text-sm font-semibold sm:w-auto sm:min-w-[160px] sm:text-base"
          >
            Volver a retos
          </Button>
        </div>
      </div>
    );
  }

  // ── PLAY VIEW ──
  return (
    <div className="flex flex-col flex-1 min-h-0 w-full overflow-hidden rounded-2xl font-museo">

      {/* Header */}
      <div className="shrink-0 bg-primary px-4 py-4 sm:px-6 sm:py-5">
        <div className="min-w-0">
          <span className="text-sm font-medium text-primary-foreground/50">
            Reto:
          </span>
          <h1 className="truncate font-montserrat text-lg font-extrabold text-primary-foreground sm:text-xl md:text-2xl">
            {isLoading ? "Cargando..." : challenge?.name ?? ""}
          </h1>
          {challenge?.topic && (
            <p className="mt-0.5 text-sm text-primary-foreground/60">{challenge.topic}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {subjectName && (
              <span className="rounded-full bg-primary-foreground/15 px-3.5 py-1.5 text-sm font-semibold text-primary-foreground">
                {subjectName}
              </span>
            )}
            {gradeName && (
              <span className="rounded-full bg-primary-foreground/15 px-3.5 py-1.5 text-sm font-semibold text-primary-foreground">
                {gradeName}
              </span>
            )}
            {challenge?.difficulty && (
              <div className="flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3.5 py-1.5">
                <span className="text-sm font-semibold text-primary-foreground">{challenge.difficulty}</span>
                <span className={`h-2.5 w-2.5 rounded-full ${DIFFICULTY_COLOR[challenge.difficulty] ?? "bg-gray-400"}`} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable questions */}
      <div className="flex-1 overflow-y-auto scrollbar-blue">
        <div className="space-y-4 px-4 py-4 sm:px-6">
          {pageQuestions.map((q, localIdx) => {
            const globalIdx = pageStart + localIdx;
            const selected = selectedAnswers[globalIdx] ?? null;
            return (
              <div
                key={q.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
              >
                <span className="text-sm font-semibold text-primary">
                  Pregunta {globalIdx + 1}
                </span>
                <p className="mb-3 mt-1.5 text-base font-medium leading-snug text-foreground sm:text-lg">
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
                      className={`flex items-center gap-2 rounded-full px-3 py-2.5 text-left text-base transition-all ${
                        selected === optIdx
                          ? "bg-primary font-semibold text-primary-foreground shadow-md"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
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
          <span className="text-sm text-muted-foreground">
            {answeredCount < questions.length
              ? `Faltan ${questions.length - answeredCount} preguntas sin responder`
              : "¡Todas respondidas!"}
          </span>
          <Button
            onClick={handleSubmit}
            disabled={submitting || questions.length === 0}
            className="rounded-full border-2 border-cta bg-cta text-sm font-bold text-cta-foreground shadow-md hover:bg-cta/90 sm:min-w-[130px] sm:text-base"
          >
            {submitting ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
