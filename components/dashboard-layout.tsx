"use client"

import type React from "react"

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabaseClient"
import { ChevronDown, LogOut, Menu, User } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { AnnualMetricsProvider } from "@/components/annual-metrics-context"
import { DEMO_CLIENT_ID } from "@/lib/demo-data"
import { ToastProvider } from "@/components/toast"
import { useRealtimeAlerts } from "@/hooks/useRealtimeAlerts"
import { FloatingChat } from "@/components/floating-chat"

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true"

const SelectedMonthContext = createContext<string | null>(null)

export function useSelectedMonth() {
  return useContext(SelectedMonthContext)
}

const ActiveClientContext = createContext<string | null>(null)

export function useActiveClient() {
  return useContext(ActiveClientContext)
}

const UserRoleContext = createContext<string | null>(null)

export function useUserRole() {
  return useContext(UserRoleContext)
}

function getRoleFromAccessToken(token: string | null | undefined): string | null {
  if (!token) return null
  try {
    const payload = token.split(".")[1]
    if (!payload) return null
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")))
    const appRole = json?.app_metadata?.role
    const userRole = json?.user_metadata?.role
    return (appRole ?? userRole ?? null) as string | null
  } catch {
    return null
  }
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    if (typeof window === "undefined") return new Date().toISOString().slice(0, 7)
    return window.localStorage.getItem("selectedMonth") ?? new Date().toISOString().slice(0, 7)
  })

  const [enabledMonths, setEnabledMonths] = useState<string[]>([])
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [ownClientId, setOwnClientId] = useState<string | null>(null)
  const [activeClientId, setActiveClientId] = useState<string | null>(null)
  const [profilesList, setProfilesList] = useState<
    Array<{ id: string; client_id: string; role: string | null; client_name: string }>
  >([])
  const isAdmin = (userRole ?? "").toLowerCase() === "admin"
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let mounted = true

    const loadEnabledMonths = async () => {
      if (IS_DEMO) return // months set in demo block above
      try {
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser()

        if (userErr) throw userErr
        if (!user) return

        const clientId = activeClientId
        if (!clientId) return

        const { data: rows, error: rErr } = await supabase
          .from("monthly_reports")
          .select("month")
          .eq("client_id", clientId)
          .order("month", { ascending: true })

        if (rErr) throw rErr

        const months = Array.from(
          new Set(
            (rows ?? [])
              .map((r: any) => {
                const raw = r?.month
                const s = raw instanceof Date ? raw.toISOString() : String(raw ?? "")
                return s.slice(0, 7)
              })
              .filter((m: string) => /^\d{4}-\d{2}$/.test(m))
          )
        ).sort()

        if (!mounted) return

        setEnabledMonths(months)

        if (months.length) {
          setSelectedMonth((prev) => {
            const next = months.includes(prev) ? prev : months[months.length - 1]
            if (typeof window !== "undefined") window.localStorage.setItem("selectedMonth", next)
            return next
          })
        }
      } catch (err) {
        console.error("Failed to load enabled months", err)
        if (mounted) setEnabledMonths([])
      }
    }

    loadEnabledMonths()

    return () => {
      mounted = false
    }
  }, [activeClientId])

  useEffect(() => {
    if (IS_DEMO) {
      setUserEmail("demo@novascaling.com")
      setUserRole("client")
      setOwnClientId(DEMO_CLIENT_ID)
      setActiveClientId(DEMO_CLIENT_ID)
      setEnabledMonths(["2026-03"])
      setSelectedMonth("2026-03")
      return
    }

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.replace("/login")
        return
      }

      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      })

      const jwtRole = getRoleFromAccessToken(session.access_token)

      const { data, error } = await supabase.auth.getUser()

      if (!error && data?.user?.email) {
        setUserEmail(data.user.email)
      }

      if (error || !data?.user) {
        await supabase.auth.signOut()
        router.replace("/login")
        return
      }

      const userId = data.user.id

      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("client_id, role")
        .eq("id", userId)
        .maybeSingle()

      if (!profErr && prof) {
        const cid = (prof as any)?.client_id as string | undefined
        const role = (prof as any)?.role as string | undefined
        setOwnClientId(cid ?? null)
        setUserRole(role ?? jwtRole ?? null)

        const stored =
          typeof window !== "undefined" ? window.localStorage.getItem("activeClientId") : null

        // Validar que el stored client_id no es basura (debe ser UUID válido)
        const isValidUUID = stored ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stored) : false
        const storedIsValid = isValidUUID && stored !== "demo"

        // Para admin: solo usar el stored si es el client_id de OTRO usuario (no el suyo propio)
        // Si el admin tiene guardado su propio client_id, se ignora para que ensureAdminActiveClient
        // elija automáticamente el primer cliente real.
        const roleIsAdmin = String(role ?? "").toLowerCase() === "admin"
        const storedIsAnotherClient = storedIsValid && stored !== cid
        const nextActive = roleIsAdmin && storedIsAnotherClient ? stored : (!roleIsAdmin ? cid ?? null : null)

        // Limpiar localStorage si el valor era inválido o si el admin tenía su propio ID guardado
        if (stored && (!storedIsValid || (roleIsAdmin && stored === cid)) && typeof window !== "undefined") {
          window.localStorage.removeItem("activeClientId")
        }

        setActiveClientId(nextActive)
      } else {
        setOwnClientId(null)
        setUserRole(jwtRole ?? null)
        setActiveClientId(null)
      }
    }

    checkSession()
  }, [router])

  useEffect(() => {
    let alive = true

    async function loadProfilesForAdmin() {
      try {
        if (!isAdmin) {
          if (alive) setProfilesList([])
          return
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("id, client_id, role, name")
          .order("id", { ascending: false })

        if (error) throw error

        const list = (data ?? []) as any[]
        if (alive) {
          const nextProfiles = list.map((p: any) => ({
            id: String(p.id),
            client_id: p?.client_id ? String(p.client_id) : "",
            role: p.role ?? null,
            client_name: p?.name
              ? String(p.name)
              : p?.client_id
                ? "Cliente " + String(p.client_id).slice(0, 8)
                : "Perfil sin cliente",
          }))

          setProfilesList(nextProfiles)
          ensureAdminActiveClient(nextProfiles)
        }
      } catch (e) {
        const err: any = e
        console.error("Failed to load profiles list", {
          message: err?.message,
          code: err?.code,
          details: err?.details,
          hint: err?.hint,
        })
        if (alive) setProfilesList([])
      }
    }

    function ensureAdminActiveClient(
      nextProfiles: Array<{ id: string; client_id: string; role: string | null; client_name: string }>
    ) {
      if (!isAdmin) return
      if (activeClientId) return

      // Skip admin-role profiles — only auto-select actual client profiles
      const firstValid = nextProfiles.find(
        (p) => Boolean(p.client_id) && String(p.role ?? "").toLowerCase() !== "admin"
      )
      if (!firstValid?.client_id) return

      setActiveClientId(firstValid.client_id)
      if (typeof window !== "undefined") {
        window.localStorage.setItem("activeClientId", firstValid.client_id)
      }
    }

    loadProfilesForAdmin()
    return () => {
      alive = false
    }
  }, [isAdmin, activeClientId])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfileMenuOpen(false)
    }

    const onMouseDown = (e: MouseEvent) => {
      const el = profileMenuRef.current
      if (!el) return
      if (!el.contains(e.target as Node)) setProfileMenuOpen(false)
    }

    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("mousedown", onMouseDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("mousedown", onMouseDown)
    }
  }, [])

  const activeClientName = useMemo(() => {
    if (!activeClientId) return null
    const match = profilesList.find((p) => p.client_id === activeClientId)
    return match?.client_name ?? null
  }, [activeClientId, profilesList])

  if (typeof window !== "undefined") {
    ;(window as any).__DEBUG_DASHBOARD_CTX = {
      activeClientId,
      ownClientId,
      userRole,
      userEmail,
    }
  }

  return (
    <ToastProvider>
    <div
      className="dark"
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#080808",
      }}
    >
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isAdmin={isAdmin} />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          marginLeft: "220px",
        }}
        className="max-lg:ml-0"
      >
        {/* Header */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "#080808",
            borderBottom: "0.5px solid #111",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 32px",
            height: "56px",
          }}
        >
          {/* Mobile menu button */}
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#555",
              padding: "4px",
            }}
          >
            <Menu size={18} />
          </button>

          <div style={{ flex: 1 }} />

          {/* Month selector */}
          {enabledMonths.length > 0 && (
            <div style={{ marginRight: "12px" }}>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  const m = e.target.value
                  setSelectedMonth(m)
                  if (typeof window !== "undefined") window.localStorage.setItem("selectedMonth", m)
                }}
                style={{
                  background: "rgba(34,197,94,0.06)",
                  border: "0.5px solid rgba(34,197,94,0.3)",
                  borderRadius: "8px",
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontFamily: "sans-serif",
                  fontWeight: 400,
                  color: "#4ade80",
                  letterSpacing: "0.5px",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {enabledMonths.map((m) => {
                  const [y, mo] = m.split("-")
                  const label = new Date(Number(y), Number(mo) - 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" })
                  return <option key={m} value={m} style={{ background: "#0d0d0d", color: "#f5f5f5" }}>{label}</option>
                })}
              </select>
            </div>
          )}

          {/* Profile menu */}
          <div style={{ position: "relative" }} ref={profileMenuRef}>
            <button
              onClick={() => setProfileMenuOpen((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "transparent",
                border: "0.5px solid #1a1a1a",
                borderRadius: "8px",
                padding: "6px 12px",
                cursor: "pointer",
                color: "#9ca3af",
                transition: "border-color 0.2s",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: "rgba(34,197,94,0.08)",
                  border: "0.5px solid rgba(34,197,94,0.2)",
                }}
              >
                <User size={12} color="#22c55e" />
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontFamily: "sans-serif",
                  fontWeight: 300,
                  letterSpacing: "1px",
                  color: "#9ca3af",
                  maxWidth: "140px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {activeClientName ?? userEmail ?? "—"}
              </span>
              <ChevronDown size={12} color="#555" />
            </button>

            {profileMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  marginTop: "6px",
                  width: "240px",
                  background: "#0d0d0d",
                  border: "0.5px solid #1a1a1a",
                  borderRadius: "10px",
                  overflow: "hidden",
                  zIndex: 100,
                }}
              >
                <div style={{ padding: "12px 14px" }}>
                  <p
                    style={{
                      fontSize: "8px",
                      color: "#333",
                      fontFamily: "sans-serif",
                      letterSpacing: "3px",
                      textTransform: "uppercase",
                      marginBottom: "4px",
                    }}
                  >
                    Cuenta
                  </p>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#9ca3af",
                      fontFamily: "sans-serif",
                      fontWeight: 300,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {userEmail ?? "—"}
                  </p>
                </div>

                <div style={{ height: "0.5px", background: "#111" }} />

                {isAdmin && profilesList.length > 0 && (
                  <>
                    <div style={{ padding: "8px 14px 4px" }}>
                      <p
                        style={{
                          fontSize: "8px",
                          color: "#333",
                          fontFamily: "sans-serif",
                          letterSpacing: "3px",
                          textTransform: "uppercase",
                        }}
                      >
                        Cambiar cliente
                      </p>
                    </div>
                    <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                      {profilesList.map((p) => {
                        const isSelectable = Boolean(p.client_id)
                        const isActive = Boolean(p.client_id) && activeClientId === p.client_id
                        return (
                          <button
                            key={p.id}
                            type="button"
                            disabled={!isSelectable}
                            onClick={() => {
                              if (!p.client_id) return
                              setActiveClientId(p.client_id)
                              if (typeof window !== "undefined")
                                window.localStorage.setItem("activeClientId", p.client_id)
                              setProfileMenuOpen(false)
                            }}
                            style={{
                              display: "flex",
                              width: "100%",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "8px 14px",
                              background: isActive ? "rgba(34,197,94,0.06)" : "transparent",
                              border: "none",
                              cursor: isSelectable ? "pointer" : "not-allowed",
                              opacity: isSelectable ? 1 : 0.4,
                              transition: "background 0.15s",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "11px",
                                fontFamily: "sans-serif",
                                fontWeight: 300,
                                color: isActive ? "#f5f5f5" : "#9ca3af",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {p.client_name}
                            </span>
                            {isActive && (
                              <span
                                style={{
                                  fontSize: "8px",
                                  color: "#22c55e",
                                  fontFamily: "sans-serif",
                                  letterSpacing: "2px",
                                }}
                              >
                                ACTIVO
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                    <div style={{ height: "0.5px", background: "#111" }} />
                  </>
                )}

                <button
                  type="button"
                  onClick={async () => {
                    await supabase.auth.signOut()
                    setProfileMenuOpen(false)
                    router.replace("/login")
                  }}
                  style={{
                    display: "flex",
                    width: "100%",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 14px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#ef4444",
                    transition: "background 0.15s",
                  }}
                >
                  <LogOut size={12} color="#ef4444" />
                  <span
                    style={{
                      fontSize: "11px",
                      fontFamily: "sans-serif",
                      fontWeight: 300,
                      letterSpacing: "1px",
                    }}
                  >
                    Cerrar sesión
                  </span>
                </button>
              </div>
            )}
          </div>
        </header>

        <ActiveClientContext.Provider value={activeClientId}>
          <UserRoleContext.Provider value={userRole}>
          <AnnualMetricsProvider>
            <SelectedMonthContext.Provider value={selectedMonth}>
              <RealtimeAlertsListener clientId={activeClientId} />
              <FloatingChat />
              <main
                style={{
                  flex: 1,
                  padding: "32px",
                }}
              >
                {children}
              </main>
            </SelectedMonthContext.Provider>
          </AnnualMetricsProvider>
          </UserRoleContext.Provider>
        </ActiveClientContext.Provider>
      </div>
    </div>
    </ToastProvider>
  )
}

// ─── Realtime alerts listener ─────────────────────────────────────────────────
// Lives inside ToastProvider so it can call useToast()
function RealtimeAlertsListener({ clientId }: { clientId: string | null }) {
  useRealtimeAlerts(clientId)
  return null
}
