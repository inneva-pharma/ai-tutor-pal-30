import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Award, X, CheckCircle2, BookOpen, GraduationCap, Zap, HelpCircle } from "lucide-react";
import { WifiLoadingScreen } from "./WifiLoadingScreen";

const DIFFICULTIES = [
  { value: "Fácil", color: "bg-green-500" },
  { value: "Medio", color: "bg-yellow-400" },
  { value: "Difícil", color: "bg-orange-500" },
  { value: "Experto", color: "bg-red-500" },
];

const LANGUAGES = ["Español", "English", "Français"];

type Phase = "form" | "loading" | "result";

interface GeneratedChallenge {
  id: number;
  name: string;
  subject: string;
  grade: string;
  difficulty: string;
  language: string;
  questionCount: number;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}

export function CreateChallengeDialog({ open, onOpenChange, onCreated }: Props) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("form");
  const [animState, setAnimState] = useState<"closed" | "entering" | "open" | "leaving">("closed");
  const [generatedChallenge, setGeneratedChallenge] = useState<GeneratedChallenge | null>(null);

  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [gradeId, setGradeId] = useState<string>("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [language, setLanguage] = useState("Español");
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState("Fácil");
  const [shareWithStudents, setShareWithStudents] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setAnimState("entering");
      const t = setTimeout(() => setAnimState("open"), 30);
      return () => clearTimeout(t);
    } else if (animState === "open" || animState === "entering") {
      setAnimState("leaving");
      const t = setTimeout(() => {
        setAnimState("closed");
        document.body.style.overflow = "";
      }, 400);
      return () => clearTimeout(t);
    }
  }, [open]);

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

  const resetForm = () => {
    setName(""); setTopic(""); setGradeId(""); setSubjectId("");
    setLanguage("Español"); setQuestionCount(5); setDifficulty("Fácil");
    setShareWithStudents(false); setPhase("form"); setGeneratedChallenge(null);
  };

  const handleClose = () => {
    if (phase === "loading") return; // Can't close while generating
    resetForm();
    onOpenChange(false);
  };

  const handleGenerate = async () => {
    if (!user) return;
    if (!name.trim() || !gradeId || !subjectId) {
      toast.error("Completa al menos el nombre, curso y asignatura");
      return;
    }

    setPhase("loading");

    try {
      // 1. Insert challenge record to Supabase
      const accessPermissions = shareWithStudents ? 1 : 0;
      const { data: challenge, error } = await supabase
        .from("challenges")
        .insert({
          name: name.trim(), topic: topic.trim() || null,
          grade_id: parseInt(gradeId), subject_id: parseInt(subjectId),
          language: language === "Español" ? "ES" : language === "English" ? "EN" : "FR",
          questionCount, difficulty, accessPermissions, user_id: user.id,
        })
        .select().single();
      if (error) throw error;

      const gradeName = grades.find((g) => g.id === parseInt(gradeId))?.name ?? "";
      const subjectName = subjects.find((s) => s.id === parseInt(subjectId))?.name ?? "";

      // 2. Call n8n and WAIT for response (not fire-and-forget)
      const webhookUrl = import.meta.env.VITE_N8N_CHALLENGE_WEBHOOK;
      let n8nResult: any = null;

      if (webhookUrl) {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;

        const response = await fetch(`${webhookUrl}/generar`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            challenge_id: challenge.id,
            user_id: user.id,
            name: name.trim(),
            topic: topic.trim(),
            grade: gradeName,
            subject: subjectName,
            subject_id: parseInt(subjectId),
            language,
            questionCount,
            difficulty,
          }),
        });

        if (!response.ok) {
          console.warn("n8n returned non-OK status:", response.status);
        } else {
          n8nResult = await response.json();
        }
      }

      // 3. Insert generated questions to Supabase
      const preguntas: any[] = n8nResult?.preguntas ?? [];
      if (preguntas.length > 0) {
        const questionsToInsert = preguntas.map((p: any) => ({
          challenge_id: challenge.id,
          question: p.pregunta,
          answer1: p.opciones?.[0] ?? "",
          answer2: p.opciones?.[1] ?? "",
          answer3: p.opciones?.[2] ?? "",
          answer4: p.opciones?.[3] ?? "",
          correctAnswer: p.correctAnswerIndex ?? 0,
          explanation: p.explanation || null,
          isInvalidQuestion: false,
        }));

        const { error: qError } = await supabase
          .from("challenge_questions")
          .insert(questionsToInsert);

        if (qError) {
          console.warn("Error inserting questions:", qError);
        }
      }

      // 4. Show result screen
      setGeneratedChallenge({
        id: challenge.id,
        name: name.trim(),
        subject: subjectName,
        grade: gradeName,
        difficulty,
        language,
        questionCount: preguntas.length || questionCount,
      });
      setPhase("result");
      onCreated(); // Refresh challenge list in background

    } catch (err: any) {
      console.error(err);
      setPhase("form");
      toast.error(err.message || "Error al crear el reto");
    }
  };

  if (animState === "closed") return null;

  const isVisible = animState === "open";
  const isLeaving = animState === "leaving";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Dialog */}
      <div
        className={`relative z-10 flex max-h-[95vh] w-full max-w-[95vw] flex-col overflow-hidden rounded-2xl bg-card shadow-2xl transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] sm:max-h-[90vh] sm:max-w-lg md:max-w-2xl ${
          isVisible
            ? "translate-x-0 scale-100 opacity-100"
            : isLeaving
              ? "-translate-x-[20%] scale-95 opacity-0"
              : "translate-x-[30%] scale-95 opacity-0"
        }`}
      >
        {/* Close button (hidden during loading) */}
        {phase !== "loading" && (
          <button
            onClick={handleClose}
            className="absolute right-3 top-3 z-20 rounded-full p-1.5 text-primary-foreground/60 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 bg-primary px-4 py-4 sm:gap-4 sm:px-6 sm:py-5 md:px-8 md:py-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cta shadow-lg sm:h-12 sm:w-12 sm:rounded-2xl md:h-14 md:w-14">
            <Award className="h-6 w-6 text-cta-foreground sm:h-7 sm:w-7 md:h-8 md:w-8" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <h2 className="text-lg font-bold text-primary-foreground sm:text-xl md:text-2xl">
              {phase === "result" ? (
                <>Reto <span className="font-extrabold">generado</span></>
              ) : (
                <>Crear <span className="font-extrabold">nuevo reto</span></>
              )}
            </h2>
            <p className="text-xs text-primary-foreground/60 sm:text-sm">
              {phase === "loading"
                ? "La IA está preparando tu reto..."
                : phase === "result"
                ? "Tu reto educativo está listo"
                : "Configura los parámetros para generar un nuevo desafío educativo"}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── LOADING PHASE ── */}
          {phase === "loading" && (
            <WifiLoadingScreen
              name={name.trim()}
              subject={subjects.find((s) => s.id === parseInt(subjectId))?.name ?? ""}
              grade={grades.find((g) => g.id === parseInt(gradeId))?.name ?? ""}
            />
          )}

          {/* ── RESULT PHASE ── */}
          {phase === "result" && generatedChallenge && (
            <div className="flex flex-col items-center gap-6 px-6 py-8 text-center">
              {/* Success icon */}
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-primary">¡Reto creado con éxito!</h3>
                <p className="text-sm text-muted-foreground">
                  Se han generado{" "}
                  <span className="font-bold text-primary">{generatedChallenge.questionCount} preguntas</span>{" "}
                  listas para usar
                </p>
              </div>

              {/* Details grid */}
              <div className="grid w-full grid-cols-2 gap-3">
                <div className="flex flex-col items-center gap-1.5 rounded-xl bg-muted/40 p-3">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <p className="text-[11px] text-muted-foreground">Asignatura</p>
                  <p className="text-sm font-bold text-primary">{generatedChallenge.subject}</p>
                </div>
                <div className="flex flex-col items-center gap-1.5 rounded-xl bg-muted/40 p-3">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <p className="text-[11px] text-muted-foreground">Curso</p>
                  <p className="text-sm font-bold text-primary">{generatedChallenge.grade}</p>
                </div>
                <div className="flex flex-col items-center gap-1.5 rounded-xl bg-muted/40 p-3">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <p className="text-[11px] text-muted-foreground">Dificultad</p>
                  <p className="text-sm font-bold text-primary">{generatedChallenge.difficulty}</p>
                </div>
                <div className="flex flex-col items-center gap-1.5 rounded-xl bg-muted/40 p-3">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  <p className="text-[11px] text-muted-foreground">Preguntas</p>
                  <p className="text-sm font-bold text-primary">{generatedChallenge.questionCount}</p>
                </div>
              </div>

              <Button
                onClick={handleClose}
                className="min-w-[160px] rounded-full border-2 border-cta bg-cta text-sm font-bold text-cta-foreground shadow-md transition-transform hover:scale-105 hover:bg-cta/90"
              >
                Cerrar
              </Button>
            </div>
          )}

          {/* ── FORM PHASE ── */}
          {phase === "form" && (
            <div className="px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6">
              <div className="space-y-4 sm:space-y-5">
                {/* Row 1 */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-primary sm:text-sm">Nombre del reto</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)}
                      className="h-9 rounded-full border-none bg-muted/60 text-sm shadow-inner sm:h-10"
                      placeholder="Ej: Multiplicaciones" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-primary sm:text-sm">Temática</Label>
                    <Input value={topic} onChange={(e) => setTopic(e.target.value)}
                      className="h-9 rounded-full border-none bg-muted/60 text-sm shadow-inner sm:h-10"
                      placeholder="Ej: Tablas del 1 al 5" />
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-primary sm:text-sm">Curso</Label>
                    <Select value={gradeId} onValueChange={setGradeId}>
                      <SelectTrigger className="h-9 rounded-full border-none bg-muted/60 text-sm shadow-inner sm:h-10">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map((g) => (
                          <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-primary sm:text-sm">Asignatura</Label>
                    <Select value={subjectId} onValueChange={setSubjectId}>
                      <SelectTrigger className="h-9 rounded-full border-none bg-muted/60 text-sm shadow-inner sm:h-10">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-primary sm:text-sm">Idioma</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="h-9 rounded-full border-none bg-muted/60 text-sm shadow-inner sm:h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((l) => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-primary sm:text-sm">Número de preguntas</Label>
                    <Input type="number" min={1} max={50} value={questionCount}
                      onChange={(e) => setQuestionCount(parseInt(e.target.value) || 1)}
                      className="h-9 w-28 rounded-full border-none bg-muted/60 text-sm shadow-inner sm:h-10 sm:w-36" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-primary sm:text-sm">Dificultad</Label>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {DIFFICULTIES.map((d) => (
                        <button key={d.value} type="button" onClick={() => setDifficulty(d.value)}
                          className={`flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs transition-all duration-200 sm:gap-1.5 sm:px-3.5 sm:py-2 sm:text-sm ${
                            difficulty === d.value
                              ? "border-primary bg-primary/10 font-bold text-primary shadow-sm"
                              : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
                          }`}>
                          {d.value}
                          <span className={`h-3 w-3 rounded-full ${d.color} shadow-sm sm:h-3.5 sm:w-3.5`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Share toggle */}
                <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3 sm:rounded-2xl sm:p-4">
                  <div>
                    <p className="text-xs font-bold text-primary sm:text-sm">Compartir con compañeros</p>
                    <p className="text-[11px] text-muted-foreground sm:text-xs">Permitir visibilidad entre alumnos</p>
                  </div>
                  <Switch checked={shareWithStudents} onCheckedChange={setShareWithStudents} />
                </div>

                {/* Actions */}
                <div className="flex justify-center gap-3 pb-1 pt-1 sm:gap-4 sm:pt-2">
                  <Button variant="secondary"
                    className="min-w-[110px] rounded-full text-xs font-semibold transition-transform hover:scale-105 sm:min-w-[140px] sm:text-sm"
                    onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button onClick={handleGenerate}
                    className="min-w-[130px] rounded-full border-2 border-cta bg-cta text-xs font-bold text-cta-foreground shadow-md transition-transform hover:scale-105 hover:bg-cta/90 sm:min-w-[160px] sm:text-sm">
                    Generar reto
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
