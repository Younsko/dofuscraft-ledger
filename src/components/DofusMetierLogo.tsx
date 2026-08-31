import React from 'react'

interface DofusMetierLogoProps {
  className?: string
  size?: number
}

export const DofusMetierLogo: React.FC<DofusMetierLogoProps> = ({
  className = '',
  size = 38
}) => {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 group ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Background Magical Ambient Halo */}
      <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/30 via-yellow-500/20 to-amber-500/30 rounded-xl blur-sm group-hover:blur-md transition" />

      {/* Hexagonal / Rounded Dark Box with Golden Border */}
      <div className="relative w-full h-full bg-[#161b22] border-2 border-[#eab308] rounded-xl flex items-center justify-center shadow-md overflow-hidden p-1">
        {/* Subtle radial glow behind the Gelano */}
        <div className="absolute inset-0 bg-radial from-pink-500/25 via-transparent to-transparent opacity-80" />

        {/* Authentic Dofus 3 Gelano Icon */}
        <img
          src="https://api.dofusdu.de/dofus3/v1/img/item/9047-128.png"
          alt="Gelano Logo"
          className="w-full h-full object-contain relative z-10 filter drop-shadow-md group-hover:scale-110 transition duration-200"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://api.dofusdu.de/dofus3/v1/img/item/9047-64.png'
          }}
        />
      </div>

      {/* Little floating PA Sparkle */}
      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full border border-slate-900 shadow-sm animate-pulse" />
    </div>
  )
}
