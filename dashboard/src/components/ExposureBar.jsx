import React from 'react'
import { RotateCcw, Clock } from 'lucide-react'

function fmtSeconds(s) {
  if (!s && s !== 0) return '0s'
  s = Math.floor(s)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${m}m ${sec}s`
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

export default function ExposureBar({ reading, onReset }) {
  if (!reading) {
    return (
      <div className="fresh-card rounded-3xl p-5 animate-pulse h-36" />
    )
  }

  const moderateSec = reading.moderate_s || 0
  const redSec = reading.red_s || 0
  const score = reading.score || 0
  const gasDose = reading.gas_dose_idx_h || 0

  return (
    <div className="fresh-card rounded-3xl p-5 shadow-md flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-[#e1dacb] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#edf4f9] text-[#1e4d6b] rounded-xl border border-[#d3e3ee]">
            <Clock size={16} />
          </div>
          <span className="text-xs font-extrabold text-[#112331] uppercase tracking-wider">Today's Dose & Exposure</span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-[11px] text-[#64748b] hover:text-rose-700 font-bold bg-white border border-[#d6cdbc] rounded-xl px-2.5 py-1 transition-all shadow-sm"
        >
          <RotateCcw size={12} />
          Reset
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-[#b45309]">🟡 Moderate-level time</span>
            <span className="text-[#1e293b] font-mono">{fmtSeconds(moderateSec)}</span>
          </div>
          <div className="h-2.5 bg-[#f5efe3] rounded-full overflow-hidden border border-[#e1dacb]">
            <div className="h-full bg-[#f59e0b] rounded-full" style={{ width: `${Math.min((moderateSec / 3600) * 100, 100)}%` }} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-[#be123c]">🔴 Unhealthy-level time</span>
            <span className="text-[#1e293b] font-mono">{fmtSeconds(redSec)}</span>
          </div>
          <div className="h-2.5 bg-[#f5efe3] rounded-full overflow-hidden border border-[#e1dacb]">
            <div className="h-full bg-[#e11d48] rounded-full" style={{ width: `${Math.min((redSec / 3600) * 100, 100)}%` }} />
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap pt-1">
        <div className="flex items-center gap-1.5 bg-white border border-[#e1dacb] rounded-xl px-3 py-1.5 shadow-sm">
          <span className="text-xs font-semibold text-[#64748b]">Score:</span>
          <span className="text-xs font-black text-[#1e293b]">{Number(score).toFixed(3)}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-[#e1dacb] rounded-xl px-3 py-1.5 shadow-sm">
          <span className="text-xs font-semibold text-[#64748b]">Gas Dose:</span>
          <span className="text-xs font-black text-[#1e4d6b]">{Number(gasDose).toFixed(3)} idx·h</span>
        </div>
      </div>
    </div>
  )
}
