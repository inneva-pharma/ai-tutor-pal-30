import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Award } from "lucide-react";

const DIFFICULTIES = [
  { value: "Fácil", color: "bg-green-500" },
  { value: "Medio", color: "bg-yellow-400" },
  { value: "Difícil", color: "bg-orange-500" },
  { value: "Experto", color: "bg-red-500" },
];

const LANGUAGES = ["Español", "English", "Français"];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}

export function CreateChallengeDialog({ open, onOpenChange, onCreated }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [gradeId, setGradeId] = useState<string>("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [language, setLanguage] = useState("Español");
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState("Fácil");
  const [shareWithStudents, setShareWithStudents] = useState(false);

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
    setName("");
    setTopic("");
    setGradeId("");
    setSubjectId("");
    setLanguage("Español");
    setQuestionCount(5);
    setDifficulty("Fácil");
    setShareWithStudents(false);
  };

  const handleGenerate = async () => {
    if (!user) return;
    if (!name.trim() || !gradeId || !subjectId) {
      toast.error("Completa al menos el nombre, curso y asignatura");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create challenge in DB
      const accessPermissions = shareWithStudents ? 1 : 0;
      const { data: challenge, error } = await supabase
        .from("challenges")
        .insert({
          name: name.trim(),
          topic: topic.trim() || null,
          grade_id: parseInt(gradeId),
          subject_id: parseInt(subjectId),
          language: language === "Español" ? "ES" : language === "English" ? "EN" : "FR",
          questionCount,
          difficulty,
          accessPermissions,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Step 2: Call n8n webhook to generate questions
      // The webhook URL will be configured via env variable
      const webhookUrl = import.meta.env.VITE_N8N_CHALLENGE_WEBHOOK;
      if (webhookUrl) {
        try {
          const session = await supabase.auth.getSession();
          const token = session.data.session?.access_token;

          const res = await fetch(`${webhookUrl}/generar`, {
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
              grade: grades.find((g) => g.id === parseInt(gradeId))?.name ?? "",
              subject: subjects.find((s) => s.id === parseInt(subjectId))?.name ?? "",
              language,
              questionCount,
              difficulty,
            }),
          });

          if (!res.ok) {
            console.warn("n8n webhook returned non-OK status:", res.status);
          }
        } catch (webhookErr) {
          console.warn("Could not call n8n webhook (it may not be configured yet):", webhookErr);
        }
      } else {
        console.info("VITE_N8N_CHALLENGE_WEBHOOK not configured — skipping AI generation");
      }

      toast.success("Reto creado correctamente");
      resetForm();
      onOpenChange(false);
      onCreated();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al crear el reto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden rounded-2xl border-none p-0">
        {/* Dark header */}
        <div className="flex items-center gap-4 bg-primary px-8 py-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-cta">
            <Award className="h-8 w-8 text-cta-foreground" />
          </div>
          <DialogHeader className="flex-1 space-y-1">
            <DialogTitle className="text-2xl font-bold text-primary-foreground">
              Crear <span className="font-extrabold">nuevo reto</span>
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/70">
              Configura los parámetros para generar un nuevo desafío educativo
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form body */}
        <div className="space-y-5 px-8 py-6">
          {/* Row 1 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-bold text-primary">Nombre del reto</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-full bg-muted/60"
                placeholder="Ej: Multiplicaciones"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-bold text-primary">Temática</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="rounded-full bg-muted/60"
                placeholder="Ej: Tablas del 1 al 5"
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="font-bold text-primary">Curso</Label>
              <Select value={gradeId} onValueChange={setGradeId}>
                <SelectTrigger className="rounded-full bg-muted/60">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-bold text-primary">Asignatura</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger className="rounded-full bg-muted/60">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-bold text-primary">Idioma</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="rounded-full bg-muted/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-bold text-primary">Número de preguntas</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value) || 1)}
                className="w-32 rounded-full bg-muted/60"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-bold text-primary">Dificultad</Label>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDifficulty(d.value)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      difficulty === d.value
                        ? "border-primary bg-primary/10 font-semibold text-primary"
                        : "border-border bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    {d.value}
                    <span className={`h-3 w-3 rounded-full ${d.color}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Share toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4">
            <div>
              <p className="font-bold text-primary">Compartir con compañeros</p>
              <p className="text-sm text-muted-foreground">Permitir visibilidad entre alumnos</p>
            </div>
            <Switch checked={shareWithStudents} onCheckedChange={setShareWithStudents} />
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4 pt-2">
            <Button
              variant="secondary"
              className="min-w-[140px] rounded-full font-semibold"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="min-w-[160px] rounded-full bg-cta font-semibold text-cta-foreground hover:bg-cta/90"
            >
              {loading ? "Generando..." : "Generar reto"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
