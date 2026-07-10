import React, { useState, useEffect } from 'react'

const MODE_CHIP = {
  MOCK: 'bg-sea-400/15 text-sea-400 border-sea-400/30',
  LIVE: 'bg-green-500/15 text-green-400 border-green-500/30',
  DEGRADED: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
}

const MODE_DOT = {
  MOCK: 'bg-sea-400',
  LIVE: 'bg-green-400 blink',
  DEGRADED: 'bg-amber-400 blink'
}

export default function Header({ decisionCount, lastUpdated, mode = 'MOCK' }) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 30000)
    return () => clearInterval(t)
  }, [])

  const now = new Date()
  const displayDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const updatedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <header className="bg-navy-900 border-b border-navy-600/60 px-4 py-2.5 flex items-center justify-between shrink-0">
      {/* Logo + title */}
      <div className="flex items-center gap-3">
        <svg className="w-9 h-9 shrink-0" viewBox="0 0 36 36">
          <rect width="36" height="36" rx="7" fill="#0b1626" />
          <path d="M7 24h22M10 24V18M17 24V14M24 24V17" stroke="#f58220" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="18" cy="10" r="2.8" fill="#5fb0d8" />
          <path d="M13 24v-2M21 24v-2" stroke="#5fb0d8" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        </svg>
        <div>
          <h1 className="text-sm font-bold text-navy-50 tracking-wider leading-tight">
            TUAS MEGA PORT RESILIENCE MONITOR
          </h1>
          <p className="text-[10px] text-navy-300 tracking-widest leading-tight">
            DIGITAL ORCHESTRATOR PROTOTYPE · SUPPLY CHAIN 4.0
          </p>
        </div>
      </div>

      {/* Right-side badges */}
      <div className="flex items-center gap-2 flex-wrap justify-end">
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-navy-300">
          <span className="w-2 h-2 rounded-full bg-green-400 blink" />
          <span>SYSTEMS NOMINAL</span>
        </div>

        <div className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-navy-300 border-l border-navy-600/40 pl-3 ml-1">
          <span>{displayDate}</span>
          <span className="text-navy-500">·</span>
          <span>Updated {updatedTime}</span>
        </div>

        {/* Dynamic mode badge — MOCK / LIVE / DEGRADED */}
        <span className={`chip border ${MODE_CHIP[mode] || MODE_CHIP.MOCK}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${MODE_DOT[mode] || MODE_DOT.MOCK}`} />
          {mode} MODE
        </span>

        {/* All data is simulated badge */}
        <span className="chip bg-navy-700/60 text-navy-300 border border-navy-600/50">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
          </svg>
          All data is simulated
        </span>

        {decisionCount > 0 && (
          <span className="chip bg-accent-500/15 text-accent-500 border border-accent-500/30">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
            {decisionCount} LOGGED
          </span>
        )}
      </div>
    </header>
  )
}
