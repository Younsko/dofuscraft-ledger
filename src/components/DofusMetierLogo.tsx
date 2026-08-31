import React from 'react'

interface DofusMetierLogoProps {
  className?: string
  size?: number
}

export const DofusMetierLogo: React.FC<DofusMetierLogoProps> = ({
  className = '',
  size = 36
}) => {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer Hexagonal Metallic Shield with Gold Borders */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="shieldGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>
          <linearGradient id="shieldBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e232d" />
            <stop offset="100%" stopColor="#0d1117" />
          </linearGradient>
          <linearGradient id="hammerSilver" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
          <radialGradient id="eggGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Shield Body */}
        <polygon
          points="50,4 92,25 92,72 50,96 8,72 8,25"
          fill="url(#shieldBg)"
          stroke="url(#shieldGold)"
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* Inner Crest Line */}
        <polygon
          points="50,11 85,28 85,68 50,89 15,68 15,28"
          fill="none"
          stroke="#ca8a04"
          strokeWidth="1.5"
          strokeDasharray="4 2"
          opacity="0.6"
        />

        {/* Dofus Egg Glow in Background */}
        <ellipse cx="50" cy="50" rx="20" ry="25" fill="url(#eggGlow)" />

        {/* Anvil Base (Forgemagie / Métier) */}
        <path
          d="M32 68 L68 68 L64 74 L36 74 Z"
          fill="#475569"
          stroke="#1e293b"
          strokeWidth="1.5"
        />
        <path
          d="M36 62 L64 62 L68 68 L32 68 Z"
          fill="#334155"
        />

        {/* Crossed Craftsman Tools: Forging Hammer & Rune Wand */}
        {/* Hammer */}
        <g transform="rotate(-30 50 50)">
          {/* Handle */}
          <rect x="47" y="24" width="6" height="42" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="1" />
          {/* Metal Ring Grip */}
          <rect x="46" y="52" width="8" height="4" rx="1" fill="url(#shieldGold)" />
          {/* Hammer Head */}
          <path
            d="M38 22 L62 22 L64 34 L36 34 Z"
            fill="url(#hammerSilver)"
            stroke="#334155"
            strokeWidth="1.5"
          />
          {/* Hammer Bevel */}
          <polygon points="38,22 42,18 58,18 62,22" fill="#f8fafc" />
        </g>

        {/* Golden Rune / Sparkles Motif */}
        <circle cx="50" cy="50" r="4" fill="#fef08a" />
        <path d="M50 40 L50 60 M40 50 L60 50" stroke="#fde047" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="70" cy="30" r="1.5" fill="#fef08a" />
        <circle cx="28" cy="34" r="1.2" fill="#fef08a" />
        <circle cx="72" cy="62" r="1.2" fill="#fef08a" />
      </svg>
    </div>
  )
}
