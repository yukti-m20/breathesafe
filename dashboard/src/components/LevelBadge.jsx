import clsx from 'clsx'
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

const LEVEL_CONFIG = {
  GOOD: {
    bg: 'bg-green-500',
    border: 'border-green-400',
    icon: CheckCircle2,
    label: 'AIR IS GOOD',
    glow: 'shadow-green-500/40',
  },
  MODERATE: {
    bg: 'bg-amber-500',
    border: 'border-amber-400',
    icon: AlertTriangle,
    label: 'MODERATE RISK',
    glow: 'shadow-amber-500/40',
  },
  UNHEALTHY: {
    bg: 'bg-red-600',
    border: 'border-red-400',
    icon: XCircle,
    label: 'UNHEALTHY AIR',
    glow: 'shadow-red-600/40',
  },
}

const GAS_PILL = {
  GOOD: 'bg-green-700/60 text-green-100',
  MODERATE: 'bg-amber-700/60 text-amber-100',
  UNHEALTHY: 'bg-red-800/60 text-red-100',
}

const HEAT_PILL = {
  GOOD: 'bg-green-700/60 text-green-100',
  MODERATE: 'bg-amber-700/60 text-amber-100',
  UNHEALTHY: 'bg-red-800/60 text-red-100',
}

export default function LevelBadge({ reading }) {
  if (!reading) {
    return <div className="rounded-2xl bg-gray-800 animate-pulse h-48 w-full" />
  }

  const level = reading.level || 'GOOD'
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.GOOD
  const Icon = cfg.icon
  const warmup = reading.warmup_left_s > 0
  const fault = reading.mq_fault

  return (
    <div className="flex flex-col gap-2">
      {/* Main hero badge */}
      <div
        className={clsx(
          'rounded-2xl border-2 p-6 flex flex-col items-center gap-3 shadow-2xl',
          cfg.bg,
          cfg.border,
          cfg.glow,
        )}
      >
        <Icon size={56} className="text-white drop-shadow-lg" strokeWidth={1.5} />
        <h2 className="text-3xl font-black tracking-widest text-white drop-shadow">
          {cfg.label}
        </h2>

        {/* Gas + Heat sub-level pills */}
        <div className="flex gap-3 mt-1 flex-wrap justify-center">
          <span
            className={clsx(
              'px-3 py-1 rounded-full text-sm font-semibold',
              GAS_PILL[reading.gas_level] || 'bg-white/20 text-white',
            )}
          >
            ðŸ’¨ Gas: {reading.gas_level ?? 'â€”'}
          </span>
          <span
            className={clsx(
              'px-3 py-1 rounded-full text-sm font-semibold',
              HEAT_PILL[reading.heat_level] || 'bg-white/20 text-white',
            )}
          >
            ðŸŒ¡ Heat: {reading.heat_level ?? 'â€”'}
          </span>
        </div>

        {reading.score != null && (
          <p className="text-white/70 text-xs font-mono mt-1">
            Score: {Number(reading.score).toFixed(3)}
          </p>
        )}
      </div>

      {/* Sensor fault banner */}
      {fault && (
        <div className="flex items-center gap-2 rounded-xl bg-orange-500/20 border border-orange-500 px-4 py-2 text-orange-300 text-sm font-semibold">
          <span>âš </span>
          <span>Sensor Fault â€” MQ sensor may need replacement or recalibration</span>
        </div>
      )}

      {/* Warmup progress strip */}
      {warmup && (
        <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/50 px-4 py-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-yellow-300 text-sm font-semibold">
            <span>ðŸ”¥ Warming up MQ sensorâ€¦</span>
            <span className="font-mono">{reading.warmup_left_s}s left</span>
          </div>
          <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all duration-1000"
              style={{ width: `${Math.max(5, 100 - (reading.warmup_left_s / 180) * 100)}%` }}
            />
          </div>
          <p className="text-yellow-400/60 text-xs">
            Readings will be available once warm-up completes.
          </p>
        </div>
      )}
    </div>
  )
}
