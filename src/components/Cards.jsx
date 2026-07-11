import React from 'react'
import { WEATHER, PORT, LEGEND, BERTHS, SHIPMENTS, ROUTES, NEWS_TICKER } from '../data/mockData.js'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from 'recharts'

const RISK_STYLE = {
  HIGH: 'bg-red-500/15 text-red-400 border-red-500/40',
  MEDIUM: 'bg-accent-500/15 text-accent-500 border-accent-500/40',
  LOW: 'bg-green-500/15 text-green-400 border-green-500/40'
}

export function WeatherCard() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-sea-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" /></svg>
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

export function PortSummaryCard() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-accent-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21V8l9-5 9 5v13M3 21h18M9 21v-6h6v6" /></svg>
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

export function LegendCard() {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-sm font-semibold tracking-wide text-navy-50">LEGEND</h3>
      </div>
      <div className="p-3 space-y-1.5">
        {LEGEND.map(l => (
          <div key={l.label} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: l.color }} />
            <span className="text-xs text-navy-200">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function BerthOccupancyWidget() {
  const data = BERTHS.map(b => ({ name: b.id, occupancy: b.occupancy, status: b.status }))
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-sea-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="6" width="18" height="12" rx="1" /><path d="M3 12h18" /></svg>
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

export function ShipmentRiskBoard({ onSelectVessel }) {
  const sorted = [...SHIPMENTS].sort((a, b) => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
    return order[a.priority] - order[b.priority]
  })
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-accent-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7L9 18l-5-5" /></svg>
          <h3 className="text-sm font-semibold tracking-wide text-navy-50">SHIPMENT RISK BOARD</h3>
        </div>
        <span className="text-[11px] text-navy-300">{sorted.length} active</span>
      </div>
      <div className="p-2 space-y-1.5 max-h-64 overflow-y-auto">
        {sorted.map(s => (
          <button
            key={s.id}
            onClick={() => onSelectVessel?.(s.vessel.replace(/ /g, '_'))}
            className="w-full text-left bg-navy-900/40 hover:bg-navy-700/50 border border-navy-600/40 rounded-lg px-3 py-2 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-navy-50">{s.id}</span>
              <span className={`chip border ${RISK_STYLE[s.priority === 'CRITICAL' ? 'HIGH' : s.priority === 'HIGH' ? 'MEDIUM' : 'LOW']}`}>{s.priority}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[11px] text-navy-200 truncate">{s.vessel} — {s.cargo}</span>
              {s.coldChain && <span className="text-sea-400 text-[10px] font-medium">COLD-CHAIN</span>}
            </div>
            <div className="flex items-center justify-between mt-1 text-[10px] text-navy-300">
              <span>ETA {s.etaHours}h</span>
              <span>{s.inventoryRisk}</span>
              {s.escalation !== 'None' && <span className="text-accent-500">{s.escalation}</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export function RouteRiskSummary() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-sea-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
          <h3 className="text-sm font-semibold tracking-wide text-navy-50">ROUTE RISK SUMMARY</h3>
        </div>
      </div>
      <div className="p-3 space-y-2">
        {ROUTES.map(r => (
          <div key={r.id} className="bg-navy-900/40 rounded-lg px-3 py-2 border border-navy-600/30">
            <div className="flex items-center justify-between">
              <span className="text-xs text-navy-50 font-medium">{r.name}</span>
              <span className={`chip border ${RISK_STYLE[r.riskLevel]}`}>{r.riskLevel}</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[10px] text-navy-300">
              <span>Congestion {r.congestionPct}%</span>
              <span>Delay +{r.delayHours}h</span>
            </div>
            <p className="text-[10px] text-navy-400 mt-1">{r.notes}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function NewsTicker() {
  const items = [...NEWS_TICKER, ...NEWS_TICKER]
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center">
        <div className="flex items-center gap-1.5 px-3 py-2 bg-navy-900 border-r border-navy-600 shrink-0">
          <svg className="w-3.5 h-3.5 text-accent-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12l9-9 9 9M5 10v10h14V10" /></svg>
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
