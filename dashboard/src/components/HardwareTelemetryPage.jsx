import React, { useState } from 'react'
import { 
  Activity, Radio, AlertTriangle, Cpu, Zap, RotateCcw, 
  Flame, Droplets, Gauge, Wind, ShieldCheck, RefreshCw, CheckCircle2, Shield
} from 'lucide-react'
import ModeSelector from './ModeSelector'
import LevelBadge from './LevelBadge'
import AIActionCard from './AIActionCard'
import DeviceStatus from './DeviceStatus'
import MetricsGrid from './MetricsGrid'
import ExposureBar from './ExposureBar'
import HistoryChart from './HistoryChart'
import { ingestReading } from '../lib/api'

export default function HardwareTelemetryPage({
  reading,
  aiAction,
  badgeReachable,
  profileMode,
  handleModeChange,
  handleCalibrate,
  handleReset
}) {
  const [simTemp, setSimTemp] = useState(27.0)
  const [simHum, setSimHum] = useState(55)
  const [simGas, setSimGas] = useState(1.8)
  const [ingesting, setIngesting] = useState(false)
  const [ingestedSuccess, setIngestedSuccess] = useState(false)

  const handleSimulatedIngest = async (overrideGas = null) => {
    const gasVal = overrideGas !== null ? overrideGas : simGas
    if (overrideGas !== null) setSimGas(overrideGas)

    setIngesting(true)
    try {
      await ingestReading({
        id: 'esp32-c3-badge-01',
        mode: profileMode.toUpperCase(),
        level: gasVal > 2.2 ? 'UNHEALTHY' : gasVal > 1.4 ? 'MODERATE' : 'GOOD',
        gas_level: gasVal > 2.2 ? 'UNHEALTHY' : gasVal > 1.4 ? 'MODERATE' : 'GOOD',
        heat_level: simTemp > 35 ? 'UNHEALTHY' : 'GOOD',
        temp_c: simTemp,
        hum: simHum,
        heat_index_c: simTemp + 1.2,
        gas_index: gasVal,
        gas_mv: Math.round(gasVal * 950),
        gas_baseline_mv: 950.0,
        calibrated: true,
        warmup_left_s: 0,
        mq_fault: false,
        score: gasVal * 0.25,
        gas_dose_idx_h: gasVal * 0.08
      })
      setIngestedSuccess(true)
      setTimeout(() => setIngestedSuccess(false), 3500)
    } catch (e) {
      console.warn('Ingest failed', e)
    } finally {
      setIngesting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      
      {/* Telemetry Header Banner - Air Track Framed */}
      <div className="fresh-card rounded-3xl p-6 sm:p-8 border border-[#e1dacb] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-[#1e4d6b] text-white rounded-2xl shadow-md shadow-[#1e4d6b]/20">
            <Wind size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-black text-[#112331]">
                Air Quality Hardware Telemetry & Sensors
              </h2>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                badgeReachable
                  ? 'bg-[#c5e6d4] text-[#134228] border-[#9fd3b6]'
                  : 'bg-[#faecd6] text-[#8c6b32] border-[#edd7b6]'
              }`}>
                {badgeReachable ? 'BADGE ONLINE' : 'INGESTION READY (AIR TRACK)'}
              </span>
            </div>
            <p className="text-xs text-[#64748b] font-medium mt-0.5">
              ESP32-C3 Wearable Badge Stream, OpenSearch Historical Telemetry & MQ-135 Gas Chamber Monitoring
            </p>
          </div>
        </div>

        {/* Quick Calibration Action */}
        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button
            onClick={handleCalibrate}
            className="text-xs px-4 py-2.5 rounded-xl font-bold bg-white hover:bg-[#faf7f0] border border-[#d6cebf] text-[#1e293b] flex items-center gap-2 shadow-2xs transition-all"
          >
            <RefreshCw size={13} />
            <span>Zero Sensor Baseline (950 mV)</span>
          </button>
        </div>
      </div>

      {/* Disconnection Warning or Ready Banner */}
      {!badgeReachable && (
        <div className="fresh-card bg-[#fff7ed] border border-[#ffedd5] text-[#9a3412] text-xs md:text-sm rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 font-bold">
            <Radio size={16} className="text-[#ea580c] animate-pulse" />
            <span>Physical Hardware is in Standby / Direct Cloud Ingestion Ready</span>
          </div>
          <span className="text-xs text-[#7c2d12] bg-[#ffedd5] px-3 py-1 rounded-xl font-medium">
            Endpoints accept Wi-Fi polling or POST /api/ingest
          </span>
        </div>
      )}

      {/* Main 2-Column Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Badge Controls, OLED status & AI action card */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <ModeSelector
            currentMode={reading?.mode || profileMode}
            onModeChange={handleModeChange}
            onCalibrate={handleCalibrate}
            warmupLeft={reading?.warmup_left_s || 0}
          />

          <LevelBadge reading={reading} />

          <AIActionCard action={aiAction} badgeReachable={badgeReachable} />

          <DeviceStatus reading={reading} badgeReachable={badgeReachable} />

          {/* Quick Hardware Ingest Simulator - Air Track Focused */}
          <div className="fresh-card rounded-3xl p-5 border border-[#e1dacb] flex flex-col gap-3.5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#e5dfd2] pb-2">
              <span className="text-xs font-black text-[#112331] flex items-center gap-1.5">
                <Zap size={14} className="text-[#1e4d6b]" />
                Live Ingest Test Bench (Air Simulation)
              </span>
              <span className="text-[10px] text-[#78716c] font-mono">POST /api/ingest</span>
            </div>

            {/* Quick Scenario Preset Buttons */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-[#78716c] uppercase tracking-wider">
                Quick Pollution Simulation:
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleSimulatedIngest(0.95)}
                  className="py-1.5 px-2 rounded-xl bg-white hover:bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d] font-bold text-[11px] transition-all"
                >
                  🟢 Clean Air (0.95×)
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulatedIngest(1.85)}
                  className="py-1.5 px-2 rounded-xl bg-white hover:bg-[#fffbeb] border border-[#fde68a] text-[#b45309] font-bold text-[11px] transition-all"
                >
                  🟡 Moderate VOC (1.85×)
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulatedIngest(3.10)}
                  className="py-1.5 px-2 rounded-xl bg-white hover:bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] font-bold text-[11px] transition-all"
                >
                  🔴 Hazardous (3.10×)
                </button>
              </div>
            </div>

            {/* Granular Sliders/Inputs */}
            <div className="grid grid-cols-3 gap-2 text-xs pt-1">
              <div>
                <label className="text-[10px] font-bold text-[#1e4d6b] block mb-1">
                  Gas Ratio (×)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={simGas}
                  onChange={(e) => setSimGas(parseFloat(e.target.value) || 1.0)}
                  className="w-full bg-[#fcfaf5] border border-[#d6cebf] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#112331]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#78716c] block mb-1">
                  Temp (°C)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={simTemp}
                  onChange={(e) => setSimTemp(parseFloat(e.target.value) || 27)}
                  className="w-full bg-[#fcfaf5] border border-[#d6cebf] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#112331]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#78716c] block mb-1">
                  Humidity (%)
                </label>
                <input
                  type="number"
                  value={simHum}
                  onChange={(e) => setSimHum(parseFloat(e.target.value) || 55)}
                  className="w-full bg-[#fcfaf5] border border-[#d6cebf] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#112331]"
                />
              </div>
            </div>

            <button
              onClick={() => handleSimulatedIngest(null)}
              disabled={ingesting}
              className="w-full py-2.5 rounded-xl bg-[#1e4d6b] hover:bg-[#163a50] text-white text-xs font-bold transition-all shadow-md shadow-[#1e4d6b]/20 flex items-center justify-center gap-2"
            >
              {ingestedSuccess ? <CheckCircle2 size={14} className="text-[#86efac]" /> : <Zap size={14} />}
              <span>{ingestedSuccess ? 'Air Packet Ingested!' : 'Dispatch Custom Air Packet'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Key metrics grid, dose bar, OpenSearch history chart */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <MetricsGrid reading={reading} />
          
          <ExposureBar reading={reading} onReset={handleReset} />

          <HistoryChart />
        </div>

      </div>

    </div>
  )
}
