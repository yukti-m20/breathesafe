import React, { useState } from 'react'
import { 
  Calendar, Clock, ShieldCheck, Activity, Plus, Trash2, 
  RotateCcw, Sparkles, AlertCircle, Compass, Users, CheckCircle2
} from 'lucide-react'
import ExposureScoreCard from './ExposureScoreCard'
import BestWindowPlanner from './BestWindowPlanner'
import DayPlanner, { STUDENT_TEMPLATE } from './DayPlanner'
import FamilyProfilesCedar from './FamilyProfilesCedar'

export default function DayPlannerOverviewPage({
  city,
  mode,
  scoreData,
  forecastData,
  blocks,
  setBlocks,
  handleCalculateScore,
  calculating,
  cedarRole,
  setCedarRole,
  activeMember,
  setActiveMember
}) {
  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="fresh-card rounded-3xl p-6 sm:p-8 border border-[#e1dacb] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-[#739d89]/20 text-[#134228] rounded-2xl border border-[#739d89]/30 shadow-sm">
            <Calendar size={28} className="text-[#1e4d6b]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-black text-[#112331]">
                Personal Day Plan & Exposure Modeling
              </h2>
              <span className="text-[10px] bg-[#97b5a1] text-[#133020] font-black px-2.5 py-0.5 rounded-full border border-[#83a48e]">
                TIME-WEIGHTED DOSE
              </span>
            </div>
            <p className="text-xs text-[#64748b] font-medium">
              48-Hour Diurnal Pollution Optimization, Respiration Factors & Time-Weighted Inhalation Scores
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#eae3d4] px-4 py-2 rounded-2xl border border-[#d6cebf] text-xs font-bold text-[#57534e]">
          <span>City: <strong className="text-[#112331]">{city}</strong></span>
          <span>•</span>
          <span>Mode: <strong className="text-[#112331] capitalize">{mode}</strong></span>
        </div>
      </div>

      {/* Top Exposure Score & 48h Best Windows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExposureScoreCard scoreData={scoreData} mode={mode} />
        <BestWindowPlanner
          windows={forecastData?.windows}
          alerts={forecastData?.alerts}
          mode={mode}
        />
      </div>

      {/* Schedule Time-Blocks Planner */}
      <DayPlanner
        blocks={blocks}
        setBlocks={setBlocks}
        onRecalculate={handleCalculateScore}
        loading={calculating}
      />

      {/* Family Profiles & Cedar RBAC */}
      <FamilyProfilesCedar
        currentRole={cedarRole}
        setRole={setCedarRole}
        activeMember={activeMember}
        setActiveMember={setActiveMember}
      />

    </div>
  )
}
