import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Rocket, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { signIn, session, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);

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
    <div className="flex min-h-screen" style={{ background: "#7B8FC7" }}>
      {/* SVG doodle pattern overlay */}
      <div className="pointer-events-none absolute inset-0 z-0" style={{
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><g fill='none' stroke='white' stroke-width='1.2' opacity='0.15'><rect x='10' y='10' width='16' height='3' rx='1.5'/><line x1='10' y1='15' x2='26' y2='15'/><line x1='13' y1='10' x2='13' y2='18'/><line x1='18' y1='10' x2='18' y2='18'/><line x1='23' y1='10' x2='23' y2='18'/><polygon points='55,8 60,18 50,18'/><circle cx='90' cy='14' r='6'/><line x1='90' y1='8' x2='90' y2='4'/><line x1='96' y1='14' x2='100' y2='14'/><line x1='84' y1='14' x2='80' y2='14'/><line x1='94' y1='10' x2='97' y2='7'/><line x1='86' y1='10' x2='83' y2='7'/><text x='130' y='18' font-size='14' font-family='sans-serif' fill='white' opacity='0.15'>A</text><text x='155' y='18' font-size='14' font-family='sans-serif' fill='white' opacity='0.15'>B</text><line x1='15' y1='50' x2='15' y2='80'/><line x1='13' y1='78' x2='15' y2='82'/><line x1='17' y1='78' x2='15' y2='82'/><polygon points='70,45 78,55 74,55 74,70 66,70 66,55 62,55'/><text x='110' y='65' font-size='16' font-family='sans-serif' fill='white' opacity='0.15'>1</text><text x='135' y='65' font-size='16' font-family='sans-serif' fill='white' opacity='0.15'>2</text><text x='160' y='65' font-size='16' font-family='sans-serif' fill='white' opacity='0.15'>3</text><polygon points='40,100 45,90 50,100 47,100 47,110 43,110 43,100'/><rect x='80' y='95' width='30' height='20' rx='2'/><line x1='85' y1='100' x2='105' y2='100'/><line x1='85' y1='105' x2='100' y2='105'/><line x1='85' y1='110' x2='105' y2='110'/><circle cx='150' cy='105' r='8'/><line x1='150' y1='97' x2='150' y2='93'/><path d='M146,99 Q150,95 154,99'/><line x1='20' y1='140' x2='45' y2='140'/><line x1='20' y1='140' x2='20' y2='165'/><line x1='20' y1='148' x2='28' y2='148'/><line x1='20' y1='155' x2='35' y2='155'/><polygon points='100,135 105,145 95,145'/><polygon points='100,145 105,155 95,155'/><path d='M140,140 Q145,130 150,140 Q155,150 160,140'/><text x='50' y='180' font-size='12' font-family='sans-serif' fill='white' opacity='0.15'>∑</text><circle cx='100' cy='180' r='3'/><circle cx='110' cy='175' r='3'/><circle cx='105' cy='185' r='3'/><path d='M150,170 L155,180 L160,172 L165,182 L170,170'/></g></svg>`)}")`,
        backgroundSize: "200px 200px",
      }} />

      {/* Left branding — hidden on mobile */}
      <div className="relative z-10 hidden w-[50%] flex-col items-center justify-center pr-8 md:flex">
        <div className="flex flex-col items-center">
          {/* Mascot placeholder */}
          <div className="mb-4 flex h-80 w-80 items-center justify-center">
            <img
              src="/assets/mascot.png"
              alt="MiniTeacher mascot"
              className="h-80 w-80 object-contain"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = "none";
                target.nextElementSibling?.classList.remove("hidden");
              }}
            />
            <div className="hidden h-80 w-80 items-center justify-center rounded-3xl" style={{ background: "rgba(255,255,255,0.12)" }}>
              <svg viewBox="0 0 120 130" className="h-56 w-56">
                <ellipse cx="60" cy="50" rx="35" ry="32" fill="white" opacity="0.9"/>
                <rect x="35" y="75" width="50" height="35" rx="12" fill="white" opacity="0.9"/>
                <circle cx="47" cy="46" r="8" fill="#222" opacity="0.7"/>
                <circle cx="73" cy="46" r="8" fill="#222" opacity="0.7"/>
                <circle cx="49" cy="44" r="3.5" fill="#22D3EE"/>
                <circle cx="75" cy="44" r="3.5" fill="#22D3EE"/>
                <rect x="48" y="28" width="24" height="7" rx="3.5" fill="#94A3B8" opacity="0.5"/>
                <rect x="55" y="22" width="10" height="8" rx="4" fill="#CBD5E1" opacity="0.6"/>
                <line x1="58" y1="90" x2="52" y2="108" stroke="#1E3A5F" strokeWidth="3" strokeLinecap="round"/>
                <rect x="46" y="85" width="28" height="16" rx="4" fill="#E2E8F0" opacity="0.5"/>
              </svg>
            </div>
          </div>
          <h1 className="select-none" style={{ fontSize: 42, fontWeight: 800, color: "#1A1F5E", letterSpacing: "-0.5px" }}>
            min<span style={{ color: "#F97316" }}>i</span> teacher
          </h1>
        </div>
      </div>

      {/* Right login card */}
      <div className="relative z-10 flex w-full items-center justify-start pl-8 md:w-[50%]">
        <div
          className="w-[90%]"
          style={{
            maxWidth: 420,
            background: "#FFFFFF",
            borderRadius: 24,
            padding: "48px 44px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
          }}
        >
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <span style={{ color: "#1A1F5E", fontSize: 28, fontWeight: 700 }}>¡Hola!</span>
              <div className="flex items-center justify-center rounded-full" style={{ width: 36, height: 36, background: "#F97316" }}>
                <span className="font-bold text-white" style={{ fontSize: 16 }}>M</span>
              </div>
            </div>
            <p style={{ color: "#6B7EC8", fontSize: 14, marginTop: 4 }}>Ingresa a tu cuenta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label style={{ color: "#1A1F5E", fontSize: 14, fontWeight: 500, marginBottom: 6, display: "block" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="login-input"
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ color: "#1A1F5E", fontSize: 14, fontWeight: 500, marginBottom: 6, display: "block" }}>Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="login-input pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A8A8A] hover:text-[#1A1F5E] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Checkbox */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(v) => setRemember(v === true)}
                className="h-5 w-5 rounded border-[#D0D5DD] data-[state=checked]:bg-[#F97316] data-[state=checked]:border-[#F97316]"
              />
              <label htmlFor="remember" className="cursor-pointer" style={{ color: "#1A1F5E", fontSize: 14 }}>
                Recordar acceso
              </label>
            </div>

            {/* Forgot password */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="hover:underline"
                style={{ color: "#1A1F5E", fontWeight: 700, fontSize: 13 }}
              >
                ¿Contraseña olvidada?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="login-btn group"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-5 w-5" />
                  Entrar
                </>
              )}
            </button>

            {/* Register link */}
            <p className="text-center" style={{ fontSize: 13, marginTop: 16 }}>
              <span style={{ color: "#8A8A8A" }}>¿No tienes cuenta? </span>
              <span className="cursor-pointer" style={{ color: "#F97316", fontWeight: 700 }}>
                ¡Regístrate ahora!
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
