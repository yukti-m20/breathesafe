import React, { useState } from 'react'
import { 
  Mic, MicOff, Volume2, Sparkles, Send, Globe, AlertTriangle, 
  HelpCircle, CheckCircle2, Compass, Shield, Wind, Flame
} from 'lucide-react'

export default function VoiceCommandPage({ 
  city = 'Delhi NCR', 
  mode = 'adult', 
  scoreData = null, 
  forecastData = null 
}) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [lang, setLang] = useState('en') // 'en' | 'hi'
  const [messages, setMessages] = useState([
    {
      sender: 'agent',
      text: 'Hello! I am your BreatheSafe Voice & AI Assistant. You can speak or ask anything about today\'s air quality, best window for walks, or whether you should wear an N95 mask.',
      time: 'Just now'
    }
  ])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)

  // Curated quick voice queries in EN and HI
  const QUICK_PROMPTS_EN = [
    'Should I wear an N95 mask outside right now?',
    'What is the best time for my outdoor evening walk?',
    'How much unhealthy air exposure do I have today?',
    'Can my child play outside at 5 PM in this pollution?',
    'Give me a 1-sentence health recommendation.'
  ]

  const QUICK_PROMPTS_HI = [
    'क्या मुझे अभी बाहर जाने के लिए N95 मास्क पहनना चाहिए?',
    'शाम को सैर के लिए सबसे सुरक्षित समय कौन सा है?',
    'आज मुझे कितने समय तक प्रदूषित हवा का सामना करना पड़ा?',
    'क्या मेरा बच्चा शाम 5 बजे बाहर खेल सकता है?',
    'मुझे आज के लिए एक सरल स्वास्थ्य सलाह दीजिए।'
  ]

  const quickPrompts = lang === 'hi' ? QUICK_PROMPTS_HI : QUICK_PROMPTS_EN

  const handleSpeakText = (textToSpeak) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(textToSpeak)
      utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US'
      utterance.rate = 0.95
      window.speechSynthesis.speak(utterance)
    }
  }

  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your current browser. You can type your voice command below or use Chrome/Edge.')
      return
    }

    if (isListening) {
      setIsListening(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-US'
      recognition.continuous = false
      recognition.interimResults = true

      recognition.onstart = () => {
        setIsListening(true)
        setTranscript('')
      }

      recognition.onresult = (event) => {
        const current = event.resultIndex
        const text = event.results[current][0].transcript
        setTranscript(text)
        setInputText(text)
      }

      recognition.onerror = (event) => {
        console.warn('Speech recognition error', event.error)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    } catch (e) {
      console.error(e)
      setIsListening(false)
    }
  }

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputText).trim()
    if (!query) return

    const userMsg = {
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages((prev) => [...prev, userMsg])
    setInputText('')
    setTranscript('')
    setLoading(true)

    try {
      // Call backend Strands coach endpoint
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          city,
          mode,
          lang,
          score_context: scoreData?.summary_hi || `Unhealthy air: ${scoreData?.unhealthy_air_fmt || '1h 45m'}, Heat stress: ${scoreData?.heat_stress_fmt || '0m'}`,
          forecast_context: `Best play window: ${forecastData?.windows?.best_play?.time || '6:00 AM - 8:00 AM'}`
        })
      })

      const data = await response.json()
      const answer = data.answer || 'Take caution and minimize outdoor exertion.'

      const agentMsg = {
        sender: 'agent',
        text: answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }

      setMessages((prev) => [...prev, agentMsg])

      // Auto speak response
      handleSpeakText(answer)
    } catch (e) {
      // Fallback deterministic response
      let fallback = ''
      if (lang === 'hi') {
        fallback = query.includes('मास्क') || query.includes('mask')
          ? `${city} में AQI गंभीर है। बाहर निकलते समय N95 मास्क अनिवार्य रूप से पहनें और खिड़कियाँ बंद रखें।`
          : `आपकी सुरक्षा के लिए सुझाव: ${city} में प्रदूषण अधिक है। कृपया सुबह 6 से 8 बजे के बीच ही बाहर जाएँ और हाइड्रेटेड रहें।`
      } else {
        fallback = query.toLowerCase().includes('mask')
          ? `Air quality in ${city} requires high protection. Wearing a certified N95 respirator is strongly advised outdoors.`
          : `For ${city} (${mode} mode): The safest window is early morning (6:00 - 8:00 AM). Stay indoors during afternoon and evening rush hours.`
      }

      const agentMsg = {
        sender: 'agent',
        text: fallback,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages((prev) => [...prev, agentMsg])
      handleSpeakText(fallback)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="fresh-card rounded-3xl p-6 sm:p-8 border border-[#e1dacb] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-[#739d89]/20 text-[#134228] rounded-2xl border border-[#739d89]/30 shadow-sm">
            <Mic size={28} className="text-[#1e4d6b]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-black text-[#112331]">
                Your AI Coach
              </h2>
              <span className="text-[10px] bg-[#97b5a1] text-[#133020] font-black px-2.5 py-0.5 rounded-full border border-[#83a48e]">
                AWS STRANDS
              </span>
            </div>
            <p className="text-xs text-[#64748b] font-medium">
              Bilingual Natural Language Voice Interface for Hands-Free Health Protection
            </p>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-2 bg-[#eae3d4] p-1.5 rounded-2xl border border-[#d6cebf] self-end md:self-auto">
          <button
            onClick={() => {
              setLang('en')
              if ('speechSynthesis' in window) window.speechSynthesis.cancel()
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
              lang === 'en'
                ? 'bg-white text-[#112331] shadow-xs'
                : 'text-[#64748b] hover:text-[#112331]'
            }`}
          >
            English
          </button>
          <button
            onClick={() => {
              setLang('hi')
              if ('speechSynthesis' in window) window.speechSynthesis.cancel()
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
              lang === 'hi'
                ? 'bg-white text-[#112331] shadow-xs'
                : 'text-[#64748b] hover:text-[#112331]'
            }`}
          >
            हिन्दी (Hindi)
          </button>
        </div>
      </div>

      {/* Main Conversation & Voice Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Chat & Voice Interaction Area */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="fresh-card rounded-3xl p-6 border border-[#e1dacb] flex flex-col h-[520px] shadow-sm justify-between">
            
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3.5 mb-4">
              {messages.map((m, idx) => {
                const isUser = m.sender === 'user'
                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] ${isUser ? 'self-end' : 'self-start'}`}
                  >
                    <div
                      className={`p-4 rounded-2xl text-xs md:text-sm font-medium leading-relaxed shadow-xs ${
                        isUser
                          ? 'bg-[#1e4d6b] text-white rounded-br-xs'
                          : 'bg-white text-[#1e293b] border border-[#e1dacb] rounded-bl-xs'
                      }`}
                    >
                      {m.text}
                    </div>
                    <div className="flex items-center gap-2 mt-1 px-1">
                      <span className="text-[10px] text-[#78716c]">{m.time}</span>
                      {!isUser && (
                        <button
                          onClick={() => handleSpeakText(m.text)}
                          title="Listen with Text-to-Speech"
                          className="text-[10px] text-[#1e4d6b] hover:underline flex items-center gap-1 font-bold"
                        >
                          <Volume2 size={11} /> Speak
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}

              {loading && (
                <div className="self-start bg-white p-3.5 rounded-2xl border border-[#e1dacb] text-xs text-[#64748b] flex items-center gap-2">
                  <Sparkles size={14} className="animate-spin text-[#739d89]" />
                  <span>Strands AI Agent is formulating clinical recommendation...</span>
                </div>
              )}
            </div>

            {/* Voice Input & Text Control Bar */}
            <div className="pt-3 border-t border-[#e5dfd2] flex flex-col gap-2.5">
              {isListening && (
                <div className="flex items-center justify-between bg-[#fef2f2] text-[#991b1b] px-4 py-2 rounded-xl border border-[#fecaca] text-xs animate-pulse">
                  <span className="flex items-center gap-2 font-bold">
                    <Mic size={14} className="text-[#dc2626]" />
                    Listening in {lang === 'hi' ? 'Hindi' : 'English'}... Speak now!
                  </span>
                  <button
                    onClick={toggleSpeechRecognition}
                    className="text-[11px] font-black underline hover:text-[#7f1d1d]"
                  >
                    Done Speaking
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`p-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center shrink-0 ${
                    isListening
                      ? 'bg-[#dc2626] text-white animate-bounce'
                      : 'bg-[#739d89] hover:bg-[#628975] text-[#133020]'
                  }`}
                  title={isListening ? 'Stop listening' : 'Start voice input'}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>

                <input
                  type="text"
                  placeholder={
                    lang === 'hi'
                      ? 'यहाँ बोलें या अपना प्रश्न लिखें (उदा. क्या N95 मास्क पहनूँ?)...'
                      : 'Speak or type your health question (e.g. Should I wear an N95 mask?)...'
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-[#fcfaf5] border border-[#d6cebf] rounded-2xl px-4 py-3 text-xs md:text-sm text-[#1e293b] font-medium focus:outline-none focus:ring-2 focus:ring-[#739d89]"
                />

                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={loading || !inputText.trim()}
                  className="p-3.5 bg-[#1e4d6b] hover:bg-[#163a50] disabled:opacity-40 text-white rounded-2xl shadow-md shadow-[#1e4d6b]/20 transition-all shrink-0"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Right: Quick Voice Prompts & Health Context Cards */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Quick Voice Prompts */}
          <div className="fresh-card rounded-3xl p-5 border border-[#e1dacb] flex flex-col gap-3 shadow-xs">
            <span className="text-[11px] font-black text-[#57534e] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} className="text-[#739d89]" />
              {lang === 'hi' ? 'त्वरित आवाज़ आदेश' : 'Quick Voice Prompts'}
            </span>
            <div className="flex flex-col gap-2">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputText(prompt)
                    handleSendMessage(prompt)
                  }}
                  className="text-left p-2.5 rounded-xl bg-[#fcfaf5] hover:bg-white border border-[#e1dacb] hover:border-[#739d89] text-xs font-semibold text-[#1e293b] transition-all flex items-start gap-2 group"
                >
                  <Mic size={12} className="text-[#78716c] group-hover:text-[#1e4d6b] shrink-0 mt-0.5" />
                  <span className="leading-snug">{prompt}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Context Card */}
          <div className="fresh-card rounded-3xl p-5 border border-[#e1dacb] flex flex-col gap-2.5 shadow-xs bg-[#f8f5ee]">
            <span className="text-[11px] font-black text-[#57534e] uppercase tracking-wider">
              Telemetry Context Injected
            </span>
            <div className="flex flex-col gap-1.5 text-xs text-[#64748b]">
              <div className="flex justify-between">
                <span>Location:</span>
                <strong className="text-[#112331]">{city}</strong>
              </div>
              <div className="flex justify-between">
                <span>Vulnerability Profile:</span>
                <strong className="capitalize text-[#112331]">{mode}</strong>
              </div>
              <div className="flex justify-between">
                <span>Unhealthy Air Dose:</span>
                <strong className="text-[#991b1b]">{scoreData?.unhealthy_air_fmt || '1h 45m'}</strong>
              </div>
              <div className="flex justify-between">
                <span>AI Language Mode:</span>
                <strong className="text-[#134228]">{lang === 'hi' ? 'हिन्दी (Hindi)' : 'English'}</strong>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
