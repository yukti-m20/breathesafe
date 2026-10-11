import React from 'react'
import { Sparkles, WifiOff, Globe } from 'lucide-react'

export default function AIActionCard({ action, badgeReachable }) {
  // If action contains Hindi/English breakdown or a standard action
  const hasBilingual = action && action.includes('[हिंदी]')

  return (
    <div className="fresh-card rounded-3xl overflow-hidden border border-[#e1dacb] shadow-md flex flex-col">
      {/* Header matching fresh theme */}
      <div className="bg-[#fcf8f0] px-5 py-3.5 border-b border-[#e1dacb] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#fef3c7] text-[#b45309] rounded-xl border border-[#fde68a]">
            <Sparkles size={16} />
          </div>
          <span className="text-[#1c384a] font-extrabold text-xs tracking-wider uppercase">AI HEALTH ACTION • AI स्वास्थ्य सलाह</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#059669]" />
          </span>
          <span className="text-[#059669] text-[11px] font-bold">LIVE</span>
        </div>
      </div>

      {/* Action Body */}
      <div className="p-5 flex flex-col gap-3">
        {!badgeReachable && (
          <div className="flex items-center gap-2 text-[#9a3412] text-xs bg-[#fff7ed] rounded-xl px-3.5 py-2 border border-[#fed7aa]">
            <WifiOff size={14} className="shrink-0" />
            <span>Badge offline — showing active contextual health recommendation</span>
          </div>
        )}

        <div className="text-[#1e293b] text-xs md:text-sm font-semibold leading-relaxed whitespace-pre-line bg-white/70 p-3.5 rounded-2xl border border-[#e8e2d5]">
          {action || 'Evaluating ambient air quality... (हवा की गुणवत्ता का विश्लेषण जारी है...)'}
        </div>

        {/* Footer info badge */}
        <div className="flex items-center justify-between text-[11px] text-[#78716c] pt-1">
          <div className="flex items-center gap-1.5">
            <Globe size={13} className="text-[#1e4d6b]" />
            <span className="font-semibold text-[#1e4d6b]">Bilingual (English + हिंदी)</span>
          </div>
          <span className="font-bold text-[#8c6b32]">AWS Strands SDK</span>
        </div>
      </div>
    </div>
  )
}
