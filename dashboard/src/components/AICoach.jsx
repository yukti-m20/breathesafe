import React, { useState } from 'react'
import { Sparkles, Send, Bot, Languages } from 'lucide-react'
import { askAiCoach } from '../lib/api'

const PROMPTS = {
  en: [
    "Can my child play outside at 5 PM?",
    "When is the best time for outdoor exercise?",
    "Should I wear an N95 mask today?",
    "How can I reduce asthma risk this evening?"
  ],
  hi: [
    "क्या मेरा बच्चा शाम 5 बजे बाहर खेल सकता है?",
    "व्यायाम और दौड़ने के लिए सबसे अच्छा समय क्या है?",
    "क्या मुझे आज N95 मास्क पहनना चाहिए?",
    "शाम को अस्थमा और प्रदूषण से कैसे बचें?"
  ]
}

export default function AICoach({ city, mode, scoreData, forecastData }) {
  const [lang, setLang] = useState('en') // 'en' | 'hi'
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState({
    en: [
      {
        sender: 'bot',
        text: `Hello! I'm your BreatheSafe AI Health Coach powered by AWS Strands Agents SDK. Ask me anything about ${city}'s air quality, safe activity windows, or child & asthma precautions.`
      }
    ],
    hi: [
      {
        sender: 'bot',
        text: `नमस्ते! मैं आपका ब्रीथसेफ एआई हेल्थ कोच हूँ (AWS Strands Agents SDK द्वारा संचालित)। आप मुझसे ${city} की वायु गुणवत्ता, बाहर जाने के सुरक्षित समय और बच्चों या अस्थमा की सावधानियों के बारे में पूछ सकते हैं।`
      }
    ]
  })

  const currentMessages = messages[lang]
  const quickPrompts = PROMPTS[lang]

  const handleSend = async (questionText) => {
    const q = questionText || query
    if (!q.trim()) return

    const userMsg = { sender: 'user', text: q }
    const updatedLangMsgs = [...currentMessages, userMsg]
    
    setMessages({
      ...messages,
      [lang]: updatedLangMsgs
    })
    setQuery('')
    setLoading(true)

    try {
      const scoreContext = scoreData ? `Score: ${scoreData.score}/10, Unhealthy: ${scoreData.unhealthy_air_text}` : ''
      const forecastContext = forecastData?.windows?.recommendation || ''
      const res = await askAiCoach(q, city, mode, lang, scoreContext, forecastContext)
      
      setMessages(prev => ({
        ...prev,
        [lang]: [...prev[lang], { sender: 'bot', text: res.answer }]
      }))
    } catch (e) {
      const fallback = lang === 'hi'
        ? `⚠️ ${city} में ${mode} श्रेणी के लिए: शाम 4 से 8 बजे के बीच बाहर निकलने से बचें। सुबह 6:00 से 7:30 बजे का समय सबसे सुरक्षित है।`
        : `⚠️ For ${mode} mode in ${city}: Limit outdoor exertion during evening traffic hours (4–8 PM). Safe window is 6:00–7:30 AM.`

      setMessages(prev => ({
        ...prev,
        [lang]: [...prev[lang], { sender: 'bot', text: fallback }]
      }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fresh-card rounded-3xl p-6 shadow-md flex flex-col gap-4">
      {/* Header with Language Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e1dacb] pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-[#edf4f9] text-[#1e4d6b] rounded-2xl border border-[#d3e3ee]">
            <Bot size={22} />
          </div>
          <div>
            <h3 className="font-extrabold text-[#112331] text-base flex items-center gap-2">
              {lang === 'hi' ? 'ब्रीथसेफ एआई हेल्थ कोच' : 'BreatheSafe AI Coach'}
              <span className="text-[10px] bg-[#dbeae0] text-[#19402c] px-2 py-0.5 rounded-full border border-[#b2d4bd] font-bold">
                AWS Strands Agent
              </span>
            </h3>
            <p className="text-xs text-[#64748b] font-medium mt-0.5">
              {lang === 'hi' ? `शहर: ${city} • प्रोफ़ाइल: ${mode.toUpperCase()}` : `Active Location: ${city} • ${mode.toUpperCase()} Profile`}
            </p>
          </div>
        </div>

        {/* Dedicated Language Selector Pills */}
        <div className="flex items-center gap-1.5 fresh-card-subtle p-1 rounded-full border border-[#e1dacb]">
          <div className="flex items-center gap-1 px-2 text-[11px] font-bold text-[#78716c]">
            <Languages size={13} className="text-[#1e4d6b]" />
            <span>Language:</span>
          </div>
          <button
            onClick={() => setLang('en')}
            className={`text-xs px-3 py-1 rounded-full font-bold transition-all ${
              lang === 'en'
                ? 'fresh-pill-active'
                : 'text-[#64748b] hover:text-[#1e293b]'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLang('hi')}
            className={`text-xs px-3 py-1 rounded-full font-bold transition-all ${
              lang === 'hi'
                ? 'fresh-pill-active'
                : 'text-[#64748b] hover:text-[#1e293b]'
            }`}
          >
            हिंदी
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex flex-col gap-3.5 max-h-80 overflow-y-auto pr-1">
        {currentMessages.map((m, i) => (
          <div
            key={i}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[90%] text-xs md:text-sm p-4 rounded-2xl leading-relaxed whitespace-pre-line shadow-sm ${
                m.sender === 'user'
                  ? 'bg-[#1e4d6b] text-white rounded-br-none shadow-md shadow-[#1e4d6b]/20 font-semibold'
                  : 'bg-white text-[#1e293b] border border-[#e1dacb] rounded-bl-none font-medium'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-[#1e4d6b] animate-pulse pl-1 font-semibold">
            <Sparkles size={14} />
            <span>
              {lang === 'hi'
                ? 'एआई कोच मौसम और स्वास्थ्य सलाह तैयार कर रहा है...'
                : 'AI Coach is evaluating environmental forecast & profile...'}
            </span>
          </div>
        )}
      </div>

      {/* Quick Question Chips (In active language) */}
      <div className="flex gap-2 flex-wrap pt-1">
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            disabled={loading}
            onClick={() => handleSend(q)}
            className="text-[11px] font-semibold bg-white hover:bg-[#faf7f0] text-[#475569] hover:text-[#1e293b] px-3.5 py-1.5 rounded-xl border border-[#d6cdbc] transition-all shadow-sm text-left"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input box */}
      <div className="flex gap-2 pt-1">
        <input
          type="text"
          value={query}
          disabled={loading}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={lang === 'hi' ? 'हिंदी में पूछें (जैसे "क्या मेरा बच्चा शाम 5 बजे बाहर खेल सकता है?")...' : 'Ask in English (e.g., "Can my child play outside at 5 PM?")...'}
          className="flex-1 bg-white border border-[#d6cdbc] rounded-2xl px-4 py-3 text-xs text-[#1e293b] font-medium placeholder-[#94a3b8] focus:outline-none focus:border-[#739d89] shadow-sm"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !query.trim()}
          className="fresh-btn-primary px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-all shadow-md"
        >
          <Send size={14} />
          <span>{lang === 'hi' ? 'पूछें' : 'Send'}</span>
        </button>
      </div>
    </div>
  )
}
