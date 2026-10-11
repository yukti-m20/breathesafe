import React, { useState, useEffect } from 'react'
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import { History } from 'lucide-react'
import { fetchHistory } from '../lib/api'

export default function HistoryChart() {
  const [hours, setHours] = useState(24)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  const loadData = async (h) => {
    setLoading(true)
    try {
      const res = await fetchHistory(h)
      const list = Array.isArray(res) ? res : (Array.isArray(res?.records) ? res.records : [])
      if (list.length > 0) {
        const formatted = list.map((r) => {
          const t = r['@timestamp'] ? new Date(r['@timestamp']) : new Date()
          const timeStr = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`
          return {
            time: timeStr,
            gas_index: r.gas_index !== null && r.gas_index !== undefined ? Number(r.gas_index) : null,
            temp_c: r.temp_c !== null && r.temp_c !== undefined ? Number(r.temp_c) : null,
          }
        })
        setData(formatted)
      }
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(hours)
  }, [hours])

  return (
    <div className="fresh-card rounded-3xl p-5 shadow-md flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-[#e1dacb] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#edf4f9] text-[#1e4d6b] rounded-xl border border-[#d3e3ee]">
            <History size={16} />
          </div>
          <span className="text-xs font-extrabold text-[#112331] uppercase tracking-wider">Sensor History (OpenSearch)</span>
        </div>
        <div className="flex gap-1 fresh-card-subtle p-0.5 rounded-full border border-[#e1dacb]">
          {[1, 6, 12, 24].map((h) => (
            <button
              key={h}
              onClick={() => setHours(h)}
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold transition-all ${
                hours === h ? 'fresh-pill-active' : 'text-[#64748b] hover:text-[#1e293b]'
              }`}
            >
              {h}h
            </button>
          ))}
        </div>
      </div>

      <div className="h-60 w-full mt-2">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-[#78716c] font-medium">
            No sensor history recorded yet in OpenSearch.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e1dacb" />
              <XAxis dataKey="time" stroke="#78716c" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" stroke="#e11d48" domain={[0, 'auto']} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#1e4d6b" domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e1dacb', borderRadius: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line yAxisId="left" type="monotone" dataKey="gas_index" name="Gas Index" stroke="#e11d48" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="temp_c" name="Temp (°C)" stroke="#1e4d6b" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
