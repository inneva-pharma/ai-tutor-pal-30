import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { CustomIcon } from "@/components/CustomIcon";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <Card className="relative overflow-hidden border-border shadow-sm">
        <CardContent className="relative flex flex-col gap-0 p-6 md:flex-row md:items-center md:justify-between md:gap-6">
          {/* Text + buttons */}
          <div className="relative z-10 space-y-4">
            <h1
              style={{
                fontFamily: "'MuseoModerno', sans-serif",
                fontWeight: 700,
                color: "#1A1F5E",
              }}
              className="text-2xl md:text-3xl"
            >
              ¿Qué te apetece{" "}
              <span className="text-secondary">aprender</span> hoy?
            </h1>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/knowledge">
                <button
                  className="flex h-11 items-center gap-2 rounded-full px-6 transition-all hover:scale-[1.03] active:scale-[0.97]"
                  style={{
                    background: "#7191C2",
                    color: "#FFFFFF",
                    fontFamily: "'Montserrat Alternates', sans-serif",
                    fontWeight: 700,
                    fontSize: 14,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <CustomIcon src="/assets/IconKnowledge.png" alt="Conocimiento" size={18} color="#FFFFFF" />
                  Mi conocimiento
                </button>
              </Link>
              <Link to="/explore">
                <button
                  className="flex h-11 items-center gap-2 rounded-full px-6 transition-all hover:scale-[1.03] active:scale-[0.97]"
                  style={{
                    background: "#1A1F5E",
                    color: "#FFFFFF",
                    fontFamily: "'Montserrat Alternates', sans-serif",
                    fontWeight: 700,
                    fontSize: 14,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <CustomIcon src="/assets/IconRocket.png" alt="Explorar" size={18} color="#FFFFFF" />
                  Explorar
                </button>
              </Link>
            </div>
          </div>
          {/* Robot — mobile: overlaps buttons slightly from right; desktop: normal */}
          <img
            src="/assets/robot-tablet.png"
            alt="MiniTeacher robot"
            className="absolute right-2 bottom-0 h-28 w-auto object-contain drop-shadow-lg md:relative md:right-auto md:bottom-auto md:h-40"
          />
        </CardContent>
      </Card>

      {/* Feature cards row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/challenges">
          <Card className="group cursor-pointer border-border shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-5 p-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center">
                <CustomIcon src="/assets/IconChallenges.png" alt="Retos" size={48} color="#F97316" />
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: "'Montserrat Alternates', sans-serif",
                    fontWeight: 700,
                    color: "#1A1F5E",
                  }}
                  className="text-lg"
                >
                  Retos
                </h3>
                <p
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 400,
                  }}
                  className="text-sm text-muted-foreground"
                >
                  Participa o crea nuevos retos y pon a prueba tus conocimientos de cada asignatura
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/chatbots">
          <Card className="group cursor-pointer border-border shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-5 p-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center">
                <CustomIcon src="/assets/IconChat.png" alt="Miniteachers" size={48} color="#F97316" />
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: "'Montserrat Alternates', sans-serif",
                    fontWeight: 700,
                    color: "#1A1F5E",
                  }}
                  className="text-lg"
                >
                  Miniteachers
                </h3>
                <p
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 400,
                  }}
                  className="text-sm text-muted-foreground"
                >
                  Accede o crea nuevos MiniTeacher que te ayudarán con todas tus dudas
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
