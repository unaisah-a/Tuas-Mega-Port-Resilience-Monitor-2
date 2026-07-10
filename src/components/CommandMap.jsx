import React, { useState, useEffect, useRef } from 'react'
import { VESSELS } from '../data/mockData.js'

const RISK_COLOR = {
  CRITICAL: '#ef4444',
  HIGH:     '#f58220',
  MEDIUM:   '#f59e0b',
  LOW:      '#22c55e'
}

const ROUTE_DEFS = [
  {
    id: 'R_MALACCA',
    label: 'Malacca Baseline',
    short: 'Malacca',
    color: '#ef4444',
    deltaDays: 0,
    costIndex: 100,
    co2Index: 100,
    coldChainSafe: false,
    riskLevel: 'High',
    note: 'Primary route. Gale warning active — monitor reefer systems continuously.',
    stormNote: 'AVOID during storm — divert cold-chain pharma to Sunda.',
    confidence: 'Medium',
    stormConfidence: 'Low',
    humanValidation: false
  },
  {
    id: 'R_SUNDA',
    label: 'Sunda Contingency',
    short: 'Sunda',
    color: '#f59e0b',
    deltaDays: 2,
    costIndex: 118,
    co2Index: 115,
    coldChainSafe: true,
    riskLevel: 'Medium',
    note: 'Recommended contingency when Malacca is disrupted. +2 days, calmer seas.',
    stormNote: 'Preferred reroute during storm — suitable for cold-chain 2-8°C cargo.',
    confidence: 'High',
    stormConfidence: 'High',
    humanValidation: false
  },
  {
    id: 'R_LOMBOK',
    label: 'Lombok Deep Alternate',
    short: 'Lombok',
    color: '#5fb0d8',
    deltaDays: 3.5,
    costIndex: 126,
    co2Index: 124,
    coldChainSafe: false,
    riskLevel: 'Low',
    note: 'Longest alternate. Use only if Malacca and Sunda are both unavailable.',
    stormNote: 'Deep alternate — +3.5 days may breach cold-chain service window. Human validation required.',
    confidence: 'Medium',
    stormConfidence: 'Medium',
    humanValidation: true
  }
]

function matchesFilter(vessel, filter) {
  if (filter === 'all') return true
  if (filter === 'cold-chain') return vessel.coldChain === true
  if (filter === 'general')   return vessel.coldChain !== true
  return true
}

// ─── Schematic SVG fallback ───────────────────────────────────────────────────
function SchematicMap({ selectedId, onSelect, snapshot, stormActive, vesselFilter, onViewSlTrader }) {
  const weather = snapshot?.weather
  const windKts = weather?.windKts ?? 18
  const riskLevel = weather?.riskLevel ?? 'Medium'
  const isStormSevere = stormActive || riskLevel === 'Severe'
  const stormOpacity = isStormSevere ? 0.55 : riskLevel === 'High' ? 0.35 : 0.18
  const filteredVessels = VESSELS.filter(v => matchesFilter(v, vesselFilter))
  const selectedVessel = VESSELS.find(v => v.id === selectedId)

  return (
    <div className="relative" style={{ height: 300 }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0b1626" />
            <stop offset="100%" stopColor="#142239" />
          </linearGradient>
          <radialGradient id="weatherNormal" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity={stormOpacity * 0.5} />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="stormBlob" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={stormOpacity} />
            <stop offset="40%" stopColor="#f58220" stopOpacity={stormOpacity * 0.7} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="url(#sea)" />
        <path d="M0,0 L0,38 Q12,34 18,40 L22,52 Q14,58 0,56 Z" fill="#1d3252" stroke="#27426b" strokeWidth="0.3" />
        <path d="M0,70 Q10,66 20,72 L18,100 L0,100 Z" fill="#1d3252" stroke="#27426b" strokeWidth="0.3" />
        <path d="M78,0 L100,0 L100,28 Q92,24 84,30 Q80,18 78,0 Z" fill="#1d3252" stroke="#27426b" strokeWidth="0.3" />
        <path d="M82,72 Q90,68 100,72 L100,100 L80,100 Z" fill="#1d3252" stroke="#27426b" strokeWidth="0.3" />
        <g>
          <circle cx="20" cy="60" r="1.6" fill="#f58220" />
          <circle cx="20" cy="60" r="1.6" fill="none" stroke="#f58220" strokeWidth="0.4" className="pulse-ring" />
          <text x="23" y="61" fill="#eef2f8" fontSize="2.4" fontFamily="monospace">TUAS PORT</text>
        </g>
        {isStormSevere ? (
          <>
            <ellipse cx="52" cy="46" rx="30" ry="20" fill="url(#stormBlob)" />
            <text x="52" y="40" fill="#ef4444" fontSize="2.8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">⛈ STORM ACTIVE</text>
            <text x="52" y="44" fill="#f58220" fontSize="1.9" fontFamily="monospace" textAnchor="middle">{windKts}kn · GALE WARNING</text>
          </>
        ) : (
          <>
            <ellipse cx="55" cy="48" rx="22" ry="14" fill="url(#weatherNormal)" />
            <text x="55" y="45" fill="#f59e0b" fontSize="2.0" fontFamily="monospace" textAnchor="middle">
              {riskLevel === 'High' ? 'ELEVATED RISK' : 'MALACCA'}
            </text>
          </>
        )}
        <path d="M20,60 Q40,50 62,58" fill="none" stroke={isStormSevere ? '#ef4444' : '#ef444488'} strokeWidth={isStormSevere ? 1 : 0.6} strokeDasharray="2,1.5" opacity="0.7" />
        <text x="38" y="51" fill={isStormSevere ? '#ef4444' : '#ef4444bb'} fontSize="1.8" fontFamily="monospace">MALACCA</text>
        <path d="M20,60 Q35,75 55,78 Q65,76 72,68" fill="none" stroke="#22c55e44" strokeWidth="0.5" strokeDasharray="1.5,2" />
        <text x="43" y="78" fill="#22c55e" fontSize="1.6" fontFamily="monospace" opacity="0.5">SUNDA ALT</text>
        {filteredVessels.map(v => {
          const isSel = v.id === selectedId
          const color = RISK_COLOR[v.priority] || '#5fb0d8'
          return (
            <g key={v.id} onClick={() => onSelect?.(v.id)} style={{ cursor: 'pointer' }}>
              {isSel && <circle cx={v.pos.x} cy={v.pos.y} r="3.5" fill="none" stroke="#f58220" strokeWidth="0.6" className="pulse-ring" />}
              <circle cx={v.pos.x} cy={v.pos.y} r="1.6" fill={color} stroke="#0b1626" strokeWidth="0.4" />
              <text x={v.pos.x + 2.4} y={v.pos.y + 0.8} fill="#eef2f8" fontSize="2.0" fontFamily="monospace" opacity={isSel ? 1 : 0.8}>{v.name}</text>
              {v.coldChain && <text x={v.pos.x + 2.4} y={v.pos.y + 3.2} fill="#5fb0d8" fontSize="1.6" fontFamily="monospace">❄</text>}
            </g>
          )
        })}
        {VESSELS.filter(v => !matchesFilter(v, vesselFilter)).map(v => (
          <g key={`dim-${v.id}`} style={{ pointerEvents: 'none' }}>
            <circle cx={v.pos.x} cy={v.pos.y} r="1.6" fill="#27426b" stroke="#142239" strokeWidth="0.4" opacity="0.35" />
          </g>
        ))}
      </svg>
      {selectedVessel && (
        <div className="absolute top-2 right-2 w-56 card p-3 slide-up z-10 max-h-72 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-navy-50 truncate">{selectedVessel.name}</span>
            <span className="chip shrink-0" style={{ background: `${RISK_COLOR[selectedVessel.priority]}22`, color: RISK_COLOR[selectedVessel.priority] }}>{selectedVessel.priority}</span>
          </div>
          <div className="space-y-1 text-[11px] text-navy-200">
            <div className="flex justify-between"><span>ETA</span><span className="text-navy-50 font-mono">{selectedVessel.etaHours}h</span></div>
            <div className="flex justify-between"><span>Speed</span><span className="text-navy-50 font-mono">{selectedVessel.speedKnots}kn</span></div>
            <div className="flex justify-between"><span>Status</span><span className="text-navy-50">{selectedVessel.status}</span></div>
            {selectedVessel.coldChain && <div className="text-sea-400 font-semibold pt-1 flex items-center gap-1"><span>❄</span><span>COLD-CHAIN</span></div>}
          </div>
          {selectedVessel.id === 'SL_TRADER' && onViewSlTrader && (
            <button onClick={onViewSlTrader} className="mt-2 w-full text-[11px] px-2 py-1.5 rounded-lg border border-accent-500/40 bg-accent-500/10 text-accent-400 hover:bg-accent-500/20 transition font-medium">
              View Full Details →
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Folium iframe map ────────────────────────────────────────────────────────
function FoliumMap({ stormActive, congestionActive, onFoliumFail }) {
  const iframeRef = useRef(null)
  const [status, setStatus] = useState('loading')  // loading | ok | failed

  // Try static file first; Flask endpoint as fallback
  const staticSrc = `/folium_map.html`

  const handleLoad = () => setStatus('ok')
  const handleError = () => {
    setStatus('failed')
    onFoliumFail?.()
  }

  // Detect blank / error document inside iframe after load
  useEffect(() => {
    if (status !== 'ok') return
    const t = setTimeout(() => {
      try {
        const doc = iframeRef.current?.contentDocument
        if (!doc || !doc.body || doc.body.innerHTML.length < 100) {
          setStatus('failed')
          onFoliumFail?.()
        }
      } catch {}
    }, 1500)
    return () => clearTimeout(t)
  }, [status, onFoliumFail])

  return (
    <div className="relative w-full" style={{ height: 340 }}>
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-navy-900/60 z-10">
          <div className="flex items-center gap-2 text-[12px] text-navy-300">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            Loading Folium map…
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={staticSrc}
        title="Folium Vessel Route Map"
        className="w-full h-full border-0 rounded-b-lg"
        style={{ display: status === 'failed' ? 'none' : 'block' }}
        onLoad={handleLoad}
        onError={handleError}
        sandbox="allow-scripts allow-same-origin"
      />
      {status === 'failed' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-[11px] text-navy-400">Map unavailable</p>
        </div>
      )}
    </div>
  )
}

// ─── Route selection buttons ──────────────────────────────────────────────────
function RouteButtons({ snapshot, stormActive, onRouteSelect, activeRouteId }) {
  const routes = snapshot?.routes ?? ROUTE_DEFS

  return (
    <div className="px-3 pb-3 grid grid-cols-3 gap-2">
      {ROUTE_DEFS.map(rd => {
        const isActive = rd.id === activeRouteId
        const isSevere = stormActive && rd.id === 'R_MALACCA'
        return (
          <button
            key={rd.id}
            onClick={() => onRouteSelect?.(rd, stormActive)}
            style={{
              borderColor: isActive ? rd.color : undefined,
              color: isActive ? rd.color : undefined,
              background: isActive ? `${rd.color}18` : undefined
            }}
            className={`text-[10px] px-2 py-2 rounded-lg border transition font-medium text-left leading-tight ${
              isActive ? '' : 'bg-navy-900/40 border-navy-600/40 text-navy-300 hover:border-navy-400/60 hover:text-navy-100'
            } ${isSevere ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center gap-1 mb-1">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: rd.color }} />
              <span className="font-semibold truncate">{rd.short}</span>
            </div>
            <div className="text-navy-400" style={{ fontSize: 9 }}>
              Δ{rd.deltaDays > 0 ? '+' : ''}{rd.deltaDays}d · ×{(rd.costIndex/100).toFixed(2)} cost
            </div>
            {rd.humanValidation && <div className="text-amber-400 mt-0.5" style={{ fontSize: 9 }}>⚠ Human validation</div>}
          </button>
        )
      })}
    </div>
  )
}

// ─── CommandMap ───────────────────────────────────────────────────────────────
export default function CommandMap({
  selectedId, onSelect, snapshot, stormActive, congestionActive,
  vesselFilter, onViewSlTrader, onRouteSelect, activeRouteId
}) {
  const [useFolium, setUseFolium] = useState(true)
  const weather = snapshot?.weather
  const riskLevel = weather?.riskLevel ?? 'Medium'
  const isStormSevere = stormActive || riskLevel === 'Severe'

  const handleFoliumFail = () => setUseFolium(false)

  return (
    <div className="card relative overflow-hidden">
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
          {useFolium ? (
            <span className="text-[10px] text-sea-400 font-mono">FOLIUM INTERACTIVE</span>
          ) : (
            <span className="text-[10px] text-amber-400 font-mono">SCHEMATIC MOCK</span>
          )}
          <button
            onClick={() => setUseFolium(f => !f)}
            className="text-[10px] px-2 py-0.5 rounded border border-navy-600/50 text-navy-300 hover:text-navy-100 hover:border-navy-400/60 transition"
            title={useFolium ? 'Switch to schematic map' : 'Switch to Folium map'}
          >
            {useFolium ? 'Schematic' : 'Interactive'}
          </button>
        </div>
      </div>

      {/* Fallback warning when Folium unavailable */}
      {!useFolium && (
        <div className="mx-3 mb-2 flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1.5">
          <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className="text-[10px] text-amber-300">Enhanced Folium map unavailable. Schematic MOCK map is being used. Decision Interface remains fully operational.</p>
        </div>
      )}

      {useFolium ? (
        <FoliumMap
          stormActive={stormActive}
          congestionActive={congestionActive}
          onFoliumFail={handleFoliumFail}
        />
      ) : (
        <SchematicMap
          selectedId={selectedId}
          onSelect={onSelect}
          snapshot={snapshot}
          stormActive={stormActive}
          vesselFilter={vesselFilter}
          onViewSlTrader={onViewSlTrader}
        />
      )}

      {/* Route selection buttons — always visible regardless of map mode */}
      <div className="px-3 pt-2 pb-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-navy-400 font-semibold tracking-wider">SELECT ROUTE → DECISION INTERFACE</span>
          {activeRouteId && (
            <span className="text-[9px] text-accent-400">Route loaded ✓</span>
          )}
        </div>
      </div>
      <RouteButtons
        snapshot={snapshot}
        stormActive={stormActive}
        onRouteSelect={onRouteSelect}
        activeRouteId={activeRouteId}
      />
    </div>
  )
}
