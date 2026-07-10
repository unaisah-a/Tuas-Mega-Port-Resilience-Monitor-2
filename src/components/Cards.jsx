import React from 'react'
import { WEATHER, PORT, LEGEND, BERTHS, SHIPMENTS as MOCK_SHIPMENTS, ROUTES as MOCK_ROUTES, NEWS_TICKER as MOCK_NEWS } from '../data/mockData.js'
import { SHIPMENTS as SIM_SHIPMENTS, ROUTES as SIM_ROUTES, NEWS_TICKER as SIM_NEWS } from '../data/simulation.js'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from 'recharts'

const RISK_STYLE = {
  HIGH: 'bg-red-500/15 text-red-400 border-red-500/40',
  MEDIUM: 'bg-accent-500/15 text-accent-500 border-accent-500/40',
  LOW: 'bg-green-500/15 text-green-400 border-green-500/40',
  SEVERE: 'bg-red-600/20 text-red-300 border-red-600/50'
}

// ─── Weather Card ─────────────────────────────────────────────────────────────
export function WeatherCard({ snapshot }) {
  // Use simulation snapshot weather if provided, fall back to mockData
  const w = snapshot?.weather

  if (w) {
    const riskKey = w.riskLevel?.toUpperCase()
    return (
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-sea-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
            </svg>
            <h3 className="text-sm font-semibold tracking-wide text-navy-50">WEATHER OVERVIEW</h3>
          </div>
          <span className={`chip border ${RISK_STYLE[riskKey] || RISK_STYLE.HIGH}`}>{w.riskLevel}</span>
        </div>
        <div className="p-3 space-y-2">
          <p className="text-[11px] text-navy-300 font-medium">{w.location} · {w.conditionLabel}</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-navy-900/50 rounded-lg py-2">
              <div className="text-[10px] text-navy-300 uppercase">Wind</div>
              <div className="text-lg font-mono text-navy-50">{w.windKts}<span className="text-xs text-navy-300">kn</span></div>
            </div>
            <div className="bg-navy-900/50 rounded-lg py-2">
              <div className="text-[10px] text-navy-300 uppercase">Waves</div>
              <div className="text-lg font-mono text-navy-50">{w.waveM}<span className="text-xs text-navy-300">m</span></div>
            </div>
            <div className="bg-navy-900/50 rounded-lg py-2">
              <div className="text-[10px] text-navy-300 uppercase">Visibility</div>
              <div className="text-lg font-mono text-navy-50">{w.visibilityKm}<span className="text-xs text-navy-300">km</span></div>
            </div>
          </div>
          <div className={`border rounded-lg px-2.5 py-1.5 ${riskKey === 'SEVERE' ? 'bg-red-600/10 border-red-600/40' : 'bg-red-500/10 border-red-500/30'}`}>
            <p className="text-[11px] text-red-300">Storm probability: {w.stormProbability}% · {WEATHER.advisory}</p>
          </div>
          <div style={{ height: 80 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={WEATHER.forecast} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27426b" />
                <XAxis dataKey="t" tick={{ fill: '#a8bbd3', fontSize: 9 }} />
                <YAxis tick={{ fill: '#a8bbd3', fontSize: 9 }} />
                <Tooltip contentStyle={{ background: '#142239', border: '1px solid #27426b', borderRadius: 8, fontSize: 11 }} />
                <Line type="monotone" dataKey="wind" stroke="#f58220" strokeWidth={2} dot={{ r: 2 }} name="Wind (kn)" />
                <Line type="monotone" dataKey="wave" stroke="#5fb0d8" strokeWidth={2} dot={{ r: 2 }} name="Wave (m)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    )
  }

  // Fallback — legacy mockData path
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-sea-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
          </svg>
          <h3 className="text-sm font-semibold tracking-wide text-navy-50">WEATHER OVERVIEW</h3>
        </div>
        <span className={`chip border ${RISK_STYLE[WEATHER.severity]}`}>{WEATHER.severity}</span>
      </div>
      <div className="p-3 space-y-2">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-navy-900/50 rounded-lg py-2">
            <div className="text-[10px] text-navy-300 uppercase">Wind</div>
            <div className="text-lg font-mono text-navy-50">{WEATHER.windKnots}<span className="text-xs text-navy-300">kn</span></div>
          </div>
          <div className="bg-navy-900/50 rounded-lg py-2">
            <div className="text-[10px] text-navy-300 uppercase">Waves</div>
            <div className="text-lg font-mono text-navy-50">{WEATHER.waveHeightM}<span className="text-xs text-navy-300">m</span></div>
          </div>
          <div className="bg-navy-900/50 rounded-lg py-2">
            <div className="text-[10px] text-navy-300 uppercase">Visibility</div>
            <div className="text-lg font-mono text-navy-50">{WEATHER.visibilityNm}<span className="text-xs text-navy-300">nm</span></div>
          </div>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-2.5 py-1.5">
          <p className="text-[11px] text-red-300">{WEATHER.advisory}</p>
        </div>
        <div style={{ height: 90 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={WEATHER.forecast} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27426b" />
              <XAxis dataKey="t" tick={{ fill: '#a8bbd3', fontSize: 9 }} />
              <YAxis tick={{ fill: '#a8bbd3', fontSize: 9 }} />
              <Tooltip contentStyle={{ background: '#142239', border: '1px solid #27426b', borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="wind" stroke="#f58220" strokeWidth={2} dot={{ r: 2 }} name="Wind (kn)" />
              <Line type="monotone" dataKey="wave" stroke="#5fb0d8" strokeWidth={2} dot={{ r: 2 }} name="Wave (m)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// ─── Port Summary Card ────────────────────────────────────────────────────────
export function PortSummaryCard({ snapshot }) {
  const ps = snapshot?.portSummary

  if (ps) {
    const pct = ps.berthOccupancy
    const congested = pct >= 80
    return (
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-accent-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21V8l9-5 9 5v13M3 21h18M9 21v-6h6v6" />
            </svg>
            <h3 className="text-sm font-semibold tracking-wide text-navy-50">PORT SUMMARY</h3>
          </div>
          <span className={`chip border ${congested ? RISK_STYLE.HIGH : RISK_STYLE.LOW}`}>
            {congested ? 'CONGESTED' : 'NOMINAL'}
          </span>
        </div>
        <div className="p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-navy-200">Berth Occupancy</span>
            <span className="text-sm font-mono text-navy-50">{pct}%</span>
          </div>
          <div className="w-full bg-navy-900 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: pct >= 90 ? '#ef4444' : pct >= 75 ? '#f58220' : '#5fb0d8' }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-navy-900/50 rounded-lg py-2">
              <div className="text-[10px] text-navy-300 uppercase">Avg Wait</div>
              <div className="text-base font-mono text-navy-50">{ps.avgDelayHours}h</div>
            </div>
            <div className="bg-navy-900/50 rounded-lg py-2">
              <div className="text-[10px] text-navy-300 uppercase">Ships In Port</div>
              <div className="text-base font-mono text-navy-50">{ps.shipsInPort}</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-navy-300">High-risk shipments</span>
            <span className="text-red-400 font-mono font-medium">{ps.highRiskShipments}</span>
          </div>
        </div>
      </div>
    )
  }

  // Fallback
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-accent-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 21V8l9-5 9 5v13M3 21h18M9 21v-6h6v6" />
          </svg>
          <h3 className="text-sm font-semibold tracking-wide text-navy-50">PORT SUMMARY</h3>
        </div>
        <span className={`chip border ${RISK_STYLE[PORT.status === 'CONGESTED' ? 'HIGH' : 'LOW']}`}>{PORT.status}</span>
      </div>
      <div className="p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-navy-200">Berth Occupancy</span>
          <span className="text-sm font-mono text-navy-50">{PORT.berthsOccupied}/{PORT.berthsTotal}</span>
        </div>
        <div className="w-full bg-navy-900 rounded-full h-2 overflow-hidden">
          <div className="bg-accent-500 h-full rounded-full transition-all" style={{ width: `${PORT.berthOccupancyPct}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-navy-900/50 rounded-lg py-2">
            <div className="text-[10px] text-navy-300 uppercase">Avg Wait</div>
            <div className="text-base font-mono text-navy-50">{PORT.avgWaitHours}h</div>
          </div>
          <div className="bg-navy-900/50 rounded-lg py-2">
            <div className="text-[10px] text-navy-300 uppercase">Unloading</div>
            <div className="text-base font-mono text-navy-50">{PORT.unloadingCapacityTEU.toLocaleString()}<span className="text-xs text-navy-300"> TEU</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Legend Card ──────────────────────────────────────────────────────────────
export function LegendCard() {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-sm font-semibold tracking-wide text-navy-50">LEGEND</h3>
      </div>
      <div className="p-3 space-y-1.5">
        {LEGEND.map(l => (
          <div key={l.label} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: l.color }} />
            <span className="text-xs text-navy-200">{l.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-1 border-t border-navy-600/40 mt-1">
          <span className="w-3 h-3 rounded-full shrink-0 bg-sea-400" />
          <span className="text-xs text-navy-200">Cold-chain cargo</span>
        </div>
      </div>
    </div>
  )
}

// ─── Berth Occupancy Widget ───────────────────────────────────────────────────
export function BerthOccupancyWidget({ snapshot }) {
  // Use simulation berth history if available
  const berthData = snapshot?.berthHistory
  const pct = snapshot?.portSummary?.berthOccupancy ?? PORT.berthOccupancyPct

  if (berthData) {
    // Show 24h history — sample every 3h for readability
    const sampled = berthData.filter((_, i) => i % 3 === 0)
    return (
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-sea-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="6" width="18" height="12" rx="1" /><path d="M3 12h18" />
            </svg>
            <h3 className="text-sm font-semibold tracking-wide text-navy-50">BERTH OCCUPANCY</h3>
          </div>
          <span className={`text-[11px] font-mono ${pct >= 90 ? 'text-red-400' : pct >= 75 ? 'text-accent-500' : 'text-sea-400'}`}>
            {pct}%
          </span>
        </div>
        <div className="p-3" style={{ height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sampled} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27426b" />
              <XAxis dataKey="hour" tick={{ fill: '#a8bbd3', fontSize: 9 }} />
              <YAxis domain={[50, 100]} tick={{ fill: '#a8bbd3', fontSize: 9 }} />
              <Tooltip contentStyle={{ background: '#142239', border: '1px solid #27426b', borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="value" stroke="#5fb0d8" strokeWidth={2} dot={{ r: 2 }} name="Occupancy %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="px-3 pb-2">
          <p className="text-[10px] text-navy-400 italic">24h history · heuristic projection — not trained ML</p>
        </div>
      </div>
    )
  }

  // Fallback — bar chart from mockData berths
  const data = BERTHS.map(b => ({ name: b.id, occupancy: b.occupancy, status: b.status }))
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-sea-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="6" width="18" height="12" rx="1" /><path d="M3 12h18" />
          </svg>
          <h3 className="text-sm font-semibold tracking-wide text-navy-50">BERTH OCCUPANCY</h3>
        </div>
        <span className="text-[11px] text-navy-300 font-mono">{PORT.berthOccupancyPct}%</span>
      </div>
      <div className="p-3" style={{ height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27426b" />
            <XAxis dataKey="name" tick={{ fill: '#a8bbd3', fontSize: 10 }} />
            <YAxis tick={{ fill: '#a8bbd3', fontSize: 9 }} />
            <Tooltip contentStyle={{ background: '#142239', border: '1px solid #27426b', borderRadius: 8, fontSize: 11 }} />
            <Bar dataKey="occupancy" radius={[3, 3, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.occupancy > 80 ? '#ef4444' : d.occupancy > 50 ? '#f58220' : d.occupancy > 0 ? '#5fb0d8' : '#27426b'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Shipment Risk Board ──────────────────────────────────────────────────────
const PRIORITY_ORDER = { Critical: 0, High: 1, CRITICAL: 0, HIGH: 1, MEDIUM: 2, Routine: 3, LOW: 3 }

export function ShipmentRiskBoard({ onSelectVessel, snapshot }) {
  // Prefer simulation shipments (12 total); fall back to mockData (5)
  const source = snapshot?.shipments ?? MOCK_SHIPMENTS
  const sorted = [...source].sort((a, b) =>
    (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2)
  )

  const priorityStyle = (p) => {
    const u = p?.toUpperCase()
    if (u === 'CRITICAL') return RISK_STYLE.HIGH
    if (u === 'HIGH') return RISK_STYLE.MEDIUM
    return RISK_STYLE.LOW
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-accent-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 7L9 18l-5-5" />
          </svg>
          <h3 className="text-sm font-semibold tracking-wide text-navy-50">SHIPMENT RISK BOARD</h3>
        </div>
        <span className="text-[11px] text-navy-300">{sorted.length} active</span>
      </div>
      <div className="p-2 space-y-1.5 max-h-64 overflow-y-auto">
        {sorted.map(s => {
          const vesselKey = s.vessel?.replace(/ /g, '_')
          const escalationText = s.escalation && s.escalation !== 'None' ? s.escalation : null
          return (
            <button
              key={s.id}
              onClick={() => onSelectVessel?.(vesselKey)}
              className="w-full text-left bg-navy-900/40 hover:bg-navy-700/50 border border-navy-600/40 rounded-lg px-3 py-2 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-navy-50">{s.id}</span>
                <span className={`chip border ${priorityStyle(s.priority)}`}>{s.priority}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-navy-200 truncate mr-2">{s.vessel} — {s.cargo}</span>
                {s.isColdChain && <span className="text-sea-400 text-[10px] font-medium shrink-0">COLD-CHAIN</span>}
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px] text-navy-300">
                <span>ETA {s.etaHours}h</span>
                {s.inventoryRisk && <span>{s.inventoryRisk}</span>}
                {escalationText && <span className="text-accent-500 truncate">{escalationText}</span>}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Route Risk Summary ───────────────────────────────────────────────────────
export function RouteRiskSummary({ snapshot }) {
  // Prefer simulation routes (4 incl. Air); fall back to mockData (3)
  const routes = snapshot?.routes ?? MOCK_ROUTES

  const riskStyleForLevel = (level) => {
    const u = level?.toUpperCase()
    return RISK_STYLE[u] || RISK_STYLE.MEDIUM
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-sea-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
          <h3 className="text-sm font-semibold tracking-wide text-navy-50">ROUTE RISK SUMMARY</h3>
        </div>
      </div>
      <div className="p-3 space-y-2">
        {routes.map(r => {
          const deltaDays = r.deltaDays !== undefined ? r.deltaDays : null
          const delayHours = r.delayHours !== undefined ? r.delayHours : null
          const congestionPct = r.congestionPct !== undefined ? r.congestionPct : null

          return (
            <div key={r.id} className="bg-navy-900/40 rounded-lg px-3 py-2 border border-navy-600/30">
              <div className="flex items-center justify-between">
                <span className="text-xs text-navy-50 font-medium">{r.name}</span>
                <span className={`chip border ${riskStyleForLevel(r.riskLevel)}`}>{r.riskLevel}</span>
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px] text-navy-300 flex-wrap gap-x-3">
                {deltaDays !== null && (
                  <span>+{deltaDays}d transit</span>
                )}
                {delayHours !== null && (
                  <span>Delay +{delayHours}h</span>
                )}
                {congestionPct !== null && (
                  <span>Congestion {congestionPct}%</span>
                )}
                {r.costIndex !== undefined && (
                  <span>Cost ×{(r.costIndex / 100).toFixed(1)}</span>
                )}
                {r.co2Index !== undefined && (
                  <span>CO2 ×{(r.co2Index / 100).toFixed(1)}</span>
                )}
              </div>
              <p className="text-[10px] text-navy-400 mt-1">{r.notes}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── News Ticker ──────────────────────────────────────────────────────────────
export function NewsTicker({ snapshot }) {
  // Prefer simulation news (includes GOLDEN STAR 1 + classroom disclaimer)
  const source = snapshot?.newsTicker ?? MOCK_NEWS
  const items = [...source, ...source]
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center">
        <div className="flex items-center gap-1.5 px-3 py-2 bg-navy-900 border-r border-navy-600 shrink-0">
          <svg className="w-3.5 h-3.5 text-accent-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12l9-9 9 9M5 10v10h14V10" />
          </svg>
          <span className="text-[11px] font-semibold text-navy-50 tracking-wider whitespace-nowrap">WORLD SHIPPING NEWS</span>
        </div>
        <div className="flex-1 overflow-hidden py-2">
          <div className="ticker-track flex gap-8 whitespace-nowrap">
            {items.map((n, i) => (
              <span key={i} className="text-[11px] text-navy-200 font-mono">
                <span className="text-accent-500 mr-1.5">●</span>{n}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
