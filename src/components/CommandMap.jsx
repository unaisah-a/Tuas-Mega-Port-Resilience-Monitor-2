import React from 'react'
import { VESSELS } from '../data/mockData.js'

const RISK_COLOR = {
  CRITICAL: '#ef4444',
  HIGH:     '#f58220',
  MEDIUM:   '#f59e0b',
  LOW:      '#22c55e'
}

// Map vessel type/cargo to filter category
function matchesFilter(vessel, filter) {
  if (filter === 'all') return true
  if (filter === 'cold-chain') return vessel.coldChain === true
  if (filter === 'general')   return vessel.coldChain !== true
  return true
}

export default function CommandMap({ selectedId, onSelect, snapshot, stormActive, vesselFilter, onViewSlTrader }) {
  const weather = snapshot?.weather
  const windKts = weather?.windKts ?? 18
  const riskLevel = weather?.riskLevel ?? 'Medium'
  const isStormSevere = stormActive || riskLevel === 'Severe'

  // Storm blob opacity scales with severity
  const stormOpacity = isStormSevere ? 0.55 : riskLevel === 'High' ? 0.35 : 0.18

  const filteredVessels = VESSELS.filter(v => matchesFilter(v, vesselFilter))
  const selectedVessel = VESSELS.find(v => v.id === selectedId)

  return (
    <div className="card relative overflow-hidden" style={{ minHeight: 380 }}>
      <div className="card-header">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-sea-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20" />
          </svg>
          <h3 className="text-sm font-semibold tracking-wide text-navy-50">MARITIME COMMAND MAP</h3>
        </div>
        <div className="flex items-center gap-2">
          {isStormSevere && (
            <span className="chip border bg-red-500/15 text-red-400 border-red-500/40 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 blink" />STORM ACTIVE
            </span>
          )}
          <span className="text-[11px] text-navy-300 font-mono">SIMULATED SNAPSHOT</span>
        </div>
      </div>

      <div className="relative" style={{ height: 340 }}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0b1626" />
              <stop offset="100%" stopColor="#142239" />
            </linearGradient>

            {/* Normal weather blob */}
            <radialGradient id="weatherNormal" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={stormOpacity * 0.5} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>

            {/* Storm blob — red/orange, larger + more intense */}
            <radialGradient id="stormBlob" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={stormOpacity} />
              <stop offset="40%" stopColor="#f58220" stopOpacity={stormOpacity * 0.7} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width="100" height="100" fill="url(#sea)" />

          {/* Landmasses */}
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

          {/* Weather / storm zone — size and color react to storm state */}
          {isStormSevere ? (
            <>
              {/* Large storm ellipse */}
              <ellipse cx="52" cy="46" rx="30" ry="20" fill="url(#stormBlob)" />
              {/* Storm label */}
              <text x="52" y="40" fill="#ef4444" fontSize="2.8" fontFamily="monospace" textAnchor="middle" opacity="0.95" fontWeight="bold">⛈ STORM ACTIVE</text>
              <text x="52" y="44" fill="#f58220" fontSize="1.9" fontFamily="monospace" textAnchor="middle" opacity="0.8">{windKts}kn · GALE WARNING</text>
            </>
          ) : (
            <>
              <ellipse cx="55" cy="48" rx="22" ry="14" fill="url(#weatherNormal)" />
              <text x="55" y="45" fill="#f59e0b" fontSize="2.0" fontFamily="monospace" textAnchor="middle" opacity="0.7">
                {riskLevel === 'High' ? 'ELEVATED RISK' : 'MALACCA'}
              </text>
            </>
          )}

          {/* Routes */}
          <path d="M20,60 Q40,50 62,58" fill="none"
            stroke={isStormSevere ? '#ef4444' : '#ef444488'} strokeWidth={isStormSevere ? 1 : 0.6}
            strokeDasharray="2,1.5" opacity="0.7" />
          <text x="38" y="51" fill={isStormSevere ? '#ef4444' : '#ef4444bb'} fontSize="1.8" fontFamily="monospace" opacity="0.8">MALACCA</text>

          {/* Sunda alternate route hint */}
          <path d="M20,60 Q35,75 55,78 Q65,76 72,68" fill="none" stroke="#22c55e44" strokeWidth="0.5" strokeDasharray="1.5,2" />
          <text x="43" y="78" fill="#22c55e" fontSize="1.6" fontFamily="monospace" opacity="0.5">SUNDA ALT</text>

          {/* Vessels */}
          {filteredVessels.map(v => {
            const isSel = v.id === selectedId
            const color = RISK_COLOR[v.priority] || '#5fb0d8'
            return (
              <g key={v.id} onClick={() => onSelect?.(v.id)} style={{ cursor: 'pointer' }}>
                {isSel && <circle cx={v.pos.x} cy={v.pos.y} r="3.5" fill="none" stroke="#f58220" strokeWidth="0.6" className="pulse-ring" />}
                <circle cx={v.pos.x} cy={v.pos.y} r="1.6" fill={color} stroke="#0b1626" strokeWidth="0.4" />
                <text x={v.pos.x + 2.4} y={v.pos.y + 0.8} fill="#eef2f8" fontSize="2.0" fontFamily="monospace" opacity={isSel ? 1 : 0.8}>
                  {v.name}
                </text>
                {v.coldChain && (
                  <text x={v.pos.x + 2.4} y={v.pos.y + 3.2} fill="#5fb0d8" fontSize="1.6" fontFamily="monospace">❄</text>
                )}
              </g>
            )
          })}

          {/* Grey out hidden vessels */}
          {VESSELS.filter(v => !matchesFilter(v, vesselFilter)).map(v => (
            <g key={`dim-${v.id}`} style={{ pointerEvents: 'none' }}>
              <circle cx={v.pos.x} cy={v.pos.y} r="1.6" fill="#27426b" stroke="#142239" strokeWidth="0.4" opacity="0.35" />
            </g>
          ))}
        </svg>

        {/* Vessel popover */}
        {selectedVessel && (
          <div className="absolute top-3 right-3 w-60 card p-3 slide-up z-10 max-h-80 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-navy-50 truncate">{selectedVessel.name}</span>
              <span className="chip shrink-0" style={{ background: `${RISK_COLOR[selectedVessel.priority]}22`, color: RISK_COLOR[selectedVessel.priority] }}>
                {selectedVessel.priority}
              </span>
            </div>
            <div className="space-y-1 text-[11px] text-navy-200">
              <div className="flex justify-between"><span>Type</span><span className="text-navy-50">{selectedVessel.type}</span></div>
              <div className="flex justify-between"><span>Flag</span><span className="text-navy-50">{selectedVessel.flag}</span></div>
              <div className="flex justify-between"><span>Cargo</span><span className="text-navy-50 text-right max-w-[60%]">{selectedVessel.cargo}</span></div>
              <div className="flex justify-between"><span>ETA</span><span className="text-navy-50 font-mono">{selectedVessel.etaHours}h</span></div>
              <div className="flex justify-between"><span>Speed</span><span className="text-navy-50 font-mono">{selectedVessel.speedKnots}kn</span></div>
              <div className="flex justify-between"><span>Status</span><span className="text-navy-50">{selectedVessel.status}</span></div>
              <div className="flex justify-between"><span>Dest</span><span className="text-navy-50">{selectedVessel.destination}</span></div>
              <div className="flex justify-between"><span>Risk Score</span>
                <span className="font-mono font-bold" style={{ color: RISK_COLOR[selectedVessel.priority] }}>
                  {selectedVessel.riskScore}
                </span>
              </div>
              {selectedVessel.coldChain && (
                <div className="text-sea-400 font-semibold pt-1 flex items-center gap-1">
                  <span>❄</span><span>COLD-CHAIN CARGO</span>
                </div>
              )}
            </div>
            {/* SL TRADER gets "View Full Details" button that prefills chat */}
            {selectedVessel.id === 'SL_TRADER' && onViewSlTrader && (
              <button
                onClick={onViewSlTrader}
                className="mt-2 w-full text-[11px] px-2 py-1.5 rounded-lg border border-accent-500/40 bg-accent-500/10 text-accent-400 hover:bg-accent-500/20 transition font-medium"
              >
                View Full Details →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
