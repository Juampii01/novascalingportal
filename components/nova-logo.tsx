"use client"

interface NovaLogoProps {
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
}

export function NovaLogo({ size = "md", className = "" }: NovaLogoProps) {
  const config = {
    xs: { novaSize: "12px", novaTk: "5px", lineW: "8px", mx: "10px", scalingSize: "7px", scalingTk: "2px" },
    sm: { novaSize: "15px", novaTk: "6px", lineW: "12px", mx: "12px", scalingSize: "8px", scalingTk: "2.5px" },
    md: { novaSize: "20px", novaTk: "8px", lineW: "16px", mx: "14px", scalingSize: "10px", scalingTk: "3px" },
    lg: { novaSize: "30px", novaTk: "12px", lineW: "22px", mx: "18px", scalingSize: "13px", scalingTk: "4px" },
  }
  const c = config[size]

  return (
    <div className={`flex items-center ${className}`}>
      <span
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: c.novaSize,
          fontWeight: 400,
          color: "#f5f5f5",
          letterSpacing: c.novaTk,
          lineHeight: 1,
        }}
      >
        NOVA
      </span>
      <div
        style={{
          width: c.lineW,
          height: "0.5px",
          background: "#22c55e",
          opacity: 0.65,
          marginLeft: c.mx,
          marginRight: c.mx,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: "'Helvetica Neue', Helvetica, sans-serif",
          fontSize: c.scalingSize,
          fontWeight: 400,
          color: "#22c55e",
          letterSpacing: c.scalingTk,
          lineHeight: 1,
        }}
      >
        SCALING
      </span>
    </div>
  )
}
