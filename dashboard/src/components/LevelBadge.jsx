import React from 'react'
import clsx from 'clsx'
import { CheckCircle2, AlertTriangle, XCircle, Wind, Radio, Shield, Gauge } from 'lucide-react'

const LEVEL_CONFIG = {
  GOOD: {
    bg: 'bg-gradient-to-br from-[#15803d] to-[#166534]',
    border: 'border-[#4ade80]',
    icon: CheckCircle2,
    label: 'AIR IS GOOD',
    sublabel: 'Safe ambient air · Safe for outdoor activity',
    glow: 'shadow-green-900/30',
  },
  MODERATE: {
    bg: 'bg-gradient-to-br from-[#d97706] to-[#b45309]',
    border: 'border-[#fde047]',
    icon: AlertTriangle,
    label: 'MODERATE AIR RISK',
    sublabel: 'Elevated VOCs detected · Sensitive profiles limit exposure',
    glow: 'shadow-amber-900/30',
  },
  UNHEALTHY: {
    bg: 'bg-gradient-to-br from-[#dc2626] to-[#991b1b]',
    border: 'border-[#f87171]',
    icon: XCircle,
    label: 'UNHEALTHY AIR',
    sublabel: 'Hazardous air detected · Move indoors or wear respirator',
    glow: 'shadow-red-900/40',
  },
}

export default function LevelBadge({ reading }) {
  // =========================================================================
  // EMPTY / DISCONNECTED STANDBY STATE
  // Shows preview of what metrics will appear once hardware connects
  // =========================================================================
  if (!reading) {
    return (
      <div className="fresh-card rounded-3xl p-6 border-2 border-dashed border-[#d6cebf] flex flex-col items-center gap-4 text-center shadow-xs">
        {/* Header Tag */}
        <div className="flex items-center justify-between w-full border-b border-[#e5dfd2] pb-2.5">
          <span className="text-[11px] font-black tracking-wider uppercase text-[#78716c] flex items-center gap-1.5">
            <Wind size={14} className="text-[#1e4d6b]" />
            Air Health Shield • वायु स्वास्थ्य स्थिति
          </span>
          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#f1ebd9] text-[#785b2e] border border-[#d8cdb8] flex items-center gap-1">
            <Radio size={10} className="animate-pulse text-[#b45309]" />
            STANDBY / DISCONNECTED
          </span>
        </div>

        {/* Central Standby Icon */}
        <div className="relative my-1">
          <div className="w-20 h-20 rounded-full bg-[#edf4f9] border-2 border-[#c6ddec] flex items-center justify-center text-[#1e4d6b] shadow-inner">
            <Wind size={38} className="text-[#1e4d6b]" />
          </div>
          <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#eab308] border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
            !
          </span>
        </div>

        <div>
          <h3 className="text-lg font-black text-[#112331]">
            Awaiting Badge Air Stream
          </h3>
          <p className="text-xs text-[#64748b] max-w-sm mt-1 leading-relaxed">
            Hardware is in standby. Connect the ESP32-C3 wearable badge or dispatch a test packet below to stream live gas & VOC telemetry.
          </p>
        </div>

        {/* Preview of Air Quality Tiers */}
        <div className="w-full bg-[#f8f5ee] rounded-2xl p-3 border border-[#e5dfd2] flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#78716c]">
            <span>Air Track Thresholds</span>
            <span>Expected Live Metrics</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white rounded-xl p-2 border border-[#dcfce7] shadow-2xs">
              <span className="block text-[10px] font-black text-[#15803d]">CLEAN AIR</span>
              <span className="text-xs font-mono font-bold text-[#1e293b]">&lt; 1.5×</span>
              <span className="block text-[9px] text-[#64748b]">Safe baseline</span>
            </div>

            <div className="bg-white rounded-xl p-2 border border-[#fef3c7] shadow-2xs">
              <span className="block text-[10px] font-black text-[#b45309]">MODERATE</span>
              <span className="text-xs font-mono font-bold text-[#1e293b]">1.5 – 2.5×</span>
              <span className="block text-[9px] text-[#64748b]">Caution tier</span>
            </div>

            <div className="bg-white rounded-xl p-2 border border-[#fee2e2] shadow-2xs">
              <span className="block text-[10px] font-black text-[#b91c1c]">HAZARDOUS</span>
              <span className="text-xs font-mono font-bold text-[#1e293b]">&gt; 2.5×</span>
              <span className="block text-[9px] text-[#64748b]">Evacuate/Mask</span>
            </div>
          </div>
        </div>

        {/* Standby preview pills */}
        <div className="flex flex-wrap gap-2 justify-center text-[11px] font-medium text-[#78716c]">
          <span className="px-2.5 py-1 rounded-full bg-white border border-[#e1dacb]">
            Baseline Reference: <strong className="text-[#112331]">950 mV</strong>
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white border border-[#e1dacb]">
            Active Sensor: <strong className="text-[#112331]">MQ-135 Gas</strong>
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white border border-[#e1dacb]">
            Track: <strong className="text-[#1e4d6b]">Air & Respiratory</strong>
          </span>
        </div>
      </div>
    )
  }

  // =========================================================================
  // CONNECTED LIVE HERO BADGE
  // =========================================================================
  const level = reading.level || reading.gas_level || 'GOOD'
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.GOOD
  const Icon = cfg.icon
  const warmup = reading.warmup_left_s > 0
  const fault = reading.mq_fault
  const gasRatio = reading.gas_index != null ? Number(reading.gas_index).toFixed(2) : '1.00'

  return (
    <div className="flex flex-col gap-3">
      {/* Main hero badge */}
      <div
        className={clsx(
          'rounded-3xl border-2 p-6 flex flex-col items-center gap-3.5 text-white shadow-xl transition-all duration-300',
          cfg.bg,
          cfg.border,
          cfg.glow,
        )}
      >
        <div className="flex items-center gap-2 text-white/80 text-[11px] font-black tracking-widest uppercase">
          <Wind size={14} />
          <span>Air Safety Track • व्यक्तिगत वायु स्तर</span>
        </div>

        <Icon size={58} className="text-white drop-shadow-md animate-in zoom-in-95 duration-200" strokeWidth={1.8} />

        <div className="text-center">
          <h2 className="text-3xl font-black tracking-wider text-white drop-shadow">
            {cfg.label}
          </h2>
          <p className="text-xs text-white/90 font-medium mt-0.5">
            {cfg.sublabel}
          </p>
        </div>

        {/* Air Quality Sub-Pills */}
        <div className="flex gap-2 mt-1 flex-wrap justify-center">
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-black/25 text-white backdrop-blur-xs border border-white/20">
            🌬 Gas Ratio: {gasRatio}×
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-black/25 text-white backdrop-blur-xs border border-white/20">
            🛡 Tier: {reading.gas_level || level}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-black/25 text-white backdrop-blur-xs border border-white/20">
            ⚡ Baseline: {reading.gas_baseline_mv || 950} mV
          </span>
        </div>

        {reading.score != null && (
          <p className="text-white/80 text-[11px] font-mono mt-0.5 bg-black/20 px-3 py-0.5 rounded-full">
            Toxic Dose Score: {Number(reading.score).toFixed(3)}
          </p>
        )}
      </div>

      {/* Sensor fault banner */}
      {fault && (
        <div className="flex items-center gap-2 rounded-2xl bg-amber-500/15 border border-amber-500/40 px-4 py-2.5 text-amber-900 text-xs font-bold">
          <AlertTriangle size={16} className="text-amber-600 shrink-0" />
          <span>MQ-135 Sensor Calibrating — Auto-applying default clean air baseline (950 mV).</span>
        </div>
      )}

      {/* Warmup progress strip */}
      {warmup && (
        <div className="rounded-2xl bg-[#fffbeb] border border-[#fef3c7] px-4 py-3 flex flex-col gap-1.5 shadow-xs">
          <div className="flex items-center justify-between text-[#b45309] text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <Gauge size={14} className="animate-spin text-[#d97706]" />
              Stabilizing MQ Gas Chamber...
            </span>
            <span className="font-mono">{reading.warmup_left_s}s left</span>
          </div>
          <div className="h-2 rounded-full bg-[#fde68a] overflow-hidden">
            <div
              className="h-full bg-[#d97706] rounded-full transition-all duration-1000"
              style={{ width: `${Math.max(5, 100 - (reading.warmup_left_s / 60) * 100)}%` }}
            />
          </div>
          <p className="text-[#92400e] text-[10px]">
            Sensor warming up. Using factory clean air calibration until heater reaches optimal 200°C.
          </p>
        </div>
      )}
    </div>
  )
}
