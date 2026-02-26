import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Rocket, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { signIn, session, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (authLoading) return null;
  if (session) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: "Email o contraseña incorrectos", variant: "destructive" });
    } else {
      toast({ description: "Sesión iniciada correctamente" });
    }
  };

  return (
    <div
      className="flex min-h-screen"
      style={{
        backgroundImage: "url('/assets/background-login.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >

      {/* Left branding — hidden on mobile */}
      <div className="relative z-10 hidden w-[50%] flex-col items-center justify-center md:flex">
        <div className="flex flex-col items-center gap-6">
          <img
            src="/assets/robot-tablet.png"
            alt="MiniTeacher robot con tablet"
            className="h-80 w-auto object-contain drop-shadow-2xl"
          />
          <img
            src="/assets/miniteacher-no-shape.png"
            alt="MiniTeacher logo"
            className="h-12 w-auto object-contain"
          />
        </div>
      </div>

      {/* Right side — on mobile: robot peeking + card + logo below */}
      <div className="relative z-10 flex w-full flex-col items-center justify-center px-4 py-8 md:w-[50%] md:flex-row md:justify-start md:pl-0 md:pr-12 md:py-0">

        {/* Mobile robot peeking from above the card */}
        <div className="relative z-20 mb-[-40px] flex justify-center md:hidden">
          <img
            src="/assets/robot-tablet.png"
            alt="MiniTeacher robot"
            className="h-32 w-auto object-contain drop-shadow-lg"
          />
        </div>

        {/* Login card */}
        <div
          className="relative z-10 w-full max-w-[420px]"
          style={{
            background: "#FFFFFF",
            borderRadius: 28,
            padding: "clamp(44px, 5vw, 52px) clamp(24px, 5vw, 48px) clamp(36px, 5vw, 52px)",
            boxShadow: "0 12px 48px rgba(0,0,0,0.25)",
          }}
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-2">
              <span
                style={{
                  color: "#1A1F5E",
                  fontSize: "clamp(26px, 4vw, 34px)",
                  fontWeight: 700,
                  fontFamily: "'MuseoModerno', sans-serif",
                }}
              >
                ¡Hola!
              </span>
              <img
                src="/assets/miniteacher-shape.png"
                alt="MiniTeacher"
                className="h-8 w-auto object-contain sm:h-9"
              />
            </div>
            <p
              style={{
                color: "#5A6A9A",
                fontSize: "clamp(13px, 1.5vw, 15px)",
                marginTop: 8,
                fontWeight: 500,
                fontStyle: "italic",
                fontFamily: "'Montserrat Alternates', sans-serif",
              }}
            >
              Ingresa a tu cuenta para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                className="mb-2 block"
                style={{
                  color: "#1A1F5E",
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "'Montserrat Alternates', sans-serif",
                }}
              >
                Usuario
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="correo@ejemplo.com"
                style={{
                  width: "100%",
                  height: 48,
                  borderRadius: 50,
                  border: "1.5px solid #D0D5E3",
                  background: "#F0F2F8",
                  padding: "0 20px",
                  fontSize: 15,
                  color: "#1A1F5E",
                  outline: "none",
                  fontFamily: "'Montserrat', sans-serif",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#F97316")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#D0D5E3")}
              />
            </div>

            {/* Password */}
            <div>
              <label
                className="mb-2 block"
                style={{
                  color: "#1A1F5E",
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "'Montserrat Alternates', sans-serif",
                }}
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    height: 48,
                    borderRadius: 50,
                    border: "1.5px solid #D0D5E3",
                    background: "#F0F2F8",
                    padding: "0 48px 0 20px",
                    fontSize: 15,
                    color: "#1A1F5E",
                    outline: "none",
                    fontFamily: "'Montserrat', sans-serif",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#F97316")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#D0D5E3")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#8A94B8" }}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="text-center">
              <Link
                to="/forgot-password"
                className="hover:underline"
                style={{
                  color: "#1A1F5E",
                  fontWeight: 700,
                  fontSize: 14,
                  fontFamily: "'Montserrat Alternates', sans-serif",
                }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mx-auto flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-60"
              style={{
                width: "70%",
                height: 50,
                borderRadius: 50,
                background: "linear-gradient(135deg, #FF8C42, #F97316)",
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: 17,
                fontFamily: "'MuseoModerno', sans-serif",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 16px rgba(249,115,22,0.35)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <Rocket className="h-5 w-5" />
                  Entrar
                </>
              )}
            </button>
          </form>
        </div>

        {/* Mobile: miniteacher no shape below the card */}
        <div className="mt-6 flex justify-center md:hidden">
          <img
            src="/assets/miniteacher-no-shape.png"
            alt="MiniTeacher logo"
            className="h-8 w-auto object-contain"
          />
        </div>
      </div>
    </div>
  );
}
