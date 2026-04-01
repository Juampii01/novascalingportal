"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { NovaLogo } from "./nova-logo"

interface SidebarProps {
  open: boolean
  onClose: () => void
  isAdmin?: boolean
}

const principalItems = [
  { name: "Overview", href: "/overview" },
  { name: "Adquisición", href: "/acquisition" },
  { name: "Ventas", href: "/sales" },
  { name: "Trazabilidad", href: "/traceability" },
  { name: "Proyecciones", href: "/projections" },
  { name: "Visibilidad", href: "/visibility" },
]

const herramientasItems = [
  { name: "EOD Diario", href: "/eod" },
  { name: "Carousel Studio", href: "/carousel-studio" },
  { name: "Auditoría IA", href: "/audit" },
  { name: "Market Intel", href: "/market-intelligence" },
  { name: "Checklist", href: "/program-checklist" },
  { name: "Calendario", href: "/calendar" },
]

const configuracionItems = [
  { name: "Mi perfil", href: "/profile" },
  { name: "Ajustes", href: "/settings" },
]

const adminItems = [
  { name: "Todos los clientes", href: "/admin" },
  { name: "Onboarding", href: "/admin/onboarding" },
  { name: "Nova Overview", href: "/nova-overview" },
]

function NavSection({
  title,
  items,
  pathname,
  onClose,
}: {
  title: string
  items: { name: string; href: string }[]
  pathname: string
  onClose: () => void
}) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <p
        style={{
          fontSize: "9px",
          fontFamily: "sans-serif",
          fontWeight: 500,
          letterSpacing: "3px",
          color: "#4ade80",
          textTransform: "uppercase",
          padding: "0 16px",
          marginBottom: "6px",
        }}
      >
        {title}
      </p>
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
        return (
          <Link key={item.href} href={item.href} onClick={onClose}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 16px",
                borderLeft: isActive ? "1.5px solid #22c55e" : "1.5px solid transparent",
                background: isActive ? "rgba(34,197,94,0.06)" : "transparent",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {isActive && (
                <span
                  style={{
                    width: "3px",
                    height: "3px",
                    borderRadius: "50%",
                    background: "#22c55e",
                    flexShrink: 0,
                  }}
                />
              )}
              <span
                style={{
                  fontSize: "13px",
                  fontFamily: "sans-serif",
                  fontWeight: isActive ? 500 : 400,
                  letterSpacing: "0.3px",
                  color: isActive ? "#f5f5f5" : "#aaaaaa",
                  paddingLeft: isActive ? "0" : "13px",
                  transition: "color 0.15s ease",
                  lineHeight: 1,
                }}
              >
                {item.name}
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export function Sidebar({ open, onClose, isAdmin = false }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.8)" }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 50,
          height: "100%",
          width: "220px",
          background: "#080808",
          borderRight: "0.5px solid #111111",
          display: "flex",
          flexDirection: "column",
          transition: "transform 0.2s ease",
          transform: open ? "translateX(0)" : undefined,
        }}
        className={!open ? "max-lg:-translate-x-full" : ""}
      >
        {/* Logo */}
        <div
          style={{
            padding: "28px 20px 24px",
            borderBottom: "0.5px solid #111",
          }}
        >
          <NovaLogo size="md" />
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: "auto", paddingTop: "24px" }}>
          <NavSection
            title="Principal"
            items={principalItems}
            pathname={pathname}
            onClose={onClose}
          />
          <div
            style={{
              height: "0.5px",
              background: "#111",
              margin: "0 16px 24px",
            }}
          />
          <NavSection
            title="Herramientas"
            items={herramientasItems}
            pathname={pathname}
            onClose={onClose}
          />
          <div
            style={{
              height: "0.5px",
              background: "#111",
              margin: "0 16px 24px",
            }}
          />
          <NavSection
            title="Configuración"
            items={configuracionItems}
            pathname={pathname}
            onClose={onClose}
          />
          {isAdmin && (
            <>
              <div
                style={{
                  height: "0.5px",
                  background: "#111",
                  margin: "0 16px 24px",
                }}
              />
              <NavSection
                title="Admin"
                items={adminItems}
                pathname={pathname}
                onClose={onClose}
              />
            </>
          )}
        </nav>

        {/* Footer */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "0.5px solid #111",
          }}
        >
          <p
            style={{
              fontSize: "9px",
              fontFamily: "sans-serif",
              fontWeight: 300,
              letterSpacing: "3px",
              color: "#444",
            }}
          >
            NOVA SCALING · v1.0.0
          </p>
        </div>
      </aside>
    </>
  )
}
