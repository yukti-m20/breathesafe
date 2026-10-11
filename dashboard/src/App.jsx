import React, { useState, useEffect } from 'react'
import { 
  Wind, Radio, Shield, MapPin, Sparkles, Navigation, Activity, Calendar, 
  Users, Home, PhoneCall, LogOut, Lock, Mic, Cpu
} from 'lucide-react'
import { useLiveData } from './hooks/useLiveData'
import { setMode, calibrate, resetToday, fetchForecast, calculateExposure } from './lib/api'

import { STUDENT_TEMPLATE } from './components/DayPlanner'
import AuthGate from './components/AuthGate'
import ProductLanding from './components/ProductLanding'
import HardwareTelemetryPage from './components/HardwareTelemetryPage'
import VoiceCommandPage from './components/VoiceCommandPage'
import DayPlannerOverviewPage from './components/DayPlannerOverviewPage'
import CallingAgent from './components/CallingAgent'

const CITIES = ['Delhi NCR', 'Mumbai', 'Bengaluru', 'Kolkata', 'Hyderabad', 'Chennai', 'Pune']

export default function App() {
  const { data, connected, wsConnected } = useLiveData()

  // Authentication State with LocalStorage Persistence
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('breathesafe_auth_session')
      return saved ? JSON.parse(saved) : null
    } catch (e) {
      return null
    }
  })

  // Navigation pages: 'overview' | 'hardware' | 'voice' | 'planner' | 'calling'
  const [activeTab, setActiveTab] = useState('overview')
  const [city, setCity] = useState('Delhi NCR')
  const [profileMode, setProfileMode] = useState('adult')

  const [blocks, setBlocks] = useState(STUDENT_TEMPLATE)
  const [scoreData, setScoreData] = useState(null)
  const [calculating, setCalculating] = useState(false)

  const [forecastData, setForecastData] = useState(null)
  const [cedarRole, setCedarRole] = useState('caregiver')
  const [activeMember, setActiveMember] = useState('self_rahul')

  const reading = data?.reading || null
  const aiAction = data?.ai_action || 'Initializing AI health assistant...'
  const badgeReachable = data?.badge_reachable ?? false

  const loadForecast = async (targetCity, targetMode) => {
    try {
      const res = await fetchForecast(targetCity, targetMode)
      setForecastData(res)
    } catch (e) {
      console.warn('Failed to load forecast', e)
    }
  }

  const handleCalculateScore = async (currentBlocks = blocks, targetCity = city, targetMode = profileMode) => {
    setCalculating(true)
    try {
      const res = await calculateExposure(targetCity, targetMode, currentBlocks)
      setScoreData(res)
    } catch (e) {
      console.warn('Failed to calculate exposure', e)
    } finally {
      setCalculating(false)
    }
  }

  useEffect(() => {
    loadForecast(city, profileMode)
    handleCalculateScore(blocks, city, profileMode)
  }, [city, profileMode])

  const handleModeChange = async (modeId) => {
    setProfileMode(modeId)
    try {
      await setMode(modeId)
    } catch (e) {}
  }

  const handleCalibrate = async () => {
    try {
      await calibrate()
    } catch (e) {}
  }

  const handleReset = async () => {
    try {
      await resetToday()
    } catch (e) {}
  }

  const handleLogout = () => {
    localStorage.removeItem('breathesafe_auth_session')
    setCurrentUser(null)
  }

  return (
    <div className="min-h-screen fresh-bg text-[#1e293b] flex flex-col items-center">
      
      {/* Authentication Gate Modal (Protects GitHub Pages & Live Deployments) */}
      {!currentUser && (
        <AuthGate onAuthenticated={(user) => setCurrentUser(user)} />
      )}

      {/* Main Full-Width Responsive Laptop Wrapper */}
      <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-6 pb-20">
        
        {/* =========================================================================
            PERSISTENT SITE-WIDE NAVBAR
            ========================================================================= */}
        <header className="flex flex-col lg:flex-row items-center justify-between gap-4 py-2 border-b border-[#e5dfd2]/80 pb-4">
          
          {/* Brand Logo & Tagline */}
          <div 
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-3.5 cursor-pointer group"
          >
            <div className="p-2.5 bg-[#1e4d6b] group-hover:bg-[#163a50] text-white rounded-2xl shadow-md shadow-[#1e4d6b]/20 transition-all">
              <Wind size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#112331]">BreatheSafe</h1>
                <span className="text-[10px] bg-[#97b5a1] text-[#133020] font-black px-2 py-0.5 rounded-full border border-[#83a48e]">
                  SHIELD v2
                </span>
              </div>
              <p className="text-xs text-[#64748b] font-medium">Intelligent Environmental Health & Exposure Protection</p>
            </div>
          </div>

          {/* Multi-Page Navigation Pills with "Your AI Coach" */}
          <nav className="flex items-center gap-1 fresh-card-subtle p-1.5 rounded-full border border-[#e1dacb] flex-wrap justify-center shadow-xs">
            
            {/* Page 1: Product Overview */}
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all ${
                activeTab === 'overview'
                  ? 'fresh-pill-active'
                  : 'text-[#58687a] hover:text-[#1e293b]'
              }`}
            >
              <Home size={14} />
              <span>Product Overview</span>
            </button>

            {/* Page 2: Hardware Telemetry */}
            <button
              onClick={() => setActiveTab('hardware')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all ${
                activeTab === 'hardware'
                  ? 'fresh-pill-active'
                  : 'text-[#58687a] hover:text-[#1e293b]'
              }`}
            >
              <Cpu size={14} />
              <span>Hardware Telemetry</span>
            </button>

            {/* Page 3: Your AI Coach (renamed as requested) */}
            <button
              onClick={() => setActiveTab('voice')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all ${
                activeTab === 'voice'
                  ? 'fresh-pill-active'
                  : 'text-[#58687a] hover:text-[#1e293b]'
              }`}
            >
              <Mic size={14} className={activeTab === 'voice' ? 'text-[#1e4d6b]' : 'text-[#739d89]'} />
              <span>Your AI Coach</span>
            </button>

            {/* Page 4: Day Planner & Exposure */}
            <button
              onClick={() => setActiveTab('planner')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all ${
                activeTab === 'planner'
                  ? 'fresh-pill-active'
                  : 'text-[#58687a] hover:text-[#1e293b]'
              }`}
            >
              <Calendar size={14} />
              <span>Day Planner & Exposure</span>
            </button>

            {/* Page 5: Automated Calling Agent */}
            <button
              onClick={() => setActiveTab('calling')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all ${
                activeTab === 'calling'
                  ? 'fresh-pill-active'
                  : 'text-[#58687a] hover:text-[#1e293b]'
              }`}
            >
              <PhoneCall size={14} className="text-[#b93826]" />
              <span>Voice Calling Agent</span>
            </button>
          </nav>

          {/* Right Status Pill & Auth Controls */}
          <div className="flex items-center gap-2.5">
            <div
              className={`flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full border font-bold ${
                wsConnected
                  ? 'bg-[#c5e6d4] text-[#134228] border-[#9fd3b6]'
                  : connected
                  ? 'bg-[#fbedd5] text-[#6d4915] border-[#f0d6ad]'
                  : 'bg-[#fde2e2] text-[#7f1d1d] border-[#f8b4b4]'
              }`}
            >
              <Radio size={12} className={wsConnected ? 'animate-pulse text-[#134228]' : ''} />
              <span>{wsConnected ? 'Live WS' : connected ? 'Polling (8s)' : 'Disconnected'}</span>
            </div>

            {currentUser && (
              <button
                onClick={handleLogout}
                title={`Logged in as ${currentUser.name} (${currentUser.role}). Click to logout.`}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border border-[#d6cebf] bg-white hover:bg-[#fff5f5] text-[#78716c] hover:text-[#991b1b] font-bold transition-all shadow-xs"
              >
                <LogOut size={12} />
                <span>Logout</span>
              </button>
            )}
          </div>
        </header>


        {/* =========================================================================
            GLOBAL LOCATION & VULNERABILITY CONTEXT BAR
            ========================================================================= */}
        <div className="fresh-card rounded-2xl px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4 border border-[#e1dacb] shadow-xs">
          
          {/* Target Location Selector */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="p-2 bg-[#ebdcc4] text-[#785b2e] rounded-xl">
              <MapPin size={16} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#78716c] font-black uppercase tracking-wider">TARGET CITY:</span>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-transparent text-xs text-[#1e293b] font-black focus:outline-none cursor-pointer border-b border-[#c8bfae] pb-0.5"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c} className="bg-[#f7f3ea] text-[#1e293b]">{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Vulnerability Mode Selector */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <span className="text-[11px] text-[#78716c] font-black uppercase tracking-wider mr-1">VULNERABILITY MODE:</span>
            {[
              { id: 'child', label: 'Child', icon: '👶', dot: 'bg-[#ecc36b]' },
              { id: 'adult', label: 'Adult', icon: '🧑', dot: 'bg-[#d6aa52]' },
              { id: 'asthma', label: 'Asthma', icon: '😮‍💨', dot: 'bg-[#c9953a]' }
            ].map((m) => {
              const active = profileMode === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => handleModeChange(m.id)}
                  className={`text-xs px-3.5 py-1.5 rounded-full font-black transition-all flex items-center gap-1.5 shadow-xs ${
                    active
                      ? 'bg-white text-[#112331] border border-[#a89b87] ring-2 ring-[#739d89]/30'
                      : 'bg-white/70 text-[#64748b] border border-[#e1dacb] hover:bg-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${m.dot}`} />
                  <span>{m.label}</span>
                </button>
              )
            })}
          </div>
        </div>


        {/* =========================================================================
            DEDICATED PAGES (Only Product Overview has the integrated ending footer)
            ========================================================================= */}

        {/* PAGE 1: PRODUCT OVERVIEW & IMAGE SHOWCASE (Has integrated ending footer) */}
        {activeTab === 'overview' && (
          <ProductLanding onNavigate={(dest) => setActiveTab(dest)} />
        )}

        {/* PAGE 2: HARDWARE TELEMETRY & SENSORS (No footer) */}
        {activeTab === 'hardware' && (
          <HardwareTelemetryPage
            reading={reading}
            aiAction={aiAction}
            badgeReachable={badgeReachable}
            profileMode={profileMode}
            handleModeChange={handleModeChange}
            handleCalibrate={handleCalibrate}
            handleReset={handleReset}
          />
        )}

        {/* PAGE 3: YOUR AI COACH (Voice & Strands assistant - No footer) */}
        {activeTab === 'voice' && (
          <VoiceCommandPage
            city={city}
            mode={profileMode}
            scoreData={scoreData}
            forecastData={forecastData}
          />
        )}

        {/* PAGE 4: DAY PLANNER & EXPOSURE OVERVIEW (No footer, AICoach removed) */}
        {activeTab === 'planner' && (
          <DayPlannerOverviewPage
            city={city}
            mode={profileMode}
            scoreData={scoreData}
            forecastData={forecastData}
            blocks={blocks}
            setBlocks={setBlocks}
            handleCalculateScore={handleCalculateScore}
            calculating={calculating}
            cedarRole={cedarRole}
            setCedarRole={setCedarRole}
            activeMember={activeMember}
            setActiveMember={setActiveMember}
          />
        )}

        {/* PAGE 5: AUTOMATED EMERGENCY VOICE CALLING AGENT (No footer) */}
        {activeTab === 'calling' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            <CallingAgent city={city} mode={profileMode} />
          </div>
        )}

      </div>
    </div>
  )
}
