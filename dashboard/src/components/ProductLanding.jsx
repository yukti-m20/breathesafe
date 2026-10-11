import React, { useState } from 'react'
import { 
  Wind, Shield, Activity, Cpu, HeartPulse, Send, Check, Sparkles, 
  ArrowRight, Radio, BellRing, Layers, Eye, Smartphone, Zap, CheckCircle2,
  Calendar, Flame, Droplets, Users, ChevronRight, PhoneCall, Upload
} from 'lucide-react'

export default function ProductLanding({ onNavigate }) {
  const [productImg, setProductImg] = useState('/hardware_badge.jpg')

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setProductImg(url)
    }
  }

  return (
    <div className="flex flex-col gap-12 w-full animate-in fade-in duration-300">
      
      {/* =========================================================================
          HERO SECTION (Product Overview & Showcase Space)
          ========================================================================= */}
      <section className="relative overflow-hidden rounded-[2.5rem] fresh-card border border-[#e1dacb] p-8 md:p-14 shadow-xl">
        {/* Ambient Organic Atmosphere Glows */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-[450px] h-[450px] bg-[#cbe3d3]/45 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-16 w-[380px] h-[380px] bg-[#faecd6]/50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Text / Value Proposition */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 bg-[#d7e9dc] text-[#1c4b35] text-xs font-black px-3.5 py-1.5 rounded-full border border-[#badbc4] w-fit shadow-xs">
              <Sparkles size={14} className="text-[#256e48]" />
              <span>Next-Gen Personal Environmental Safety Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#112331] tracking-tight leading-[1.12]">
              Breathe Clean. <br />
              <span className="text-[#1e4d6b]">Live Protected</span> With <br />
              <span className="text-[#8c6b32]">Autonomous AI</span>
            </h1>

            <p className="text-[#475569] text-sm md:text-base leading-relaxed max-w-xl font-medium">
              <strong>BreatheSafe Shield</strong> is an intelligent wearable badge and guardian system designed for high-risk individuals—children, asthma sufferers, and elderly citizens. It tracks hyper-local air pollution, heat stress, predicts severe AQI spikes 48 hours in advance, and autonomously calls you before dangerous outdoor exposure.
            </p>

            {/* Quick Action Navigation CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={() => onNavigate('planner')}
                className="fresh-btn-primary font-black px-6 py-3.5 rounded-2xl text-xs md:text-sm transition-all flex items-center gap-2 shadow-lg shadow-[#739d89]/30"
              >
                <span>Open Day Planner & Exposure</span>
                <Calendar size={16} />
              </button>

              <button
                onClick={() => onNavigate('calling')}
                className="bg-white hover:bg-[#faf7f0] text-[#991b1b] border border-[#fecaca] font-black px-6 py-3.5 rounded-2xl text-xs md:text-sm transition-all flex items-center gap-2 shadow-xs"
              >
                <PhoneCall size={16} className="text-[#b93826]" />
                <span>AI Voice Calling Agent</span>
              </button>

              <button
                onClick={() => onNavigate('hardware')}
                className="fresh-btn-secondary font-bold px-5 py-3.5 rounded-2xl text-xs md:text-sm transition-all flex items-center gap-2"
              >
                <Cpu size={16} />
                <span>Hardware Telemetry</span>
              </button>
            </div>

            {/* Micro proof points */}
            <div className="flex items-center gap-6 pt-3 border-t border-[#e3dcce] text-xs font-bold text-[#57534e]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-[#16a34a]" />
                <span>ESP32-C3 Wearable</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-[#16a34a]" />
                <span>AWS Strands AI</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-[#16a34a]" />
                <span>Cedar RBAC Security</span>
              </div>
            </div>
          </div>

          {/* Right Dedicated Product Image Frame */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-full aspect-square max-w-md rounded-3xl fresh-card border-2 border-dashed border-[#c5beb0] p-4 flex flex-col items-center justify-center text-center overflow-hidden group shadow-inner">
              
              {productImg ? (
                <div className="relative w-full h-full rounded-2xl overflow-hidden group">
                  <img 
                    src={productImg} 
                    alt="BreatheSafe Wearable Hardware" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <label className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm border border-[#d6cebf] text-[#112331] text-[11px] font-bold px-3 py-1.5 rounded-xl cursor-pointer hover:bg-white shadow-sm flex items-center gap-1.5">
                    <Upload size={12} />
                    <span>Change Image</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 p-6">
                  <div className="w-20 h-20 rounded-2xl bg-[#ebe3d3] text-[#735e39] flex items-center justify-center border border-[#d6cebf] shadow-sm">
                    <Cpu size={36} className="text-[#1e4d6b]" />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-black text-[#112331]">Product Showcase Space</h3>
                    <p className="text-xs text-[#64748b] max-w-xs">
                      ESP32-C3 Wearable Badge with OLED display, MQ Gas sensor, & DHT11 thermal monitor.
                    </p>
                  </div>

                  {/* Image Upload Button */}
                  <label className="mt-2 bg-[#1e4d6b] hover:bg-[#153a52] text-white text-xs font-black px-4 py-2.5 rounded-xl cursor-pointer shadow-md shadow-[#1e4d6b]/20 transition-all flex items-center gap-2">
                    <Upload size={14} />
                    <span>Upload Product Photo</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>

                  <span className="text-[10px] text-[#8c8273] italic">
                    Drop PNG or JPG photo of the badge hardware here
                  </span>
                </div>
              )}

              {/* Badge overlay tag */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-[#d6cebf] text-[10px] font-black text-[#1e4d6b] uppercase tracking-wider shadow-xs">
                Wearable Badge v2.0
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* =========================================================================
          KEY PRODUCT HIGHLIGHTS & ARCHITECTURE PILLARS
          ========================================================================= */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-extrabold text-[#78716c] uppercase tracking-wider">Comprehensive Architecture</span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#112331]">End-to-End Health Defense System</h2>
          <p className="text-xs sm:text-sm text-[#64748b]">Engineered for high accuracy environmental telemetry and instantaneous protective response.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Hardware Badge */}
          <div className="fresh-card rounded-3xl p-6 flex flex-col justify-between gap-4 border border-[#e1dacb] hover:shadow-md transition-shadow">
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-[#e8f1ec] text-[#2d6148] rounded-2xl border border-[#d2e4d9] w-fit">
                <Cpu size={22} />
              </div>
              <h4 className="text-base font-bold text-[#112331]">1. ESP32 Wearable Badge</h4>
              <p className="text-xs text-[#526071] leading-relaxed">
                Dual-core microcontroller sampling MQ gas sensors, ambient temperature, humidity, and calculated Heat Index with an onboard 0.96" OLED display.
              </p>
            </div>
            <button
              onClick={() => onNavigate('hardware')}
              className="text-xs font-bold text-[#2d6148] hover:underline flex items-center gap-1 self-start"
            >
              <span>View Hardware Telemetry</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Card 2: AI Day Planner */}
          <div className="fresh-card rounded-3xl p-6 flex flex-col justify-between gap-4 border border-[#e1dacb] hover:shadow-md transition-shadow">
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-[#edf4f9] text-[#1e4d6b] rounded-2xl border border-[#d3e3ee] w-fit">
                <Calendar size={22} />
              </div>
              <h4 className="text-base font-bold text-[#112331]">2. Exposure & Day Planner</h4>
              <p className="text-xs text-[#526071] leading-relaxed">
                Time-weighted inhalation dose modeling calculated across indoor/outdoor blocks and physical activity respiration multipliers (rest, light, exercise).
              </p>
            </div>
            <button
              onClick={() => onNavigate('planner')}
              className="text-xs font-bold text-[#1e4d6b] hover:underline flex items-center gap-1 self-start"
            >
              <span>Explore Day Planner</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Card 3: Autonomous Voice Calling */}
          <div className="fresh-card rounded-3xl p-6 flex flex-col justify-between gap-4 border border-[#e1dacb] hover:shadow-md transition-shadow">
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-[#faecd6] text-[#8c6b32] rounded-2xl border border-[#edd7b6] w-fit">
                <PhoneCall size={22} className="text-[#b93826]" />
              </div>
              <h4 className="text-base font-bold text-[#112331]">3. Autonomous Calling Agent</h4>
              <p className="text-xs text-[#526071] leading-relaxed">
                Automatically places an emergency phone call in English or Hindi whenever severe air spikes occur or an N95 respirator is strictly required.
              </p>
            </div>
            <button
              onClick={() => onNavigate('calling')}
              className="text-xs font-bold text-[#b93826] hover:underline flex items-center gap-1 self-start"
            >
              <span>Test Voice Agent</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Card 4: Strands AI + Cedar RBAC */}
          <div className="fresh-card rounded-3xl p-6 flex flex-col justify-between gap-4 border border-[#e1dacb] hover:shadow-md transition-shadow">
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-[#f5edf9] text-[#692b87] rounded-2xl border border-[#e8d5f0] w-fit">
                <Shield size={22} />
              </div>
              <h4 className="text-base font-bold text-[#112331]">4. Strands AI & Cedar RBAC</h4>
              <p className="text-xs text-[#526071] leading-relaxed">
                AWS Strands Agents SDK provides real-time personalized medical advice, while AWS Cedar governs role-based caregiver policies for protected family members.
              </p>
            </div>
            <button
              onClick={() => onNavigate('planner')}
              className="text-xs font-bold text-[#692b87] hover:underline flex items-center gap-1 self-start"
            >
              <span>Check Family Profiles</span>
              <ChevronRight size={14} />
            </button>
          </div>

        </div>
      </section>


      {/* =========================================================================
          INTERACTIVE LIVE TESTBENCH (Hardware Ingest Simulation)
          ========================================================================= */}
      <section className="fresh-card rounded-3xl p-7 md:p-8 border border-[#e1dacb] flex flex-col gap-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#e1dacb] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#1e4d6b] text-white rounded-2xl shadow-sm">
              <Zap size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-[#112331] text-lg">Hardware-Ready Ingest Pipeline</h3>
              <p className="text-xs text-[#64748b]">
                Real-time endpoint: <code className="text-[#1e4d6b] font-mono font-bold bg-[#f1ebd9] px-2 py-0.5 rounded">POST /api/ingest</code>
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('hardware')}
            className="text-xs font-bold px-4 py-2 rounded-xl bg-white border border-[#d6cebf] hover:bg-[#faf7f0] text-[#112331] flex items-center gap-1.5 transition-all shadow-xs"
          >
            <span>Telemetry Dashboard</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <p className="text-xs text-[#475569] leading-relaxed max-w-3xl">
          The physical badge sends JSON packets via Wi-Fi polling or direct cloud ingest. The system operates fully even in standalone mode with synthetic simulations. Test the pipeline below:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#f8f5ee] p-5 rounded-2xl border border-[#e8e2d4]">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-[#78716c] uppercase">Badge Status</span>
            <span className="text-xs font-black text-[#134228] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
              Ingestion Ready
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-[#78716c] uppercase">Vulnerability Profile</span>
            <span className="text-xs font-black text-[#1e4d6b]">Adaptive Mode</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-[#78716c] uppercase">Calling Engine</span>
            <span className="text-xs font-black text-[#991b1b]">Twilio / TTS Armed</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-[#78716c] uppercase">Time-Series Storage</span>
            <span className="text-xs font-black text-[#785b2e]">OpenSearch Indexed</span>
          </div>
        </div>
      </section>


      {/* =========================================================================
          SEAMLESS OVERVIEW ENDING FOOTER (Integrated into Page Flow, No Bulge Box)
          ========================================================================= */}
      <footer className="pt-8 border-t border-[#d8d0bf] flex flex-col gap-6 mt-4">
        
        {/* Top 4-Column Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-[#e1dacb]">
          
          {/* Col 1: Brand & Tagline */}
          <div className="flex flex-col gap-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#1e4d6b] text-white rounded-xl">
                <Wind size={18} />
              </div>
              <h3 className="font-black text-sm text-[#112331]">BreatheSafe Shield</h3>
            </div>
            <p className="text-xs text-[#64748b] leading-relaxed">
              Autonomous personal environmental health defense system combining ESP32 wearable hardware, diurnal AI forecasting, and emergency voice alerting.
            </p>
          </div>

          {/* Col 2: Navigation Directory */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-[#78716c] uppercase tracking-wider">Navigation</span>
            <ul className="flex flex-col gap-1.5 text-xs font-semibold text-[#58687a]">
              <li><button onClick={() => onNavigate('overview')} className="hover:text-[#112331] transition-colors text-left">1. Product Overview</button></li>
              <li><button onClick={() => onNavigate('hardware')} className="hover:text-[#112331] transition-colors text-left">2. Hardware Telemetry</button></li>
              <li><button onClick={() => onNavigate('voice')} className="hover:text-[#112331] transition-colors text-left">3. Your AI Coach</button></li>
              <li><button onClick={() => onNavigate('planner')} className="hover:text-[#112331] transition-colors text-left">4. Day Planner & Exposure</button></li>
              <li><button onClick={() => onNavigate('calling')} className="hover:text-[#112331] transition-colors text-left">5. Voice Calling Agent</button></li>
            </ul>
          </div>

          {/* Col 3: AWS Open Source Stack */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-[#78716c] uppercase tracking-wider">Powered By AWS Open Source</span>
            <ul className="flex flex-col gap-1.5 text-xs text-[#58687a]">
              <li>• <strong>AWS Strands Agents SDK</strong> (AI Health Coach)</li>
              <li>• <strong>OpenSearch</strong> (Time-Series Sensor Telemetry)</li>
              <li>• <strong>AWS Cedar</strong> (Caregiver RBAC Security)</li>
              <li>• <strong>Twilio Voice & Polly TTS</strong> (Emergency Alerting)</li>
            </ul>
          </div>

          {/* Col 4: Hackathon Tracks */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-[#78716c] uppercase tracking-wider">Hackathon Submission</span>
            <div className="p-3 bg-[#f8f5ee] rounded-2xl border border-[#e8e2d4] flex flex-col gap-1">
              <span className="text-xs font-bold text-[#112331]">Tracks 01 & 02</span>
              <p className="text-[11px] text-[#64748b] leading-tight">
                Track 01: Air Quality & Exposure Defense<br />
                Track 02: Heat Stress & Water Inhalation Safety
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Baseline Copyright & Heartbeat */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-[#78716c] gap-3 pb-4">
          <span>© 2026 BreatheSafe Shield. Engineered for Environmental Health Protection.</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
            <span className="font-bold text-[#134228]">System Fully Operational</span>
          </div>
        </div>

      </footer>

    </div>
  )
}
