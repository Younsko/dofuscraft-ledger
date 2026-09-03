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
      {/* Crisp Solid Dark Box with Gold Border */}
      <div className="relative w-full h-full bg-[#14171d] border border-[#d97706] rounded-lg flex items-center justify-center overflow-hidden p-1">
        {/* Dofus Gelano Icon */}
        <img
          src="https://api.dofusdu.de/dofus3/v1/img/item/9047-128.png"
          alt="Gelano Logo"
          className="w-full h-full object-contain relative z-10"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://api.dofusdu.de/dofus3/v1/img/item/9047-64.png'
          }}
        />
      </div>
    </div>
  )
}
