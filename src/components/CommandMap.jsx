import React, { useState } from 'react'
import { VESSELS, WEATHER } from '../data/mockData.js'

const RISK_COLOR = {
  CRITICAL: '#ef4444',
  HIGH:     '#f58220',
  MEDIUM:   '#eab308',
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

// Geographic coordinate → SVG coordinate mapping
// Covers lon 96–125°E, lat 12°N to -10°S
// viewBox 0 0 800 500
const W = 800, H = 500
const LON0 = 96, LAT0 = 12
const LON_SPAN = 29, LAT_SPAN = 22

function geoToSvg(lat, lon) {
  const x = ((lon - LON0) / LON_SPAN) * W
  const y = ((LAT0 - lat) / LAT_SPAN) * H
  return { x, y }
}

function pt(lat, lon) {
  const { x, y } = geoToSvg(lat, lon)
  return `${x.toFixed(1)},${y.toFixed(1)}`
}

function polyline(coords) {
  return coords.map(([lat, lon]) => pt(lat, lon)).join(' ')
}

// Land mass polygons (approximate outlines)
const PENINSULAR_MALAYSIA = [
  [6.5, 99.8], [6.8, 101.0], [6.2, 102.3], [5.5, 103.4], [4.8, 103.5],
  [3.8, 103.5], [2.8, 103.5], [1.8, 103.6], [1.2, 103.6],
  [1.5, 102.5], [2.0, 101.5], [2.8, 101.2], [3.5, 100.9],
  [4.2, 100.4], [5.0, 100.3], [5.8, 100.2], [6.5, 99.8]
]

const SUMATRA = [
  [5.6, 95.3], [4.2, 96.5], [2.5, 97.5], [0.5, 99.0], [-2.0, 100.5],
  [-4.5, 102.5], [-5.4, 104.0], [-5.9, 105.8],
  [-4.5, 105.5], [-2.5, 104.5], [-0.5, 103.5],
  [2.0, 101.5], [3.8, 100.0], [5.0, 97.8], [5.6, 95.3]
]

const JAVA = [
  [-6.0, 106.0], [-6.8, 107.5], [-7.5, 110.0], [-8.0, 112.5],
  [-8.7, 115.0], [-8.5, 115.2], [-8.0, 113.5],
  [-7.5, 111.0], [-7.0, 108.5], [-6.5, 107.0], [-6.0, 105.5], [-6.0, 106.0]
]

const BORNEO = [
  [7.0, 116.5], [6.5, 118.0], [5.0, 118.5], [3.0, 117.5],
  [1.0, 117.0], [0.0, 116.5], [-1.0, 116.0], [-2.0, 116.5],
  [-1.5, 115.0], [-0.5, 114.0], [1.0, 112.5], [2.5, 111.0],
  [4.0, 110.0], [5.5, 110.5], [6.0, 112.0], [7.0, 116.5]
]

const SINGAPORE_PT = geoToSvg(1.3, 103.8)

// Vessel GPS positions on the schematic (lat, lon)
const VESSEL_POSITIONS = {
  SL_TRADER:    { lat: 3.2, lon: 100.5 },   // In Malacca Strait, off Selangor
  OCEAN_VEGA:   { lat: 4.6, lon: 99.1 },    // Northern Malacca, holding
  NORDIC_PEARL: { lat: -3.0, lon: 106.5 },  // Java Sea, approaching Sunda
  PACIFIC_DAWN: { lat: 1.1, lon: 104.7 },   // Singapore Strait, approaching
  MERIDIAN_STAR:{ lat: 1.3, lon: 103.65 }   // Berthing at Tuas
}

// Route polylines (lat/lon arrays)
const MALACCA_PTS = [
  [5.80, 98.60], [5.10, 99.00], [4.30, 99.40], [3.60, 100.40],
  [2.90, 100.90], [2.20, 101.90], [1.70, 102.90], [1.30, 103.65]
]
const SUNDA_PTS = [
  [5.80, 98.60], [4.50, 97.50], [2.50, 96.50], [0.50, 97.00],
  [-2.00, 99.00], [-4.50, 103.00], [-5.50, 105.80], [-4.80, 107.50],
  [-2.50, 108.50], [0.00, 107.00], [1.00, 105.50], [1.30, 103.65]
]
const LOMBOK_PTS = [
  [5.80, 98.60], [3.50, 97.00], [0.00, 96.50], [-3.00, 100.00],
  [-5.50, 104.50], [-7.00, 108.50], [-7.80, 112.00], [-8.50, 115.50],
  [-7.50, 117.00], [-5.00, 115.00], [-2.00, 112.00],
  [0.50, 108.00], [1.00, 105.00], [1.30, 103.65]
]

function matchesFilter(vessel, filter) {
  if (filter === 'all') return true
  if (filter === 'cold-chain') return vessel.coldChain === true
  if (filter === 'general') return vessel.coldChain !== true
  return true
}

// ─── Schematic Map SVG ────────────────────────────────────────────────────────
function SchematicMapSVG({ selectedId, onSelect, snapshot, stormActive, vesselFilter, onViewSlTrader, activeRouteId }) {
  const weather = snapshot?.weather ?? WEATHER
  const windKts = weather?.windKnots ?? WEATHER.windKnots
  const waveM   = weather?.waveHeightM ?? WEATHER.waveHeightM
  const visNm   = weather?.visibilityNm ?? WEATHER.visibilityNm
  const riskLevel = weather?.severity ?? WEATHER.severity

  const isHighRisk = stormActive || riskLevel === 'HIGH'

  const filteredVessels = VESSELS.filter(v => matchesFilter(v, vesselFilter))
  const dimmedVessels   = VESSELS.filter(v => !matchesFilter(v, vesselFilter))
  const selectedVessel  = VESSELS.find(v => v.id === selectedId)

  // Weather blob center — Malacca Strait mid-section
  const blobCenter = geoToSvg(4.0, 99.5)

  // Key label positions
  const malaysiaPt  = geoToSvg(4.5, 102.2)
  const sumatraPt   = geoToSvg(0.5, 102.0)
  const javaPt      = geoToSvg(-7.2, 110.0)
  const borneoPt    = geoToSvg(2.5, 114.5)
  const singaporePt = geoToSvg(1.35, 103.85)

  const malaccaLabelPt  = geoToSvg(3.8, 99.0)
  const sundaLabelPt    = geoToSvg(-5.0, 105.9)
  const lombokLabelPt   = geoToSvg(-8.3, 115.7)

  return (
    <div className="relative" style={{ height: 400 }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        style={{ borderRadius: '0 0 8px 8px' }}
      >
        <defs>
          {/* Sea gradient */}
          <linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b8d8ea" />
            <stop offset="100%" stopColor="#7fb8d8" />
          </linearGradient>
          {/* Land gradient */}
          <linearGradient id="landGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c8d8a0" />
            <stop offset="100%" stopColor="#b0c888" />
          </linearGradient>
          {/* Storm blob */}
          <radialGradient id="stormBlob" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={isHighRisk ? 0.55 : 0.3} />
            <stop offset="50%" stopColor="#f58220" stopOpacity={isHighRisk ? 0.35 : 0.15} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>
          {/* Vessel pulse */}
          <radialGradient id="pulseGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>
          {/* Grid pattern */}
          <pattern id="gridPat" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#5890a8" strokeWidth="0.3" opacity="0.25" />
          </pattern>
          {/* Active route glow */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="softglow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Sea background */}
        <rect width={W} height={H} fill="url(#seaGrad)" />
        {/* Nautical grid */}
        <rect width={W} height={H} fill="url(#gridPat)" />

        {/* ── Land masses ── */}
        <polygon
          points={polyline(SUMATRA)}
          fill="url(#landGrad)" stroke="#8aaa60" strokeWidth="1.5"
        />
        <polygon
          points={polyline(PENINSULAR_MALAYSIA)}
          fill="url(#landGrad)" stroke="#8aaa60" strokeWidth="1.5"
        />
        <polygon
          points={polyline(JAVA)}
          fill="url(#landGrad)" stroke="#8aaa60" strokeWidth="1.5"
        />
        <polygon
          points={polyline(BORNEO)}
          fill="url(#landGrad)" stroke="#8aaa60" strokeWidth="1.5"
        />

        {/* Singapore dot */}
        <circle cx={SINGAPORE_PT.x} cy={SINGAPORE_PT.y} r="5" fill="#d4a843" stroke="#fff" strokeWidth="1.5" />

        {/* ── Weather disruption blob ── */}
        <ellipse
          cx={blobCenter.x} cy={blobCenter.y}
          rx="110" ry="70"
          fill="url(#stormBlob)"
        />
        {isHighRisk && (
          <>
            <ellipse
              cx={blobCenter.x} cy={blobCenter.y}
              rx="110" ry="70"
              fill="none"
              stroke="#ef4444"
              strokeWidth="1"
              strokeDasharray="6,4"
              opacity="0.5"
            />
            <text
              x={blobCenter.x} y={blobCenter.y - 18}
              fill="#ef4444" fontSize="13" fontFamily="monospace" fontWeight="bold"
              textAnchor="middle" opacity="0.9"
            >GALE</text>
            <text
              x={blobCenter.x} y={blobCenter.y - 4}
              fill="#f58220" fontSize="10" fontFamily="monospace"
              textAnchor="middle" opacity="0.85"
            >{windKts}kn · {waveM}m waves</text>
          </>
        )}

        {/* ── Shipping routes ── */}
        {/* Malacca */}
        <polyline
          points={polyline(MALACCA_PTS)}
          fill="none"
          stroke={activeRouteId === 'R_MALACCA' ? '#ef4444' : '#ef444488'}
          strokeWidth={activeRouteId === 'R_MALACCA' ? 3 : 1.8}
          strokeDasharray="10,6"
          filter={activeRouteId === 'R_MALACCA' ? 'url(#glow)' : undefined}
        />
        {/* Sunda */}
        <polyline
          points={polyline(SUNDA_PTS)}
          fill="none"
          stroke={activeRouteId === 'R_SUNDA' ? '#f59e0b' : '#f59e0b66'}
          strokeWidth={activeRouteId === 'R_SUNDA' ? 3 : 1.8}
          strokeDasharray="10,6"
          filter={activeRouteId === 'R_SUNDA' ? 'url(#glow)' : undefined}
        />
        {/* Lombok */}
        <polyline
          points={polyline(LOMBOK_PTS)}
          fill="none"
          stroke={activeRouteId === 'R_LOMBOK' ? '#5fb0d8' : '#5fb0d866'}
          strokeWidth={activeRouteId === 'R_LOMBOK' ? 3 : 1.8}
          strokeDasharray="10,6"
          filter={activeRouteId === 'R_LOMBOK' ? 'url(#glow)' : undefined}
        />

        {/* ── Direction arrows on routes ── */}
        {[
          { pts: MALACCA_PTS, color: '#ef4444', id: 'R_MALACCA' },
          { pts: SUNDA_PTS,   color: '#f59e0b', id: 'R_SUNDA'   },
          { pts: LOMBOK_PTS,  color: '#5fb0d8', id: 'R_LOMBOK'  }
        ].map(({ pts, color, id }) => {
          const midIdx = Math.floor(pts.length / 2)
          const a = geoToSvg(pts[midIdx - 1][0], pts[midIdx - 1][1])
          const b = geoToSvg(pts[midIdx][0], pts[midIdx][1])
          const angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI
          const mx = (a.x + b.x) / 2
          const my = (a.y + b.y) / 2
          return (
            <text
              key={id}
              x={mx} y={my}
              fill={color}
              fontSize="14"
              textAnchor="middle"
              dominantBaseline="middle"
              transform={`rotate(${angle}, ${mx}, ${my})`}
              opacity={activeRouteId === id ? 1 : 0.6}
            >▶</text>
          )
        })}

        {/* ── Strait labels ── */}
        <text x={malaccaLabelPt.x} y={malaccaLabelPt.y}
          fill="#1e4a6e" fontSize="12" fontFamily="sans-serif" fontWeight="700"
          textAnchor="middle" transform={`rotate(-48, ${malaccaLabelPt.x}, ${malaccaLabelPt.y})`}
          opacity="0.85"
        >Malacca Strait</text>

        <text x={sundaLabelPt.x - 10} y={sundaLabelPt.y + 5}
          fill="#1e4a6e" fontSize="11" fontFamily="sans-serif" fontWeight="700"
          textAnchor="middle" opacity="0.8"
        >Sunda Strait</text>

        <text x={lombokLabelPt.x} y={lombokLabelPt.y + 14}
          fill="#1e4a6e" fontSize="11" fontFamily="sans-serif" fontWeight="700"
          textAnchor="middle" opacity="0.8"
        >Lombok Strait</text>

        {/* ── Land labels ── */}
        <text x={malaysiaPt.x} y={malaysiaPt.y}
          fill="#4a6030" fontSize="14" fontFamily="sans-serif" fontWeight="800"
          textAnchor="middle" opacity="0.9"
        >MALAYSIA</text>

        <text x={sumatraPt.x - 50} y={sumatraPt.y + 30}
          fill="#4a6030" fontSize="13" fontFamily="sans-serif" fontWeight="800"
          textAnchor="middle" opacity="0.9"
          transform={`rotate(-65, ${sumatraPt.x - 50}, ${sumatraPt.y + 30})`}
        >SUMATRA</text>

        <text x={javaPt.x} y={javaPt.y}
          fill="#4a6030" fontSize="13" fontFamily="sans-serif" fontWeight="800"
          textAnchor="middle" opacity="0.9"
        >JAVA</text>

        <text x={borneoPt.x} y={borneoPt.y}
          fill="#4a6030" fontSize="14" fontFamily="sans-serif" fontWeight="800"
          textAnchor="middle" opacity="0.9"
        >BORNEO</text>

        <text x={singaporePt.x + 10} y={singaporePt.y - 10}
          fill="#7a5a10" fontSize="11" fontFamily="sans-serif" fontWeight="700"
          opacity="0.95"
        >SINGAPORE</text>

        {/* ── Dimmed (filtered-out) vessels ── */}
        {dimmedVessels.map(v => {
          const pos = VESSEL_POSITIONS[v.id]
          if (!pos) return null
          const { x, y } = geoToSvg(pos.lat, pos.lon)
          return (
            <circle key={`dim-${v.id}`} cx={x} cy={y} r="7"
              fill="#8ab0c8" stroke="#aacce0" strokeWidth="1" opacity="0.25"
              style={{ pointerEvents: 'none' }}
            />
          )
        })}

        {/* ── Active vessels ── */}
        {filteredVessels.map(v => {
          const pos = VESSEL_POSITIONS[v.id]
          if (!pos) return null
          const { x, y } = geoToSvg(pos.lat, pos.lon)
          const color = RISK_COLOR[v.priority] || '#5fb0d8'
          const isSel = v.id === selectedId
          const isSlTrader = v.id === 'SL_TRADER'

          return (
            <g key={v.id} onClick={() => onSelect?.(v.id)} style={{ cursor: 'pointer' }}>
              {/* Pulse ring for SL TRADER (critical) */}
              {isSlTrader && (
                <>
                  <circle cx={x} cy={y} r="22" fill="#ef4444" opacity="0.08" />
                  <circle cx={x} cy={y} r="16" fill="none" stroke="#ef4444" strokeWidth="1.5"
                    strokeDasharray="4,3" opacity="0.5">
                    <animateTransform attributeName="transform" type="rotate"
                      from={`0 ${x} ${y}`} to={`360 ${x} ${y}`} dur="8s" repeatCount="indefinite" />
                  </circle>
                </>
              )}
              {/* Selection ring */}
              {isSel && !isSlTrader && (
                <circle cx={x} cy={y} r="14" fill="none" stroke={color}
                  strokeWidth="2" strokeDasharray="4,3" opacity="0.7" />
              )}
              {/* Vessel body */}
              <circle cx={x} cy={y} r="8" fill={color} stroke="#fff" strokeWidth="2"
                filter={isSlTrader ? 'url(#softglow)' : undefined}
              />
              {/* Cold chain snowflake */}
              {v.coldChain && (
                <text x={x} y={y + 1} fill="#fff" fontSize="7" textAnchor="middle"
                  dominantBaseline="middle" fontWeight="bold">*</text>
              )}
              {/* Vessel name label */}
              <rect x={x + 12} y={y - 10} width={v.name.length * 5.8 + 6} height="14"
                fill="#0b1a2e" rx="2" opacity="0.72" />
              <text x={x + 15} y={y + 1}
                fill="#e8f0f8" fontSize="10" fontFamily="monospace" fontWeight="600"
                dominantBaseline="middle"
              >{v.name}</text>
              {isSlTrader && (
                <text x={x + 15} y={y + 13}
                  fill="#ef4444" fontSize="9" fontFamily="monospace" fontWeight="700"
                >CRITICAL</text>
              )}
            </g>
          )
        })}

        {/* ── Tuas Port marker ── */}
        <g>
          <rect
            x={SINGAPORE_PT.x - 2} y={SINGAPORE_PT.y - 16}
            width="4" height="16" fill="#e8a020" rx="1"
          />
          <polygon
            points={`${SINGAPORE_PT.x - 2},${SINGAPORE_PT.y - 16} ${SINGAPORE_PT.x + 10},${SINGAPORE_PT.y - 10} ${SINGAPORE_PT.x - 2},${SINGAPORE_PT.y - 4}`}
            fill="#e8a020"
          />
        </g>

        {/* ── Disclaimer ── */}
        <text x="4" y={H - 5}
          fill="#1e4a6e" fontSize="8" fontFamily="monospace" opacity="0.6"
        >Schematic simulated map — not for operational navigation</text>
      </svg>

      {/* ── Floating map controls ── */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
        {[
          { icon: '+', title: 'Zoom in' },
          { icon: '−', title: 'Zoom out' },
          { icon: '⊕', title: 'Center' },
          { icon: '⊞', title: 'Layers' }
        ].map(({ icon, title }) => (
          <button key={title} title={title}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
              shadow-md transition hover:scale-110 active:scale-95"
            style={{ background: '#0b1a2ecc', color: '#a8d4e8', border: '1px solid #2a4a6e' }}
          >{icon}</button>
        ))}
      </div>

      {/* ── Weather Overview card ── */}
      <div className="absolute top-3 right-3 w-44 rounded-xl overflow-hidden shadow-lg"
        style={{ background: '#0b1a2ee8', border: '1px solid #2a4a6e' }}>
        <div className="px-3 py-2 flex items-center justify-between"
          style={{ background: '#0d2035', borderBottom: '1px solid #2a4a6e' }}>
          <span className="text-[10px] font-bold tracking-wider" style={{ color: '#a8d4e8' }}>
            Malacca Strait
          </span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{
              background: isHighRisk ? '#ef444422' : '#f59e0b22',
              color: isHighRisk ? '#ef4444' : '#f59e0b',
              border: `1px solid ${isHighRisk ? '#ef444444' : '#f59e0b44'}`
            }}>
            {isHighRisk ? 'HIGH' : 'MEDIUM'}
          </span>
        </div>
        <div className="px-3 py-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px]" style={{ color: '#7090a8' }}>Wind</span>
            <span className="text-[11px] font-mono font-semibold" style={{ color: '#e8f0f8' }}>
              {windKts} kn
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px]" style={{ color: '#7090a8' }}>Waves</span>
            <span className="text-[11px] font-mono font-semibold" style={{ color: '#e8f0f8' }}>
              {waveM} m
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px]" style={{ color: '#7090a8' }}>Visibility</span>
            <span className="text-[11px] font-mono font-semibold" style={{ color: '#e8f0f8' }}>
              {visNm} nm
            </span>
          </div>
          {isHighRisk && (
            <div className="pt-1 text-[9px] font-medium leading-tight" style={{ color: '#f58220' }}>
              Gale warning active
            </div>
          )}
        </div>
      </div>

      {/* ── Vessel detail popup ── */}
      {selectedVessel && (
        <div className="absolute top-3 left-3 w-48 rounded-xl overflow-hidden shadow-lg slide-up"
          style={{ background: '#0b1a2eee', border: '1px solid #2a4a6e', zIndex: 10 }}>
          <div className="px-3 py-2 flex items-center justify-between"
            style={{ background: '#0d2035', borderBottom: '1px solid #2a4a6e' }}>
            <span className="text-[11px] font-bold truncate" style={{ color: '#e8f0f8' }}>
              {selectedVessel.name}
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ml-1"
              style={{
                background: `${RISK_COLOR[selectedVessel.priority]}20`,
                color: RISK_COLOR[selectedVessel.priority],
                border: `1px solid ${RISK_COLOR[selectedVessel.priority]}44`
              }}>
              {selectedVessel.priority}
            </span>
          </div>
          <div className="px-3 py-2 space-y-1">
            {[
              { label: 'ETA',    value: `${selectedVessel.etaHours}h` },
              { label: 'Speed',  value: `${selectedVessel.speedKnots}kn` },
              { label: 'Status', value: selectedVessel.status },
              { label: 'Cargo',  value: selectedVessel.cargo }
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between gap-2">
                <span className="text-[10px]" style={{ color: '#7090a8' }}>{label}</span>
                <span className="text-[10px] font-mono text-right truncate" style={{ color: '#c8dcea' }}>{value}</span>
              </div>
            ))}
            {selectedVessel.coldChain && (
              <div className="pt-1 text-[10px] font-semibold" style={{ color: '#5fb0d8' }}>
                ❄ COLD-CHAIN ACTIVE
              </div>
            )}
          </div>
          {selectedVessel.id === 'SL_TRADER' && onViewSlTrader && (
            <div className="px-3 pb-2">
              <button onClick={onViewSlTrader}
                className="w-full text-[10px] px-2 py-1.5 rounded-lg transition font-medium"
                style={{ background: '#1a3a5e', color: '#7ab8d8', border: '1px solid #2a5a8e' }}
                onMouseEnter={e => e.currentTarget.style.background = '#1e4570'}
                onMouseLeave={e => e.currentTarget.style.background = '#1a3a5e'}
              >
                View Full Details →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Route selection buttons ──────────────────────────────────────────────────
function RouteButtons({ stormActive, onRouteSelect, activeRouteId }) {
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
              isActive
                ? ''
                : 'bg-navy-900/40 border-navy-600/40 text-navy-300 hover:border-navy-400/60 hover:text-navy-100'
            } ${isSevere ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center gap-1 mb-1">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: rd.color }} />
              <span className="font-semibold truncate">{rd.short}</span>
            </div>
            <div className="text-navy-400" style={{ fontSize: 9 }}>
              Δ{rd.deltaDays > 0 ? '+' : ''}{rd.deltaDays}d · ×{(rd.costIndex / 100).toFixed(2)} cost
            </div>
            {rd.humanValidation && (
              <div className="text-amber-400 mt-0.5" style={{ fontSize: 9 }}>⚠ Human validation</div>
            )}
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
  const weather = snapshot?.weather
  const riskLevel = weather?.severity ?? 'HIGH'
  const isHighRisk = stormActive || riskLevel === 'HIGH' || riskLevel === 'Severe'

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
          {isHighRisk && (
            <span className="chip border bg-red-500/15 text-red-400 border-red-500/40 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 blink" />STORM ACTIVE
            </span>
          )}
          <span className="text-[10px] text-sea-400 font-mono">SCHEMATIC</span>
        </div>
      </div>

      <SchematicMapSVG
        selectedId={selectedId}
        onSelect={onSelect}
        snapshot={snapshot}
        stormActive={stormActive}
        vesselFilter={vesselFilter}
        onViewSlTrader={onViewSlTrader}
        activeRouteId={activeRouteId}
      />

      {/* Route selection buttons */}
      <div className="px-3 pt-2 pb-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-navy-400 font-semibold tracking-wider">
            SELECT ROUTE → DECISION INTERFACE
          </span>
          {activeRouteId && (
            <span className="text-[9px] text-accent-400">Route loaded ✓</span>
          )}
        </div>
      </div>
      <RouteButtons
        stormActive={stormActive}
        onRouteSelect={onRouteSelect}
        activeRouteId={activeRouteId}
      />
    </div>
  )
}
