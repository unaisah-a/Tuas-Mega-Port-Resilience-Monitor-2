import React, { useState } from 'react'

const CONF_STYLES = {
  High: { bg: 'bg-green-500/15', text: 'text-green-400', ring: 'ring-green-500/40', dot: 'bg-green-400' },
  Medium: { bg: 'bg-accent-500/15', text: 'text-accent-500', ring: 'ring-accent-500/40', dot: 'bg-accent-500' },
  Low: { bg: 'bg-red-500/15', text: 'text-red-400', ring: 'ring-red-500/40', dot: 'bg-red-400' }
}

function TradeoffRow({ label, value, good, suffix, prefix }) {
  const positive = typeof value === 'number' && value > 0
  const neutral = value === 0 || value === 'N/A' || value === 'Unknown' || value === 'Stable'
  const color = neutral ? 'text-navy-100' : good === 'low' ? (positive ? 'text-red-400' : 'text-green-400') : (positive ? 'text-green-400' : 'text-red-400')
  const sign = typeof value === 'number' && value > 0 ? '+' : ''
  const display = typeof value === 'number' ? `${prefix || ''}${sign}${Math.abs(value).toLocaleString()}` : value
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-navy-600/40 last:border-0">
      <span className="text-xs text-navy-200">{label}</span>
      <span className={`text-sm font-mono font-medium ${color}`}>
        {display}{suffix}
      </span>
    </div>
  )
}

export default function DecisionInterface({ recommendation, onLog, compact = false }) {
  const [selectedAction, setSelectedAction] = useState(null)
  const [challenging, setChallenging] = useState(false)
  const [challengeText, setChallengeText] = useState('')
  const [logged, setLogged] = useState(false)

  if (!recommendation) {
    return (
      <div className="card p-4 text-sm text-navy-200">
        No active recommendation. Select a vessel or run a scenario to generate a recommendation.
      </div>
    )
  }

  const conf = CONF_STYLES[recommendation.confidence] || CONF_STYLES.Medium
  const t = recommendation.tradeoffs || {}
  const action = selectedAction || recommendation.action

  const handleAccept = () => {
    setSelectedAction(recommendation.action)
    setChallenging(false)
  }
  const handleChallenge = () => {
    setChallenging(true)
    setSelectedAction(null)
  }
  const handleSubmitChallenge = () => {
    setSelectedAction('Challenge: ' + (challengeText.slice(0, 60) || 'operator override'))
    setChallenging(false)
  }
  const handleLog = () => {
    const entry = {
      id: `DEC-${Date.now()}`,
      vessel: recommendation.vesselName,
      recommendation: recommendation.action,
      selectedAction: action,
      confidence: recommendation.confidence,
      humanValidation: recommendation.humanValidation,
      challenge: challengeText || null,
      cargo: recommendation.cargo,
      timestamp: new Date().toISOString()
    }
    onLog?.(entry)
    setLogged(true)
    setTimeout(() => setLogged(false), 2200)
  }

  return (
    <div className={`card slide-up ${recommendation.humanValidation ? 'ring-2 ring-red-500/50' : ''}`}>
      <div className="card-header">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-accent-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
          <h3 className="text-sm font-semibold tracking-wide text-navy-50">DECISION INTERFACE</h3>
        </div>
        <span className={`chip ${conf.bg} ${conf.text} ring-1 ${conf.ring}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} /> {recommendation.confidence}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Recommendation */}
        <div>
          <div className="text-[11px] uppercase tracking-wider text-navy-300 mb-1">Recommendation</div>
          <div className="text-sm text-navy-50 font-medium">{recommendation.action}</div>
          <p className="text-xs text-navy-200 mt-1.5 leading-relaxed">{recommendation.rationale}</p>
        </div>

        {/* Human validation banner */}
        {recommendation.humanValidation && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/40 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 text-red-400 blink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
            <span className="text-xs font-semibold text-red-300">HUMAN VALIDATION REQUIRED</span>
          </div>
        )}

        {/* Selected action */}
        <div className="bg-navy-900/60 rounded-lg px-3 py-2 border border-navy-600/40">
          <div className="text-[11px] uppercase tracking-wider text-navy-300 mb-0.5">Selected Action</div>
          <div className="text-sm font-mono text-accent-500">{action}</div>
        </div>

        {/* Trade-offs */}
        <div>
          <div className="text-[11px] uppercase tracking-wider text-navy-300 mb-1">Trade-offs</div>
          <div className="bg-navy-900/40 rounded-lg px-3 py-1">
            <TradeoffRow label="Transit Delay" value={t.delay} good="low" suffix="h" />
            <TradeoffRow label="Cost Impact" value={t.cost} good="low" prefix="$" />
            <TradeoffRow label="CO2 Impact" value={t.co2} good="low" suffix="kg" />
            <TradeoffRow label="Cold-chain Safety" value={t.coldChain} />
            <TradeoffRow label="Operational Risk" value={t.opsRisk} />
          </div>
          {t.note && <p className="text-[11px] text-navy-300 mt-1.5 italic">{t.note}</p>}
        </div>

        {/* Controls */}
        {!compact && (
          <div className="space-y-2">
            {challenging ? (
              <div className="space-y-2 slide-up">
                <textarea
                  value={challengeText}
                  onChange={e => setChallengeText(e.target.value)}
                  placeholder="State your challenge / override reason..."
                  rows={2}
                  className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm text-navy-50 placeholder-navy-400 focus:outline-none focus:ring-1 focus:ring-accent-500"
                />
                <div className="flex gap-2">
                  <button onClick={handleSubmitChallenge} className="btn-primary flex-1">Submit Challenge</button>
                  <button onClick={() => setChallenging(false)} className="btn-ghost">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <button onClick={handleAccept} className="btn-primary">Accept</button>
                <button onClick={handleChallenge} className="btn-outline">Challenge</button>
                <button onClick={handleLog} className="btn-ghost">
                  {logged ? 'Logged ✓' : 'Log Decision'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
