import { useEffect, useState } from "react";

interface Props {
  name: string;
  subject: string;
  grade: string;
}

const MESSAGES = [
  "Analizando el currículo oficial...",
  "Construyendo preguntas con IA...",
  "Ajustando la dificultad...",
  "Revisando el contenido...",
  "Preparando tu reto...",
];

export function WifiLoadingScreen({ name, subject, grade }: Props) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-8 px-6 py-10 text-center">
      {/* Animated WiFi icon */}
      <div className="relative flex h-28 w-28 items-end justify-center">
        {/* Arc 3 (outermost) */}
        <span
          className="absolute bottom-0 h-[88px] w-[88px] rounded-tl-full rounded-tr-full border-[6px] border-transparent border-t-primary/20 border-l-primary/20 border-r-primary/20"
          style={{ animation: "wifi-pulse 1.8s ease-in-out 0.4s infinite" }}
        />
        {/* Arc 2 */}
        <span
          className="absolute bottom-0 h-[60px] w-[60px] rounded-tl-full rounded-tr-full border-[6px] border-transparent border-t-primary/50 border-l-primary/50 border-r-primary/50"
          style={{ animation: "wifi-pulse 1.8s ease-in-out 0.2s infinite" }}
        />
        {/* Arc 1 (innermost) */}
        <span
          className="absolute bottom-0 h-[34px] w-[34px] rounded-tl-full rounded-tr-full border-[6px] border-transparent border-t-primary border-l-primary border-r-primary"
          style={{ animation: "wifi-pulse 1.8s ease-in-out 0s infinite" }}
        />
        {/* Center dot */}
        <span className="relative z-10 mb-[-2px] h-4 w-4 rounded-full bg-primary shadow-md" />
      </div>

      {/* Rotating message */}
      <div className="space-y-1.5">
        <p
          key={msgIndex}
          className="text-base font-semibold text-primary"
          style={{ animation: "fade-in 0.4s ease" }}
        >
          {MESSAGES[msgIndex]}
        </p>
        <p className="text-xs text-muted-foreground">
          {name} &middot; {subject} &middot; {grade}
        </p>
      </div>

      {/* Bouncing dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-full bg-primary/60"
            style={{ animation: `bounce-dot 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>

      <style>{`
        @keyframes wifi-pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.97); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes bounce-dot {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
