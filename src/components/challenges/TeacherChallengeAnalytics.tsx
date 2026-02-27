import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTopBar } from "@/contexts/TopBarContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

const OPTION_LABELS = ["A", "B", "C", "D"];

const DIFFICULTY_COLOR: Record<string, string> = {
  Fácil: "bg-green-500",
  Medio: "bg-yellow-400",
  Difícil: "bg-orange-500",
  Experto: "bg-red-500",
};

interface Props {
  challengeId: number;
  onBack: () => void;
  onVerified: () => void;
}

interface StudentAnswer {
  studentName: string;
  selectedAnswer: number;
  isCorrect: boolean;
}

interface QuestionStats {
  questionText: string;
  options: string[];
  correctAnswer: number;
  explanation: string | null;
  correctCount: number;
  incorrectCount: number;
  students: StudentAnswer[];
}

export function TeacherChallengeAnalytics({ challengeId, onBack, onVerified }: Props) {
  const { user } = useAuth();
  const { setBackAction } = useTopBar();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    setBackAction(onBack);
    return () => setBackAction(undefined);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 1. Challenge data
  const { data: challenge } = useQuery({
    queryKey: ["analytics-challenge", challengeId],
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

  // 2. Questions
  const { data: questions = [] } = useQuery({
    queryKey: ["analytics-questions", challengeId],
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

  // 3. All completed results with student profiles
  const { data: results = [] } = useQuery({
    queryKey: ["analytics-results", challengeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenge_results")
        .select("id, user_id, score, correctAnswers, totalQuestions, answersLists, isReviewed, profiles!challenge_results_user_id_fkey(name, lastname)")
        .eq("challenge_id", challengeId)
        .eq("isCompleted", true);
      if (error) throw error;
      return data ?? [];
    },
  });

  // 4. Count target students (from share_content + students_enrollments)
  const { data: targetStudentCount = 0 } = useQuery({
    queryKey: ["analytics-target-count", challengeId],
    queryFn: async () => {
      // Get share info
      const { data: shares } = await supabase
        .from("share_content")
        .select("classroomLetter, shareContentType")
        .eq("challenge_id", challengeId)
        .in("shareContentType", [4, 5]);
      if (!shares?.length || !challenge) return 0;

      const gradeId = challenge.grade_id;
      const letters = shares
        .filter((s) => s.shareContentType === 5)
        .map((s) => s.classroomLetter)
        .filter(Boolean);
      const isPublic = shares.some((s) => s.shareContentType === 4);

      let query = supabase
        .from("students_enrollments")
        .select("user_id")
        .eq("grade_id", gradeId);

      if (!isPublic && letters.length > 0) {
        query = query.in("classroomLetter", letters);
      }

      const { data: enrollments } = await query;
      const uniqueStudents = new Set((enrollments ?? []).map((e) => e.user_id));
      return uniqueStudents.size;
    },
    enabled: !!challenge,
  });

  // Compute per-question stats
  const questionStats: QuestionStats[] = useMemo(() => {
    if (questions.length === 0 || results.length === 0) return [];

    return questions.map((q, qIdx) => {
      const students: StudentAnswer[] = [];
      let correctCount = 0;
      let incorrectCount = 0;

      for (const r of results) {
        const answers = (r.answersLists ?? "").split(",").map(Number);
        const selected = answers[qIdx] ?? -1;
        const isCorrect = selected === q.correctAnswer;
        if (isCorrect) correctCount++;
        else incorrectCount++;

        const profile = (r as any).profiles;
        const name = [profile?.name, profile?.lastname].filter(Boolean).join(" ") || "Alumno";
        students.push({ studentName: name, selectedAnswer: selected, isCorrect });
      }

      return {
        questionText: q.question,
        options: [q.answer1, q.answer2, q.answer3, q.answer4],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        correctCount,
        incorrectCount,
        students,
      };
    });
  }, [questions, results]);

  const unreviewedIds = results.filter((r) => !r.isReviewed).map((r) => r.id);

  const handleVerify = async () => {
    if (unreviewedIds.length === 0) return;
    setVerifying(true);
    try {
      const { error } = await supabase
        .from("challenge_results")
        .update({ isReviewed: true } as any)
        .in("id", unreviewedIds);
      if (error) throw error;
      toast.success("Resultados verificados");
      onVerified();
    } catch (err: any) {
      toast.error(err.message || "Error al verificar");
    } finally {
      setVerifying(false);
    }
  };

  const completedCount = results.length;
  const progressPct = targetStudentCount > 0
    ? Math.round((completedCount / targetStudentCount) * 100)
    : 0;

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full overflow-hidden rounded-2xl font-museo">

      {/* ── HEADER ── */}
      <div className="shrink-0 bg-primary px-4 py-4 sm:px-6 sm:py-5">
        <div className="min-w-0">
          <span className="text-sm font-medium text-primary-foreground/50">
            Analítica del reto:
          </span>
          <h1 className="truncate font-montserrat text-lg font-extrabold text-primary-foreground sm:text-xl md:text-2xl">
            {challenge?.name ?? "Cargando..."}
          </h1>
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
            <span className="rounded-full bg-primary-foreground/15 px-3.5 py-1.5 text-sm font-semibold text-primary-foreground">
              #{challengeId}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm text-primary-foreground/70">
              <span>{completedCount}/{targetStudentCount} alumnos han completado el reto</span>
              <span>{progressPct}%</span>
            </div>
            <div className="mt-1 h-2.5 w-full rounded-full bg-primary-foreground/20">
              <div
                className="h-full rounded-full bg-cta transition-all duration-500"
                style={{ width: `${Math.min(progressPct, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div className="flex-1 overflow-y-auto scrollbar-blue">
        <div className="space-y-3 px-4 py-4 sm:px-6">
          {questionStats.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            questionStats.map((qs, idx) => {
              const total = qs.correctCount + qs.incorrectCount;
              const correctPct = total > 0 ? Math.round((qs.correctCount / total) * 100) : 0;
              const isExpanded = expandedIdx === idx;

              return (
                <div key={idx} className="rounded-2xl border border-border bg-card shadow-sm">
                  {/* Collapsed view — always visible */}
                  <button
                    onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                    className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/30 sm:p-5"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug text-foreground sm:text-base">
                        {qs.questionText}
                      </p>

                      {/* Stats bar */}
                      <div className="mt-2 flex h-3 w-full overflow-hidden rounded-full">
                        <div
                          className="bg-green-500 transition-all duration-500"
                          style={{ width: `${correctPct}%` }}
                        />
                        <div
                          className="bg-red-400 transition-all duration-500"
                          style={{ width: `${100 - correctPct}%` }}
                        />
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Check className="h-3 w-3 text-green-500" />
                          {qs.correctCount} correctas
                        </span>
                        <span className="flex items-center gap-1">
                          <X className="h-3 w-3 text-red-400" />
                          {qs.incorrectCount} incorrectas
                        </span>
                      </div>
                    </div>
                    <div className="mt-1 shrink-0 text-muted-foreground">
                      {isExpanded
                        ? <ChevronUp className="h-5 w-5" />
                        : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </button>

                  {/* Expanded view — per-student answers */}
                  {isExpanded && (
                    <div className="border-t border-border px-4 pb-4 pt-3 sm:px-5">
                      {/* Show correct answer + options */}
                      <div className="mb-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                        {qs.options.map((opt, optIdx) => {
                          const isCorrectOpt = qs.correctAnswer === optIdx;
                          return (
                            <div
                              key={optIdx}
                              className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm ${
                                isCorrectOpt
                                  ? "bg-green-500 font-semibold text-white"
                                  : "bg-muted/60 text-muted-foreground"
                              }`}
                            >
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                                {isCorrectOpt ? <Check className="h-3.5 w-3.5" /> : OPTION_LABELS[optIdx]}
                              </span>
                              <span className="leading-tight">{opt}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {qs.explanation && (
                        <div className="mb-3 rounded-xl bg-primary/10 px-3 py-2">
                          <p className="text-sm leading-relaxed text-foreground/80">
                            {qs.explanation}
                          </p>
                        </div>
                      )}

                      {/* Student list */}
                      <div className="space-y-1">
                        {qs.students.map((s, sIdx) => (
                          <div
                            key={sIdx}
                            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${
                              s.isCorrect ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20"
                            }`}
                          >
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                              s.isCorrect ? "bg-green-500 text-white" : "bg-red-400 text-white"
                            }`}>
                              {s.isCorrect
                                ? <Check className="h-3 w-3" />
                                : <X className="h-3 w-3" />}
                            </span>
                            <span className="flex-1 font-medium text-foreground">
                              {s.studentName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {s.selectedAnswer >= 0
                                ? `Opción ${OPTION_LABELS[s.selectedAnswer]}`
                                : "Sin responder"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="shrink-0 border-t border-border bg-card px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            {unreviewedIds.length > 0
              ? `${unreviewedIds.length} resultado${unreviewedIds.length !== 1 ? "s" : ""} sin verificar`
              : "Todos los resultados verificados"}
          </span>
          <Button
            onClick={handleVerify}
            disabled={verifying || unreviewedIds.length === 0}
            className="rounded-full border-2 border-cta bg-cta text-sm font-bold text-cta-foreground shadow-md hover:bg-cta/90 sm:min-w-[160px] sm:text-base"
          >
            {verifying ? "Verificando..." : "Verificar todo"}
          </Button>
        </div>
      </div>
    </div>
  );
}
