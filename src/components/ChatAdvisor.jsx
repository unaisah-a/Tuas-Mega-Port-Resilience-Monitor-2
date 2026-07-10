import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { query as mockQuery, QUICK_QUESTIONS } from '../agent/mockBrain.js'
import { queryLive, queryDegraded, DEFAULT_MODEL } from '../agent/liveBrain.js'

// ─── Styles ───────────────────────────────────────────────────────────────────

const CONF_CHIP = {
  High:   'bg-green-500/15 text-green-400 border-green-500/30',
  Medium: 'bg-accent-500/15 text-accent-500 border-accent-500/30',
  Low:    'bg-red-500/15 text-red-400 border-red-500/30'
}
const CONF_DOT = {
  High: 'bg-green-400', Medium: 'bg-accent-500', Low: 'bg-red-400'
}
const SECTION_META = {
  logistics:    { label: 'LOGISTICS',    color: 'text-sea-400' },
  inventory:    { label: 'INVENTORY',    color: 'text-green-400' },
  procurement:  { label: 'PROCUREMENT',  color: 'text-accent-500' },
  orchestrator: { label: 'ORCHESTRATOR', color: 'text-yellow-300' }
}

// ─── Structured message renderer ──────────────────────────────────────────────

function StructuredMessage({ sections, confidence, humanValidationRequired, source }) {
  const [expanded, setExpanded] = useState({
    logistics: true, inventory: true, procurement: false, orchestrator: true
  })
  const toggle = key => setExpanded(e => ({ ...e, [key]: !e[key] }))

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        {confidence && (
          <span className={`chip border text-[10px] ${CONF_CHIP[confidence] || CONF_CHIP.Medium}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${CONF_DOT[confidence] || CONF_DOT.Medium}`} />
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
        {source === 'LIVE' && (
          <span className="chip border bg-green-500/10 text-green-400 border-green-500/30 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 blink" />LIVE
          </span>
        )}
        {source === 'DEGRADED' && (
          <span className="chip border bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />EXPERT RULES
          </span>
        )}
      </div>
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
              <span className={`text-[10px] font-bold tracking-widest ${meta.color}`}>{meta.label} VIEW</span>
              <svg className={`w-3 h-3 text-navy-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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

function PlainMessage({ text, isAlert }) {
  return (
    <p className={`text-xs leading-relaxed whitespace-pre-line ${isAlert ? 'text-amber-300 font-medium' : 'text-navy-100'}`}>
      {isAlert && (
        <svg className="w-3 h-3 inline mr-1 -mt-0.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><path d="M12 9v4m0 4h.01" />
        </svg>
      )}
      {text}
    </p>
  )
}

// ─── Degraded banner ──────────────────────────────────────────────────────────

function DegradedBanner({ reason, onDismiss }) {
  return (
    <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/40 rounded-lg px-3 py-2 mx-2.5 mt-2">
      <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><path d="M12 9v4m0 4h.01" />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-amber-300">DEGRADED MODE</p>
        <p className="text-[10px] text-amber-400 leading-relaxed mt-0.5">
          Degraded mode: LIVE request failed or timed out. MOCK expert rules are being used.
          {reason ? ` (${reason})` : ''}
        </p>
      </div>
      <button onClick={onDismiss} className="text-amber-400 hover:text-amber-200 transition shrink-0">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// ─── LIVE settings panel ──────────────────────────────────────────────────────

function LiveSettings({ apiKey, setApiKey, llmModel, setLlmModel, onClose }) {
  return (
    <div className="border-t border-navy-600/50 bg-navy-900/60 px-3 py-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-navy-100 tracking-wide">LIVE MODE SETTINGS</span>
        <button onClick={onClose} className="text-navy-400 hover:text-navy-200 transition">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] text-navy-300 uppercase tracking-wider">API Provider</label>
        <div className="flex items-center gap-2 bg-navy-800 border border-navy-600/50 rounded-lg px-3 py-1.5">
          <span className="text-[11px] text-navy-200">Claude (Anthropic)</span>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] text-navy-300 uppercase tracking-wider">API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder="sk-ant-..."
          className="w-full bg-navy-800 border border-navy-600/50 rounded-lg px-3 py-1.5 text-[11px] text-navy-50 placeholder-navy-500 focus:outline-none focus:ring-1 focus:ring-accent-500 font-mono"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] text-navy-300 uppercase tracking-wider">Model</label>
        <input
          type="text"
          value={llmModel}
          onChange={e => setLlmModel(e.target.value)}
          className="w-full bg-navy-800 border border-navy-600/50 rounded-lg px-3 py-1.5 text-[11px] text-navy-50 font-mono focus:outline-none focus:ring-1 focus:ring-accent-500"
        />
      </div>
      <div className="flex items-start gap-1.5 bg-amber-500/8 border border-amber-500/20 rounded-lg px-2.5 py-2">
        <svg className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><path d="M12 9v4m0 4h.01" />
        </svg>
        <p className="text-[10px] text-amber-400 leading-relaxed">
          For assessment demo, use MOCK MODE. Client-side API keys are for classroom prototype only.
        </p>
      </div>
    </div>
  )
}

const MODE_BTN_ACTIVE  = { MOCK: 'bg-sea-400/15 text-sea-400 border-sea-400/30', LIVE: 'bg-green-500/15 text-green-400 border-green-500/30', DEGRADED: 'bg-amber-500/15 text-amber-400 border-amber-500/30' }
const MODE_BTN_IDLE    = 'bg-navy-700/40 text-navy-400 border-navy-600/40 hover:bg-navy-600/50'

// ─── Main component (forwardRef for pushAlert / prefill) ──────────────────────

const ChatAdvisor = forwardRef(function ChatAdvisor({
  onRecommendation,
  mode, setMode,
  apiKey, setApiKey,
  llmModel, setLlmModel
}, ref) {
  const [messages, setMessages] = useState([
    {
      role: 'advisor',
      plain: `TMPRM Digital Orchestrator online — ${mode} MODE.\n\nI reason over simulated snapshot data: 12 active shipments (2 cold-chain pharma at 2-8°C), Malacca weather, Tuas berth occupancy, and 4 route options.\n\nUse the quick-question buttons or type a query. Every answer updates the Decision Interface.`
    }
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [degradedBanner, setDegradedBanner] = useState(null)
  const scrollRef = useRef(null)
  const messagesRef = useRef(messages)
  messagesRef.current = messages

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  // ─── Exposed imperative API ───────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    // Push a proactive system alert into the chat stream (no Decision Interface update)
    pushAlert(text) {
      setMessages(prev => [...prev, {
        role: 'advisor',
        plain: text,
        isAlert: true
      }])
    },
    // Pre-fill the input field so the user can review and send
    prefill(text) {
      setInput(text)
      // Give focus to textarea if possible
      document.querySelector('[data-chat-input]')?.focus()
    }
  }), [])

  const handleSetMode = (newMode) => {
    setMode(newMode)
    if (newMode === 'MOCK') setDegradedBanner(null)
    if (newMode === 'LIVE') { setDegradedBanner(null); setShowSettings(true) }
  }

  const pushToDecisionInterface = (result) => {
    if (!result?.decision || !onRecommendation) return
    const d = result.decision
    onRecommendation({
      vesselId: null,
      vesselName: null,
      action: d.selectedAction,
      rationale: d.recommendation,
      confidence: d.confidence,
      humanValidation: d.humanValidationRequired,
      tradeoffs: {
        delay: d.tradeoffs.delay,
        cost: d.tradeoffs.cost,
        co2: d.tradeoffs.co2,
        coldChain: d.tradeoffs.coldChainSafe === true ? 'Protected'
          : d.tradeoffs.coldChainSafe === false ? 'At Risk'
          : d.tradeoffs.coldChainSafe ?? 'N/A',
        opsRisk: d.tradeoffs.risk ?? 'Medium',
        note: d.dataUsed?.slice(0, 2).join(' | ')
      },
      shipmentId: null,
      cargo: d.dataUsed?.[0] || null,
      priority: d.confidence === 'High' ? 'CRITICAL' : 'HIGH',
      coldChain: d.tradeoffs.coldChainSafe != null,
      riskLabel: d.confidence === 'High' ? { text: 'High', color: 'green' }
        : d.confidence === 'Medium' ? { text: 'Medium', color: 'orange' }
        : { text: 'Low', color: 'red' },
      timestamp: new Date().toISOString()
    })
  }

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || thinking) return
    setInput('')
    setThinking(true)
    setMessages(prev => [...prev, { role: 'user', plain: msg }])

    try {
      let result
      if (mode === 'LIVE') {
        try {
          result = await queryLive({ message: msg, apiKey, model: llmModel || DEFAULT_MODEL, history: messagesRef.current })
          setDegradedBanner(null)
        } catch (err) {
          result = queryDegraded(msg)
          setMode('DEGRADED')
          setDegradedBanner({ reason: err?.message || 'Unknown error' })
        }
      } else {
        await new Promise(r => setTimeout(r, 280))
        result = mode === 'DEGRADED' ? queryDegraded(msg) : { ...mockQuery(msg), source: 'MOCK' }
      }

      setMessages(prev => [...prev, {
        role: 'advisor',
        structured: result.sections,
        confidence: result.confidence,
        humanValidationRequired: result.humanValidationRequired,
        source: result.source
      }])
      pushToDecisionInterface(result)
    } finally {
      setThinking(false)
    }
  }

  return (
    <div className="card flex flex-col" style={{ flex: 1, minHeight: 0 }}>
      {/* Header */}
      <div className="card-header shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-accent-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
          </svg>
          <h3 className="text-sm font-semibold tracking-wide text-navy-50">AI LOGISTICS ADVISOR</h3>
        </div>
        <div className="flex items-center gap-1">
          {['MOCK', 'LIVE'].map(m => (
            <button key={m} onClick={() => handleSetMode(m)}
              className={`text-[10px] px-2 py-0.5 rounded border transition font-semibold ${
                mode === m || (mode === 'DEGRADED' && m === 'LIVE')
                  ? MODE_BTN_ACTIVE[mode === 'DEGRADED' ? 'DEGRADED' : m]
                  : MODE_BTN_IDLE
              }`}
            >
              {mode === 'DEGRADED' && m === 'LIVE' ? 'DEGRADED' : m}
            </button>
          ))}
          <button
            onClick={() => setShowSettings(s => !s)}
            className={`p-1 rounded border transition ${showSettings ? 'bg-accent-500/20 border-accent-500/30 text-accent-500' : 'bg-navy-700/40 border-navy-600/40 text-navy-400 hover:text-navy-200'}`}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>

      {showSettings && (
        <LiveSettings apiKey={apiKey} setApiKey={setApiKey} llmModel={llmModel} setLlmModel={setLlmModel} onClose={() => setShowSettings(false)} />
      )}

      {degradedBanner && (
        <DegradedBanner reason={degradedBanner.reason} onDismiss={() => setDegradedBanner(null)} />
      )}

      {/* Message stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3" style={{ minHeight: 0 }}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'advisor' && (
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 mr-2 ${m.isAlert ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-accent-500/20 border border-accent-500/30'}`}>
                {m.isAlert
                  ? <svg className="w-2.5 h-2.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                  : <svg className="w-2.5 h-2.5 text-accent-500" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4" /></svg>
                }
              </div>
            )}
            <div className={`rounded-lg px-3 py-2.5 border ${
              m.role === 'user'
                ? 'bg-accent-500/15 text-navy-50 border-accent-500/30 max-w-[85%]'
                : m.isAlert
                ? 'bg-amber-500/8 border-amber-500/30 flex-1'
                : 'bg-navy-800/70 border-navy-600/40 flex-1'
            }`}>
              {m.structured
                ? <StructuredMessage sections={m.structured} confidence={m.confidence} humanValidationRequired={m.humanValidationRequired} source={m.source} />
                : <PlainMessage text={m.plain} isAlert={m.isAlert} />
              }
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex justify-start">
            <div className="w-5 h-5 rounded-full bg-accent-500/20 border border-accent-500/30 flex items-center justify-center shrink-0 mt-0.5 mr-2">
              <svg className="w-2.5 h-2.5 text-accent-500" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4" /></svg>
            </div>
            <div className="bg-navy-800/70 border border-navy-600/40 rounded-lg px-3 py-2.5 flex items-center gap-1.5">
              {[0, 0.2, 0.4].map((delay, i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-accent-500 blink" style={{ animationDelay: `${delay}s` }} />
              ))}
              {mode === 'LIVE' && <span className="text-[10px] text-navy-400 ml-1">Calling Claude API…</span>}
            </div>
          </div>
        )}
      </div>

      {/* Quick questions + input */}
      <div className="border-t border-navy-600/60 p-2.5 space-y-2 shrink-0">
        <div className="flex gap-1 flex-wrap">
          {QUICK_QUESTIONS.map(q => (
            <button key={q.id} onClick={() => send(q.prompt)} disabled={thinking} title={q.prompt}
              className="text-[10px] px-2 py-1 rounded-md bg-navy-700/60 hover:bg-navy-600 text-navy-100 border border-navy-600/40 transition disabled:opacity-50">
              {q.id}: {q.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            data-chat-input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            disabled={thinking}
            placeholder="Ask about a vessel, route, weather, scenario…"
            className="flex-1 bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-xs text-navy-50 placeholder-navy-400 focus:outline-none focus:ring-1 focus:ring-accent-500 disabled:opacity-50"
          />
          <button onClick={() => send()} disabled={thinking || !input.trim()} className="btn-primary text-xs px-3 disabled:opacity-50">
            Send
          </button>
        </div>
        <p className="text-[9px] text-navy-500 text-center">
          {mode === 'MOCK' && 'MOCK MODE · Deterministic expert rules · Snapshot data only · No API key required'}
          {mode === 'LIVE' && 'LIVE MODE · Claude API · 30s timeout · Falls back to MOCK on failure'}
          {mode === 'DEGRADED' && 'DEGRADED MODE · LIVE failed · Expert rules active · Decision Interface still updating'}
        </p>
      </div>
    </div>
  )
})

export default ChatAdvisor
