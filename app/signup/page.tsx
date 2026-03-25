"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

function isAlreadyRegisteredError(error: any) {
  const msg = String(error?.message ?? "");
  const code = String(error?.code ?? "");
  if (["user_already_exists", "email_exists", "email_already_exists"].includes(code)) return true;
  return /already\s*(registered|been\s*registered)|user\s*already\s*registered|email\s*already\s*(registered|in\s*use)|duplicate/i.test(msg);
}

function safeProjectRefFromUrl(url?: string) {
  if (!url) return "";
  try { const u = new URL(url); return u.hostname.split(".")[0] ?? ""; } catch { return ""; }
}

function errInfo(e: any) {
  if (!e) return null;
  return { message: String(e.message ?? e), name: e?.name, status: e?.status, code: e?.code };
}

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [debug, setDebug] = useState<any>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [pendingConfirmEmail, setPendingConfirmEmail] = useState<string | null>(null);
  const [pendingRedirectTo, setPendingRedirectTo] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const projectRef = useMemo(() => safeProjectRefFromUrl(supabaseUrl), [supabaseUrl]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null); setMsg(null); setDebug(null);
    setPendingConfirmEmail(null); setPendingRedirectTo(null); setResendLoading(false);

    const supabase = createClient();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail.includes("@")) { setLoading(false); setErr("Ingresá un email válido."); return; }
    if (password.length < 6) { setLoading(false); setErr("La contraseña debe tener al menos 6 caracteres."); return; }

    const emailRedirectTo = `${window.location.origin}/login`;
    const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password, options: { emailRedirectTo } });

    const identities = (data?.user as any)?.identities;
    const debugPayload = { supabaseUrl, projectRef, emailRedirectTo, returnedUserId: data?.user?.id ?? null, returnedSession: Boolean(data?.session), identitiesLen: Array.isArray(identities) ? identities.length : null, error: errInfo(error) };
    console.log("SIGNUP RESULT", { data, error, debug: debugPayload });
    setDebug(debugPayload);

    if (error) {
      if (isAlreadyRegisteredError(error)) {
        const { error: resendErr } = await supabase.auth.resend({ type: "signup", email: cleanEmail, options: { emailRedirectTo } });
        setLoading(false);
        if (!resendErr) { setMsg("Ese email ya tiene una cuenta. Te reenviamos la confirmación (revisá spam)."); return; }
        setErr(`No pude crear la cuenta. Detalle: ${String(resendErr.message ?? resendErr)}`); return;
      }
      setLoading(false); setErr(String(error.message ?? error)); return;
    }

    if (!data?.user?.id) { setLoading(false); setErr("No pude confirmar la creación del usuario. Contactá soporte."); return; }

    if (!data?.session) {
      setLoading(false);
      setPendingConfirmEmail(cleanEmail);
      setPendingRedirectTo(emailRedirectTo);
      setMsg("Cuenta creada. Revisá tu email y confirmá el acceso antes de iniciar sesión.");
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user?.id) { setLoading(false); setErr("La cuenta parece creada, pero no pude leer la sesión. Contactá soporte."); return; }

    setLoading(false);
    setMsg("Cuenta creada. Redirigiendo...");
    setTimeout(() => router.push("/"), 600);
  }

  async function onResendConfirmation() {
    if (!pendingConfirmEmail) return;
    setResendLoading(true); setErr(null); setMsg(null);
    const supabase = createClient();
    const emailRedirectTo = pendingRedirectTo || `${window.location.origin}/login`;
    const { error: resendErr } = await supabase.auth.resend({ type: "signup", email: pendingConfirmEmail, options: { emailRedirectTo } });
    setResendLoading(false);
    if (resendErr) { setErr(`No pude reenviar el email. Detalle: ${String(resendErr.message ?? resendErr)}`); return; }
    setMsg("Email reenviado. Revisá spam/promociones.");
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
          50% { transform: translate(-40px, 30px) scale(1.06); }
        }
        @keyframes blob2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(30px, -20px) scale(0.95); }
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
        <div style={{ flex: "0 0 54%", position: "relative", display: "flex", flexDirection: "column", padding: "48px 60px", overflow: "hidden" }}>

          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
            <div style={{ position: "absolute", top: "15%", right: "-5%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 60%)", animation: "blob1 22s ease-in-out infinite" }} />
            <div style={{ position: "absolute", bottom: "-5%", left: "-8%", width: "380px", height: "380px", borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.04) 0%, transparent 65%)", animation: "blob2 28s ease-in-out infinite" }} />
            <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)", backgroundSize: "64px 64px" }} />
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
              Nuevo acceso
            </p>

            <h2 className="fu2" style={{ fontFamily: "Georgia, serif", fontSize: "46px", fontWeight: 400, color: "#f0f0f0", lineHeight: 1.12, letterSpacing: "-1px", marginBottom: "24px" }}>
              Empieza a ver<br />tu negocio<br />
              <span style={{ color: "#1a2a1f" }}>con claridad.</span>
            </h2>

            <p className="fu3" style={{ fontSize: "13px", fontFamily: "sans-serif", fontWeight: 300, color: "#3a3a3a", lineHeight: 1.75, maxWidth: "300px" }}>
              CRM automático desde ManyChat.<br />
              Trazabilidad de revenue.<br />
              Proyecciones reales.
            </p>

            {/* Divider */}
            <div className="fu4" style={{ width: "40px", height: "0.5px", background: "#1a1a1a", margin: "36px 0" }} />

            {/* Steps */}
            <div className="fu5" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {[
                { n: "01", text: "Cuenta creada en 30 segundos" },
                { n: "02", text: "Conectás ManyChat con un webhook" },
                { n: "03", text: "Tu pipeline se gestiona solo" },
              ].map((s) => (
                <div key={s.n} style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                  <span style={{ fontFamily: "Georgia, serif", fontSize: "11px", color: "#22c55e", opacity: 0.5, flexShrink: 0, letterSpacing: "1px" }}>{s.n}</span>
                  <span style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#2e2e2e", letterSpacing: "0.3px" }}>{s.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: "10px", fontFamily: "sans-serif", fontWeight: 300, color: "#1a1a1a", letterSpacing: "1px", position: "relative", zIndex: 1 }}>
            © {new Date().getFullYear()} NOVA Scaling
          </p>

          <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "1px", background: "linear-gradient(to bottom, transparent 0%, #111 25%, #111 75%, transparent 100%)" }} />
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px 72px", position: "relative" }}>
          <div style={{ position: "absolute", bottom: "-5%", right: "-10%", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.03) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{ maxWidth: "340px", width: "100%" }}>
            <div className="fu1" style={{ marginBottom: "52px" }}>
              <h1 style={{ fontFamily: "Georgia, serif", fontSize: "30px", fontWeight: 400, color: "#f5f5f5", letterSpacing: "-0.3px", marginBottom: "10px" }}>
                Crear cuenta
              </h1>
              <p style={{ fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#333", letterSpacing: "0.2px" }}>
                Confirmá el email después de registrarte.
              </p>
            </div>

            <form onSubmit={onSubmit}>
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
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  style={inputStyle("password")}
                />
              </div>

              {err && (
                <div style={{ marginBottom: "24px", padding: "13px 16px", background: "rgba(239,68,68,0.04)", border: "0.5px solid rgba(239,68,68,0.12)", borderRadius: "8px", fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#ef4444", lineHeight: 1.5 }}>
                  {err}
                </div>
              )}

              {msg && (
                <div style={{ marginBottom: "24px", padding: "13px 16px", background: "rgba(34,197,94,0.04)", border: "0.5px solid rgba(34,197,94,0.12)", borderRadius: "8px", fontSize: "12px", fontFamily: "sans-serif", fontWeight: 300, color: "#4ade80", lineHeight: 1.5 }}>
                  {msg}
                </div>
              )}

              {pendingConfirmEmail && (
                <button
                  type="button"
                  onClick={onResendConfirmation}
                  disabled={resendLoading}
                  style={{ width: "100%", padding: "13px", borderRadius: "6px", background: "transparent", border: "0.5px solid #1a1a1a", color: resendLoading ? "#1f1f1f" : "#3a3a3a", fontSize: "10px", fontFamily: "sans-serif", fontWeight: 400, letterSpacing: "2.5px", textTransform: "uppercase", cursor: resendLoading ? "not-allowed" : "pointer", transition: "all 0.2s", marginBottom: "12px" }}
                >
                  {resendLoading ? "Reenviando…" : "Reenviar confirmación"}
                </button>
              )}

              <div className="fu4" style={{ marginBottom: "32px" }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: "100%", padding: "15px", borderRadius: "6px", background: loading ? "rgba(34,197,94,0.1)" : "#22c55e", border: "none", color: loading ? "#4ade80" : "#000", fontSize: "10px", fontFamily: "sans-serif", fontWeight: 600, letterSpacing: "3.5px", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.background = "#16a34a"; (e.currentTarget as HTMLButtonElement).style.letterSpacing = "4px"; } }}
                  onMouseLeave={(e) => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.background = "#22c55e"; (e.currentTarget as HTMLButtonElement).style.letterSpacing = "3.5px"; } }}
                >
                  {loading ? "Creando…" : "Crear cuenta"}
                </button>
              </div>

              <div className="fu5" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <a href="/login"
                  style={{ fontSize: "11px", fontFamily: "sans-serif", fontWeight: 300, color: "#252525", textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#22c55e")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#252525")}
                >
                  ← Ya tengo cuenta
                </a>
                <a href="/forgot-password"
                  style={{ fontSize: "11px", fontFamily: "sans-serif", fontWeight: 300, color: "#252525", textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#666")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#252525")}
                >
                  ¿Olvidaste la contraseña?
                </a>
              </div>

              {debug && (
                <details style={{ marginTop: "28px", background: "#080808", border: "0.5px solid #111", borderRadius: "6px", padding: "12px" }}>
                  <summary style={{ fontSize: "9px", fontFamily: "sans-serif", color: "#1f1f1f", cursor: "pointer", letterSpacing: "2px", textTransform: "uppercase" }}>Debug</summary>
                  <pre style={{ marginTop: "8px", fontSize: "10px", fontFamily: "monospace", color: "#2a2a2a", overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                    {JSON.stringify(debug, null, 2)}
                  </pre>
                </details>
              )}
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
