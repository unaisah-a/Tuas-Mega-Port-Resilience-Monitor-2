import React from 'react'
import { VESSELS, WEATHER, ROUTES } from '../data/mockData.js'

const RISK_COLOR = {
  CRITICAL: '#ef4444', HIGH: '#f58220', MEDIUM: '#f59e0b', LOW: '#22c55e'
}

export default function CommandMap({ selectedId, onSelect }) {
  return (
    <div className="card relative overflow-hidden" style={{ minHeight: 380 }}>
      <div className="card-header">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-sea-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20" /></svg>
          <h3 className="text-sm font-semibold tracking-wide text-navy-50">MARITIME COMMAND MAP</h3>
        </div>
        <span className="text-[11px] text-navy-300 font-mono">SIMULATED SNAPSHOT</span>
      </div>

      <div className="relative" style={{ height: 340 }}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          {/* Sea */}
          <defs>
            <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0b1626" />
              <stop offset="100%" stopColor="#142239" />
            </linearGradient>
            <radialGradient id="storm" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#sea)" />

          {/* Landmasses (stylised) */}
          <path d="M0,0 L0,38 Q12,34 18,40 L22,52 Q14,58 0,56 Z" fill="#1d3252" stroke="#27426b" strokeWidth="0.3" />
          <path d="M0,70 Q10,66 20,72 L18,100 L0,100 Z" fill="#1d3252" stroke="#27426b" strokeWidth="0.3" />
          <path d="M78,0 L100,0 L100,28 Q92,24 84,30 Q80,18 78,0 Z" fill="#1d3252" stroke="#27426b" strokeWidth="0.3" />
          <path d="M82,72 Q90,68 100,72 L100,100 L80,100 Z" fill="#1d3252" stroke="#27426b" strokeWidth="0.3" />

          {/* Tuas port marker */}
          <g>
            <circle cx="20" cy="60" r="1.6" fill="#f58220" />
            <circle cx="20" cy="60" r="1.6" fill="none" stroke="#f58220" strokeWidth="0.4" className="pulse-ring" />
            <text x="23" y="61" fill="#eef2f8" fontSize="2.4" fontFamily="monospace">TUAS PORT</text>
          </g>

          {/* Storm zone */}
          <ellipse cx="55" cy="48" rx="22" ry="16" fill="url(#storm)" />
          <text x="55" y="44" fill="#ef4444" fontSize="2.2" fontFamily="monospace" textAnchor="middle" opacity="0.8">STORM</text>

          {/* Routes */}
          <path d="M20,60 Q40,50 62,58" fill="none" stroke="#ef4444" strokeWidth="0.6" strokeDasharray="2,1.5" opacity="0.6" />
          <text x="42" y="52" fill="#ef4444" fontSize="1.8" fontFamily="monospace" opacity="0.7">MALACCA</text>

          {/* Vessels */}
          {VESSELS.map(v => {
            const isSel = v.id === selectedId
            const color = RISK_COLOR[v.priority] || '#5fb0d8'
            return (
              <g key={v.id} onClick={() => onSelect?.(v.id)} style={{ cursor: 'pointer' }}>
                {isSel && <circle cx={v.pos.x} cy={v.pos.y} r="3.2" fill="none" stroke="#f58220" strokeWidth="0.5" className="pulse-ring" />}
                <circle cx={v.pos.x} cy={v.pos.y} r="1.4" fill={color} stroke="#0b1626" strokeWidth="0.3" />
                <text x={v.pos.x + 2.2} y={v.pos.y + 0.8} fill="#eef2f8" fontSize="1.9" fontFamily="monospace" opacity={isSel ? 1 : 0.75}>
                  {v.name}
                </text>
                {v.coldChain && (
                  <text x={v.pos.x + 2.2} y={v.pos.y + 3} fill="#5fb0d8" fontSize="1.5" fontFamily="monospace">❄</text>
                )}
              </g>
            )
          })}
        </svg>

        {/* Vessel popover */}
        {selectedId && (() => {
          const v = VESSELS.find(x => x.id === selectedId)
          if (!v) return null
          return (
            <div className="absolute top-3 right-3 w-56 card p-3 slide-up z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-navy-50">{v.name}</span>
                <span className="chip" style={{ background: `${RISK_COLOR[v.priority]}22`, color: RISK_COLOR[v.priority] }}>{v.priority}</span>
              </div>
              <div className="space-y-1 text-[11px] text-navy-200">
                <div className="flex justify-between"><span>Type</span><span className="text-navy-50">{v.type}</span></div>
                <div className="flex justify-between"><span>Flag</span><span className="text-navy-50">{v.flag}</span></div>
                <div className="flex justify-between"><span>Cargo</span><span className="text-navy-50 text-right">{v.cargo}</span></div>
                <div className="flex justify-between"><span>ETA</span><span className="text-navy-50 font-mono">{v.etaHours}h</span></div>
                <div className="flex justify-between"><span>Speed</span><span className="text-navy-50 font-mono">{v.speedKnots}kn</span></div>
                <div className="flex justify-between"><span>Status</span><span className="text-navy-50">{v.status}</span></div>
                <div className="flex justify-between"><span>Dest</span><span className="text-navy-50">{v.destination}</span></div>
                <div className="flex justify-between"><span>Risk</span><span className="font-mono" style={{ color: RISK_COLOR[v.priority] }}>{v.riskScore}</span></div>
                {v.coldChain && <div className="text-sea-400 font-medium pt-1">COLD-CHAIN CARGO</div>}
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
