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
import { Award, X, Info } from "lucide-react";
import { WifiLoadingScreen } from "./WifiLoadingScreen";
import type { ReviewQuestion } from "./QuestionReviewScreen";

const DIFFICULTIES = [
  { value: "Fácil", color: "bg-green-500" },
  { value: "Medio", color: "bg-yellow-400" },
  { value: "Difícil", color: "bg-orange-500" },
  { value: "Experto", color: "bg-red-500" },
];

const LANGUAGES = ["Español", "English", "Français"];

// DB subject names that represent foreign languages → consolidated as "Lengua Extranjera"
const FOREIGN_LANG_NAMES = ["Inglés", "Francés", "Alemán"];
const FOREIGN_LANG_ID = "0"; // virtual ID, never stored directly in DB

const PRIMARY_SUBJECTS = ["Matemáticas", "Lengua Castellana y Literatura", "Ciencias de la Naturaleza", "Ciencias Sociales", "Inglés", "Educación Artística", "Educación Física", "Educación en Valores Cívicos y Éticos", "Religión/Atención Educativa"];
const ESO_SUBJECTS = ["Matemáticas", "Lengua Castellana y Literatura", "Física y Química", "Biología y Geología", "Geografía e Historia", "Educación Plástica, Visual y Audiovisual", "Tecnología y Digitalización", "Inglés", "Francés", "Alemán", "Música", "Educación Física", "Educación en Valores Cívicos y Éticos", "Religión"];
const BACHILLER_SUBJECTS = ["Lengua Castellana y Literatura", "Historia de la Filosofía", "Historia de España", "Educación Física", "Matemáticas", "Física", "Química", "Biología", "Geología y CC. Ambientales", "Dibujo Técnico", "Inglés", "Francés", "Alemán", "Filosofía", "Latín", "Griego", "Historia del Arte", "Geografía", "Economía", "Empresa y Diseño de Modelos de Negocio"];

function getAllowedSubjects(gradeName: string): string[] | null {
  if (gradeName.includes("Primaria")) return PRIMARY_SUBJECTS;
  if (gradeName.includes("ESO")) return ESO_SUBJECTS;
  if (gradeName.includes("Bachillerato")) return BACHILLER_SUBJECTS;
  return null; // FP Básica, Otro → todas las asignaturas
}

function getEtapa(gradeName: string): string {
  if (gradeName.includes("Primaria")) return "Primaria";
  if (gradeName.includes("ESO")) return "ESO";
  if (gradeName.includes("Bachillerato")) return "Bachillerato";
  return gradeName;
}

type Phase = "form" | "loading";

export interface ChallengeFormSnapshot {
  name: string;
  topic: string;
  gradeId: string;
  subjectId: string;
  gradeName: string;
  subjectName: string;
  language: string;
  difficulty: string;
  shareWithStudents: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onGenerated: (questions: ReviewQuestion[], form: ChallengeFormSnapshot) => void;
  defaultValues?: Partial<ChallengeFormSnapshot>;
}

export function CreateChallengeDialog({ open, onOpenChange, onGenerated, defaultValues }: Props) {
  const { user, profile } = useAuth();
  const [phase, setPhase] = useState<Phase>("form");
  const [animState, setAnimState] = useState<"closed" | "entering" | "open" | "leaving">("closed");

  const [name, setName] = useState(defaultValues?.name ?? "");
  const [topic, setTopic] = useState(defaultValues?.topic ?? "");
  const [gradeId, setGradeId] = useState<string>(defaultValues?.gradeId ?? "");
  const [subjectId, setSubjectId] = useState<string>(defaultValues?.subjectId ?? "");
  const [foreignLang, setForeignLang] = useState("");
  const [language, setLanguage] = useState(defaultValues?.language ?? "Español");
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState(defaultValues?.difficulty ?? "Fácil");
  const [shareWithStudents, setShareWithStudents] = useState(defaultValues?.shareWithStudents ?? false);

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

  // Subjects filtered by the selected grade level
  const selectedGradeName = grades.find((g) => g.id === parseInt(gradeId))?.name ?? "";
  const allowedSubjectNames = getAllowedSubjects(selectedGradeName);
  const filteredSubjects = allowedSubjectNames
    ? subjects.filter((s) => allowedSubjectNames.includes(s.name))
    : subjects;

  // Replace individual foreign-language subjects with one "Lengua Extranjera" virtual entry
  const hasLangSubjects = filteredSubjects.some((s) => FOREIGN_LANG_NAMES.includes(s.name));
  const consolidatedSubjects: { id: number; name: string }[] = [
    ...filteredSubjects.filter((s) => !FOREIGN_LANG_NAMES.includes(s.name)),
    ...(hasLangSubjects ? [{ id: 0, name: "Lengua Extranjera" }] : []),
  ];

  const isLenguaExtranjera = subjectId === FOREIGN_LANG_ID;

  // Resolve the real DB subject_id when "Lengua Extranjera" is selected
  const resolveSubjectId = (): number => {
    if (!isLenguaExtranjera) return parseInt(subjectId);
    const typed = foreignLang.trim().toLowerCase();
    const exact = subjects.find((s) => s.name.toLowerCase() === typed);
    if (exact) return exact.id;
    return subjects.find((s) => FOREIGN_LANG_NAMES.includes(s.name))?.id ?? 0;
  };

  const handleGradeChange = (newGradeId: string) => {
    setGradeId(newGradeId);
    setForeignLang("");
    // Reset subject if it doesn't belong to the new grade level
    const newGradeName = grades.find((g) => g.id === parseInt(newGradeId))?.name ?? "";
    const allowed = getAllowedSubjects(newGradeName);
    if (allowed) {
      const currentSubjectName = subjects.find((s) => s.id === parseInt(subjectId))?.name;
      if (currentSubjectName && !allowed.includes(currentSubjectName)) {
        setSubjectId("");
      }
    }
  };

  const resetForm = () => {
    setName(defaultValues?.name ?? "");
    setTopic(defaultValues?.topic ?? "");
    setGradeId(defaultValues?.gradeId ?? "");
    setSubjectId(defaultValues?.subjectId ?? "");
    setForeignLang("");
    setLanguage(defaultValues?.language ?? "Español");
    setQuestionCount(10);
    setDifficulty(defaultValues?.difficulty ?? "Fácil");
    setShareWithStudents(defaultValues?.shareWithStudents ?? false);
    setPhase("form");
  };

  const handleClose = () => {
    if (phase === "loading") return;
    resetForm();
    onOpenChange(false);
  };

  const handleGenerate = async () => {
    if (!user) return;
    if (!name.trim() || !gradeId || !subjectId) {
      toast.error("Completa al menos el nombre, curso y asignatura");
      return;
    }
    if (isLenguaExtranjera && !foreignLang.trim()) {
      toast.error("Indica qué lengua extranjera es");
      return;
    }

    setPhase("loading");

    try {
      const gradeName = grades.find((g) => g.id === parseInt(gradeId))?.name ?? "";
      const baseSubjectName = subjects.find((s) => s.id === parseInt(subjectId))?.name ?? "";
      const subjectName = isLenguaExtranjera
        ? `Lengua Extranjera ${foreignLang.trim()}`
        : baseSubjectName;
      const resolvedSubjectId = resolveSubjectId();

      const webhookBase = import.meta.env.VITE_N8N_CHALLENGE_WEBHOOK;
      const n8nResponse = await fetch(`${webhookBase}/generar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "generar",
          user_id: user.id,
          name: name.trim(),
          topic: topic.trim(),
          etapa: getEtapa(gradeName),
          grade: gradeName,
          subject: subjectName,
          subject_id: resolvedSubjectId,
          language,
          questionCount,
          difficulty,
        }),
      });

      const rawText = await n8nResponse.text();
      console.log("n8n raw response", n8nResponse.status, rawText);

      if (!n8nResponse.ok) {
        throw new Error(`Error ${n8nResponse.status}: ${rawText.slice(0, 300)}`);
      }
      if (!rawText.trim()) {
        throw new Error("n8n devolvió una respuesta vacía. Revisa que el workflow esté activo y tenga un nodo 'Respond to Webhook'.");
      }
      const n8nResult = JSON.parse(rawText);
      const preguntas: any[] = n8nResult?.preguntas ?? [];

      if (preguntas.length === 0) {
        toast.error("No se generaron preguntas. Intenta de nuevo.");
        setPhase("form");
        return;
      }

      const questions: ReviewQuestion[] = preguntas.map((p: any) => ({
        pregunta: p.pregunta ?? "",
        opciones: [
          p.opciones?.[0] ?? "",
          p.opciones?.[1] ?? "",
          p.opciones?.[2] ?? "",
          p.opciones?.[3] ?? "",
        ],
        correctAnswerIndex: p.correctAnswerIndex ?? 0,
        explanation: p.explanation ?? null,
      }));

      const formSnapshot: ChallengeFormSnapshot = {
        name: name.trim(),
        topic: topic.trim(),
        gradeId,
        subjectId: String(resolvedSubjectId),
        gradeName,
        subjectName,
        language,
        difficulty,
        shareWithStudents,
      };

      resetForm();
      onOpenChange(false);
      onGenerated(questions, formSnapshot);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Dialog — proportional popup, not full-screen */}
      <div
        className={`relative z-10 flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-card shadow-2xl transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] md:max-w-2xl ${
          isVisible
            ? "translate-x-0 scale-100 opacity-100"
            : isLeaving
              ? "-translate-x-[20%] scale-95 opacity-0"
              : "translate-x-[30%] scale-95 opacity-0"
        }`}
      >
        {phase !== "loading" && (
          <button
            onClick={handleClose}
            className="absolute right-3 top-3 z-20 rounded-full p-1.5 text-primary-foreground/60 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 bg-primary px-5 py-4 sm:gap-4 sm:px-6 sm:py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cta shadow-lg sm:h-12 sm:w-12 sm:rounded-2xl">
            <Award className="h-6 w-6 text-cta-foreground sm:h-7 sm:w-7" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <h2 className="text-lg font-bold text-primary-foreground sm:text-xl">
              Crear <span className="font-extrabold">nuevo reto</span>
            </h2>
            <p className="text-xs text-primary-foreground/60 sm:text-sm">
              {phase === "loading"
                ? "La IA está preparando tu reto..."
                : "Configura los parámetros para generar un nuevo desafío educativo"}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {phase === "loading" && (
            <WifiLoadingScreen
              name={name.trim()}
              subject={subjects.find((s) => s.id === parseInt(subjectId))?.name ?? ""}
              grade={grades.find((g) => g.id === parseInt(gradeId))?.name ?? ""}
            />
          )}

          {phase === "form" && (
            <div className="px-5 py-4 sm:px-6 sm:py-5">
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
                    <Select value={gradeId} onValueChange={handleGradeChange}>
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
                    <Select
                      value={subjectId}
                      onValueChange={(val) => {
                        setSubjectId(val);
                        if (val !== FOREIGN_LANG_ID) setForeignLang("");
                      }}
                    >
                      <SelectTrigger className="h-9 rounded-full border-none bg-muted/60 text-sm shadow-inner sm:h-10">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {consolidatedSubjects.map((s) => (
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

                {/* Campo lengua extranjera — solo visible cuando se selecciona "Lengua Extranjera" */}
                {isLenguaExtranjera && (
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-primary sm:text-sm">¿Qué lengua extranjera?</Label>
                    <Input
                      value={foreignLang}
                      onChange={(e) => setForeignLang(e.target.value)}
                      placeholder="Ej: Inglés, Alemán, Francés, Chino..."
                      className="h-9 rounded-full border-none bg-muted/60 text-sm shadow-inner sm:h-10"
                    />
                  </div>
                )}

                {/* Row 3 */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_1fr] sm:items-end sm:gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-primary sm:text-sm">Número de preguntas</Label>
                    <Input type="number" min={1} max={50} value={questionCount}
                      onChange={(e) => setQuestionCount(parseInt(e.target.value) || 1)}
                      className="h-9 w-28 rounded-full border-none bg-muted/60 text-sm shadow-inner sm:h-10 sm:w-36" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-primary sm:text-sm">Dificultad</Label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {DIFFICULTIES.map((d) => (
                        <button key={d.value} type="button" onClick={() => setDifficulty(d.value)}
                          className={`flex items-center justify-center gap-1.5 rounded-full border py-2 text-xs transition-all duration-200 sm:py-2.5 sm:text-sm ${
                            difficulty === d.value
                              ? "border-primary bg-primary/10 font-bold text-primary shadow-sm"
                              : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
                          }`}>
                          {d.value}
                          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${d.color} shadow-sm`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Share toggle / teacher info note */}
                {profile?.role_id === 2 ? (
                  <div className="flex items-center gap-3 rounded-xl bg-primary/5 p-3 sm:rounded-2xl sm:p-4">
                    <Info className="h-5 w-5 shrink-0 text-primary" />
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      Al guardar, podrás elegir con quién compartir este reto
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3 sm:rounded-2xl sm:p-4">
                    <div>
                      <p className="text-xs font-bold text-primary sm:text-sm">Compartir con compañeros</p>
                      <p className="text-[11px] text-muted-foreground sm:text-xs">Permitir visibilidad entre alumnos</p>
                    </div>
                    <Switch checked={shareWithStudents} onCheckedChange={setShareWithStudents} />
                  </div>
                )}

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
