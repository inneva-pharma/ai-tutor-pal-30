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
    <div className="flex min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/assets/background-login.png')" }}>

      {/* Left branding — hidden on mobile */}
      <div className="relative z-10 hidden w-[50%] flex-col items-center justify-center md:flex">
        <div className="flex flex-col items-center">
          <div className="mb-6 flex h-72 w-72 lg:h-80 lg:w-80 items-center justify-center">
            <img
              src="/assets/mascot.png"
              alt="MiniTeacher mascot"
              className="h-full w-full object-contain drop-shadow-2xl"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = "none";
                target.nextElementSibling?.classList.remove("hidden");
              }}
            />
            <div className="hidden h-72 w-72 lg:h-80 lg:w-80 items-center justify-center rounded-3xl">
              <svg viewBox="0 0 120 130" className="h-56 w-56">
                <ellipse cx="60" cy="50" rx="35" ry="32" fill="white" opacity="0.9"/>
                <rect x="35" y="75" width="50" height="35" rx="12" fill="white" opacity="0.9"/>
                <circle cx="47" cy="46" r="8" fill="#222" opacity="0.7"/>
                <circle cx="73" cy="46" r="8" fill="#222" opacity="0.7"/>
                <circle cx="49" cy="44" r="3.5" fill="#22D3EE"/>
                <circle cx="75" cy="44" r="3.5" fill="#22D3EE"/>
              </svg>
            </div>
          </div>
          <h1 className="select-none" style={{ fontSize: 40, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.5px" }}>
            min<span style={{ color: "#F97316" }}>i</span> teacher
          </h1>
        </div>
      </div>

      {/* Right login card */}
      <div className="relative z-10 flex w-full items-center justify-center px-4 md:w-[50%] md:justify-start md:pl-0 md:pr-12">
        <div
          className="w-full max-w-[420px]"
          style={{
            background: "#F0F2F8",
            borderRadius: 28,
            padding: "clamp(32px, 5vw, 52px) clamp(24px, 5vw, 48px)",
            boxShadow: "0 12px 48px rgba(0,0,0,0.25)",
          }}
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-2">
              <span style={{ color: "#1A1F5E", fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 700 }}>¡Hola!</span>
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: "clamp(32px, 4vw, 40px)",
                  height: "clamp(32px, 4vw, 40px)",
                  background: "#F97316",
                }}
              >
                <span className="font-bold text-white" style={{ fontSize: "clamp(14px, 2vw, 18px)" }}>M</span>
              </div>
            </div>
            <p style={{ color: "#5A6A9A", fontSize: "clamp(13px, 1.5vw, 15px)", marginTop: 6, fontWeight: 500 }}>
              Ingresa a tu cuenta para continuar
            </p>
          </div>

          {/* Mobile branding */}
          <div className="mb-6 flex flex-col items-center md:hidden">
            <img
              src="/assets/mascot.png"
              alt="MiniTeacher mascot"
              className="h-28 w-28 object-contain drop-shadow-lg"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                className="mb-2 block"
                style={{ color: "#1A1F5E", fontSize: 14, fontWeight: 600 }}
              >
                Usuario
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  height: 48,
                  borderRadius: 50,
                  border: "1.5px solid #D0D5E3",
                  background: "#FFFFFF",
                  padding: "0 20px",
                  fontSize: 15,
                  color: "#1A1F5E",
                  outline: "none",
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
                style={{ color: "#1A1F5E", fontSize: 14, fontWeight: 600 }}
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    height: 48,
                    borderRadius: 50,
                    border: "1.5px solid #D0D5E3",
                    background: "#FFFFFF",
                    padding: "0 48px 0 20px",
                    fontSize: 15,
                    color: "#1A1F5E",
                    outline: "none",
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
                style={{ color: "#1A1F5E", fontWeight: 700, fontSize: 14 }}
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
                fontSize: 16,
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
      </div>
    </div>
  );
}
