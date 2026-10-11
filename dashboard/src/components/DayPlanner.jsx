import React from 'react'
import { Calendar, Plus, RefreshCw, Zap, Home, Footprints } from 'lucide-react'

export const STUDENT_TEMPLATE = [
  { id: '1', title: 'Home & Sleep', start_hour: 0, end_hour: 7, environment: 'indoor', activity: 'rest' },
  { id: '2', title: 'Morning Commute to School', start_hour: 7, end_hour: 8, environment: 'outdoor', activity: 'light' },
  { id: '3', title: 'Classes (Air-filtered Room)', start_hour: 8, end_hour: 14, environment: 'indoor', activity: 'light' },
  { id: '4', title: 'Sports / Playground Practice', start_hour: 14, end_hour: 16, environment: 'outdoor', activity: 'exercise' },
  { id: '5', title: 'Commute Back Home', start_hour: 16, end_hour: 17, environment: 'outdoor', activity: 'light' },
  { id: '6', title: 'Study & Indoor Rest', start_hour: 17, end_hour: 20, environment: 'indoor', activity: 'rest' },
  { id: '7', title: 'Evening Walk / Market', start_hour: 20, end_hour: 21, environment: 'outdoor', activity: 'light' },
  { id: '8', title: 'Night Sleep', start_hour: 21, end_hour: 24, environment: 'indoor', activity: 'rest' },
]

export const WORKER_TEMPLATE = [
  { id: '1', title: 'Sleep & Rest', start_hour: 0, end_hour: 7, environment: 'indoor', activity: 'rest' },
  { id: '2', title: 'Morning Outdoor Jog', start_hour: 7, end_hour: 8, environment: 'outdoor', activity: 'exercise' },
  { id: '3', title: 'Office / Workplace', start_hour: 8, end_hour: 18, environment: 'indoor', activity: 'light' },
  { id: '4', title: 'Evening Transit', start_hour: 18, end_hour: 19, environment: 'outdoor', activity: 'light' },
  { id: '5', title: 'Home / Night', start_hour: 19, end_hour: 24, environment: 'indoor', activity: 'rest' },
]

export default function DayPlanner({ blocks, setBlocks, onRecalculate, loading }) {
  const loadTemplate = (tmpl) => {
    setBlocks(tmpl)
    onRecalculate(tmpl)
  }

  const toggleEnv = (id) => {
    const updated = blocks.map(b => b.id === id ? { ...b, environment: b.environment === 'indoor' ? 'outdoor' : 'indoor' } : b)
    setBlocks(updated)
    onRecalculate(updated)
  }

  const toggleAct = (id) => {
    const cycle = { rest: 'light', light: 'exercise', exercise: 'rest' }
    const updated = blocks.map(b => b.id === id ? { ...b, activity: cycle[b.activity] || 'light' } : b)
    setBlocks(updated)
    onRecalculate(updated)
  }

  return (
    <div className="fresh-card rounded-3xl p-6 shadow-lg flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e1dacb] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-[#edf4f9] text-[#1e4d6b] rounded-2xl border border-[#d3e3ee]">
            <Calendar size={22} />
          </div>
          <div>
            <h3 className="font-extrabold text-[#112331] text-base">Personal Day Plan</h3>
            <p className="text-xs text-[#64748b] font-medium">Time-blocks with location & breathing activity multipliers</p>
          </div>
        </div>

        {/* 1-Click Templates */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#78716c] font-semibold">Templates:</span>
          <button
            onClick={() => loadTemplate(STUDENT_TEMPLATE)}
            className="text-xs bg-white hover:bg-[#faf7f0] text-[#1e4d6b] font-bold px-3.5 py-1.5 rounded-full border border-[#d6cdbc] shadow-sm transition-all"
          >
            🎓 Student
          </button>
          <button
            onClick={() => loadTemplate(WORKER_TEMPLATE)}
            className="text-xs bg-white hover:bg-[#faf7f0] text-[#1e4d6b] font-bold px-3.5 py-1.5 rounded-full border border-[#d6cdbc] shadow-sm transition-all"
          >
            💼 Adult
          </button>
        </div>
      </div>

      {/* Block List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
        {blocks.map((b) => {
          const isOutdoor = b.environment === 'outdoor'
          const isExercise = b.activity === 'exercise'
          const formatHour = (h) => `${h % 12 || 12} ${h < 12 || h === 24 ? 'AM' : 'PM'}`

          return (
            <div
              key={b.id}
              className="bg-white/90 border border-[#e1dacb] hover:border-[#b8ab94] rounded-2xl p-3.5 flex items-center justify-between gap-2 transition-all shadow-sm"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-[#1e293b]">{b.title}</span>
                <span className="text-[11px] text-[#64748b] font-mono">
                  {formatHour(b.start_hour)} – {formatHour(b.end_hour)} ({b.end_hour - b.start_hour} hrs)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Environment badge */}
                <button
                  onClick={() => toggleEnv(b.id)}
                  title="Click to toggle Indoor / Outdoor"
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                    isOutdoor
                      ? 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]'
                      : 'bg-[#d1fae5] text-[#065f46] border-[#a7f3d0]'
                  }`}
                >
                  {isOutdoor ? 'Outdoor (1.0x)' : 'Indoor (0.45x)'}
                </button>

                {/* Activity badge */}
                <button
                  onClick={() => toggleAct(b.id)}
                  title="Click to cycle Rest -> Light -> Exercise"
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                    isExercise
                      ? 'bg-[#ffe4e6] text-[#9f1239] border-[#fecdd3]'
                      : b.activity === 'light'
                      ? 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]'
                      : 'bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]'
                  }`}
                >
                  {b.activity === 'exercise' ? '🏃 Exercise (2.5x)' : b.activity === 'light' ? '🚶 Light (1.0x)' : '🛋️ Rest (0.8x)'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-[#64748b] pt-2 border-t border-[#e1dacb]">
        <span>Exercise multiplies inhalation by 2.5× • Indoor filtration cuts exposure by 55%</span>
        <button
          onClick={() => onRecalculate(blocks)}
          disabled={loading}
          className="text-[#1e4d6b] hover:text-[#112331] font-bold flex items-center gap-1"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Recalculate
        </button>
      </div>
    </div>
  )
}
