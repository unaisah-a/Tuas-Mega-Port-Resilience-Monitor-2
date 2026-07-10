// src/agent/mockBrain.js
// Deterministic MOCK advisor. No API calls. Uses getSnapshot() data only.
// Returns a structured 4-part response + a decision object for the Decision Interface.
// System prompt governs format — see systemPrompt.js.

import { getSnapshot } from '../data/simulation.js'

// ─── Response builder helpers ─────────────────────────────────────────────────

function makeDecision({ recommendation, selectedAction, confidence, humanValidationRequired, tradeoffs, dataUsed }) {
  return {
    recommendation,
    selectedAction,
    confidence,
    humanValidationRequired: humanValidationRequired || confidence === 'Low',
    tradeoffs: {
      delay: tradeoffs.delay ?? null,
      cost: tradeoffs.cost ?? null,
      co2: tradeoffs.co2 ?? null,
      coldChainSafe: tradeoffs.coldChainSafe ?? null,
      risk: tradeoffs.risk ?? null
    },
    dataUsed: dataUsed || []
  }
}

function makeResponse({ logistics, inventory, procurement, orchestrator, confidence, humanValidationRequired, decision }) {
  return {
    sections: { logistics, inventory, procurement, orchestrator },
    confidence,
    humanValidationRequired: humanValidationRequired || confidence === 'Low',
    decision
  }
}

// ─── Keyword matchers ─────────────────────────────────────────────────────────

const TC1_KEYS = ['tropical storm', 'storm', 'pharmaceutical', 'pharma', '48 hour', '48h', 'late', 'delay', 'cold-chain', 'cold chain', 'insulin', 'vaccine', 'biologics', 'sl trader', 'aurora']
const TC2_KEYS = ['92%', '92 percent', 'berth occupancy', 'congestion', 'minimise delay', 'minimize delay', 'berth full', 'congested', 'berth 92']
const TC3_KEYS = ['weather normal', 'weather conditions are normal', 'severe congestion', 'should i reroute', 'conflicting', 'reroute my shipment', 'conditions are normal']
const TC4_KEYS = ['red sea', 'hormuz', 'golden star', 'batam', 'spillover', 'multi-disruption', 'tanzania', 'sank']
const TC5_KEYS = ['only one vessel', 'only unload one', 'one vessel', 'pharmaceutical supplies', 'consumer electronics', 'which should be prioritised', 'which vessel', 'prioritise one', 'which to unload', 'limited berth']

function matchAny(msg, keys) {
  return keys.some(k => msg.includes(k))
}

// ─── TC1: Weather & Cold Chain Protection ─────────────────────────────────────

function tc1(snap) {
  const slTrader = snap.shipments.find(s => s.vessel === 'SL TRADER')
  const aurora = snap.shipments.find(s => s.vessel === 'AURORA PIONEER')
  const sunda = snap.routes.find(r => r.id === 'R_SUNDA')
  const air = snap.routes.find(r => r.id === 'R_AIR')
  const w = snap.weather

  const logistics = [
    `Route: Malacca Strait is exposed to storm conditions (wind ${w.windKts}kn, waves ${w.waveM}m, visibility ${w.visibilityKm}km, storm probability ${w.stormProbability}%). Condition: ${w.conditionLabel}.`,
    `SL TRADER (${slTrader?.id}) carrying Insulin & Vaccines — ETA ${slTrader?.etaHours}h. A 48h delay would push ETA to ~54h from now, compressing the safety-stock window critically.`,
    `AURORA PIONEER (${aurora?.id}) carrying Biologics — ETA ${aurora?.etaHours}h, also on Malacca route. Both are 2-8°C cold-chain shipments.`,
    `Alternate route: Sunda Strait adds ${sunda?.deltaDays} days (cost index ×${(sunda?.costIndex/100).toFixed(2)}, CO2 ×${(sunda?.co2Index/100).toFixed(2)}). Safer sea state.`,
    `Partial air freight available: −${Math.abs(air?.deltaDays)} days advantage vs delayed sea, but cost index ×${(air?.costIndex/100).toFixed(1)} and CO2 index ×${(air?.co2Index/100).toFixed(1)} — emergency use only.`
  ]

  const inventory = [
    `SHP-2041 (SL TRADER): Insulin & Vaccines at 2-8°C — inventory risk: ${slTrader?.inventoryRisk}. A 48h delay approaches the 18h safety-stock floor. Stockout is imminent if arrival is not prioritised.`,
    `SHP-2042 (AURORA PIONEER): Biologics at 2-8°C — inventory risk: ${aurora?.inventoryRisk}. 36h safety window provides moderate buffer but must be actively monitored.`,
    `Cold-chain integrity is non-negotiable. Reefer power and temperature must be verified every 4h during storm transit. Any temperature excursion above 8°C invalidates the pharmaceutical batch.`,
    `Safety stock release should be activated immediately with ${slTrader?.customer} and ${aurora?.customer} to bridge the expected delay window.`
  ]

  const procurement = [
    `Supplier notification required: ${slTrader?.customer} (SHP-2041) — Director already escalated per snapshot. Reconfirm shipment status and release any safety stock held at distribution centres.`,
    `${aurora?.customer} (SHP-2042) — notify of potential 48h delay risk. Assess whether regional buffer inventory in Southeast Asia can be mobilised.`,
    `If delay exceeds 36h, initiate partial air freight for the most time-critical units (e.g. insulin) — cost is secondary to pharmaceutical continuity.`,
    `No cargo substitution is feasible for pharmaceutical biologics. Customer escalation to National Pharmacy Board standby is recommended.`
  ]

  const orchestrator = [
    `Immediate action: Contact SL TRADER captain to confirm reefer temperature status and storm avoidance routing. Request 4-hourly cold-chain telemetry.`,
    `Evaluate Sunda Strait reroute for AURORA PIONEER — its 18h ETA head start vs SL TRADER makes it a safer candidate for early diversion.`,
    `If SL TRADER\'s storm delay exceeds 24h, activate partial air freight for insulin units from SHP-2041 (cost index ×${(air?.costIndex/100).toFixed(1)} — acceptable given stockout risk).`,
    `Reserve Berth 3 at Tuas Mega Port for SL TRADER and trigger cold-storage team standby.`,
    `Trade-off: Sunda adds ${sunda?.deltaDays} days and +${((sunda?.costIndex - 100)/100 * 100).toFixed(0)}% cost, but eliminates storm exposure. Air freight adds −${Math.abs(air?.deltaDays)} days but at ${(air?.costIndex/100).toFixed(1)}× cost and ${(air?.co2Index/100).toFixed(1)}× CO2. Cold-chain integrity outranks cost in all cases.`
  ]

  const decision = makeDecision({
    recommendation: 'Protect cold-chain pharmaceutical shipments from storm delay; activate Sunda reroute evaluation and partial air freight if delay threatens 2-8°C integrity.',
    selectedAction: 'Protect cold-chain shipment; consider Sunda + partial air freight if required.',
    confidence: 'High',
    humanValidationRequired: false,
    tradeoffs: {
      delay: +2,
      cost: +38000,
      co2: +41000,
      coldChainSafe: true,
      risk: 'Medium'
    },
    dataUsed: [
      `SHP-2041 (SL TRADER) — Insulin & Vaccines, 2-8°C, ETA ${slTrader?.etaHours}h, ${slTrader?.inventoryRisk}`,
      `SHP-2042 (AURORA PIONEER) — Biologics, 2-8°C, ETA ${aurora?.etaHours}h`,
      `Weather: ${w.conditionLabel}, ${w.windKts}kn, ${w.waveM}m waves`,
      `Sunda route: +${sunda?.deltaDays} days, cost ×${(sunda?.costIndex/100).toFixed(2)}`,
      `Air freight: −${Math.abs(air?.deltaDays)} days, cost ×${(air?.costIndex/100).toFixed(1)}`
    ]
  })

  return makeResponse({
    logistics, inventory, procurement, orchestrator,
    confidence: 'High',
    humanValidationRequired: false,
    decision
  })
}

// ─── TC2: Berth Congestion ────────────────────────────────────────────────────

function tc2(snap) {
  const ps = snap.portSummary
  const coldChainShips = snap.shipments.filter(s => s.isColdChain && s.temperatureRange === '2-8 C')
  const criticalShips = snap.shipments.filter(s => s.priority === 'Critical' || s.priority === 'CRITICAL')
  const lowPriority = snap.shipments.filter(s => s.priority === 'Routine' && !s.isColdChain)
  const sunda = snap.routes.find(r => r.id === 'R_SUNDA')

  const logistics = [
    `Berth occupancy at 92-95% constitutes a severe congestion event at Tuas Mega Port. At this threshold, average waiting time rises to ~${ps.avgDelayHours}h and unloading queues extend into the anchorage.`,
    `With ${ps.shipsInPort} ships in port and ${ps.highRiskShipments} high-risk shipments, berth contention directly degrades service reliability for all inbound vessels.`,
    `Dwell time increases compound transshipment impact: feeder vessels downstream will miss connections if primary berths are unavailable for 8+ hours.`,
    `Vessels eligible for rescheduling: ${lowPriority.map(s => `${s.vessel} (${s.id})`).join(', ')} — routine cargo with buffer inventory. Rerouting via Sunda (+${sunda?.deltaDays} days) frees capacity without cold-chain risk.`
  ]

  const inventory = [
    `Critical priority: ${coldChainShips.map(s => `${s.id} (${s.vessel}) — ${s.cargo}, ${s.temperatureRange}, risk: ${s.inventoryRisk}`).join('; ')}.`,
    `These 2-8°C pharmaceutical shipments must be unloaded first. Extended berth wait threatens temperature integrity if reefer power cycles are disrupted during congestion.`,
    `Non-critical cargo (routine shipments) has buffer inventory of 9-30 days — deferral of 12-24h has minimal service-level impact.`,
    `Recommend activating safety stock release for ${coldChainShips.map(s => s.customer).join(', ')} to absorb any residual delay.`
  ]

  const procurement = [
    `Supplier impact: prioritising cold-chain and critical cargo unloading requires formally notifying carriers of lower-priority vessels of 12-24h deferral.`,
    `Cost exposure: berth reassignment and queue re-prioritisation may incur demurrage charges for deferred vessels (~SGD 15,000-40,000 per vessel per day). Weighed against cold-chain breach cost, this is justified.`,
    `Customer escalation: ${coldChainShips.map(s => s.customer).join(', ')} should be updated immediately that their cargo will be unloaded first.`,
    `No expedite orders needed if deferral stays under 24h. If congestion persists beyond 24h, consider Sunda reroute for the next inbound routine-cargo vessel.`
  ]

  const orchestrator = [
    `Implement priority berthing protocol: (1) pharmaceutical 2-8°C cold-chain cargo first, (2) critical-priority shipments, (3) high-priority non-cold-chain, (4) routine cargo.`,
    `Reschedule ${lowPriority.slice(0,2).map(s => s.vessel).join(' and ')} arrivals by 12-18h to reduce queue depth and restore berth cycling time.`,
    `Coordinate with port operations to expedite unloading of ${coldChainShips[0]?.vessel} at Berth 3 — activate cold-storage receiving team immediately.`,
    `Trade-off: deferring routine cargo by 12-24h costs demurrage but avoids pharmaceutical cold-chain breach risk (SGD ${coldChainShips.map(s=>'$'+s.valueSGD?.toLocaleString()).join(' + ')} at stake). Correct trade-off.`
  ]

  const decision = makeDecision({
    recommendation: 'Apply priority berthing protocol: cold-chain pharma first, then critical cargo. Reschedule routine-cargo arrivals by 12-18h to reduce congestion.',
    selectedAction: 'Prioritise critical cargo and reschedule lower-priority arrivals.',
    confidence: 'High',
    humanValidationRequired: false,
    tradeoffs: {
      delay: +12,
      cost: +28000,
      co2: -3000,
      coldChainSafe: true,
      risk: 'Medium'
    },
    dataUsed: [
      `Port occupancy: ${ps.berthOccupancy}%, avg delay ${ps.avgDelayHours}h, ${ps.shipsInPort} ships`,
      ...coldChainShips.map(s => `${s.id} (${s.vessel}) — ${s.cargo}, ${s.temperatureRange}`),
      ...lowPriority.slice(0,2).map(s => `${s.id} (${s.vessel}) — Routine, buffer stock available`)
    ]
  })

  return makeResponse({
    logistics, inventory, procurement, orchestrator,
    confidence: 'High',
    humanValidationRequired: false,
    decision
  })
}

// ─── TC3: Information Validation (Conflicting Signals) ───────────────────────

function tc3(snap) {
  const w = snap.weather
  const ps = snap.portSummary
  const sunda = snap.routes.find(r => r.id === 'R_SUNDA')

  const logistics = [
    `Conflicting signals detected: weather snapshot shows ${w.conditionLabel} (${w.riskLevel} risk, ${w.windKts}kn winds) — not the severe storm condition that would mandate rerouting — yet Tuas reports severe congestion.`,
    `Port occupancy at ${ps.berthOccupancy}% is high but congestion alone does not justify a full Sunda reroute (adds ${sunda?.deltaDays} days and cost ×${(sunda?.costIndex/100).toFixed(2)}).`,
    `Uncertainty exists: "severe congestion" at port level may reflect a local incident, berth maintenance extension (Berth 7 maintenance ongoing), or transient vessel clustering — none of which are confirmed in current snapshot.`,
    `Rerouting without confirming the root cause of congestion risks adding ${sunda?.deltaDays} days of transit delay unnecessarily.`
  ]

  const inventory = [
    `Without a confirmed storm threat, cold-chain shipments (SHP-2041, SHP-2042 — 2-8°C) should not be rerouted reactively. Temperature excursion risk from extended alternate-route transit may exceed congestion delay risk.`,
    `Inventory buffer status: SHP-2041 (SL TRADER) has ${snap.shipments.find(s=>s.id==='SHP-2041')?.inventoryRisk} — any additional delay is high-stakes.`,
    `Safety stock should be put on standby but not yet released — premature release wastes buffer stock and signals false alarm to customers.`
  ]

  const procurement = [
    `Do not issue supplier or customer notifications until root cause of congestion is confirmed. Premature escalation creates unnecessary alarm.`,
    `Prepare Sunda Strait reroute documentation and carrier pre-authorisation as a contingency — but do not execute without validation.`,
    `Cost of unnecessary reroute: SGD ~38,000-52,000 per vessel in additional freight + customer dwell-time charges. Not justified on conflicting signals alone.`
  ]

  const orchestrator = [
    `Step 1: Validate berth slot — contact Tuas Mega Port Operations to confirm whether the reported congestion affects the reserved berth for inbound critical vessels.`,
    `Step 2: Adjust ETA communication — request inbound vessels to reduce speed slightly to allow a 2-4h buffer while validation occurs. This avoids anchorage queuing without committing to reroute.`,
    `Step 3: Prepare Sunda Strait as contingency — if berth validation confirms a 12h+ wait, issue contingency reroute order.`,
    `Step 4: If uncertainty persists, escalate to port operations supervisor. Data conflict means human judgement is required before any irrevocable reroute decision.`,
    `Trade-off: Acting on conflicting data risks both over-reacting (unnecessary cost and delay) and under-reacting (congestion worsens). Conservative hold with validation is the correct call.`
  ]

  const decision = makeDecision({
    recommendation: 'Conflicting signals: weather nominal but congestion severe. Validate berth slot before any reroute decision. Prepare Sunda as contingency only.',
    selectedAction: 'Validate berth slot; adjust ETA; prepare Sunda contingency — do not reroute yet.',
    confidence: 'Medium',
    humanValidationRequired: true,
    tradeoffs: {
      delay: +3,
      cost: +4000,
      co2: 0,
      coldChainSafe: true,
      risk: 'Medium'
    },
    dataUsed: [
      `Weather: ${w.conditionLabel}, ${w.windKts}kn, ${w.riskLevel} risk`,
      `Port occupancy: ${ps.berthOccupancy}%, avg delay ${ps.avgDelayHours}h`,
      `Sunda contingency: +${sunda?.deltaDays} days, cost ×${(sunda?.costIndex/100).toFixed(2)}`,
      'Berth 7 maintenance ongoing — capacity reduced'
    ]
  })

  return makeResponse({
    logistics, inventory, procurement, orchestrator,
    confidence: 'Medium',
    humanValidationRequired: true,
    decision
  })
}

// ─── TC4: Multi-Disruption (Red Sea / Hormuz / GOLDEN STAR 1) ─────────────────

function tc4(snap) {
  const w = snap.weather
  const ps = snap.portSummary
  const malacca = snap.routes.find(r => r.id === 'R_MALACCA')
  const sunda = snap.routes.find(r => r.id === 'R_SUNDA')
  const coldChain = snap.shipments.filter(s => s.isColdChain && s.temperatureRange === '2-8 C')
  const highValue = snap.shipments.filter(s => s.valueSGD >= 1000000)

  // Cite GOLDEN STAR 1 only if present in news ticker
  const goldenStarNews = snap.newsTicker.find(n => n.includes('GOLDEN STAR'))

  const logistics = [
    `Multi-disruption context: (1) Red Sea and Hormuz spillover is increasing vessel volume on the Malacca Strait route — Malacca route currently rated ${malacca?.riskLevel} risk. (2) Malaysian ports report congestion is manageable — current Tuas occupancy ${ps.berthOccupancy}% is high but not yet critical.`,
    goldenStarNews
      ? `(3) GOLDEN STAR 1 incident: ${goldenStarNews} — grounding near Batam creates a navigational advisory zone that may slow southbound Malacca approaches. All crew reported rescued.`
      : `(3) No confirmed major incident in current snapshot affecting Malacca passage.`,
    `Combined effect: above-normal traffic pressure + potential slow-transit zone near Batam = elevated but manageable disruption. Avoid overreaction — congestion is "manageable" per snapshot.`,
    `Sunda Strait (${sunda?.riskLevel} risk, +${sunda?.deltaDays} days) remains available as a pressure-relief valve if Malacca approach times worsen.`
  ]

  const inventory = [
    `Prioritise cold-chain pharmaceutical shipments: ${coldChain.map(s=>`${s.id} (${s.vessel}) — ${s.cargo}, ${s.temperatureRange}, ETA ${s.etaHours}h, ${s.inventoryRisk}`).join('; ')}.`,
    `High-value shipments at risk: ${highValue.map(s=>`${s.id} ${s.vessel} SGD ${s.valueSGD?.toLocaleString()}`).join(', ')}.`,
    `Maintain safety stock monitoring for pharmaceutical clients. Do not release safety stock prematurely — congestion is currently manageable.`,
    `If Malacca delay exceeds 18h for SHP-2041 (SL TRADER), activate safety stock and escalate to BioHealth Pharma Director.`
  ]

  const procurement = [
    `Issue precautionary supplier notifications for cold-chain clients (BioHealth Pharma, MedGlobal AG) — advise of elevated transit risk without triggering full escalation.`,
    `Prepare hold decisions for routine low-priority cargo to preserve berth priority for high-value and cold-chain vessels.`,
    `Monitor bunker and freight rate impacts from Red Sea diversion pressure — increased demand on Malacca route will push spot rates.`,
    `No emergency procurement actions yet — situation is elevated but manageable. Escalate only if Malacca delay confirmed >12h.`
  ]

  const orchestrator = [
    `Adopt a cautious watch posture, not emergency response. Monitor Malacca approach delays every 2h.`,
    `Activate contingency routing pre-authorisation for Sunda Strait — ready to execute within 2h if Malacca approach times worsen materially.`,
    `Prioritise berth allocation for cold-chain and high-value cargo: ${coldChain.map(s=>s.vessel).join(', ')}.`,
    `Do not reroute routine cargo yet — adding ${sunda?.deltaDays} days detour cost (×${(sunda?.costIndex/100).toFixed(2)}) is not justified on current intelligence.`,
    `Trade-off: Over-reacting wastes cost and delays routine cargo. Under-reacting risks missing a deterioration window for cold-chain integrity. Cautious contingency readiness is the correct middle path.`
  ]

  const decision = makeDecision({
    recommendation: 'Multi-disruption watch posture: monitor Malacca every 2h, pre-authorise Sunda contingency, prioritise cold-chain berth access. Do not reroute yet.',
    selectedAction: 'Activate contingency watch; prepare Sunda reroute authorisation; prioritise cold-chain cargo.',
    confidence: 'Medium',
    humanValidationRequired: false,
    tradeoffs: {
      delay: +2,
      cost: +8000,
      co2: 0,
      coldChainSafe: true,
      risk: 'Medium'
    },
    dataUsed: [
      `Weather: ${w.conditionLabel}, ${w.windKts}kn`,
      `Port occupancy: ${ps.berthOccupancy}%, ${ps.shipsInPort} ships`,
      `Malacca route: ${malacca?.riskLevel} risk`,
      `Sunda contingency: +${sunda?.deltaDays} days, ×${(sunda?.costIndex/100).toFixed(2)} cost`,
      ...(goldenStarNews ? ['GOLDEN STAR 1 incident — Batam navigational advisory'] : []),
      ...coldChain.map(s => `${s.id} (${s.vessel}) — ${s.temperatureRange}, ETA ${s.etaHours}h`)
    ]
  })

  return makeResponse({
    logistics, inventory, procurement, orchestrator,
    confidence: 'Medium',
    humanValidationRequired: false,
    decision
  })
}

// ─── TC5: Emergency Shipment Prioritisation ───────────────────────────────────

function tc5(snap) {
  const pharmaShip = snap.shipments.find(s => s.isColdChain && s.temperatureRange === '2-8 C')
  const electronicsShip = snap.shipments.find(s => s.cargo?.toLowerCase().includes('electronic'))

  const logistics = [
    `Scenario: single berth available, two candidates — ${pharmaShip?.vessel} (${pharmaShip?.id}) carrying ${pharmaShip?.cargo} at ${pharmaShip?.temperatureRange}, and ${electronicsShip?.vessel} (${electronicsShip?.id}) carrying ${electronicsShip?.cargo}.`,
    `Pharmaceutical vessel ETA: ${pharmaShip?.etaHours}h. Electronics vessel ETA: ${electronicsShip?.etaHours}h. Both inbound.`,
    `Malacca berth occupancy: ${snap.portSummary.berthOccupancy}% — no immediate second berth available. One must wait.`,
    `Maritime and operational priority is unambiguous: cold-chain pharmaceutical cargo has a hard time constraint (2-8°C integrity window). Consumer electronics have no temperature constraint and a 14-day inventory buffer.`
  ]

  const inventory = [
    `SHP-2041 / ${pharmaShip?.vessel}: ${pharmaShip?.cargo} at ${pharmaShip?.temperatureRange} — inventory risk: ${pharmaShip?.inventoryRisk}. Stockout in 18h if unloading is deferred. This is a public health supply-chain priority.`,
    `${electronicsShip?.id} / ${electronicsShip?.vessel}: Consumer Electronics — inventory risk: ${electronicsShip?.inventoryRisk || 'Buffer 14 days'}. A 6-12h deferral has zero service-level impact.`,
    `Cold-chain integrity: every hour of delay for the pharmaceutical shipment increases the risk of temperature excursion. Reefer power during anchorage must be confirmed.`,
    `The inventory calculus is clear: one has a 18h stockout clock, the other has a 14-day buffer. No further analysis required.`
  ]

  const procurement = [
    `Notify ${pharmaShip?.customer || 'BioHealth Pharma'}: pharmaceutical vessel will be berthed first. No customer escalation — this is the correct outcome they are awaiting.`,
    `Notify ${electronicsShip?.customer || 'RetailMart SG'}: consumer electronics vessel will be rescheduled to next available berth (estimated 6-12h deferral). Advise that buffer stock is sufficient to cover.`,
    `Demurrage cost for electronics vessel anchorage wait (~SGD 8,000-12,000) is justified — this is lower than the value at risk for the pharmaceutical batch (SGD ${pharmaShip?.valueSGD?.toLocaleString()}).`,
    `No expedite orders required. This is a prioritisation decision, not a procurement intervention.`
  ]

  const orchestrator = [
    `Decision: unload ${pharmaShip?.vessel} (${pharmaShip?.id}) at Berth 3 immediately. Cold-chain pharmaceutical cargo always outranks cost and non-critical cargo in berth allocation.`,
    `Direct ${electronicsShip?.vessel} to anchorage with ETA update for Berth 3 in ~8h. Maintain vessel reefer power.`,
    `Activate cold-storage receiving team for pharmaceutical unloading. Ensure customs fast-track for SHP-2041 (pharmaceutical priority clearance).`,
    `Trade-off summary: deferring electronics by 8h costs SGD ~10,000 in anchorage fees and has zero inventory impact. Pharmaceutical delay would risk SGD ${pharmaShip?.valueSGD?.toLocaleString()} in cargo value and a public health stockout. There is no trade-off — pharmaceutical berthing is unambiguously correct.`
  ]

  const decision = makeDecision({
    recommendation: `Unload ${pharmaShip?.vessel} (pharmaceutical, 2-8°C) at Berth 3 immediately. Defer ${electronicsShip?.vessel} (consumer electronics, 14-day buffer) to next available berth.`,
    selectedAction: 'Unload pharmaceutical cargo first; reschedule consumer electronics.',
    confidence: 'High',
    humanValidationRequired: false,
    tradeoffs: {
      delay: +8,
      cost: +10000,
      co2: 0,
      coldChainSafe: true,
      risk: 'Low'
    },
    dataUsed: [
      `${pharmaShip?.id} (${pharmaShip?.vessel}) — ${pharmaShip?.cargo}, ${pharmaShip?.temperatureRange}, ETA ${pharmaShip?.etaHours}h, ${pharmaShip?.inventoryRisk}, SGD ${pharmaShip?.valueSGD?.toLocaleString()}`,
      `${electronicsShip?.id} (${electronicsShip?.vessel}) — ${electronicsShip?.cargo}, ETA ${electronicsShip?.etaHours}h, buffer 14 days`,
      `Port occupancy: ${snap.portSummary.berthOccupancy}%`
    ]
  })

  return makeResponse({
    logistics, inventory, procurement, orchestrator,
    confidence: 'High',
    humanValidationRequired: false,
    decision
  })
}

// ─── General: vessel name match ───────────────────────────────────────────────

function vesselResponse(vessel, snap, shipment) {
  const w = snap.weather
  const sunda = snap.routes.find(r => r.id === 'R_SUNDA')
  const s = shipment || snap.shipments.find(s => s.vessel === vessel.name)

  const logistics = [
    `Vessel: ${vessel.name} (IMO: ${s?.imo || 'N/A'}) — ${vessel.type || s?.cargo}, flag: ${vessel.flag || 'N/A'}.`,
    `Status: ${vessel.status || s?.status}. ETA: ${s?.etaHours || vessel.etaHours}h. Current location: ${s?.currentLocation || 'En route'}.`,
    `Route: ${s?.route || 'Malacca Strait approach'}. Risk level: ${s?.riskLevel || vessel.riskScore > 70 ? 'High' : 'Medium'}.`,
    `Weather context: ${w.conditionLabel} on Malacca (${w.windKts}kn, ${w.waveM}m). ${s?.riskLevel === 'High' ? 'Storm exposure elevated.' : 'Conditions manageable.'}`
  ]

  const inventory = s ? [
    `Shipment ${s.id}: ${s.cargo}. Priority: ${s.priority}. Value: SGD ${s.valueSGD?.toLocaleString()}.`,
    s.isColdChain ? `Cold-chain: ${s.temperatureRange}. Inventory risk: ${s.inventoryRisk}. Customer: ${s.customer}.` : `No cold-chain requirement. Inventory buffer: ${s.inventoryRisk}.`,
    `Escalation status: ${s.escalation || 'None'}.`
  ] : ['No shipment data matched for this vessel in current snapshot.']

  const procurement = s ? [
    `Customer: ${s.customer}. Escalation: ${s.escalation}.`,
    s.isColdChain ? 'Cold-chain pharmaceutical: supplier notification required if ETA shifts by more than 4h.' : 'Standard cargo: routine supplier communication. No immediate escalation required.',
    `Estimated value at risk: SGD ${s.valueSGD?.toLocaleString()}.`
  ] : ['No procurement signals matched for this vessel.']

  const orchestrator = [
    `Recommended action: monitor ${vessel.name} closely given ${w.riskLevel} weather risk.`,
    s?.priority === 'Critical' ? `CRITICAL priority: assign Berth 3 priority, activate cold-storage team, fast-track customs clearance.` : `Standard monitoring — no immediate intervention required.`,
    `If ETA worsens beyond 12h, evaluate Sunda Strait (+${sunda?.deltaDays} days, ×${(sunda?.costIndex/100).toFixed(2)} cost) for reroute.`
  ]

  const conf = (s?.priority === 'Critical' || s?.riskLevel === 'High') ? 'High' : 'Medium'

  const decision = makeDecision({
    recommendation: `Monitor ${vessel.name}. ${s?.priority === 'Critical' ? 'Priority berthing required.' : 'No immediate intervention.'}`,
    selectedAction: s?.priority === 'Critical' ? 'Prioritise Berthing' : 'Monitor / No Action',
    confidence: conf,
    humanValidationRequired: conf === 'Low',
    tradeoffs: {
      delay: s?.priority === 'Critical' ? -6 : 0,
      cost: s?.priority === 'Critical' ? +12000 : 0,
      co2: 0,
      coldChainSafe: s?.isColdChain ? true : null,
      risk: s?.riskLevel || 'Low'
    },
    dataUsed: [
      `${s?.id} (${vessel.name}) — ${s?.cargo}, ETA ${s?.etaHours}h`,
      `Weather: ${w.conditionLabel}, ${w.windKts}kn`
    ].filter(Boolean)
  })

  return makeResponse({
    logistics, inventory, procurement, orchestrator,
    confidence: conf,
    humanValidationRequired: conf === 'Low',
    decision
  })
}

// ─── General: out-of-scope / default ─────────────────────────────────────────

function generalResponse(msg, snap) {
  const w = snap.weather
  const ps = snap.portSummary
  const os = snap.orchestrationSignals

  // Weather query
  if (/weather|wind|wave|storm|visibility/.test(msg)) {
    return makeResponse({
      logistics: [
        `Malacca Strait: ${w.conditionLabel}. Wind ${w.windKts}kn, waves ${w.waveM}m, visibility ${w.visibilityKm}km. Storm probability ${w.stormProbability}%.`,
        `Risk level: ${w.riskLevel}. ${w.riskLevel === 'Severe' ? 'Gale warning active — vessel movement restricted.' : 'Conditions elevated but manageable.'}`
      ],
      inventory: [`Weather risk level (${w.riskLevel}) affects cold-chain exposure for 2-8°C shipments SHP-2041 and SHP-2042.`],
      procurement: ['Monitor supplier SLAs. If storm escalates to Severe, activate safety stock and customer notification protocols.'],
      orchestrator: [`Weather snapshot only — no reroute decision warranted at ${w.riskLevel} risk unless storm escalates to Severe.`],
      confidence: 'Medium',
      humanValidationRequired: false,
      decision: makeDecision({
        recommendation: `Weather monitoring — ${w.conditionLabel}. No immediate reroute required at ${w.riskLevel} risk level.`,
        selectedAction: 'Monitor weather — no action required',
        confidence: 'Medium',
        humanValidationRequired: false,
        tradeoffs: { delay: 0, cost: 0, co2: 0, coldChainSafe: true, risk: w.riskLevel },
        dataUsed: [`Malacca: ${w.conditionLabel}, ${w.windKts}kn, ${w.waveM}m, ${w.stormProbability}% storm probability`]
      })
    })
  }

  // Berth / port query
  if (/berth|port|occupancy|congestion|wait/.test(msg)) {
    return makeResponse({
      logistics: [
        `Tuas Mega Port: ${ps.berthOccupancy}% berth occupancy, avg delay ${ps.avgDelayHours}h, ${ps.shipsInPort} ships in port.`,
        `${ps.berthOccupancy >= 90 ? 'Severe congestion — priority berthing protocol should be active.' : ps.berthOccupancy >= 75 ? 'High congestion — monitor closely.' : 'Occupancy manageable.'}`
      ],
      inventory: [`High-risk shipments: ${ps.highRiskShipments}. Cold-chain 2-8°C priority: SHP-2041 (SL TRADER), SHP-2042 (AURORA PIONEER).`],
      procurement: ['Evaluate deferral of routine-cargo arrivals to reduce berth contention. Notify affected carriers.'],
      orchestrator: [`Port status: ${os.logistics.berthCongestionLevel} congestion. Recommend priority protocol for cold-chain and critical cargo.`],
      confidence: ps.berthOccupancy >= 90 ? 'High' : 'Medium',
      humanValidationRequired: false,
      decision: makeDecision({
        recommendation: `Port at ${ps.berthOccupancy}% occupancy. ${ps.berthOccupancy >= 90 ? 'Apply priority berthing protocol.' : 'Monitor — approaching threshold.'}`,
        selectedAction: ps.berthOccupancy >= 90 ? 'Apply priority berthing protocol' : 'Monitor port occupancy',
        confidence: ps.berthOccupancy >= 90 ? 'High' : 'Medium',
        humanValidationRequired: false,
        tradeoffs: { delay: +6, cost: +10000, co2: 0, coldChainSafe: true, risk: os.logistics.berthCongestionLevel },
        dataUsed: [`Port: ${ps.berthOccupancy}% occupied, ${ps.shipsInPort} ships, avg delay ${ps.avgDelayHours}h`]
      })
    })
  }

  // Shipment / inventory query
  if (/shipment|cargo|inventory|stock|cold.?chain/.test(msg)) {
    const crit = snap.shipments.filter(s => s.priority === 'Critical')
    return makeResponse({
      logistics: [
        `${snap.shipments.length} active shipments tracked. ${snap.orchestrationSignals.inventory.criticalCargoCount} critical cold-chain pharma at 2-8°C.`,
        `Exposed shipments: ${snap.orchestrationSignals.logistics.exposedShipments.join(', ')}.`
      ],
      inventory: [
        `Safety stock risk: ${snap.orchestrationSignals.inventory.safetyStockRisk}`,
        `Stockout exposure: ${snap.orchestrationSignals.inventory.estimatedStockoutExposure}`,
        `Cold-chain shipments: ${snap.orchestrationSignals.inventory.coldChainShipments.join(', ')}.`
      ],
      procurement: [
        `Expedite candidates: ${snap.orchestrationSignals.procurement.expediteCandidates.join(', ')}.`,
        `Supplier notifications required: ${snap.orchestrationSignals.procurement.supplierNotificationRequired.join('; ')}.`
      ],
      orchestrator: crit.map(s => `${s.id} (${s.vessel}): ${s.cargo} — ${s.temperatureRange}, ETA ${s.etaHours}h, ${s.inventoryRisk}. ACTION: priority berth.`),
      confidence: 'High',
      humanValidationRequired: false,
      decision: makeDecision({
        recommendation: 'Monitor all critical shipments. Priority: SHP-2041 (SL TRADER), SHP-2042 (AURORA PIONEER).',
        selectedAction: 'Monitor critical shipments — priority cold-chain',
        confidence: 'High',
        humanValidationRequired: false,
        tradeoffs: { delay: 0, cost: 0, co2: 0, coldChainSafe: true, risk: 'High' },
        dataUsed: crit.map(s => `${s.id} (${s.vessel}), ETA ${s.etaHours}h, ${s.inventoryRisk}`)
      })
    })
  }

  // Route query
  if (/route|malacca|sunda|lombok|air freight/.test(msg)) {
    const routes = snap.routes
    return makeResponse({
      logistics: routes.map(r => `${r.name}: ${r.riskLevel} risk, Δ${r.deltaDays} days, cost ×${(r.costIndex/100).toFixed(2)}, CO2 ×${(r.co2Index/100).toFixed(2)}. ${r.notes}`),
      inventory: ['Sunda and Lombok add transit time but carry no cold-chain temperature risk if reefer units are operational.', 'Air freight eliminates delay but at ×3.4 cost and ×6.1 CO2 — reserve for emergency pharma only.'],
      procurement: ['Route selection affects carrier contracts. Any diversion beyond Sunda requires pre-authorisation from logistics operations manager.'],
      orchestrator: ['No reroute action warranted from this query alone. Route risk summary provided for situational awareness.'],
      confidence: 'High',
      humanValidationRequired: false,
      decision: makeDecision({
        recommendation: 'Route situational awareness. No reroute action required at this time.',
        selectedAction: 'Monitor routes — no reroute required',
        confidence: 'High',
        humanValidationRequired: false,
        tradeoffs: { delay: 0, cost: 0, co2: 0, coldChainSafe: null, risk: 'Low' },
        dataUsed: routes.map(r => `${r.name}: +${r.deltaDays}d, ×${(r.costIndex/100).toFixed(2)} cost`)
      })
    })
  }

  // Out-of-scope fallback
  return makeResponse({
    logistics: ['Query is outside the current simulated snapshot scope. Snapshot covers: Malacca weather, Tuas berth occupancy, 12 active shipments (2 cold-chain pharma), and 4 route options.'],
    inventory: ['No inventory signals matched in current data. Conservative hold recommended until scope is clarified.'],
    procurement: ['No procurement action warranted without matched data. Do not commit to orders or diversions based on unverified signals.'],
    orchestrator: [
      'Conservative holding action applied. This query falls outside the operational data provided.',
      'Recommendation: Hold current vessel positions and berth allocations. Do not reroute or escalate without validated data.',
      'HUMAN VALIDATION REQUIRED before any operational decision.'
    ],
    confidence: 'Low',
    humanValidationRequired: true,
    decision: makeDecision({
      recommendation: 'Out-of-scope query. Conservative hold. HUMAN VALIDATION REQUIRED.',
      selectedAction: 'Hold — await human validation',
      confidence: 'Low',
      humanValidationRequired: true,
      tradeoffs: { delay: +18, cost: +4000, co2: 0, coldChainSafe: null, risk: 'Unknown' },
      dataUsed: ['No matched snapshot data']
    })
  })
}

// ─── Public API ───────────────────────────────────────────────────────────────

// Known vessels from simulation (used for vessel-name matching)
const VESSEL_NAMES = [
  { id: 'SL_TRADER', name: 'SL TRADER', type: 'Container', flag: 'Liberia', status: 'Approaching', etaHours: 6, riskScore: 78 },
  { id: 'AURORA_PIONEER', name: 'AURORA PIONEER', type: 'Container', flag: 'Germany', status: 'Watch', etaHours: 18, riskScore: 65 },
  { id: 'OCEAN_VEGA', name: 'OCEAN VEGA', type: 'Reefer', flag: 'Panama', status: 'Holding', etaHours: 22, riskScore: 60 },
  { id: 'NORDIC_PEARL', name: 'NORDIC PEARL', type: 'Bulk Carrier', flag: 'Singapore', status: 'Reroute Candidate', etaHours: 30, riskScore: 41 },
  { id: 'PACIFIC_DAWN', name: 'PACIFIC DAWN', type: 'Tanker', flag: 'Marshall Islands', status: 'On Schedule', etaHours: 12, riskScore: 35 },
  { id: 'MERIDIAN_STAR', name: 'MERIDIAN STAR', type: 'Container', flag: 'Hong Kong', status: 'Berthing', etaHours: 4, riskScore: 22 }
]

// Dispatch rules — checked in strict priority order.
// Each rule uses the MOST distinguishing signals for that test case only.
function dispatch(msg, snap) {
  // TC5: "only unload one" / "one vessel" / "pharmaceutical supplies" + "consumer electronics"
  // Must be checked before TC1 because TC5 also mentions pharma.
  if (
    matchAny(msg, TC5_KEYS) &&
    (msg.includes('consumer electronics') || msg.includes('one vessel') || msg.includes('only unload') || msg.includes('limited berth'))
  ) return tc5(snap)

  // TC4: Red Sea / Hormuz / GOLDEN STAR / Batam — very specific terms
  if (matchAny(msg, TC4_KEYS)) return tc4(snap)

  // TC3: "weather conditions are normal" + "congestion" / "reroute" — conflicting signals
  // The key signal is that weather is explicitly described as normal/fine while congestion is the issue.
  if (
    (msg.includes('weather') && msg.includes('normal') && (msg.includes('congestion') || msg.includes('reroute'))) ||
    msg.includes('conflicting') ||
    (msg.includes('conditions are normal') && msg.includes('congest'))
  ) return tc3(snap)

  // TC2: berth occupancy percentage specifically called out, or minimise delays as the framing
  // Key signal: "92%" or "berth occupancy" as the problem (not as context in another scenario)
  if (
    msg.includes('92%') ||
    msg.includes('92 percent') ||
    (msg.includes('berth occupancy') && (msg.includes('minimis') || msg.includes('minimiz') || msg.includes('how can'))) ||
    (msg.includes('berth') && msg.includes('full') && !msg.includes('pharma') && !msg.includes('pharmaceutical'))
  ) return tc2(snap)

  // TC1: storm / pharma delay — the primary cold-chain disruption scenario
  if (
    (msg.includes('storm') || msg.includes('tropical storm') || msg.includes('gale')) &&
    (msg.includes('pharma') || msg.includes('pharmaceutical') || msg.includes('insulin') || msg.includes('vaccine') || msg.includes('biologics') || msg.includes('cold chain') || msg.includes('cold-chain'))
  ) return tc1(snap)

  // TC1 variant: 48h late + pharma
  if (
    (msg.includes('48 hour') || msg.includes('48h') || msg.includes('48 hrs')) &&
    (msg.includes('pharma') || msg.includes('pharmaceutical') || msg.includes('late') || msg.includes('delay'))
  ) return tc1(snap)

  // Vessel name match
  for (const v of VESSEL_NAMES) {
    if (msg.includes(v.name.toLowerCase())) {
      return vesselResponse(v, snap)
    }
  }

  return generalResponse(msg, snap)
}

export function query(message) {
  const snap = getSnapshot()
  const msg = message.toLowerCase()
  return dispatch(msg, snap)
}

// Quick question prompts for the chat UI
export const QUICK_QUESTIONS = [
  {
    id: 'QQ1',
    label: 'TC1: Pharma Storm',
    prompt: 'A tropical storm is expected in the Malacca Strait and my vessel carrying pharmaceutical products will arrive 48 hours late. What should I do?'
  },
  {
    id: 'QQ2',
    label: 'Berth Congestion',
    prompt: 'Berth occupancy has reached 92%. How can we minimise delays?'
  },
  {
    id: 'QQ3',
    label: 'TC3: Conflicting Data',
    prompt: 'Weather conditions are normal, but Tuas reports severe congestion. Should I reroute my shipment?'
  },
  {
    id: 'QQ4',
    label: 'TC4: Multi-Disruption',
    prompt: 'The Strait of Malacca is experiencing spillover pressure from Red Sea and Hormuz disruptions, though Malaysian ports report congestion remains manageable. Separately, the Tanzania-registered container vessel GOLDEN STAR 1 sank 6 km off Batam on 5 June 2026, with all nine crew rescued. What should we do?'
  },
  {
    id: 'QQ5',
    label: 'TC5: Priority Berth',
    prompt: 'Due to limited berth availability, we can only unload one vessel today. We have one vessel carrying pharmaceutical supplies and another carrying consumer electronics. Which should be prioritised?'
  }
]
