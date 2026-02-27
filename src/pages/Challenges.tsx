import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Shield } from "lucide-react";
import { toast } from "sonner";
import { CreateChallengeDialog, type ChallengeFormSnapshot } from "@/components/challenges/CreateChallengeDialog";
import { ChallengeCard } from "@/components/challenges/ChallengeCard";
import { ChallengeReviewPage } from "@/components/challenges/ChallengeReviewPage";
import { ChallengePlayPage } from "@/components/challenges/ChallengePlayPage";
import { TeacherChallengeAnalytics } from "@/components/challenges/TeacherChallengeAnalytics";
import type { ReviewQuestion } from "@/components/challenges/QuestionReviewScreen";

interface ReviewState {
  questions: ReviewQuestion[];
  form: ChallengeFormSnapshot;
  challengeId?: number; // set when editing an existing challenge
}

export default function Challenges() {
  const { user, profile } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [review, setReview] = useState<ReviewState | null>(null);
  const [playChallenge, setPlayChallenge] = useState<number | null>(null);
  const [reviewingChallengeId, setReviewingChallengeId] = useState<number | null>(null);
  const [defaultValues, setDefaultValues] = useState<Partial<ChallengeFormSnapshot> | undefined>(undefined);
  const [idInput, setIdInput] = useState("");
  const [searchingId, setSearchingId] = useState(false);

  const isStudent = profile?.role_id === 3;
  const isTeacher = profile?.role_id === 2;

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

  // Needed to resolve grade/subject names when opening edit mode
  const { data: grades = [] } = useQuery({
    queryKey: ["grades"],
    queryFn: async () => {
      const { data } = await supabase.from("grades").select("*").order("id");
      return data ?? [];
    },
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data } = await supabase.from("subjects").select("*").order("name");
      return data ?? [];
    },
  });

  // ── Teacher challenges visible to this student (enriched with teacher name + subject) ──
  const { data: teacherChallenges = [] } = useQuery({
    queryKey: ["teacher-challenges", user?.id, profile?.schools_id],
    queryFn: async () => {
      if (!user || !profile?.schools_id) return [];

      // 1. Get student enrollments
      const { data: enrollments, error: enrollError } = await supabase
        .from("students_enrollments")
        .select("grade_id, classroomLetter")
        .eq("user_id", user.id);
      if (enrollError) throw enrollError;
      if (!enrollments || enrollments.length === 0) return [];

      // 2. Get share_content entries
      const { data: shareEntries, error: shareError } = await supabase
        .from("share_content")
        .select("challenge_id, classroomLetter, shareContentType")
        .in("shareContentType", [4, 5]);
      if (shareError) throw shareError;
      if (!shareEntries || shareEntries.length === 0) return [];

      // 3. Filter matching
      const matchingChallengeIds = new Set<number>();
      for (const entry of shareEntries) {
        if (!entry.challenge_id) continue;
        if (entry.shareContentType === 4) {
          matchingChallengeIds.add(entry.challenge_id);
        } else if (entry.shareContentType === 5) {
          for (const enr of enrollments) {
            if (enr.classroomLetter === entry.classroomLetter) {
              matchingChallengeIds.add(entry.challenge_id);
            }
          }
        }
      }
      if (matchingChallengeIds.size === 0) return [];

      // 4. Fetch challenges with teacher profile + subject name
      const { data: challenges, error: chError } = await supabase
        .from("challenges")
        .select("*, profiles!challenges_user_id_fkey(name, lastname), subjects(name)")
        .in("id", Array.from(matchingChallengeIds))
        .eq("isDeleted", false)
        .order("createDate", { ascending: false });
      if (chError) throw chError;

      return (challenges ?? [])
        .filter((c: any) => c.user_id !== user.id)
        .map((c: any) => ({
          ...c,
          _teacherName: [c.profiles?.name, c.profiles?.lastname].filter(Boolean).join(" ") || null,
          _subjectName: c.subjects?.name || null,
        }));
    },
    enabled: !!user && isStudent,
  });

  // ── Completed challenge IDs (to hide from "Retos de tu profesor") ──
  const { data: completedChallengeIds = [] } = useQuery({
    queryKey: ["completed-challenge-ids", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("challenge_results")
        .select("challenge_id")
        .eq("user_id", user.id)
        .eq("isCompleted", true);
      if (error) throw error;
      return (data ?? []).map((r) => r.challenge_id);
    },
    enabled: !!user && isStudent,
  });

  const completedSet = new Set(completedChallengeIds);
  const pendingTeacherChallenges = teacherChallenges.filter(
    (ch) => !completedSet.has(ch.id)
  );

  // ── Shared challenge stats for teacher "Retos de tus alumnos" ──
  const { data: sharedChallengeStats = [], refetch: refetchStats } = useQuery({
    queryKey: ["shared-challenge-stats", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // 1. Challenges shared by this teacher
      const { data: shares } = await supabase
        .from("share_content")
        .select("challenge_id, classroomLetter, shareContentType")
        .eq("user_id", user.id)
        .in("shareContentType", [4, 5]);
      if (!shares?.length) return [];

      const challengeIds = [...new Set(shares.filter((s) => s.challenge_id).map((s) => s.challenge_id!))];

      // 2. Challenge data
      const { data: challenges } = await supabase
        .from("challenges")
        .select("*, grades(name), subjects(name)")
        .in("id", challengeIds)
        .eq("isDeleted", false);

      // 3. All completed results for those challenges
      const { data: results } = await supabase
        .from("challenge_results")
        .select("id, challenge_id, isReviewed")
        .in("challenge_id", challengeIds)
        .eq("isCompleted", true);

      // 4. Aggregate per challenge
      return (challenges ?? []).map((ch: any) => {
        const chResults = (results ?? []).filter((r) => r.challenge_id === ch.id);
        const pendingReview = chResults.filter((r) => !r.isReviewed).length;
        return {
          challenge: ch,
          gradeName: ch.grades?.name ?? "",
          subjectName: ch.subjects?.name ?? "",
          completedCount: chResults.length,
          pendingReviewCount: pendingReview,
          classrooms: shares.filter((s) => s.challenge_id === ch.id).map((s) => s.classroomLetter),
        };
      }).filter((s) => s.pendingReviewCount > 0);
    },
    enabled: !!user && isTeacher,
  });

  const badgeCount = isStudent ? pendingTeacherChallenges.length : myChallenges.length;

  const handleIdSearch = async () => {
    const id = parseInt(idInput.trim());
    if (!id || isNaN(id)) {
      toast.error("Introduce un ID válido");
      return;
    }
    setSearchingId(true);
    try {
      const { data, error } = await supabase
        .from("challenges")
        .select("id")
        .eq("id", id)
        .eq("isDeleted", false)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setIdInput("");
        setPlayChallenge(data.id);
      } else {
        toast.error(`No existe ningún reto con el ID ${id}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Error al buscar el reto");
    } finally {
      setSearchingId(false);
    }
  };

  const openCreate = () => {
    setDefaultValues(undefined);
    setCreateOpen(true);
  };

  const handleDelete = async (challengeId: number) => {
    const { error } = await supabase
      .from("challenges")
      .update({ isDeleted: true })
      .eq("id", challengeId);
    if (error) { toast.error("Error al borrar el reto"); return; }
    toast.success("Reto borrado");
    refetch();
  };

  const handleEdit = async (challengeId: number) => {
    const challenge = myChallenges.find((c) => c.id === challengeId);
    if (!challenge) return;

    const { data: dbQuestions, error } = await supabase
      .from("challenge_questions")
      .select("*")
      .eq("challenge_id", challengeId)
      .order("id");

    if (error) {
      toast.error("Error al cargar las preguntas del reto");
      return;
    }

    const gradeName = grades.find((g) => g.id === challenge.grade_id)?.name ?? "";
    const subjectName = subjects.find((s) => s.id === challenge.subject_id)?.name ?? "";

    const questions: ReviewQuestion[] = (dbQuestions ?? []).map((q) => ({
      pregunta: q.question,
      opciones: [q.answer1, q.answer2, q.answer3, q.answer4],
      correctAnswerIndex: q.correctAnswer,
      explanation: q.explanation,
    }));

    const form: ChallengeFormSnapshot = {
      name: challenge.name,
      topic: challenge.topic ?? "",
      gradeId: String(challenge.grade_id),
      subjectId: String(challenge.subject_id),
      gradeName,
      subjectName,
      language:
        challenge.language === "ES"
          ? "Español"
          : challenge.language === "EN"
          ? "English"
          : "Français",
      difficulty: challenge.difficulty,
      shareWithStudents: challenge.accessPermissions === 1,
    };

    setReview({ questions, form, challengeId });
  };

  // ── Full-screen overlays ──

  if (review) {
    return (
      <div className="absolute inset-0 z-10 flex flex-col overflow-hidden pb-20 md:pb-0">
        <ChallengeReviewPage
          questions={review.questions}
          form={review.form}
          challengeId={review.challengeId}
          onSaved={() => { setReview(null); refetch(); }}
          onDiscard={() => setReview(null)}
          onRegenerate={() => {
            const form = review.form;
            setReview(null);
            setDefaultValues(form);
            setCreateOpen(true);
          }}
        />
      </div>
    );
  }

  if (playChallenge !== null) {
    return (
      <div className="absolute inset-0 z-10 flex flex-col overflow-hidden pb-20 md:pb-0">
        <ChallengePlayPage
          challengeId={playChallenge}
          onBack={() => setPlayChallenge(null)}
        />
      </div>
    );
  }

  if (reviewingChallengeId !== null) {
    return (
      <div className="absolute inset-0 z-10 flex flex-col overflow-hidden pb-20 md:pb-0">
        <TeacherChallengeAnalytics
          challengeId={reviewingChallengeId}
          onBack={() => setReviewingChallengeId(null)}
          onVerified={() => { setReviewingChallengeId(null); refetchStats(); }}
        />
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col gap-3 min-h-0 lg:gap-4">

      {/* ═══════════════════════════════════════
          FILA 1 — HERO
          ═══════════════════════════════════════ */}
      <div
        className="relative w-full shrink-0 overflow-hidden rounded-2xl shadow-xl"
        style={{ minHeight: "clamp(140px, 18vw, 240px)" }}
      >
        <img
          src="/assets/robot-retos-fondo.png"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <img
          src="/assets/robot-retos-sin-fondo.png"
          alt="Robot Retos"
          className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 select-none object-contain drop-shadow-2xl"
          style={{ height: "clamp(120px, 16vw, 220px)" }}
        />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[55%] bg-gradient-to-r from-primary/70 via-primary/30 to-transparent" />

        <div className="relative z-10 flex min-w-0 items-start justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 md:px-8">
          <div
            className="min-w-0 shrink rounded-xl bg-primary/80 p-2.5 backdrop-blur-sm sm:rounded-2xl sm:p-4 md:p-5 lg:p-6"
            style={{ maxWidth: "clamp(140px, 30%, 280px)" }}
          >
            <h1
              className="font-extrabold leading-tight text-primary-foreground"
              style={{ fontSize: "clamp(0.85rem, 2.2vw, 1.6rem)" }}
            >
              ¿Qué <span className="text-cta">reto</span>
              <br />quieres
              <br />superar hoy?
            </h1>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5 sm:gap-2">
            <button
              onClick={openCreate}
              className="flex w-full flex-col items-start gap-0.5 rounded-xl bg-cta px-3 py-1.5 text-left shadow-lg transition-transform hover:scale-105 hover:brightness-110 active:scale-95 sm:rounded-2xl sm:px-4 sm:py-2.5"
              style={{ minWidth: "clamp(100px, 12vw, 160px)" }}
            >
              <span className="font-extrabold text-cta-foreground" style={{ fontSize: "clamp(0.7rem, 1.3vw, 0.9rem)" }}>
                Nuevo Reto
              </span>
              <span className="hidden leading-tight text-cta-foreground/70 sm:block" style={{ fontSize: "clamp(0.6rem, 0.9vw, 0.72rem)" }}>
                Diseña tu propio desafío interactivo
              </span>
            </button>
            <button
              className="flex w-full flex-col items-start gap-0.5 rounded-xl bg-cta px-3 py-1.5 text-left shadow-lg transition-transform hover:scale-105 hover:brightness-110 active:scale-95 sm:rounded-2xl sm:px-4 sm:py-2.5"
              style={{ minWidth: "clamp(100px, 12vw, 160px)" }}
            >
              <span className="font-extrabold text-cta-foreground" style={{ fontSize: "clamp(0.7rem, 1.3vw, 0.9rem)" }}>
                Buscar Retos
              </span>
              <span className="hidden leading-tight text-cta-foreground/70 sm:block" style={{ fontSize: "clamp(0.6rem, 0.9vw, 0.72rem)" }}>
                Explora retos
              </span>
            </button>
            <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/25 px-2.5 py-1 backdrop-blur-sm sm:px-3 sm:py-1.5">
              <Shield className="h-3.5 w-3.5 shrink-0 text-cta" />
              <span className="text-[10px] font-semibold text-white sm:text-xs">Retos por superar</span>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cta text-[10px] font-extrabold text-cta-foreground sm:h-6 sm:w-6 sm:text-xs">
                {badgeCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          FILAS 2 + 3 — grid 12 cols, flex-1
          ═══════════════════════════════════════ */}
      <div className="grid flex-1 min-h-0 grid-cols-12 items-stretch gap-3 lg:gap-4 lg:[grid-template-rows:1fr_1fr]">

        {/* ── FILA 2 IZQ: Retos de tu profesor (alumnos) / Retos de tus alumnos (profesores) ── */}
        <div className="col-span-12 min-w-0 flex flex-col rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5 lg:col-span-9 min-h-[200px] lg:min-h-0">
          {isTeacher ? (
            /* ── Teacher view: "Retos de tus alumnos" ── */
            <>
              <div className="flex shrink-0 items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground sm:text-base">
                  Retos de tus <span className="font-bold text-primary">alumnos</span>
                </h2>
              </div>
              {sharedChallengeStats.length === 0 ? (
                <div className="mt-4 flex flex-1 items-center justify-center">
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    No hay retos pendientes de revisar
                  </p>
                </div>
              ) : (
                <div className="mt-3 grid justify-start gap-4
                  [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]
                  sm:[grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]
                  lg:[grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
                  {sharedChallengeStats.map((stat, i) => (
                    <div
                      key={stat.challenge.id}
                      className="min-w-0 animate-fade-in"
                      style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
                    >
                      <ChallengeCard
                        challenge={stat.challenge}
                        subjectName={stat.subjectName}
                        reviewInfo={{ completed: stat.completedCount, pendingReview: stat.pendingReviewCount }}
                        classrooms={stat.classrooms}
                        onReview={() => setReviewingChallengeId(stat.challenge.id)}
                        onEdit={() => {}}
                        onPlay={() => {}}
                        onDelete={() => {}}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* ── Student view: "Retos de tu profesor" ── */
            <>
              <div className="flex shrink-0 items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground sm:text-base">
                  Retos de tu <span className="font-bold text-primary">profesor</span>
                </h2>
                <Button variant="default" size="sm" className="rounded-full px-3 text-xs font-semibold sm:px-4">
                  Ver todos
                </Button>
              </div>
              {pendingTeacherChallenges.length === 0 ? (
                <div className="mt-4 flex flex-1 items-center justify-center">
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    No hay retos de profesor disponibles
                  </p>
                </div>
              ) : (
                <div className="mt-3 grid justify-start gap-4
                  [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]
                  sm:[grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]
                  lg:[grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
                  {pendingTeacherChallenges.map((ch: any, i: number) => (
                    <div
                      key={ch.id}
                      className="min-w-0 animate-fade-in"
                      style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
                    >
                      <ChallengeCard
                        challenge={ch}
                        onEdit={() => {}}
                        onPlay={(id) => setPlayChallenge(id)}
                        onDelete={() => {}}
                        playOnly
                        teacherName={ch._teacherName}
                        subjectName={ch._subjectName}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── FILA 2 DER: Introducir ID ── */}
        <div className="col-span-12 min-w-0 w-full flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4 text-center shadow-sm sm:p-5 lg:col-span-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-xl font-extrabold text-primary-foreground shadow-md">
            #
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Introducir ID</h3>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground sm:text-xs">
              Si tienes un código específico de un profesor o compañero introdúcelo aquí
            </p>
          </div>
          <input
            type="number"
            min={1}
            value={idInput}
            onChange={(e) => setIdInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleIdSearch()}
            placeholder="#"
            className="w-full rounded-full border border-input bg-muted/50 px-3 py-2 text-center text-sm outline-none transition-all focus:ring-2 focus:ring-cta"
          />
          <Button
            size="sm"
            onClick={handleIdSearch}
            disabled={searchingId || !idInput.trim()}
            className="w-full rounded-full bg-cta text-sm font-semibold text-cta-foreground hover:bg-cta/90 disabled:opacity-60"
          >
            {searchingId ? "Buscando..." : "Aceptar"}
          </Button>
        </div>

        {/* ── FILA 3 IZQ: Retos creados ── */}
        <div className="col-span-12 min-w-0 flex flex-col rounded-2xl border border-border bg-secondary/20 p-4 shadow-sm sm:p-5 lg:col-span-9 min-h-[200px] lg:min-h-0 lg:overflow-hidden">
          <div className="flex shrink-0 items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground sm:text-base">
              Retos <span className="font-bold italic text-primary">creados</span>
            </h2>
            <Button variant="default" size="sm" className="rounded-full px-3 text-xs font-semibold sm:px-4">
              Ver todos
            </Button>
          </div>

          {myChallenges.length === 0 ? (
            <div className="mt-4 flex flex-1 items-center justify-center">
              <p className="text-xs text-muted-foreground sm:text-sm">
                Aún no has creado ningún reto
              </p>
            </div>
          ) : (
            <div className="mt-3 grid justify-start gap-3 sm:gap-4
              [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))]
              sm:[grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]
              lg:[grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
              {myChallenges.map((ch, i) => (
                <div
                  key={ch.id}
                  className="min-w-0 animate-fade-in"
                  style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
                >
                  <ChallengeCard
                    challenge={ch}
                    onEdit={handleEdit}
                    onPlay={(id) => setPlayChallenge(id)}
                    onDelete={handleDelete}
                    subjectName={subjects.find((s) => s.id === ch.subject_id)?.name}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── FILA 3 DER: Crear nuevo reto ── */}
        <button
          onClick={openCreate}
          className="col-span-12 min-w-0 w-full flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card/60 px-4 py-6 text-muted-foreground transition-all hover:border-cta hover:bg-cta/5 hover:text-cta active:scale-95 lg:col-span-3 lg:py-0"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-current">
            <Plus className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold sm:text-sm">Crear nuevo reto</span>
        </button>
      </div>

      <CreateChallengeDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onGenerated={(questions, form) => setReview({ questions, form })}
        defaultValues={defaultValues}
      />
    </div>
  );
}
