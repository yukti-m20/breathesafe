import React from 'react'
import { Cpu, CheckCircle2, XCircle } from 'lucide-react'

export default function DeviceStatus({ reading, badgeReachable }) {
  if (!reading) return null
  const isConnected = badgeReachable && reading.wifi_connected

  return (
    <div className="fresh-card rounded-3xl p-5 shadow-md flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-[#e1dacb] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#edf4f9] text-[#1e4d6b] rounded-xl border border-[#d3e3ee]">
            <Cpu size={16} />
          </div>
          <span className="text-xs font-extrabold text-[#112331] uppercase tracking-wider">Badge Hardware & Network</span>
        </div>
        <div>
          {isConnected ? (
            <span className="flex items-center gap-1 text-xs text-emerald-700 font-bold">
              <CheckCircle2 size={13} />
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-rose-700 font-bold">
              <XCircle size={13} />
              Offline
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white/80 p-2.5 rounded-xl border border-[#e1dacb] flex flex-col shadow-sm">
          <span className="text-[#78716c] text-[10px] font-semibold">Device ID</span>
          <span className="font-mono text-[#112331] font-bold">{reading.id || 'ESP32-C3'}</span>
        </div>
        <div className="bg-white/80 p-2.5 rounded-xl border border-[#e1dacb] flex flex-col shadow-sm">
          <span className="text-[#78716c] text-[10px] font-semibold">Badge IP</span>
          <span className="font-mono text-[#112331] font-bold">{reading.ip || reading.ap_ip || 'badge.local'}</span>
        </div>
        <div className="bg-white/80 p-2.5 rounded-xl border border-[#e1dacb] flex flex-col shadow-sm">
          <span className="text-[#78716c] text-[10px] font-semibold">WiFi Signal</span>
          <span className="text-[#112331] font-bold">{reading.wifi_rssi ? `${reading.wifi_rssi} dBm` : 'AP Mode'}</span>
        </div>
        <div className="bg-white/80 p-2.5 rounded-xl border border-[#e1dacb] flex flex-col shadow-sm">
          <span className="text-[#78716c] text-[10px] font-semibold">Sensor Baseline</span>
          <span className="text-[#112331] font-bold">{reading.calibrated ? `${Math.round(reading.gas_baseline_mv || 0)} mV` : 'Uncalibrated'}</span>
        </div>
      </div>
    </div>
  )
}
