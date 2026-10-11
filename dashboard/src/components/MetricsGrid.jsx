import React from 'react'
import clsx from 'clsx'

function heatCategory(hi) {
  if (hi === null || hi === undefined || isNaN(hi)) return { label: '—', color: 'text-slate-400' }
  if (hi < 27) return { label: 'Comfortable', color: 'text-emerald-700' }
  if (hi < 32) return { label: 'Caution', color: 'text-amber-700' }
  if (hi < 39) return { label: 'Extreme Caution', color: 'text-orange-700' }
  return { label: 'Danger!', color: 'text-rose-700' }
}

function MetricCard({ emoji, title, value, unit, sub, subColor }) {
  return (
    <div className="fresh-card rounded-2xl p-4 flex flex-col justify-between border border-[#e1dacb] shadow-sm">
      <div className="flex items-center gap-1.5 text-[#64748b] text-[11px] font-bold uppercase tracking-wider">
        <span>{emoji}</span>
        <span>{title}</span>
      </div>
      <div className="flex items-baseline gap-1 my-1">
        <span className="text-2xl font-black text-[#112331]">
          {value !== null && value !== undefined && !isNaN(value) ? value : '—'}
        </span>
        {unit && <span className="text-xs font-bold text-[#64748b]">{unit}</span>}
      </div>
      {sub && (
        <span className={clsx('text-[11px] font-bold', subColor || 'text-[#64748b]')}>{sub}</span>
      )}
    </div>
  )
}

export default function MetricsGrid({ reading }) {
  if (!reading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="fresh-card rounded-2xl p-4 animate-pulse h-24" />
        ))}
      </div>
    )
  }

  const hi = reading.heat_index_c
  const hiCat = heatCategory(hi)
  const gi = reading.gas_index

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricCard
        emoji="🌡"
        title="Temperature"
        value={reading.temp_c !== null ? Number(reading.temp_c)?.toFixed(1) : null}
        unit="°C"
        sub={reading.temp_c !== null ? (reading.temp_c > 35 ? 'Very Hot' : reading.temp_c > 28 ? 'Warm' : 'Comfortable') : 'No Sensor'}
        subColor={reading.temp_c > 35 ? 'text-rose-700' : reading.temp_c > 28 ? 'text-amber-700' : 'text-emerald-700'}
      />
      <MetricCard
        emoji="💧"
        title="Humidity"
        value={reading.hum !== null ? Number(reading.hum)?.toFixed(0) : null}
        unit="%"
        sub={reading.hum !== null ? (reading.hum > 70 ? 'High' : reading.hum > 40 ? 'Optimal' : 'Low') : 'No Sensor'}
        subColor={reading.hum > 70 ? 'text-amber-700' : reading.hum > 40 ? 'text-emerald-700' : 'text-blue-700'}
      />
      <MetricCard
        emoji="🌬"
        title="Gas Index"
        value={gi !== null ? Number(gi)?.toFixed(2) : null}
        unit="x"
        sub={gi !== null ? (gi < 1.5 ? 'Clean Air' : gi < 2.5 ? 'Elevated VOC' : 'Hazardous') : 'Warming up...'}
        subColor={gi < 1.5 ? 'text-emerald-700' : gi < 2.5 ? 'text-amber-700' : 'text-rose-700'}
      />
      <MetricCard
        emoji="🔥"
        title="Heat Index"
        value={hi !== null ? Number(hi)?.toFixed(1) : null}
        unit="°C"
        sub={hiCat.label}
        subColor={hiCat.color}
      />
    </div>
  )
}
