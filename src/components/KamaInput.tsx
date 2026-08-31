import React, { useState, useEffect } from 'react'
import { Coins } from 'lucide-react'
import { formatKamas, parseKamaInput } from '../utils/formatters'

interface KamaInputProps {
  value: number
  onChange: (value: number) => void
  placeholder?: string
  label?: string
  className?: string
  showPresets?: boolean
}

export const KamaInput: React.FC<KamaInputProps> = ({
  value,
  onChange,
  placeholder = 'Ex: 1.5m ou 500k',
  label,
  className = '',
  showPresets = true
}) => {
  const [text, setText] = useState<string>(value > 0 ? value.toString() : '')

  useEffect(() => {
    // Sync external value changes if not matching parsed
    if (value !== parseKamaInput(text)) {
      setText(value > 0 ? value.toString() : '')
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setText(raw)
    const parsed = parseKamaInput(raw)
    onChange(parsed)
  }

  const addAmount = (delta: number) => {
    const current = parseKamaInput(text)
    const next = current + delta
    setText(next.toString())
    onChange(next)
  }

  const parsedVal = parseKamaInput(text)

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-amber-300/80">
          <span>{label}</span>
          {parsedVal > 0 && (
            <span className="font-mono text-amber-400 font-normal normal-case text-xs">
              = {formatKamas(parsedVal)}
            </span>
          )}
        </label>
      )}

      <div className="relative flex items-center">
        <div className="absolute left-3 flex items-center pointer-events-none text-amber-500">
          <Coins className="w-4 h-4" />
        </div>

        <input
          type="text"
          value={text}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full pl-9 pr-12 py-2.5 bg-slate-900/90 border border-slate-700/80 hover:border-amber-500/50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-slate-100 placeholder-slate-500 font-mono text-sm transition-all"
        />

        <div className="absolute right-3 text-xs font-bold text-amber-500/80 pointer-events-none">
          K
        </div>
      </div>

      {showPresets && (
        <div className="flex flex-wrap gap-1 pt-1">
          <button
            type="button"
            onClick={() => addAmount(10000)}
            className="px-2 py-0.5 text-[11px] font-mono bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-amber-300 rounded border border-slate-700 transition"
          >
            +10k
          </button>
          <button
            type="button"
            onClick={() => addAmount(100000)}
            className="px-2 py-0.5 text-[11px] font-mono bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-amber-300 rounded border border-slate-700 transition"
          >
            +100k
          </button>
          <button
            type="button"
            onClick={() => addAmount(500000)}
            className="px-2 py-0.5 text-[11px] font-mono bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-amber-300 rounded border border-slate-700 transition"
          >
            +500k
          </button>
          <button
            type="button"
            onClick={() => addAmount(1000000)}
            className="px-2 py-0.5 text-[11px] font-mono bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 rounded border border-amber-800/60 transition"
          >
            +1M
          </button>
          <button
            type="button"
            onClick={() => addAmount(10000000)}
            className="px-2 py-0.5 text-[11px] font-mono bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 rounded border border-amber-800/60 transition"
          >
            +10M
          </button>
        </div>
      )}
    </div>
  )
}
