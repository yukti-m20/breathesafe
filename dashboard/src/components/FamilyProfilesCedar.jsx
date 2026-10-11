import React from 'react'
import { Users, Lock } from 'lucide-react'

export default function FamilyProfilesCedar({ currentRole, setRole, activeMember, setActiveMember }) {
  const members = [
    { id: 'child_aarav', name: 'Aarav (Child)', mode: 'child', age: '8 yrs', score: '5.8/10', status: 'Moderate' },
    { id: 'patient_dadi', name: 'Dadi (Asthma)', mode: 'asthma', age: '68 yrs', score: '7.2/10', status: 'High Risk' },
    { id: 'self_rahul', name: 'Rahul (Self / Adult)', mode: 'adult', age: '34 yrs', score: '3.4/10', status: 'Good' },
  ]

  return (
    <div className="fresh-card rounded-3xl p-6 shadow-lg flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e1dacb] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-[#edf4f9] text-[#1e4d6b] rounded-2xl border border-[#d3e3ee]">
            <Users size={22} />
          </div>
          <div>
            <h3 className="font-extrabold text-[#112331] text-base flex items-center gap-2">
              Family Shield & RBAC
              <span className="text-[10px] bg-[#eedef5] text-[#5b217a] px-2 py-0.5 rounded-full border border-[#d8b4e7] font-bold">
                AWS Cedar Policy
              </span>
            </h3>
            <p className="text-xs text-[#64748b] font-medium">Caregiver multi-member oversight with fine-grained policy authorization</p>
          </div>
        </div>

        {/* Role Switcher */}
        <div className="flex items-center gap-1.5 fresh-card-subtle p-1 rounded-full border border-[#e1dacb]">
          <span className="text-[11px] text-[#78716c] font-bold px-2">Role:</span>
          <button
            onClick={() => setRole('caregiver')}
            className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition-all ${
              currentRole === 'caregiver'
                ? 'fresh-pill-active'
                : 'text-[#64748b] hover:text-[#1e293b]'
            }`}
          >
            🛡️ Caregiver
          </button>
          <button
            onClick={() => setRole('child')}
            className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition-all ${
              currentRole === 'child'
                ? 'fresh-pill-active'
                : 'text-[#64748b] hover:text-[#1e293b]'
            }`}
          >
            👶 Child Login
          </button>
        </div>
      </div>

      {/* Cedar Access Evaluation Notice */}
      {currentRole === 'child' ? (
        <div className="bg-[#fef3c7] border border-[#fde68a] rounded-2xl p-4 flex items-center gap-3 text-xs text-[#92400e] font-medium shadow-sm">
          <Lock size={18} className="shrink-0 text-[#b45309]" />
          <span>
            <strong>Cedar Policy Active:</strong> Child role has restricted view (can only see personal today-routine, caregiver controls are locked).
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {members.map((m) => {
            const isSelected = activeMember === m.id
            return (
              <div
                key={m.id}
                onClick={() => setActiveMember(m.id)}
                className={`cursor-pointer rounded-2xl p-4 border transition-all flex flex-col gap-2 shadow-sm ${
                  isSelected
                    ? 'bg-white border-[#1e4d6b] ring-2 ring-[#1e4d6b]/20 shadow-md'
                    : 'bg-white/80 border-[#e1dacb] hover:border-[#b8ab94]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1e293b]">{m.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    m.status === 'High Risk' ? 'bg-[#ffe4e6] text-[#9f1239] border border-[#fecdd3]' :
                    m.status === 'Moderate' ? 'bg-[#fef3c7] text-[#92400e] border border-[#fde68a]' :
                    'bg-[#d1fae5] text-[#065f46] border border-[#a7f3d0]'
                  }`}>
                    {m.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#64748b]">
                  <span>Exposure Score:</span>
                  <span className="font-mono font-bold text-[#1e293b]">{m.score}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
