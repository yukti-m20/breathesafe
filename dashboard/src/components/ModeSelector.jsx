import React, { useState } from 'react'
import { User, Crosshair } from 'lucide-react'
import clsx from 'clsx'

const MODES = [
  { id: 'child', name: 'CHILD', label: 'Child', hindi: 'बालक', icon: '👶', desc: 'Gas 1.5x / HI 30°C' },
  { id: 'adult', name: 'ADULT', label: 'Adult', hindi: 'वयस्क', icon: '🧑', desc: 'Gas 2.0x / HI 32°C' },
  { id: 'asthma', name: 'ASTHMA', label: 'Asthma', hindi: 'अस्थमा', icon: '😮‍💨', desc: 'Gas 1.4x / HI 30°C' },
]

export default function ModeSelector({ currentMode, onModeChange, onCalibrate, warmupLeft }) {
  const [updating, setUpdating] = useState(false)

  const handleSelect = async (modeId) => {
    setUpdating(true)
    try {
      if (onModeChange) await onModeChange(modeId)
    } finally {
      setUpdating(false)
    }
  }

  const handleCalibrate = () => {
    if (warmupLeft > 0) {
      alert(`Sensor is still warming up (${warmupLeft}s left). Wait until warmup finishes.`)
      return
    }
    if (window.confirm("Calibrate clean-air baseline now? Only do this in fresh, clean air!")) {
      if (onCalibrate) onCalibrate()
    }
  }

  const activeMode = currentMode?.toUpperCase() || 'ADULT'

  return (
    <div className="fresh-card rounded-3xl p-5 shadow-md flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-[#e1dacb] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#edf4f9] text-[#1e4d6b] rounded-xl border border-[#d3e3ee]">
            <User size={15} />
          </div>
          <span className="text-xs font-extrabold text-[#112331] uppercase tracking-wider">Safety Profile • सुरक्षा प्रोफ़ाइल</span>
        </div>
        <button
          onClick={handleCalibrate}
          className="flex items-center gap-1 text-[11px] text-[#1e4d6b] hover:text-[#112331] font-bold bg-white border border-[#d6cdbc] rounded-xl px-2.5 py-1 transition-all shadow-sm"
          title="Set clean-air baseline"
        >
          <Crosshair size={12} />
          Calibrate
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {MODES.map((m) => {
          const isSelected = activeMode === m.name
          return (
            <button
              key={m.id}
              disabled={updating}
              onClick={() => handleSelect(m.id)}
              className={clsx(
                'flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border text-center transition-all shadow-sm',
                isSelected
                  ? 'bg-white border-[#1e4d6b] ring-2 ring-[#1e4d6b]/20 shadow-md'
                  : 'bg-white/70 border-[#e1dacb] text-[#64748b] hover:bg-white'
              )}
            >
              <span className="text-xl">{m.icon}</span>
              <span className="text-xs font-bold text-[#1e293b] mt-1">{m.label}</span>
              <span className="text-[10px] text-[#78716c] font-medium">{m.hindi}</span>
              <span className="text-[9px] text-[#8c7456] mt-0.5">{m.desc}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
