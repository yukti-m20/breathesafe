import React from 'react'
import { Compass, AlertOctagon, CheckCircle2, ShieldAlert } from 'lucide-react'

export default function BestWindowPlanner({ windows, alerts, mode }) {
  if (!windows) {
    return (
      <div className="fresh-card rounded-3xl p-6 animate-pulse h-48" />
    )
  }

  return (
    <div className="fresh-card rounded-3xl p-6 shadow-lg flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-[#e1dacb] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-[#edf4f9] text-[#1e4d6b] rounded-2xl border border-[#d3e3ee]">
            <Compass size={22} />
          </div>
          <div>
            <h3 className="font-extrabold text-[#112331] text-base">48-Hour Best-Window Planner</h3>
            <p className="text-xs text-[#64748b] font-medium">Activity schedule optimization tailored for {mode.toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Recommended vs Avoid Windows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="bg-[#d1fae5]/80 border border-[#a7f3d0] rounded-2xl p-4 flex flex-col gap-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#065f46] uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={15} />
              Best Window for Exercise / Play
            </span>
            <span className="text-xs bg-[#a7f3d0] text-[#064e3b] px-2.5 py-0.5 rounded-full font-black">
              AQI ~{windows.best_aqi}
            </span>
          </div>
          <span className="text-base font-black text-[#064e3b]">{windows.best_window}</span>
          <p className="text-xs text-[#047857] font-medium">Optimal atmospheric dispersion & comfortable thermal load.</p>
        </div>

        <div className="bg-[#ffe4e6]/80 border border-[#fecdd3] rounded-2xl p-4 flex flex-col gap-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#9f1239] uppercase tracking-wider flex items-center gap-1.5">
              <AlertOctagon size={15} />
              Avoid Outdoor Exposure
            </span>
            <span className="text-xs bg-[#fecdd3] text-[#881337] px-2.5 py-0.5 rounded-full font-black">
              AQI ~{windows.avoid_aqi}
            </span>
          </div>
          <span className="text-base font-black text-[#881337]">{windows.avoid_window}</span>
          <p className="text-xs text-[#be123c] font-medium">Severe rush-hour particulate stagnation + cooling inversion.</p>
        </div>
      </div>

      {/* Forecast Threshold Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="flex flex-col gap-2 pt-1">
          <span className="text-xs font-bold text-[#475569] flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-[#b45309]" />
            Upcoming Forecast Threshold Alerts:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {alerts.map((a, i) => (
              <div
                key={i}
                className={`text-xs p-3 rounded-2xl border flex items-center gap-2 font-medium shadow-sm ${
                  a.level === 'RED'
                    ? 'bg-[#ffe4e6] border-[#fecdd3] text-[#9f1239]'
                    : 'bg-[#fef3c7] border-[#fde68a] text-[#92400e]'
                }`}
              >
                <span className="font-mono font-bold shrink-0">{a.time}</span>
                <span className="truncate">{a.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
