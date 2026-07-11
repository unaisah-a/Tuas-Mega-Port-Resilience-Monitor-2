import React from 'react'
import { MODE } from '../data/mockData.js'

export default function Header({ decisionCount }) {
  return (
    <header className="bg-navy-900 border-b border-navy-600/60 px-4 py-2.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <svg className="w-8 h-8" viewBox="0 0 32 32">
          <rect width="32" height="32" rx="6" fill="#0b1626" />
          <path d="M6 20h20M9 20V14M15 20V11M21 20V13" stroke="#f58220" strokeWidth="2" strokeLinecap="round" />
          <circle cx="16" cy="8" r="2.5" fill="#5fb0d8" />
        </svg>
        <div>
          <h1 className="text-sm font-bold text-navy-50 tracking-wide leading-tight">TUAS MEGA PORT</h1>
          <p className="text-[10px] text-navy-300 tracking-wider leading-tight">RESILIENCE MONITOR · DIGITAL ORCHESTRATOR</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-4 text-[11px] text-navy-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 blink" />
            <span>SYSTEMS NOMINAL</span>
          </div>
          <span className="font-mono">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`chip ${MODE === 'MOCK' ? 'bg-navy-600/60 text-sea-400' : 'bg-green-500/15 text-green-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${MODE === 'MOCK' ? 'bg-sea-400' : 'bg-green-400'}`} />
            {MODE} MODE
          </span>
          <span className="chip bg-accent-500/15 text-accent-500">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
            {decisionCount} LOGGED
          </span>
        </div>
      </div>
    </header>
  )
}
