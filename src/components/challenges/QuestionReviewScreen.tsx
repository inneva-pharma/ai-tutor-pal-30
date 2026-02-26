import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, ChevronLeft, ChevronRight, Save, Pencil, Trash2 } from "lucide-react";

export interface ReviewQuestion {
  pregunta: string;
  opciones: string[];
  correctAnswerIndex: number;
  explanation?: string | null;
}

interface Props {
  questions: ReviewQuestion[];
  onSave: (questions: ReviewQuestion[]) => void;
  onCancel: () => void;
  saving: boolean;
}

export function QuestionReviewScreen({ questions: initial, onSave, onCancel, saving }: Props) {
  const [questions, setQuestions] = useState<ReviewQuestion[]>(initial);
  const [currentIdx, setCurrentIdx] = useState(0);

  const q = questions[currentIdx];
  if (!q) return null;

  const updateQuestion = (patch: Partial<ReviewQuestion>) => {
    setQuestions((prev) =>
      prev.map((item, i) => (i === currentIdx ? { ...item, ...patch } : item))
    );
  };

  const updateOption = (optIdx: number, value: string) => {
    const newOpts = [...q.opciones];
    newOpts[optIdx] = value;
    updateQuestion({ opciones: newOpts });
  };

  const deleteQuestion = () => {
    if (questions.length <= 1) return;
    const newQ = questions.filter((_, i) => i !== currentIdx);
    setQuestions(newQ);
    setCurrentIdx((prev) => Math.min(prev, newQ.length - 1));
  };

  const optionLabels = ["A", "B", "C", "D"];
  const optionColors = [
    { bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800", selected: "bg-blue-500" },
    { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800", selected: "bg-emerald-500" },
    { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", selected: "bg-amber-500" },
    { bg: "bg-rose-50 dark:bg-rose-950/30", border: "border-rose-200 dark:border-rose-800", selected: "bg-rose-500" },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Top navigation */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-primary">
            Pregunta {currentIdx + 1}
          </span>
          <span className="text-sm text-muted-foreground">
            de {questions.length}
          </span>
        </div>

        {/* Question dots */}
        <div className="flex gap-1.5 overflow-x-auto">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIdx(i)}
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                i === currentIdx
                  ? "bg-cta text-cta-foreground shadow-md scale-110"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <button
          onClick={deleteQuestion}
          disabled={questions.length <= 1}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
          title="Eliminar pregunta"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Question body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        {/* Question text */}
        <div className="mb-5 space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-bold text-primary">
            <Pencil className="h-3.5 w-3.5" />
            Pregunta
          </label>
          <Textarea
            value={q.pregunta}
            onChange={(e) => updateQuestion({ pregunta: e.target.value })}
            className="min-h-[80px] resize-none rounded-xl border-border bg-muted/40 text-sm leading-relaxed shadow-inner focus:ring-2 focus:ring-cta"
            placeholder="Escribe la pregunta..."
          />
        </div>

        {/* Options */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-primary">Opciones (haz clic para marcar la correcta)</label>
          {q.opciones.map((opt, optIdx) => {
            const isCorrect = q.correctAnswerIndex === optIdx;
            const color = optionColors[optIdx];
            return (
              <div
                key={optIdx}
                className={`flex items-center gap-3 rounded-xl border-2 p-3 transition-all ${
                  isCorrect
                    ? `${color.bg} border-green-400 dark:border-green-600 shadow-sm`
                    : `${color.bg} ${color.border}`
                }`}
              >
                {/* Correct toggle */}
                <button
                  type="button"
                  onClick={() => updateQuestion({ correctAnswerIndex: optIdx })}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isCorrect
                      ? "bg-green-500 text-white shadow-md"
                      : `${color.selected}/20 text-muted-foreground hover:opacity-80`
                  }`}
                >
                  {isCorrect ? <Check className="h-4 w-4" /> : optionLabels[optIdx]}
                </button>

                {/* Option text */}
                <Input
                  value={opt}
                  onChange={(e) => updateOption(optIdx, e.target.value)}
                  className="border-none bg-transparent text-sm shadow-none focus-visible:ring-0"
                  placeholder={`Opción ${optionLabels[optIdx]}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-between border-t border-border px-4 py-3 sm:px-6">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx((p) => p - 1)}
            className="gap-1 rounded-full"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Anterior</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={currentIdx === questions.length - 1}
            onClick={() => setCurrentIdx((p) => p + 1)}
            className="gap-1 rounded-full"
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={saving}
            className="rounded-full text-xs font-semibold sm:text-sm"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={() => onSave(questions)}
            disabled={saving}
            className="gap-1.5 rounded-full border-2 border-cta bg-cta text-xs font-bold text-cta-foreground shadow-md hover:bg-cta/90 sm:text-sm"
          >
            <Save className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar reto"}
          </Button>
        </div>
      </div>
    </div>
  );
}
