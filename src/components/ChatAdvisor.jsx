import React, { useState, useRef, useEffect } from 'react'
import { advisorReply, SCENARIOS } from '../engine/decisionEngine.js'
import { MODE } from '../data/mockData.js'

export default function ChatAdvisor({ onRecommendation, onSelectVessel }) {
  const [messages, setMessages] = useState([
    {
      role: 'advisor',
      text: `TMPRM Logistics Advisor online (${MODE} mode). I reason over simulated snapshot data — vessels, weather, berth occupancy, shipments, and routes. Ask about a vessel, a disruption, or pick a scenario below. Every recommendation feeds the Decision Interface.`
    }
  ])
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = (text) => {
    const msg = text || input
    if (!msg.trim()) return
    const reply = advisorReply(msg)
    const newMsgs = [
      ...messages,
      { role: 'user', text: msg },
      { role: 'advisor', text: reply.text }
    ]
    setMessages(newMsgs)
    setInput('')
    if (reply.recommendation) {
      onRecommendation?.(reply.recommendation, reply.scenarioId)
    }
    if (reply.scenarioId) {
      const sc = SCENARIOS.find(s => s.id === reply.scenarioId)
      if (sc) onSelectVessel?.(sc.vesselId)
    }
  }

  return (
    <div className="card flex flex-col" style={{ height: '100%', minHeight: 0 }}>
      <div className="card-header">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-accent-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>
          <h3 className="text-sm font-semibold tracking-wide text-navy-50">AI LOGISTICS ADVISOR</h3>
        </div>
        <span className="chip bg-navy-600/60 text-sea-400">{MODE}</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5" style={{ minHeight: 0 }}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] rounded-lg px-3 py-2 text-xs leading-relaxed whitespace-pre-line ${
              m.role === 'user' ? 'bg-accent-500/20 text-navy-50 border border-accent-500/30' : 'bg-navy-700/60 text-navy-100 border border-navy-600/40'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-navy-600/60 p-2.5 space-y-2">
        <div className="flex gap-1.5 flex-wrap">
          {SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => send(s.prompt)}
              className="text-[10px] px-2 py-1 rounded-md bg-navy-700/60 hover:bg-navy-600 text-navy-100 border border-navy-600/40 transition"
              title={s.summary}
            >
              {s.id}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask about a vessel, weather, scenario..."
            className="flex-1 bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-xs text-navy-50 placeholder-navy-400 focus:outline-none focus:ring-1 focus:ring-accent-500"
          />
          <button onClick={() => send()} className="btn-primary text-xs px-3">Send</button>
        </div>
      </div>
    </div>
  )
}
