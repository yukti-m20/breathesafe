import React from 'react'
import clsx from 'clsx'
import { Wind, ShieldCheck, Zap, Activity, Radio, AlertTriangle } from 'lucide-react'

function AirMetricCard({ 
  icon: Icon, 
  title, 
  value, 
  unit, 
  sub, 
  subColor, 
  tag,
  isStandby = false,
  badgeText = null
}) {
  return (
    <div className={clsx(
      "fresh-card rounded-2xl p-4 flex flex-col justify-between border shadow-sm transition-all",
      isStandby ? "border-[#e5dfd2] bg-[#fbf9f4]/80" : "border-[#e1dacb] bg-white"
    )}>
      {/* Top Header */}
      <div className="flex items-center justify-between gap-1 text-[#64748b]">
        <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#1e4d6b]">
          <Icon size={14} className="text-[#1e4d6b]" />
          <span>{title}</span>
        </div>
        {badgeText ? (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#edf4f9] text-[#1e4d6b] border border-[#d3e3ee]">
            {badgeText}
          </span>
        ) : isStandby ? (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#f5efe3] text-[#785b2e] border border-[#e5dfd2]">
            STANDBY
          </span>
        ) : null}
      </div>

      {/* Main Value Display */}
      <div className="flex items-baseline gap-1.5 my-2">
        <span className={clsx(
          "text-2xl font-black tracking-tight",
          isStandby ? "text-[#78716c]" : "text-[#112331]"
        )}>
          {value}
        </span>
        {unit && (
          <span className="text-xs font-bold text-[#64748b]">
            {unit}
          </span>
        )}
      </div>

      {/* Description & Technical Tag */}
      <div className="flex flex-col gap-0.5 pt-1 border-t border-[#f0ebd9]">
        <span className={clsx('text-[11px] font-bold truncate', subColor || 'text-[#64748b]')}>
          {sub}
        </span>
        {tag && (
          <span className="text-[9px] text-[#94a3b8] font-medium truncate">
            {tag}
          </span>
        )}
      </div>
    </div>
  )
}

export default function MetricsGrid({ reading }) {
  const isStandby = !reading

  // Air Track Metrics
  const gasRatio = reading?.gas_index != null ? Number(reading.gas_index).toFixed(2) : '1.00'
  const gasLevel = reading?.gas_level || reading?.level || 'GOOD'
  const baselineMv = reading?.gas_baseline_mv != null ? Math.round(reading.gas_baseline_mv) : 950
  const dose = reading?.gas_dose_idx_h != null ? Number(reading.gas_dose_idx_h).toFixed(3) : '0.000'

  return (
    <div className="flex flex-col gap-2.5">
      {/* Air Track Header Strip */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-black uppercase tracking-wider text-[#78716c] flex items-center gap-1.5">
          <Wind size={13} className="text-[#1e4d6b]" />
          Air Quality & Respiratory Metrics (Air Track)
        </span>
        {isStandby && (
          <span className="text-[10px] text-[#b45309] font-bold flex items-center gap-1">
            <Radio size={10} className="animate-pulse" />
            Showing Expected Preview Values
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Gas / VOC Index */}
        <AirMetricCard
          icon={Wind}
          title="Gas / VOC Ratio"
          value={isStandby ? '1.00' : gasRatio}
          unit="×"
          sub={isStandby ? 'Clean Air Baseline (Expected)' : (Number(gasRatio) < 1.5 ? 'Clean Ambient Air' : Number(gasRatio) < 2.5 ? 'Elevated VOCs' : 'Hazardous Toxic Spike')}
          subColor={isStandby ? 'text-[#78716c]' : (Number(gasRatio) < 1.5 ? 'text-emerald-700' : Number(gasRatio) < 2.5 ? 'text-amber-700' : 'text-rose-700')}
          tag="MQ-135 Gas Chamber (Rs/R0)"
          isStandby={isStandby}
          badgeText={!isStandby && Number(gasRatio) >= 2.5 ? 'ALERT' : null}
        />

        {/* Metric 2: Air Safety Tier */}
        <AirMetricCard
          icon={ShieldCheck}
          title="Air Safety Tier"
          value={isStandby ? 'GOOD' : gasLevel}
          unit=""
          sub={isStandby ? 'Awaiting Live Stream' : (gasLevel === 'GOOD' ? 'Safe to Breathe' : gasLevel === 'MODERATE' ? 'Caution Recommended' : 'Action Required!')}
          subColor={isStandby ? 'text-[#78716c]' : (gasLevel === 'GOOD' ? 'text-emerald-700' : gasLevel === 'MODERATE' ? 'text-amber-700' : 'text-rose-700')}
          tag="Vulnerability Adjusted Tier"
          isStandby={isStandby}
        />

        {/* Metric 3: MQ-135 Baseline (Zero Reference) */}
        <AirMetricCard
          icon={Zap}
          title="Sensor Baseline"
          value={isStandby ? '950' : baselineMv}
          unit="mV"
          sub={isStandby ? 'Factory Clean Reference' : (reading?.calibrated ? 'Calibrated Reference (R0)' : 'Calibrating Ambient...')}
          subColor={isStandby ? 'text-[#78716c]' : 'text-[#1e4d6b]'}
          tag="ADC Voltage Divider (Vcc=5V)"
          isStandby={isStandby}
        />

        {/* Metric 4: Toxic Inhalation Dose */}
        <AirMetricCard
          icon={Activity}
          title="Gas Dose Load"
          value={isStandby ? '0.000' : dose}
          unit="idx·h"
          sub={isStandby ? 'Ready to Accumulate' : 'Cumulative Toxic Inhalation'}
          subColor={isStandby ? 'text-[#78716c]' : (Number(dose) > 0.5 ? 'text-amber-700' : 'text-emerald-700')}
          tag="Time-Weighted Air Exposure"
          isStandby={isStandby}
        />
      </div>

      {/* Environmental Context Sub-Banner (Secondary, Air-First Track) */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#f5efe3]/70 border border-[#e5dfd2] text-[10px] text-[#78716c]">
        <span>
          Ambient Context:{' '}
          <strong className="text-[#112331]">
            {reading?.temp_c != null ? `${Number(reading.temp_c).toFixed(1)}°C` : '27.0°C (Default)'}
          </strong>{' '}
          · Humidity:{' '}
          <strong className="text-[#112331]">
            {reading?.hum != null ? `${Math.round(reading.hum)}%` : '55% (Default)'}
          </strong>
        </span>
        <span className="font-medium text-[#1e4d6b]">
          Air Quality Track · Clean Air & VOC Protection
        </span>
      </div>
    </div>
  )
}
