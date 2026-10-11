import React from 'react'
import { RotateCcw, Clock, Wind, Radio, ShieldAlert } from 'lucide-react'

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
  const isStandby = !reading

  const moderateSec = reading?.moderate_s || 0
  const redSec = reading?.red_s || 0
  const score = reading?.score || 0
  const gasDose = reading?.gas_dose_idx_h || 0

  return (
    <div className="fresh-card rounded-3xl p-5 shadow-sm border border-[#e1dacb] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e1dacb] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#edf4f9] text-[#1e4d6b] rounded-xl border border-[#d3e3ee]">
            <Clock size={16} />
          </div>
          <div>
            <span className="text-xs font-black text-[#112331] uppercase tracking-wider block">
              Today's Air Exposure & Inhalation Dose
            </span>
            <span className="text-[10px] text-[#78716c] font-medium">
              दैनिक वायु प्रदूषण समय और विषाक्त गैस खुराक (Air Track)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isStandby ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f1ebd9] text-[#785b2e] border border-[#d8cdb8] flex items-center gap-1">
              <Radio size={9} className="animate-pulse" />
              STANDBY
            </span>
          ) : (
            <button
              onClick={onReset}
              className="flex items-center gap-1 text-[11px] text-[#64748b] hover:text-rose-700 font-bold bg-white border border-[#d6cdbc] rounded-xl px-2.5 py-1 transition-all shadow-2xs"
            >
              <RotateCcw size={12} />
              Reset Daily Dose
            </button>
          )}
        </div>
      </div>

      {/* Exposure Duration Bars */}
      <div className="flex flex-col gap-3">
        {/* Moderate Exposure Bar */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-[#b45309] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
              Moderate Air Risk Time (Gas Index 1.5 – 2.5×)
            </span>
            <span className="text-[#1e293b] font-mono">
              {isStandby ? '0s (Standby)' : fmtSeconds(moderateSec)}
            </span>
          </div>
          <div className="h-2.5 bg-[#f5efe3] rounded-full overflow-hidden border border-[#e1dacb]">
            <div
              className="h-full bg-[#f59e0b] rounded-full transition-all duration-500"
              style={{ width: `${Math.min((moderateSec / 3600) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Hazardous Exposure Bar */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-[#be123c] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#e11d48]" />
              Unhealthy / Hazardous Air Time (Gas Index &gt; 2.5×)
            </span>
            <span className="text-[#1e293b] font-mono">
              {isStandby ? '0s (Standby)' : fmtSeconds(redSec)}
            </span>
          </div>
          <div className="h-2.5 bg-[#f5efe3] rounded-full overflow-hidden border border-[#e1dacb]">
            <div
              className="h-full bg-[#e11d48] rounded-full transition-all duration-500"
              style={{ width: `${Math.min((redSec / 3600) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Aggregate Score Chips & Standby Banner */}
      <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-white border border-[#e1dacb] rounded-xl px-3 py-1.5 shadow-2xs">
            <span className="text-xs font-semibold text-[#64748b]">Air Score:</span>
            <span className="text-xs font-black text-[#1e293b]">
              {isStandby ? '0.000' : Number(score).toFixed(3)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-[#e1dacb] rounded-xl px-3 py-1.5 shadow-2xs">
            <span className="text-xs font-semibold text-[#64748b]">Cumulative Dose:</span>
            <span className="text-xs font-black text-[#1e4d6b]">
              {isStandby ? '0.000' : Number(gasDose).toFixed(3)} idx·h
            </span>
          </div>
        </div>

        {isStandby && (
          <span className="text-[10px] text-[#78716c] font-medium">
            Time-weighted accumulation activates upon connection
          </span>
        )}
      </div>
    </div>
  )
}
