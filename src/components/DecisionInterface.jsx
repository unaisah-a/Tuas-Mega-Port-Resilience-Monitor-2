import React, { useState, useEffect, useRef } from 'react'

// ─── Styles ───────────────────────────────────────────────────────────────────

const CONF_STYLES = {
  High:   { bg: 'bg-green-500/15', text: 'text-green-400', ring: 'ring-green-500/40', dot: 'bg-green-400', border: 'border-green-500/30' },
  Medium: { bg: 'bg-accent-500/15', text: 'text-accent-500', ring: 'ring-accent-500/40', dot: 'bg-accent-500', border: 'border-accent-500/30' },
  Low:    { bg: 'bg-red-500/15', text: 'text-red-400', ring: 'ring-red-500/40', dot: 'bg-red-400', border: 'border-red-500/30' }
}

// ─── Tradeoff card ────────────────────────────────────────────────────────────

function TradeoffCard({ icon, label, value, good, suffix, prefix }) {
  if (value === null || value === undefined) {
    return (
      <div className="bg-navy-900/40 border border-navy-700/40 rounded-lg px-2.5 py-2 flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-[10px] uppercase tracking-wider text-navy-400">{label}</span>
        </div>
        <span className="text-xs font-mono text-navy-500">N/A</span>
      </div>
    )
  }

  const isNumeric = typeof value === 'number'
  const positive  = isNumeric && value > 0
  const isNeutral = !isNumeric || value === 0

  let color = 'text-navy-100'
  if (!isNeutral) {
    if (good === 'low')  color = positive ? 'text-red-400'   : 'text-green-400'
    if (good === 'high') color = positive ? 'text-green-400' : 'text-red-400'
  }

  // Text values get their own colouring
  if (!isNumeric) {
    if (/protected|yes|safe|stable/i.test(String(value)))    color = 'text-green-400'
    else if (/at risk|no|breach|unknown|monitor/i.test(String(value))) color = 'text-red-400'
    else if (/medium|moderate/i.test(String(value)))          color = 'text-accent-500'
    else color = 'text-navy-100'
  }

  const sign    = isNumeric && value > 0 ? '+' : ''
  const display = isNumeric
    ? `${prefix || ''}${sign}${Math.abs(value).toLocaleString()}${suffix || ''}`
    : String(value)

  return (
    <div className="bg-navy-900/40 border border-navy-700/40 rounded-lg px-2.5 py-2 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] uppercase tracking-wider text-navy-400">{label}</span>
      </div>
      <span className={`text-xs font-mono font-semibold ${color}`}>{display}</span>
    </div>
  )
}

// Icon helpers (inline SVGs stay tiny)
const Icon = ({ d, color = 'text-navy-400' }) => (
  <svg className={`w-3 h-3 shrink-0 ${color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{d}</svg>
)
const DelayIcon   = <Icon d={<path d="M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>} color="text-navy-400" />
const CostIcon    = <Icon d={<path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 0v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>} color="text-navy-400" />
const CO2Icon     = <Icon d={<path d="M3 12h18M12 3a9 9 0 010 18M6.4 6.4l11.2 11.2"/>} color="text-navy-400" />
const ColdIcon    = <Icon d={<path d="M12 2v20M2 12h20M4.2 4.2l15.6 15.6M19.8 4.2L4.2 19.8"/>} color="text-sea-400" />
const RiskIcon    = <Icon d={<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01"/>} color="text-navy-400" />

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-accent-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
          <h3 className="text-sm font-semibold tracking-wide text-navy-50">DECISION INTERFACE</h3>
        </div>
        <span className="chip bg-navy-700/60 text-navy-400 border border-navy-600/50">
          <span className="w-1.5 h-1.5 rounded-full bg-navy-500" />Awaiting input
        </span>
      </div>
      <div className="p-4 space-y-4">
        {/* Placeholder recommendation block */}
        <div className="bg-navy-900/40 rounded-xl border border-navy-700/40 px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-navy-500 mb-1">Current Recommendation</div>
          <div className="text-sm text-navy-500 italic">No decision selected</div>
        </div>
        {/* Placeholder trade-off cards */}
        <div className="grid grid-cols-5 gap-2">
          {['Delay', 'Cost', 'CO2', 'Cold-chain', 'Risk'].map(l => (
            <div key={l} className="bg-navy-900/30 border border-navy-700/30 rounded-lg px-2 py-2">
              <div className="text-[9px] uppercase tracking-wider text-navy-600">{l}</div>
              <div className="text-xs text-navy-600 font-mono mt-0.5">—</div>
            </div>
          ))}
        </div>
        {/* Disabled buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button disabled className="btn-primary opacity-30 cursor-not-allowed text-xs">Accept recommendation</button>
          <button disabled className="btn-outline opacity-30 cursor-not-allowed text-xs">Challenge recommendation</button>
          <button disabled className="btn-ghost opacity-30 cursor-not-allowed text-xs">Log decision</button>
        </div>
        <p className="text-[11px] text-navy-500 text-center">
          Select a vessel on the map, run a scenario, or use the chat advisor to generate a recommendation.
        </p>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DecisionInterface({ recommendation, onLog, compact = false }) {
  const [selectedAction, setSelectedAction] = useState(null)
  const [challenging, setChallenging]       = useState(false)
  const [challengeText, setChallengeText]   = useState('')
  const [logged, setLogged]                 = useState(false)
  const [username, setUsername]             = useState(() => {
    try { return localStorage.getItem('tmprm_username') || '' } catch { return '' }
  })
  const [showUsernameEdit, setShowUsernameEdit] = useState(false)
  const prevRecKey = useRef(null)

  // Reset when recommendation changes (keyed by action + timestamp)
  useEffect(() => {
    const key = recommendation
      ? `${recommendation.vesselId || ''}-${recommendation.action}-${recommendation.timestamp}`
      : null
    if (key !== prevRecKey.current) {
      prevRecKey.current = key
      setSelectedAction(null)
      setChallenging(false)
      setChallengeText('')
      setLogged(false)
    }
  }, [recommendation])

  const saveUsername = (name) => {
    setUsername(name)
    try { localStorage.setItem('tmprm_username', name) } catch {}
    setShowUsernameEdit(false)
  }

  if (!recommendation) return <EmptyState />

  const conf   = CONF_STYLES[recommendation.confidence] || CONF_STYLES.Medium
  const t      = recommendation.tradeoffs || {}
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
      vessel:         recommendation.vesselName || null,
      recommendation: recommendation.action,
      selectedAction: action,
      confidence:     recommendation.confidence,
      humanValidation: recommendation.humanValidation,
      challenge:      challengeText || null,
      cargo:          recommendation.cargo || null,
      user:           username || 'demo-user',
      timestamp:      new Date().toISOString()
    }
    onLog?.(entry)
    setLogged(true)
    setTimeout(() => setLogged(false), 2500)
  }

  return (
    <div className={`card slide-up ${recommendation.humanValidation ? 'ring-2 ring-red-500/40' : ''}`}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="card-header">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-accent-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
          <h3 className="text-sm font-semibold tracking-wide text-navy-50">DECISION INTERFACE</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Confidence badge */}
          <span className={`chip ${conf.bg} ${conf.text} ring-1 ${conf.ring} border ${conf.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
            {recommendation.confidence}
          </span>
          {/* Username — demo identity */}
          {!compact && (
            <button
              onClick={() => setShowUsernameEdit(v => !v)}
              className="text-[10px] text-navy-400 hover:text-navy-200 transition flex items-center gap-1"
              title="Demo user identity for decision logging"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/>
              </svg>
              {username || 'demo-user'}
            </button>
          )}
        </div>
      </div>

      {/* ── Username edit ────────────────────────────────────────────────── */}
      {showUsernameEdit && (
        <div className="border-b border-navy-600/50 bg-navy-900/60 px-4 py-2 flex items-center gap-2 slide-up">
          <span className="text-[10px] text-navy-400">Demo user identity for decision logging:</span>
          <input
            autoFocus
            type="text"
            defaultValue={username}
            maxLength={40}
            placeholder="e.g. Port-OPS-01"
            onKeyDown={e => {
              if (e.key === 'Enter') saveUsername(e.target.value)
              if (e.key === 'Escape') setShowUsernameEdit(false)
            }}
            className="flex-1 bg-navy-800 border border-navy-600/50 rounded px-2 py-1 text-[11px] text-navy-50 placeholder-navy-500 focus:outline-none focus:ring-1 focus:ring-accent-500 font-mono"
          />
          <button
            onClick={e => saveUsername(e.target.closest('div').querySelector('input').value)}
            className="text-[10px] btn-ghost py-0.5 px-2"
          >Save</button>
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* ── Current recommendation ─────────────────────────────────────── */}
        <div className="bg-navy-900/50 rounded-xl border border-navy-700/40 px-3.5 py-3">
          <div className="text-[10px] uppercase tracking-wider text-navy-400 mb-1.5">Current Recommendation</div>
          <div className="text-sm text-navy-50 font-semibold leading-snug">{recommendation.action}</div>
          {recommendation.rationale && (
            <p className="text-[11px] text-navy-300 mt-1.5 leading-relaxed">{recommendation.rationale}</p>
          )}
        </div>

        {/* ── Human validation alert ─────────────────────────────────────── */}
        {recommendation.humanValidation && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/40 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 text-red-400 blink shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
            <span className="text-xs font-bold text-red-300">HUMAN VALIDATION REQUIRED</span>
          </div>
        )}

        {/* ── Selected action ────────────────────────────────────────────── */}
        {selectedAction && (
          <div className="bg-accent-500/10 border border-accent-500/30 rounded-lg px-3.5 py-2.5 slide-up">
            <div className="text-[10px] uppercase tracking-wider text-accent-400 mb-0.5">Selected Action</div>
            <div className="text-sm font-mono text-accent-300 font-semibold">{selectedAction}</div>
          </div>
        )}

        {/* ── Trade-off cards ───────────────────────────────────────────── */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-navy-400 mb-2">Trade-offs</div>
          <div className="grid grid-cols-5 gap-1.5">
            <TradeoffCard icon={DelayIcon} label="Delay" value={t.delay} good="low" suffix="h" />
            <TradeoffCard icon={CostIcon}  label="Cost"  value={t.cost}  good="low" prefix="$" />
            <TradeoffCard icon={CO2Icon}   label="CO2"   value={t.co2}   good="low" suffix="kg" />
            <TradeoffCard icon={ColdIcon}  label="Cold-chain" value={t.coldChain} />
            <TradeoffCard icon={RiskIcon}  label="Risk"  value={t.opsRisk} />
          </div>
          {t.note && (
            <p className="text-[10px] text-navy-400 mt-1.5 italic leading-relaxed">{t.note}</p>
          )}
        </div>

        {/* ── Controls ──────────────────────────────────────────────────── */}
        {!compact && (
          <div className="space-y-2">
            {challenging ? (
              <div className="space-y-2 slide-up">
                <div className="text-[10px] text-navy-400 uppercase tracking-wider">Challenge reason / override</div>
                <textarea
                  value={challengeText}
                  onChange={e => setChallengeText(e.target.value)}
                  placeholder="State your challenge or override reason..."
                  rows={2}
                  className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm text-navy-50 placeholder-navy-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                />
                <div className="flex gap-2">
                  <button onClick={handleSubmitChallenge} className="btn-primary flex-1 text-xs">Submit Challenge</button>
                  <button onClick={() => setChallenging(false)} className="btn-ghost text-xs">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleAccept}
                  className={`btn-primary text-xs ${selectedAction === recommendation.action ? 'opacity-60' : ''}`}
                >
                  {selectedAction === recommendation.action ? 'Accepted ✓' : 'Accept recommendation'}
                </button>
                <button onClick={handleChallenge} className="btn-outline text-xs">
                  Challenge recommendation
                </button>
                <button onClick={handleLog} className={`btn-ghost text-xs ${logged ? 'text-green-400' : ''}`}>
                  {logged ? 'Logged ✓' : 'Log decision'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
