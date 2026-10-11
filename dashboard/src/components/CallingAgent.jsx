import React, { useState, useEffect } from 'react'
import { 
  PhoneCall, ShieldAlert, CheckCircle2, AlertTriangle, Volume2, Globe, Clock, 
  Sparkles, Key, Settings, ExternalLink, HelpCircle
} from 'lucide-react'
import { triggerEmergencyCall, fetchCallLogs, saveTwilioConfig } from '../lib/api'

export default function CallingAgent({ city = 'Delhi NCR', mode = 'adult' }) {
  const [phoneNumber, setPhoneNumber] = useState('+919876543210')
  const [reasonType, setReasonType] = useState('mask_advisory')
  const [lang, setLang] = useState('en')
  const [autoCallEnabled, setAutoCallEnabled] = useState(true)
  const [calling, setCalling] = useState(false)
  const [lastCallResult, setLastCallResult] = useState(null)
  const [callHistory, setCallHistory] = useState([])
  const [twilioConfigured, setTwilioConfigured] = useState(false)
  const [activeAudioPlaying, setActiveAudioPlaying] = useState(false)

  // Twilio Settings Drawer / State
  const [showConfig, setShowConfig] = useState(false)
  const [accountSid, setAccountSid] = useState('')
  const [authToken, setAuthToken] = useState('')
  const [fromNumber, setFromNumber] = useState('')
  const [configSaving, setConfigSaving] = useState(false)
  const [configMsg, setConfigMsg] = useState('')

  const REASONS = [
    {
      id: 'mask_advisory',
      label: 'N95 Respirator Advisory',
      desc: 'Calls user immediately when outdoor AQI / gas levels mandate wearing an N95 mask.',
      badge: 'Mandatory N95'
    },
    {
      id: 'predictive_alert',
      label: 'Imminent AQI Spike (48h AI)',
      desc: 'Calls ahead of time when machine learning models predict a rapid pollution surge.',
      badge: 'Predictive Surge'
    },
    {
      id: 'severe_hazardous',
      label: 'Severe Red AQI Spike',
      desc: 'Direct emergency telephone broadcast to caregiver & user when thresholds cross dangerous limits.',
      badge: 'Hazardous Red'
    }
  ]

  const loadLogs = async () => {
    try {
      const data = await fetchCallLogs()
      if (data?.calls) {
        setCallHistory(data.calls)
      }
      setTwilioConfigured(Boolean(data?.twilio_configured))
    } catch (e) {
      console.warn('Could not load call history', e)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  const handleSaveTwilio = async (e) => {
    e.preventDefault()
    if (!accountSid.trim() || !authToken.trim() || !fromNumber.trim()) {
      setConfigMsg('Please enter Account SID, Auth Token, and Twilio phone number.')
      return
    }

    setConfigSaving(true)
    setConfigMsg('')
    try {
      const res = await saveTwilioConfig(accountSid, authToken, fromNumber)
      if (res?.configured) {
        setTwilioConfigured(true)
        setConfigMsg('✓ Twilio credentials successfully saved! Live phone calls will ring actual devices.')
        setTimeout(() => setShowConfig(false), 2000)
      } else {
        setConfigMsg('Could not verify credentials. Please check details.')
      }
    } catch (err) {
      setConfigMsg('Failed to connect to backend: ' + err.message)
    } finally {
      setConfigSaving(false)
    }
  }

  const handleTriggerCall = async (overrideReason = null) => {
    const selectedReason = overrideReason || reasonType
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      alert('Please enter a valid telephone number with country code (e.g. +91 98765 43210)')
      return
    }

    setCalling(true)
    try {
      const res = await triggerEmergencyCall(phoneNumber, selectedReason, city, mode, lang, false)
      setLastCallResult(res)
      loadLogs()

      // Browser speech synthesis playback preview
      if ('speechSynthesis' in window && res?.spoken_script) {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(res.spoken_script)
        utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US'
        utterance.rate = 0.95
        utterance.onstart = () => setActiveAudioPlaying(true)
        utterance.onend = () => setActiveAudioPlaying(false)
        utterance.onerror = () => setActiveAudioPlaying(false)
        window.speechSynthesis.speak(utterance)
      }
    } catch (e) {
      console.error('Call dispatch failed', e)
    } finally {
      setCalling(false)
    }
  }

  const stopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setActiveAudioPlaying(false)
    }
  }

  return (
    <div className="fresh-card rounded-3xl p-6 sm:p-7 border border-[#e1dacb] flex flex-col gap-6 shadow-sm">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#e5dfd2]">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#e86b5c]/15 text-[#b93826] rounded-2xl border border-[#e86b5c]/30 shadow-sm">
            <PhoneCall size={24} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg md:text-xl font-black text-[#112331]">
                Automated Emergency Calling Agent
              </h3>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                twilioConfigured 
                  ? 'bg-[#c5e6d4] text-[#134228] border-[#9fd3b6]' 
                  : 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]'
              }`}>
                {twilioConfigured ? 'TWILIO CARRIER LIVE' : 'SIMULATION & TTS MODE'}
              </span>
            </div>
            <p className="text-xs text-[#64748b] font-medium">
              Autonomous outbound phone call dispatcher for severe spikes, predictive hazards, & N95 mask advisories
            </p>
          </div>
        </div>

        {/* Language selector & Config Toggle */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
          {/* Twilio Settings Toggle Button */}
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`text-xs px-3.5 py-1.5 rounded-xl font-bold border transition-all flex items-center gap-1.5 ${
              twilioConfigured
                ? 'bg-white hover:bg-[#faf7f0] text-[#1e4d6b] border-[#d6cebf]'
                : 'bg-[#b93826] hover:bg-[#a12f1f] text-white border-[#b93826] shadow-sm animate-pulse'
            }`}
          >
            <Settings size={13} />
            <span>{twilioConfigured ? 'Twilio Settings' : 'Connect Real Phone (Twilio)'}</span>
          </button>

          {/* Bilingual Selector */}
          <div className="flex items-center bg-[#eae3d4] p-1 rounded-xl border border-[#d6cebf]">
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                lang === 'en'
                  ? 'bg-white text-[#112331] shadow-xs'
                  : 'text-[#64748b] hover:text-[#112331]'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLang('hi')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                lang === 'hi'
                  ? 'bg-white text-[#112331] shadow-xs'
                  : 'text-[#64748b] hover:text-[#112331]'
              }`}
            >
              हिन्दी (Hindi)
            </button>
          </div>
        </div>
      </div>

      {/* Carrier Info / Missing Twilio Callout Banner */}
      {!twilioConfigured && (
        <div className="p-4 rounded-2xl bg-[#fffbeb] border border-[#fef3c7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#92400e]">
          <div className="flex items-start sm:items-center gap-2.5">
            <AlertTriangle size={18} className="text-[#d97706] shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <strong className="block text-[#78350f]">Notice: Real Physical Phone Ringing requires Twilio Credentials</strong>
              <span>
                Currently running in <strong>Simulated Telephony Mode</strong> (synthesizes audio via browser speaker). To ring an actual mobile phone number worldwide, enter your free Twilio SID and Token.
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowConfig(true)}
            className="shrink-0 bg-[#d97706] hover:bg-[#b45309] text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all shadow-xs"
          >
            Setup Twilio Now
          </button>
        </div>
      )}

      {/* Interactive Twilio Credentials Drawer */}
      {showConfig && (
        <div className="p-5 rounded-2xl bg-[#fcfaf5] border-2 border-[#1e4d6b]/30 shadow-md flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-[#e5dfd2]">
            <div className="flex items-center gap-2">
              <Key size={16} className="text-[#1e4d6b]" />
              <h4 className="text-sm font-black text-[#112331]">Twilio Voice API Carrier Configuration</h4>
            </div>
            <a
              href="https://www.twilio.com/try-twilio"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-bold text-[#1e4d6b] hover:underline flex items-center gap-1"
            >
              <span>Get Free Twilio Account</span>
              <ExternalLink size={12} />
            </a>
          </div>

          <form onSubmit={handleSaveTwilio} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[#78716c] uppercase block mb-1">Twilio Account SID</label>
              <input
                type="text"
                placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={accountSid}
                onChange={(e) => setAccountSid(e.target.value)}
                className="w-full bg-white border border-[#d6cebf] rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#739d89]"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#78716c] uppercase block mb-1">Twilio Auth Token</label>
              <input
                type="password"
                placeholder="Auth Token"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                className="w-full bg-white border border-[#d6cebf] rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#739d89]"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#78716c] uppercase block mb-1">Twilio Outbound Number</label>
              <input
                type="tel"
                placeholder="+18005550199"
                value={fromNumber}
                onChange={(e) => setFromNumber(e.target.value)}
                className="w-full bg-white border border-[#d6cebf] rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#739d89]"
              />
            </div>

            <div className="sm:col-span-3 flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-[#1e4d6b]">{configMsg}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfig(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-[#d6cebf] bg-white text-xs font-bold text-[#78716c]"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={configSaving}
                  className="px-4 py-1.5 rounded-xl bg-[#1e4d6b] hover:bg-[#163a50] text-white text-xs font-black shadow-sm"
                >
                  {configSaving ? 'Saving...' : 'Save & Enable Real Carrier Calls'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Main Grid: Control & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form & Trigger Controls */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full sm:flex-1">
              <label className="block text-[11px] font-bold text-[#57534e] uppercase tracking-wider mb-1">
                Recipient Telephone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-[#fcfaf5] border border-[#d6cebf] rounded-xl px-3.5 py-2.5 text-xs text-[#1e293b] font-bold tracking-wide focus:outline-none focus:ring-2 focus:ring-[#739d89]"
              />
            </div>

            <div className="w-full sm:w-auto self-end">
              <button
                onClick={() => handleTriggerCall()}
                disabled={calling}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#b93826] hover:bg-[#a12f1f] text-white font-extrabold text-xs shadow-md shadow-[#b93826]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <PhoneCall size={14} className={calling ? 'animate-spin' : ''} />
                <span>{calling ? 'Connecting Call...' : twilioConfigured ? 'Ring Phone via Twilio' : 'Test Call Voice Alert'}</span>
              </button>
            </div>
          </div>

          {/* Trigger Alert Reason Selector */}
          <div>
            <label className="block text-[11px] font-bold text-[#57534e] uppercase tracking-wider mb-1.5">
              Select Call Scenario / Trigger Reason
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {REASONS.map((r) => {
                const active = reasonType === r.id
                return (
                  <div
                    key={r.id}
                    onClick={() => setReasonType(r.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                      active
                        ? 'bg-white border-[#b93826] shadow-sm ring-1 ring-[#b93826]/20'
                        : 'bg-[#fcfaf5] border-[#e1dacb] hover:bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-[#112331]">{r.label}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#e5dfd2] text-[#57534e]">
                          {r.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748b] leading-tight">{r.desc}</p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setReasonType(r.id)
                        handleTriggerCall(r.id)
                      }}
                      className="text-[10px] font-bold text-[#b93826] hover:underline flex items-center gap-1 mt-1"
                    >
                      <PhoneCall size={10} /> Trigger this scenario
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Autonomous Telephony Rules */}
          <div className="p-3.5 rounded-2xl bg-[#fdf8f0] border border-[#eedfc9] flex items-start gap-2.5 text-xs text-[#785b2e]">
            <ShieldAlert size={16} className="shrink-0 mt-0.5 text-[#b45309]" />
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-[#92400e]">Autonomous Outbound Dispatch</span>
              <span className="text-[11px] leading-relaxed text-[#785b2e]">
                Target: <strong>{phoneNumber}</strong> | Location: <strong>{city}</strong> | Profile: <strong className="capitalize">{mode}</strong>. 
                When real-time AQI exceeds <strong>{mode === 'asthma' ? '150' : '200'}</strong>, the system dials out with an urgent audio broadcast advising mandatory N95 mask usage.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Call Audio & Transcript Preview */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#57534e] uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 size={13} /> Voice Dispatch Audio & Transcript
            </span>
            {activeAudioPlaying && (
              <button
                onClick={stopAudio}
                className="text-[10px] font-bold text-[#b93826] hover:underline flex items-center gap-1"
              >
                ■ Stop Audio
              </button>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#d6cebf] flex flex-col gap-3 shadow-xs">
            {lastCallResult ? (
              <>
                <div className="flex items-center justify-between text-xs pb-2 border-b border-[#f1ebd9]">
                  <div className="flex items-center gap-1.5 font-bold text-[#134228]">
                    <CheckCircle2 size={14} className="text-[#16a34a]" />
                    <span>
                      {lastCallResult.provider === 'twilio_live' ? 'Live Phone Call Placed (Twilio)' : 'Simulated Voice Dispatch (TTS)'}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#78716c] font-mono">{lastCallResult.call_id}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-[#78716c] block mb-1">
                    Spoken Voice Broadcast ({lastCallResult.lang === 'hi' ? 'हिन्दी Audio' : 'English Audio'}):
                  </span>
                  <p className="text-xs text-[#1e293b] font-medium italic bg-[#fcfaf5] p-3 rounded-xl border border-[#e8e2d4] leading-relaxed">
                    "{lastCallResult.spoken_script}"
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#64748b] pt-1">
                  <span>Recipient: <strong>{lastCallResult.phone_number}</strong></span>
                  <span>Carrier: <strong className="capitalize">{lastCallResult.provider}</strong></span>
                </div>
              </>
            ) : (
              <div className="text-center py-6 flex flex-col items-center gap-2 text-[#78716c]">
                <PhoneCall size={28} className="text-[#c5beb0]" />
                <p className="text-xs font-semibold">No call dispatched yet.</p>
                <p className="text-[11px] text-[#a8a29e] max-w-xs">
                  Click "Test Call Voice Alert" above to test the autonomous voice alert.
                </p>
              </div>
            )}
          </div>

          {/* Call History Mini Log */}
          {callHistory.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-1">
              <span className="text-[10px] font-bold text-[#78716c] uppercase tracking-wider flex items-center gap-1">
                <Clock size={11} /> Recent Dispatches ({callHistory.length})
              </span>
              <div className="max-h-28 overflow-y-auto flex flex-col gap-1 pr-1 text-[11px]">
                {callHistory.slice(0, 3).map((call, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-[#f8f5ee] border border-[#e5dfd2] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className={`w-1.5 h-1.5 rounded-full ${call.provider === 'twilio_live' ? 'bg-[#2563eb]' : 'bg-[#16a34a]'} shrink-0`} />
                      <span className="font-semibold text-[#112331] truncate">{call.reason}</span>
                    </div>
                    <span className="text-[10px] text-[#78716c] shrink-0 font-mono">
                      {new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  )
}
