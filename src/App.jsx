import React, { useState, useEffect, useCallback } from 'react'
import Header from './components/Header.jsx'
import ChatAdvisor from './components/ChatAdvisor.jsx'
import CommandMap from './components/CommandMap.jsx'
import DecisionInterface from './components/DecisionInterface.jsx'
import { WeatherCard, PortSummaryCard, LegendCard, BerthOccupancyWidget, ShipmentRiskBoard, RouteRiskSummary, NewsTicker } from './components/Cards.jsx'
import { buildRecommendation, buildScenarioRecommendation, SCENARIOS } from './engine/decisionEngine.js'
import {
  getSnapshot,
  forceStorm, clearStorm,
  forceCongestion, clearCongestion,
  isStormForced, isCongestionForced
} from './data/simulation.js'

const STORAGE_KEY = 'tmprm_decision_history'

export default function App() {
  const [selectedVesselId, setSelectedVesselId] = useState('SL_TRADER')
  const [recommendation, setRecommendation] = useState(null)
  const [activeScenario, setActiveScenario] = useState(null)
  const [history, setHistory] = useState([])
  const [snapshot, setSnapshot] = useState(() => getSnapshot())
  const [stormActive, setStormActive] = useState(false)
  const [congestionActive, setCongestionActive] = useState(false)

  // Refresh snapshot (called after forcing storm/congestion)
  const refreshSnapshot = useCallback(() => {
    setSnapshot(getSnapshot())
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setHistory(JSON.parse(stored))
    } catch {}
    setRecommendation(buildRecommendation('SL_TRADER'))
  }, [])

  const persistHistory = (entries) => {
    setHistory(entries)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)) } catch {}
  }

  const handleLog = (entry) => {
    persistHistory([entry, ...history].slice(0, 50))
  }

  const handleRecommendation = (rec, scenarioId) => {
    setRecommendation(rec)
    if (scenarioId) {
      setActiveScenario(scenarioId)
      const sc = SCENARIOS.find(s => s.id === scenarioId)
      if (sc) setSelectedVesselId(sc.vesselId)
    }
  }

  const handleSelectVessel = (vesselId) => {
    setSelectedVesselId(vesselId)
    setActiveScenario(null)
    setRecommendation(buildRecommendation(vesselId))
  }

  const runScenario = (scenarioId) => {
    const sc = SCENARIOS.find(s => s.id === scenarioId)
    if (!sc) return
    setActiveScenario(scenarioId)
    setSelectedVesselId(sc.vesselId)
    setRecommendation(buildScenarioRecommendation(scenarioId))
  }

  const clearHistory = () => {
    if (confirm('Clear all logged decisions?')) persistHistory([])
  }

  // Storm toggle — wired for Stage 2+ use
  const toggleStorm = () => {
    if (stormActive) { clearStorm(); setStormActive(false) }
    else { forceStorm(); setStormActive(true) }
    refreshSnapshot()
  }

  // Congestion toggle — wired for Stage 2+ use
  const toggleCongestion = () => {
    if (congestionActive) { clearCongestion(); setCongestionActive(false) }
    else { forceCongestion(); setCongestionActive(true) }
    refreshSnapshot()
  }

  return (
    <div className="min-h-screen flex flex-col bg-navy-950">
      <Header decisionCount={history.length} lastUpdated={snapshot.generatedAt} />

      {/* Scenario + simulation control bar */}
      <div className="bg-navy-800/60 border-b border-navy-600/40 px-4 py-2 flex items-center gap-2 overflow-x-auto">
        <span className="text-[11px] text-navy-300 font-semibold tracking-wider shrink-0">SCENARIOS:</span>
        {SCENARIOS.map(s => (
          <button
            key={s.id}
            onClick={() => runScenario(s.id)}
            className={`text-[11px] px-2.5 py-1 rounded-md border transition shrink-0 ${
              activeScenario === s.id
                ? 'bg-accent-500/20 border-accent-500/50 text-accent-500'
                : 'bg-navy-700/40 border-navy-600/40 text-navy-200 hover:bg-navy-600/50'
            }`}
            title={s.summary}
          >
            {s.id} · {s.title}
          </button>
        ))}

        <span className="ml-auto shrink-0 text-[11px] text-navy-500 font-semibold tracking-wider">SIM CONTROLS:</span>

        <button
          onClick={toggleStorm}
          className={`text-[11px] px-2.5 py-1 rounded-md border transition shrink-0 ${
            stormActive
              ? 'bg-red-500/20 border-red-500/50 text-red-400'
              : 'bg-navy-700/40 border-navy-600/40 text-navy-300 hover:bg-navy-600/50'
          }`}
          title="Toggle forced storm on Malacca Strait"
        >
          {stormActive ? 'Clear Storm' : 'Force Storm'}
        </button>

        <button
          onClick={toggleCongestion}
          className={`text-[11px] px-2.5 py-1 rounded-md border transition shrink-0 ${
            congestionActive
              ? 'bg-accent-500/20 border-accent-500/50 text-accent-500'
              : 'bg-navy-700/40 border-navy-600/40 text-navy-300 hover:bg-navy-600/50'
          }`}
          title="Toggle forced port congestion (92-95% berth occupancy)"
        >
          {congestionActive ? 'Clear Congestion' : 'Force Congestion'}
        </button>
      </div>

      {/* Main grid */}
      <main className="flex-1 grid grid-cols-12 gap-3 p-3" style={{ minHeight: 0 }}>
        {/* Left: Chat advisor */}
        <div className="col-span-12 lg:col-span-3 flex flex-col" style={{ minHeight: 0 }}>
          <ChatAdvisor onRecommendation={handleRecommendation} onSelectVessel={handleSelectVessel} />
        </div>

        {/* Center: Map + Decision Interface + widgets */}
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-3" style={{ minHeight: 0 }}>
          <CommandMap selectedId={selectedVesselId} onSelect={handleSelectVessel} />

          {/* Decision Interface — always visible, core differentiator */}
          <DecisionInterface recommendation={recommendation} onLog={handleLog} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <BerthOccupancyWidget snapshot={snapshot} />
            <ShipmentRiskBoard onSelectVessel={handleSelectVessel} snapshot={snapshot} />
          </div>
        </div>

        {/* Right: Status cards + decision history */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-3" style={{ minHeight: 0 }}>
          <WeatherCard snapshot={snapshot} />
          <PortSummaryCard snapshot={snapshot} />
          <RouteRiskSummary snapshot={snapshot} />
          <LegendCard />

          {/* Decision history */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-accent-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-sm font-semibold tracking-wide text-navy-50">DECISION HISTORY</h3>
              </div>
              {history.length > 0 && (
                <button onClick={clearHistory} className="text-[10px] text-navy-300 hover:text-red-400 transition">
                  Clear
                </button>
              )}
            </div>
            <div className="p-2 space-y-1.5 max-h-48 overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-[11px] text-navy-300 p-2 text-center">
                  No decisions logged. Use the Decision Interface to log.
                </p>
              ) : history.map(d => (
                <div key={d.id} className="bg-navy-900/40 border border-navy-600/30 rounded-lg px-2.5 py-1.5 slide-up">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-navy-300">{d.id}</span>
                    <span className={`text-[9px] px-1.5 rounded ${
                      d.confidence === 'High' ? 'bg-green-500/15 text-green-400'
                      : d.confidence === 'Medium' ? 'bg-accent-500/15 text-accent-500'
                      : 'bg-red-500/15 text-red-400'
                    }`}>{d.confidence}</span>
                  </div>
                  <div className="text-[11px] text-navy-100 mt-0.5">{d.vessel}</div>
                  <div className="text-[10px] text-navy-300">{d.selectedAction}</div>
                  <div className="text-[9px] text-navy-400 mt-0.5">{new Date(d.timestamp).toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom news ticker — uses simulation.js NEWS_TICKER */}
      <div className="px-3 pb-3">
        <NewsTicker snapshot={snapshot} />
      </div>

      <footer className="px-4 py-2 text-center text-[10px] text-navy-400 border-t border-navy-600/40">
        Tuas Mega Port Resilience Monitor · Digital Orchestrator Prototype · MOCK MODE — all data simulated · Supply Chain 4.0
      </footer>
    </div>
  )
}
