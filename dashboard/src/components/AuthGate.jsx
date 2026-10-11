import React, { useState } from 'react'
import { ShieldCheck, Lock, Key, ArrowRight, UserCheck, AlertTriangle } from 'lucide-react'

// Demo access passcodes
const VALID_PASSCODES = ['BREATHE2026', 'AWS-HACKATHON', 'AIRGUARD', 'DEMO123']

export default function AuthGate({ onAuthenticated }) {
  const [passcode, setPasscode] = useState('')
  const [userName, setUserName] = useState('')
  const [error, setError] = useState('')
  const [selectedRole, setSelectedRole] = useState('caregiver')

  const handleSubmit = (e) => {
    e.preventDefault()
    const cleanCode = passcode.trim().toUpperCase()

    if (!cleanCode) {
      setError('Please enter your access key or demo passcode.')
      return
    }

    if (VALID_PASSCODES.includes(cleanCode) || cleanCode.startsWith('AWS-')) {
      const authPayload = {
        name: userName.trim() || (selectedRole === 'caregiver' ? 'Primary Caregiver' : 'Family Member'),
        role: selectedRole,
        code: cleanCode,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem('breathesafe_auth_session', JSON.stringify(authPayload))
      onAuthenticated(authPayload)
    } else {
      setError('Invalid Access Key. Use demo key: BREATHE2026 or AWS-HACKATHON')
    }
  }

  const handleQuickDemoAccess = () => {
    const authPayload = {
      name: 'Caregiver Evaluator',
      role: 'caregiver',
      code: 'BREATHE2026',
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('breathesafe_auth_session', JSON.stringify(authPayload))
    onAuthenticated(authPayload)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#233529]/60 backdrop-blur-md">
      <div className="w-full max-w-md fresh-card rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#d6cebf] flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-[#1e4d6b] text-white flex items-center justify-center shadow-lg shadow-[#1e4d6b]/20">
            <Lock size={26} />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <h2 className="text-2xl font-black text-[#112331]">BreatheSafe Access</h2>
            <span className="text-[10px] bg-[#97b5a1] text-[#133020] font-bold px-2 py-0.5 rounded-full border border-[#83a48e]">
              SECURE
            </span>
          </div>
          <p className="text-xs text-[#64748b] leading-relaxed">
            Protected Environmental Exposure & Health Shield. Please authenticate to access personal sensor feeds and emergency dispatch.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-bold text-[#57534e] uppercase tracking-wider mb-1">
              Your Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-[#fcfaf5] border border-[#d6cebf] rounded-xl px-3.5 py-2.5 text-xs text-[#1e293b] font-medium placeholder-[#a8a29e] focus:outline-none focus:ring-2 focus:ring-[#739d89]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#57534e] uppercase tracking-wider mb-1">
              Access Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole('caregiver')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  selectedRole === 'caregiver'
                    ? 'bg-[#1e4d6b] text-white border-[#1e4d6b] shadow-sm'
                    : 'bg-[#fcfaf5] text-[#57534e] border-[#d6cebf] hover:bg-white'
                }`}
              >
                <UserCheck size={14} />
                <span>Caregiver / Admin</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('member')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  selectedRole === 'member'
                    ? 'bg-[#1e4d6b] text-white border-[#1e4d6b] shadow-sm'
                    : 'bg-[#fcfaf5] text-[#57534e] border-[#d6cebf] hover:bg-white'
                }`}
              >
                <span>Family Member</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#57534e] uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Access Key / Passcode</span>
              <span className="text-[10px] text-[#78716c] font-normal">Demo: BREATHE2026</span>
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="Enter access passcode"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value)
                  setError('')
                }}
                className="w-full bg-[#fcfaf5] border border-[#d6cebf] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[#1e293b] font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-[#739d89]"
              />
              <Key size={14} className="absolute left-3 top-3 text-[#78716c]" />
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-xs flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-[#739d89] hover:bg-[#628975] text-[#133020] font-black text-xs uppercase tracking-wider shadow-md shadow-[#739d89]/30 transition-all flex items-center justify-center gap-2"
          >
            <span>Unlock Dashboard</span>
            <ArrowRight size={14} />
          </button>
        </form>

        {/* Quick Demo Access Bar */}
        <div className="pt-2 border-t border-[#e5dfd2] flex flex-col items-center gap-2">
          <p className="text-[11px] text-[#78716c]">Evaluating for Hackathon presentation?</p>
          <button
            onClick={handleQuickDemoAccess}
            className="w-full py-2 px-3 rounded-xl bg-[#f3ede0] hover:bg-[#eae3d4] border border-[#d6cebf] text-[#2c3e2e] text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <ShieldCheck size={14} className="text-[#3b7556]" />
            <span>1-Click Hackathon Evaluator Login</span>
          </button>
        </div>

      </div>
    </div>
  )
}
