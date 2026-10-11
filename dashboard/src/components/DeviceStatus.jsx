import React from 'react'
import { Cpu, CheckCircle2, XCircle, Radio } from 'lucide-react'

export default function DeviceStatus({ reading, badgeReachable }) {
  const isConnected = Boolean(reading && badgeReachable && reading.wifi_connected)

  return (
    <div className="fresh-card rounded-3xl p-5 shadow-xs border border-[#e1dacb] flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-[#e1dacb] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#edf4f9] text-[#1e4d6b] rounded-xl border border-[#d3e3ee]">
            <Cpu size={16} />
          </div>
          <span className="text-xs font-black text-[#112331] uppercase tracking-wider">Badge Hardware & Network</span>
        </div>
        <div>
          {isConnected ? (
            <span className="flex items-center gap-1 text-xs text-emerald-700 font-bold">
              <CheckCircle2 size={13} />
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-amber-700 font-bold">
              <Radio size={12} className="animate-pulse" />
              Standby / Ready
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white/80 p-2.5 rounded-xl border border-[#e1dacb] flex flex-col shadow-2xs">
          <span className="text-[#78716c] text-[10px] font-semibold">Device ID</span>
          <span className="font-mono text-[#112331] font-bold">{reading?.id || 'esp32-c3-badge-01'}</span>
        </div>
        <div className="bg-white/80 p-2.5 rounded-xl border border-[#e1dacb] flex flex-col shadow-2xs">
          <span className="text-[#78716c] text-[10px] font-semibold">Badge IP / Host</span>
          <span className="font-mono text-[#112331] font-bold">{reading?.ip || reading?.ap_ip || '10.171.192.184 (or AP: 192.168.4.1)'}</span>
        </div>
        <div className="bg-white/80 p-2.5 rounded-xl border border-[#e1dacb] flex flex-col shadow-2xs">
          <span className="text-[#78716c] text-[10px] font-semibold">Wi-Fi Connection</span>
          <span className="text-[#112331] font-bold">{reading?.wifi_rssi ? `${reading.wifi_rssi} dBm` : 'Direct Ingest / Hotspot'}</span>
        </div>
        <div className="bg-white/80 p-2.5 rounded-xl border border-[#e1dacb] flex flex-col shadow-2xs">
          <span className="text-[#78716c] text-[10px] font-semibold">Gas Sensor Cal</span>
          <span className="text-[#112331] font-bold">{reading?.calibrated ? `${Math.round(reading.gas_baseline_mv || 950)} mV` : '950 mV (Clean Air Default)'}</span>
        </div>
      </div>
    </div>
  )
}
