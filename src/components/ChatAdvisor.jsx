import React, { useState, useRef, useEffect } from 'react'
import { query, QUICK_QUESTIONS } from '../agent/mockBrain.js'
import { MODE } from '../data/simulation.js'

const CONF_CHIP = {
  High: 'bg-green-500/15 text-green-400 border-green-500/30',
  Medium: 'bg-accent-500/15 text-accent-500 border-accent-500/30',
  Low: 'bg-red-500/15 text-red-400 border-red-500/30'
}

const SECTION_META = {
  logistics: { label: 'LOGISTICS', color: 'text-sea-400', icon: '⚓' },
  inventory: { label: 'INVENTORY', color: 'text-green-400', icon: '📦' },
  procurement: { label: 'PROCUREMENT', color: 'text-accent-500', icon: '📋' },
  orchestrator: { label: 'ORCHESTRATOR', color: 'text-yellow-300', icon: '🎯' }
}

function StructuredMessage({ sections, confidence, humanValidationRequired }) {
  const [expanded, setExpanded] = useState({ logistics: true, inventory: true, procurement: false, orchestrator: true })
  const toggle = key => setExpanded(e => ({ ...e, [key]: !e[key] }))

  return (
    <div className="space-y-1.5">
      {/* Confidence + validation badges */}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        {confidence && (
          <span className={`chip border text-[10px] ${CONF_CHIP[confidence] || CONF_CHIP.Medium}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${confidence === 'High' ? 'bg-green-400' : confidence === 'Medium' ? 'bg-accent-500' : 'bg-red-400'}`} />
            Confidence: {confidence}
          </span>
        )}
        {humanValidationRequired && (
          <span className="chip border bg-red-500/15 text-red-300 border-red-500/40 text-[10px]">
            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            HUMAN VALIDATION REQUIRED
          </span>
        )}
      </div>

      {/* 4-part sections */}
      {Object.entries(sections).map(([key, lines]) => {
        const meta = SECTION_META[key]
        if (!meta || !lines?.length) return null
        const isOpen = expanded[key]
        return (
          <div key={key} className="bg-navy-900/60 border border-navy-600/40 rounded-lg overflow-hidden">
            <button
              onClick={() => toggle(key)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 hover:bg-navy-700/30 transition"
            >
              <span className={`text-[10px] font-bold tracking-widest ${meta.color}`}>
                {meta.label} VIEW
              </span>
              <svg
                className={`w-3 h-3 text-navy-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              >
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isOpen && (
              <div className="px-2.5 pb-2 space-y-1">
                {lines.map((line, i) => (
                  <p key={i} className="text-[11px] text-navy-100 leading-relaxed">
                    <span className={`${meta.color} mr-1`}>›</span>{line}
                  </p>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function PlainMessage({ text }) {
  return <p className="text-xs text-navy-100 leading-relaxed whitespace-pre-line">{text}</p>
}

export default function ChatAdvisor({ onRecommendation }) {
  const [messages, setMessages] = useState([
    {
      role: 'advisor',
      plain: `TMPRM Digital Orchestrator online — ${MODE} MODE.\n\nI reason over simulated snapshot data only: vessels, weather, berth occupancy, 12 active shipments (2 cold-chain pharma at 2-8°C), and 4 route options.\n\nEvery answer follows the LOGISTICS → INVENTORY → PROCUREMENT → ORCHESTRATOR structure. Use the quick-question buttons below to run the 5 required test scenarios, or type your own query.`
    }
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = (text) => {
    const msg = (text || input).trim()
    if (!msg || thinking) return

    setInput('')
    setThinking(true)

    setMessages(prev => [...prev, { role: 'user', plain: msg }])

    // Small timeout to give visual feedback (deterministic — not async)
    setTimeout(() => {
      const result = query(msg)

      setMessages(prev => [
        ...prev,
        {
          role: 'advisor',
          structured: result.sections,
          confidence: result.confidence,
          humanValidationRequired: result.humanValidationRequired
        }
      ])

      // Update Decision Interface with the returned decision object
      if (result.decision && onRecommendation) {
        // Convert mockBrain decision format → decisionEngine format for the Decision Interface
        onRecommendation({
          vesselId: null,
          vesselName: null,
          action: result.decision.selectedAction,
          rationale: result.decision.recommendation,
          confidence: result.decision.confidence,
          humanValidation: result.decision.humanValidationRequired,
          tradeoffs: {
            delay: result.decision.tradeoffs.delay,
            cost: result.decision.tradeoffs.cost,
            co2: result.decision.tradeoffs.co2,
            coldChain: result.decision.tradeoffs.coldChainSafe === true
              ? 'Protected'
              : result.decision.tradeoffs.coldChainSafe === false
              ? 'At Risk'
              : result.decision.tradeoffs.coldChainSafe ?? 'N/A',
            opsRisk: result.decision.tradeoffs.risk ?? 'Medium',
            note: result.decision.dataUsed?.slice(0, 3).join(' | ')
          },
          shipmentId: null,
          cargo: result.decision.dataUsed?.[0] || null,
          priority: result.confidence === 'High' ? 'CRITICAL' : result.confidence === 'Medium' ? 'HIGH' : 'MEDIUM',
          coldChain: result.decision.tradeoffs.coldChainSafe != null,
          riskLabel: result.confidence === 'High'
            ? { text: 'High', color: 'green' }
            : result.confidence === 'Medium'
            ? { text: 'Medium', color: 'orange' }
            : { text: 'Low', color: 'red' },
          timestamp: new Date().toISOString()
        })
      }

      setThinking(false)
    }, 280)
  }

  return (
    <div className="card flex flex-col" style={{ height: '100%', minHeight: 0 }}>
      {/* Header */}
      <div className="card-header shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-accent-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
          </svg>
          <h3 className="text-sm font-semibold tracking-wide text-navy-50">AI LOGISTICS ADVISOR</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="chip bg-sea-400/15 text-sea-400 border border-sea-400/30">
            <span className="w-1.5 h-1.5 rounded-full bg-sea-400 blink" />
            {MODE}
          </span>
        </div>
      </div>

      {/* Message stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3" style={{ minHeight: 0 }}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'advisor' && (
              <div className="w-5 h-5 rounded-full bg-accent-500/20 border border-accent-500/30 flex items-center justify-center shrink-0 mt-0.5 mr-2">
                <svg className="w-2.5 h-2.5 text-accent-500" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="4" />
                </svg>
              </div>
            )}
            <div
              className={`rounded-lg px-3 py-2.5 border ${
                m.role === 'user'
                  ? 'bg-accent-500/15 text-navy-50 border-accent-500/30 max-w-[85%]'
                  : 'bg-navy-800/70 border-navy-600/40 flex-1'
              }`}
            >
              {m.structured
                ? <StructuredMessage sections={m.structured} confidence={m.confidence} humanValidationRequired={m.humanValidationRequired} />
                : <PlainMessage text={m.plain} />
              }
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex justify-start">
            <div className="w-5 h-5 rounded-full bg-accent-500/20 border border-accent-500/30 flex items-center justify-center shrink-0 mt-0.5 mr-2">
              <svg className="w-2.5 h-2.5 text-accent-500" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4" /></svg>
            </div>
            <div className="bg-navy-800/70 border border-navy-600/40 rounded-lg px-3 py-2.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 blink" />
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 blink" style={{ animationDelay: '0.2s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 blink" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
      </div>

      {/* Quick questions + input */}
      <div className="border-t border-navy-600/60 p-2.5 space-y-2 shrink-0">
        <div className="flex gap-1 flex-wrap">
          {QUICK_QUESTIONS.map(q => (
            <button
              key={q.id}
              onClick={() => send(q.prompt)}
              disabled={thinking}
              className="text-[10px] px-2 py-1 rounded-md bg-navy-700/60 hover:bg-navy-600 text-navy-100 border border-navy-600/40 transition disabled:opacity-50"
              title={q.prompt}
            >
              {q.id}: {q.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            disabled={thinking}
            placeholder="Ask about a vessel, route, weather, scenario..."
            className="flex-1 bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-xs text-navy-50 placeholder-navy-400 focus:outline-none focus:ring-1 focus:ring-accent-500 disabled:opacity-50"
          />
          <button
            onClick={() => send()}
            disabled={thinking || !input.trim()}
            className="btn-primary text-xs px-3 disabled:opacity-50"
          >
            Send
          </button>
        </div>

        <p className="text-[9px] text-navy-500 text-center leading-relaxed">
          Digital Orchestrator · MOCK MODE · All reasoning uses simulated snapshot data only
        </p>
      </div>
    </div>
  )
}
