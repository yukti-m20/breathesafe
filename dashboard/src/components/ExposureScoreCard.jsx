import React from 'react'
import { Clock, Flame, HeartPulse, Languages } from 'lucide-react'

export default function ExposureScoreCard({ scoreData, mode }) {
  if (!scoreData) {
    return (
      <div className="fresh-card rounded-3xl p-6 animate-pulse h-48" />
    )
  }

  const score = scoreData.score || 0
  const scoreColor = score > 6 ? 'text-[#be123c]' : score > 3.5 ? 'text-[#b45309]' : 'text-[#047857]'
  const scoreBg = score > 6 ? 'bg-[#ffe4e6] border-[#fecdd3]' : score > 3.5 ? 'bg-[#fef3c7] border-[#fde68a]' : 'bg-[#d1fae5] border-[#a7f3d0]'

  return (
    <div className="fresh-card rounded-3xl p-6 shadow-lg flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-[#e1dacb] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-[#edf4f9] text-[#1e4d6b] rounded-2xl border border-[#d3e3ee]">
            <HeartPulse size={22} />
          </div>
          <div>
            <h3 className="font-extrabold text-[#112331] text-base">Time-Weighted Exposure Score</h3>
            <p className="text-xs text-[#64748b] font-medium">Integrated pulmonary inhalation adjusted for {mode.toUpperCase()}</p>
          </div>
        </div>

        {/* Big Score badge */}
        <div className={`px-4 py-1.5 rounded-full border flex items-center gap-2 shadow-sm ${scoreBg}`}>
          <span className="text-xs text-[#52525b] font-bold uppercase">Daily Score</span>
          <span className={`text-xl font-black ${scoreColor}`}>{score} / 10</span>
        </div>
      </div>

      {/* Primary Headline Outputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white/90 border border-[#e1dacb] rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 bg-[#ffe4e6] text-[#be123c] rounded-2xl border border-[#fecdd3]">
            <Clock size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[#64748b] uppercase font-bold tracking-wider">Unhealthy Air Inhaled</span>
            <span className="text-lg font-black text-[#be123c]">{scoreData.unhealthy_air_text}</span>
            <span className="text-[10px] text-[#71717a]">Exceeded {mode} safe limit thresholds</span>
          </div>
        </div>

        <div className="bg-white/90 border border-[#e1dacb] rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 bg-[#fef3c7] text-[#b45309] rounded-2xl border border-[#fde68a]">
            <Flame size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[#64748b] uppercase font-bold tracking-wider">Heat-Stress Duration</span>
            <span className="text-lg font-black text-[#b45309]">{scoreData.heat_stress_text}</span>
            <span className="text-[10px] text-[#71717a]">HI &gt; 30°C thermal cardiovascular load</span>
          </div>
        </div>
      </div>

      {/* Hindi Daily Summary */}
      {scoreData.hindi_summary && (
        <div className="bg-gradient-to-r from-[#faecd6]/80 via-white/80 to-[#dbeae0]/80 border border-[#e1dacb] rounded-2xl p-4 flex items-start gap-3 shadow-sm">
          <div className="p-1.5 bg-[#d4a373]/20 text-[#8c6b32] rounded-xl shrink-0 mt-0.5">
            <Languages size={16} />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-[#8c6b32]">दैनिक वायु सारांश (Hindi Summary):</span>
            <p className="text-xs text-[#334155] leading-relaxed font-medium">{scoreData.hindi_summary}</p>
          </div>
        </div>
      )}
    </div>
  )
}
