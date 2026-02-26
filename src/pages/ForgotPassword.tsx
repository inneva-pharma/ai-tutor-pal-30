import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CustomIcon } from "@/components/CustomIcon";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        backgroundImage: "url('/assets/background-login.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        className="relative w-full max-w-[420px]"
        style={{
          background: "#FFFFFF",
          borderRadius: 28,
          padding: "clamp(44px, 5vw, 52px) clamp(24px, 5vw, 48px) clamp(36px, 5vw, 52px)",
          boxShadow: "0 12px 48px rgba(0,0,0,0.25)",
        }}
      >
        {/* Close button */}
        <Link
          to="/login"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
        >
          <CustomIcon src="/assets/IconClose.png" alt="Cerrar" size={18} color="#8A94B8" />
        </Link>

        {/* Header */}
        <div className="mb-8 text-center">
          <h2
            style={{
              fontFamily: "'MuseoModerno', sans-serif",
              fontWeight: 700,
              color: "#1A1F5E",
              fontSize: "clamp(22px, 3.5vw, 28px)",
            }}
          >
            Recuperar contraseña
          </h2>
          <p
            style={{
              fontFamily: "'Montserrat Alternates', sans-serif",
              fontWeight: 500,
              fontStyle: "italic",
              color: "#5A6A9A",
              fontSize: "clamp(13px, 1.5vw, 15px)",
              marginTop: 8,
            }}
          >
            Ingresa tu correo y te enviaremos un email con los pasos a seguir.
          </p>
        </div>

        {sent ? (
          <div className="space-y-5 text-center">
            <p
              style={{
                fontFamily: "'Montserrat Alternates', sans-serif",
                fontWeight: 500,
                color: "#5A6A9A",
                fontSize: 14,
              }}
            >
              Revisa tu email, te hemos enviado el enlace de recuperación.
            </p>
            <Link to="/login">
              <button
                className="mx-auto flex items-center justify-center transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
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
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(249,115,22,0.35)",
                }}
              >
                Volver al inicio
              </button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
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
                Email
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
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Recuperar"}
            </button>
          </form>
        )}
      </div>

      {/* MiniTeacher logo — bottom right */}
      <img
        src="/assets/miniteacher-no-shape.png"
        alt="MiniTeacher logo"
        className="fixed bottom-4 right-4 h-8 w-auto object-contain opacity-80"
      />
    </div>
  );
}
