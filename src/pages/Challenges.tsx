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
import type { ReviewQuestion } from "@/components/challenges/QuestionReviewScreen";

interface ReviewState {
  questions: ReviewQuestion[];
  form: ChallengeFormSnapshot;
  challengeId?: number; // set when editing an existing challenge
}

export default function Challenges() {
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [review, setReview] = useState<ReviewState | null>(null);
  const [playChallenge, setPlayChallenge] = useState<number | null>(null);
  const [defaultValues, setDefaultValues] = useState<Partial<ChallengeFormSnapshot> | undefined>(undefined);

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

  const openCreate = () => {
    setDefaultValues(undefined);
    setCreateOpen(true);
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
    );
  }

  if (playChallenge !== null) {
    return (
      <ChallengePlayPage
        challengeId={playChallenge}
        onBack={() => setPlayChallenge(null)}
      />
    );
  }

  return (
    /*
     * Raíz: flex-1 garantiza que este componente ocupa toda la altura
     * disponible del área principal (después de topbar + padding del main).
     */
    <div className="flex w-full min-w-0 flex-1 flex-col gap-6">

      {/* ═══════════════════════════════════════
          FILA 1 — HERO
          ═══════════════════════════════════════ */}
      <div
        className="relative w-full overflow-hidden rounded-2xl shadow-xl"
        style={{ height: "clamp(180px, 24vw, 300px)" }}
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
          style={{ height: "clamp(150px, 21vw, 280px)" }}
        />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[55%] bg-gradient-to-r from-primary/70 via-primary/30 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-between gap-3 px-4 py-4 sm:px-6 md:px-8">
          <div
            className="rounded-xl bg-primary/80 p-3 backdrop-blur-sm sm:rounded-2xl sm:p-4 md:p-5 lg:p-6"
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
          <div className="flex flex-col gap-2 sm:gap-3">
            <button
              onClick={openCreate}
              className="flex flex-col items-start gap-0.5 rounded-xl bg-cta px-3 py-2 text-left shadow-lg transition-transform hover:scale-105 hover:brightness-110 active:scale-95 sm:rounded-2xl sm:px-4 sm:py-3"
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
              className="flex flex-col items-start gap-0.5 rounded-xl bg-cta px-3 py-2 text-left shadow-lg transition-transform hover:scale-105 hover:brightness-110 active:scale-95 sm:rounded-2xl sm:px-4 sm:py-3"
              style={{ minWidth: "clamp(100px, 12vw, 160px)" }}
            >
              <span className="font-extrabold text-cta-foreground" style={{ fontSize: "clamp(0.7rem, 1.3vw, 0.9rem)" }}>
                Buscar Retos
              </span>
              <span className="hidden leading-tight text-cta-foreground/70 sm:block" style={{ fontSize: "clamp(0.6rem, 0.9vw, 0.72rem)" }}>
                Explora retos
              </span>
            </button>
          </div>
        </div>
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/25 px-2.5 py-1 backdrop-blur-sm sm:px-3 sm:py-1.5">
          <Shield className="h-3.5 w-3.5 text-cta" />
          <span className="text-[10px] font-semibold text-white sm:text-xs">Retos por superar</span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cta text-[10px] font-extrabold text-cta-foreground sm:h-6 sm:w-6 sm:text-xs">
            {myChallenges.length}
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          FILAS 2 + 3 — grid 12 cols, flex-1
          El grid crece para llenar el espacio
          restante debajo del hero.
          ═══════════════════════════════════════ */}
      <div className="grid flex-1 grid-cols-12 items-stretch gap-6">

        {/* ── FILA 2 IZQ: Retos de tu profesor ──
            min-h-[260px] lg:min-h-[340px] garantiza
            que la sección no quede "bajita" incluso
            cuando no hay cards.                    */}
        <div className="col-span-12 min-w-0 flex flex-col rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5 lg:col-span-9 min-h-[260px] lg:min-h-[340px]">
          <div className="flex shrink-0 items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground sm:text-base">
              Retos de tu <span className="font-bold text-primary">profesor</span>
            </h2>
            <Button variant="default" size="sm" className="rounded-full px-3 text-xs font-semibold sm:px-4">
              Ver todos
            </Button>
          </div>
          {/* área de cards — vacía por ahora */}
          <div className="mt-4 flex flex-1 items-center justify-center">
            <p className="text-xs text-muted-foreground sm:text-sm">
              No hay retos de profesor disponibles
            </p>
          </div>
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
            type="text"
            placeholder="#"
            className="w-full rounded-full border border-input bg-muted/50 px-3 py-2 text-center text-sm outline-none transition-all focus:ring-2 focus:ring-cta"
          />
          <Button size="sm" className="w-full rounded-full bg-cta text-sm font-semibold text-cta-foreground hover:bg-cta/90">
            Aceptar
          </Button>
        </div>

        {/* ── FILA 3 IZQ: Retos creados ──
            min-h-[320px] lg:min-h-[420px]          */}
        <div className="col-span-12 min-w-0 flex flex-col rounded-2xl border border-border bg-secondary/20 p-4 shadow-sm sm:p-5 lg:col-span-9 min-h-[320px] lg:min-h-[420px]">
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
            /*
             * Grid auto-fill — columnas de tamaño fijo objetivo por breakpoint.
             * auto-fill (no auto-fit) crea tracks vacíos, así las pocas cards
             * NO se estiran para rellenar el ancho.
             * justify-start alinea las cards a la izquierda.
             */
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
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── FILA 3 DER: Crear nuevo reto ──
            flex-1 lo estira para igualar la
            altura de "Retos creados" en desktop  */}
        <button
          onClick={openCreate}
          className="col-span-12 min-w-0 w-full flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card/60 px-4 py-10 text-muted-foreground transition-all hover:border-cta hover:bg-cta/5 hover:text-cta active:scale-95 lg:col-span-3"
          style={{ minHeight: "clamp(120px, 12vw, 200px)" }}
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
