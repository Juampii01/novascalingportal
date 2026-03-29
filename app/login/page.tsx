"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/home");
    });
  }, [router, supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setErrorMsg(error.message); return; }
    const { data } = await supabase.auth.getSession();
    if (data.session) router.replace("/home");
    else setErrorMsg("No se pudo obtener la sesión. Intentá nuevamente.");
  }

  const inputStyle = (field: string): React.CSSProperties => ({
    width: "100%",
    background: "transparent",
    border: "none",
    borderBottom: `1px solid ${focusedField === field ? "rgba(34,197,94,0.4)" : "#1a1a1a"}`,
    padding: "14px 0",
    color: "#f5f5f5",
    fontSize: "15px",
    fontFamily: "sans-serif",
    fontWeight: 300,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.3s",
    letterSpacing: "0.3px",
  });

  return (
    <>
      <style>{`
        @keyframes blob1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(40px, -30px) scale(1.08); }
        }
        @keyframes blob2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-30px, 25px) scale(0.94); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fu0 { animation: fadeUp 0.7s 0.05s ease both; }
        .fu1 { animation: fadeUp 0.7s 0.15s ease both; }
        .fu2 { animation: fadeUp 0.7s 0.25s ease both; }
        .fu3 { animation: fadeUp 0.7s 0.35s ease both; }
        .fu4 { animation: fadeUp 0.7s 0.45s ease both; }
        .fu5 { animation: fadeUp 0.7s 0.55s ease both; }
        input::placeholder { color: #2a2a2a; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#060606", display: "flex", overflow: "hidden" }}>

        {/* ── LEFT PANEL ── */}
        <div style={{
          flex: "0 0 54%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          padding: "48px 60px",
          overflow: "hidden",
        }}>
          {/* Blobs */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
            <div style={{ position: "absolute", top: "5%", left: "-8%", width: "560px", height: "560px", borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 60%)", animation: "blob1 20s ease-in-out infinite" }} />
            <div style={{ position: "absolute", bottom: "0%", right: "-5%", width: "420px", height: "420px", borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.04) 0%, transparent 65%)", animation: "blob2 26s ease-in-out infinite" }} />
            {/* Grid */}
            <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)", backgroundSize: "64px 64px" }} />
            {/* Vignette */}
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 40%, #060606 100%)" }} />
          </div>

          {/* Logo */}
          <div className="fu0" style={{ display: "flex", alignItems: "center", gap: "14px", position: "relative", zIndex: 1 }}>
            <span style={{ fontFamily: "Georgia, serif", fontSize: "17px", fontWeight: 400, color: "#f5f5f5", letterSpacing: "9px" }}>NOVA</span>
            <div style={{ width: "20px", height: "0.5px", background: "#22c55e", opacity: 0.6 }} />
            <span style={{ fontFamily: "sans-serif", fontSize: "6px", fontWeight: 300, color: "#22c55e", letterSpacing: "5px" }}>SCALING</span>
          </div>

          {/* Center block */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 1, paddingBottom: "48px" }}>
            <p className="fu1" style={{ fontSize: "9px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "3.5px", textTransform: "uppercase", color: "#22c55e", marginBottom: "24px" }}>
              Inteligencia operativa
            </p>

            <h2 className="fu2" style={{ fontFamily: "Georgia, serif", fontSize: "46px", fontWeight: 400, color: "#f0f0f0", lineHeight: 1.12, letterSpacing: "-1px", marginBottom: "24px" }}>
              Cada cierre<br />tiene un origen.<br />
              <span style={{ color: "#1f2e23" }}>Ahora lo sabés.</span>
            </h2>

            <p className="fu3" style={{ fontSize: "13px", fontFamily: "sans-serif", fontWeight: 300, color: "#3a3a3a", lineHeight: 1.75, maxWidth: "320px" }}>
              Del contenido al DM. Del DM a la llamada.<br />De la llamada al revenue.
            </p>

            {/* Divider */}
            <div className="fu4" style={{ width: "40px", height: "0.5px", background: "#1a1a1a", margin: "36px 0" }} />

            {/* Stats */}
            <div className="fu5" style={{ display: "flex", gap: "48px" }}>
              {[
                { value: "100%", label: "Automatizado" },
                { value: "Real time", label: "Data en vivo" },
                { value: "0 gaps", label: "Pipeline sin puntos ciegos" },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: "20px", fontWeight: 400, color: "#c8c8c8", letterSpacing: "0.5px", marginBottom: "5px" }}>{s.value}</div>
                  <div style={{ fontSize: "8px", fontFamily: "sans-serif", fontWeight: 400, color: "#2a2a2a", letterSpacing: "2.5px", textTransform: "uppercase" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 300, color: "#1a1a1a", letterSpacing: "1px", position: "relative", zIndex: 1 }}>
            © {new Date().getFullYear()} NOVA Scaling
          </p>

          {/* Right edge fade */}
          <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "1px", background: "linear-gradient(to bottom, transparent 0%, #111 25%, #111 75%, transparent 100%)" }} />
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "48px 72px",
          position: "relative",
        }}>
          {/* Subtle top-right glow */}
          <div style={{ position: "absolute", top: "-5%", right: "-10%", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.03) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{ maxWidth: "340px", width: "100%" }}>
            {/* Heading */}
            <div className="fu1" style={{ marginBottom: "52px" }}>
              <h1 style={{ fontFamily: "Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#f5f5f5", letterSpacing: "-0.3px", marginBottom: "10px" }}>
                Bienvenido
              </h1>
              <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#333", letterSpacing: "0.2px" }}>
                Accedé a tu panel de métricas.
              </p>
            </div>

            <form onSubmit={onSubmit}>
              {/* Email */}
              <div className="fu2" style={{ marginBottom: "36px" }}>
                <label style={{ fontSize: "9px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "2.5px", textTransform: "uppercase", color: focusedField === "email" ? "#22c55e" : "#2a2a2a", display: "block", marginBottom: "8px", transition: "color 0.3s" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="vos@dominio.com"
                  required
                  autoComplete="email"
                  style={inputStyle("email")}
                />
              </div>

              {/* Password */}
              <div className="fu3" style={{ marginBottom: "44px" }}>
                <label style={{ fontSize: "9px", fontFamily: "sans-serif", fontWeight: 500, letterSpacing: "2.5px", textTransform: "uppercase", color: focusedField === "password" ? "#22c55e" : "#2a2a2a", display: "block", marginBottom: "8px", transition: "color 0.3s" }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={inputStyle("password")}
                />
              </div>

              {errorMsg && (
                <div style={{ marginBottom: "24px", padding: "13px 16px", background: "rgba(239,68,68,0.04)", border: "0.5px solid rgba(239,68,68,0.12)", borderRadius: "8px", fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#ef4444", lineHeight: 1.5 }}>
                  {errorMsg}
                </div>
              )}

              {/* CTA */}
              <div className="fu4" style={{ marginBottom: "32px" }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "15px",
                    borderRadius: "6px",
                    background: loading ? "rgba(34,197,94,0.1)" : "#22c55e",
                    border: "none",
                    color: loading ? "#4ade80" : "#000",
                    fontSize: "10px",
                    fontFamily: "sans-serif",
                    fontWeight: 600,
                    letterSpacing: "3.5px",
                    textTransform: "uppercase",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.background = "#16a34a"; (e.currentTarget as HTMLButtonElement).style.letterSpacing = "4px"; } }}
                  onMouseLeave={(e) => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.background = "#22c55e"; (e.currentTarget as HTMLButtonElement).style.letterSpacing = "3.5px"; } }}
                >
                  {loading ? "Entrando…" : "Entrar"}
                </button>
              </div>

              {/* Links */}
              <div className="fu5" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <a href="/forgot-password"
                  style={{ fontSize: "11px", fontFamily: "sans-serif", fontWeight: 300, color: "#252525", textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#666")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#252525")}
                >
                  ¿Olvidaste la contraseña?
                </a>
                <a href="/signup"
                  style={{ fontSize: "11px", fontFamily: "sans-serif", fontWeight: 300, color: "#252525", textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#22c55e")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#252525")}
                >
                  Crear cuenta →
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
