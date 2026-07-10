// src/data/simulation.js
// Canonical simulation data for Tuas Mega Port Resilience Monitor.
// MOCK MODE only — no API key required. All data is simulated.

export const MODE = 'MOCK'

// ─── Mutable simulation state ─────────────────────────────────────────────────
let _stormForced = false
let _congestionForced = false

// ─── Weather ──────────────────────────────────────────────────────────────────
const BASE_WEATHER = {
  location: 'Malacca Strait',
  conditionLabel: 'Partly Cloudy with Scattered Showers',
  windKts: 18,
  waveM: 1.8,
  visibilityKm: 9,
  stormProbability: 22,
  riskLevel: 'Medium'
}

const STORM_OVERRIDE = {
  conditionLabel: 'Severe Thunderstorm — Gale Warning Active',
  windKts: 42,
  waveM: 4.8,
  visibilityKm: 1.8,
  stormProbability: 91,
  riskLevel: 'Severe'
}

function getWeather() {
  if (_stormForced) return { ...BASE_WEATHER, ...STORM_OVERRIDE }
  return { ...BASE_WEATHER }
}

export function forceStorm() { _stormForced = true }
export function clearStorm() { _stormForced = false }
export function isStormForced() { return _stormForced }

// ─── Berth occupancy ──────────────────────────────────────────────────────────
// 24-hour historical occupancy (%) — hourly readings, evening peak ~18:00
const BERTH_HISTORY_BASE = [
  { hour: '00:00', value: 61 }, { hour: '01:00', value: 59 },
  { hour: '02:00', value: 57 }, { hour: '03:00', value: 58 },
  { hour: '04:00', value: 60 }, { hour: '05:00', value: 62 },
  { hour: '06:00', value: 65 }, { hour: '07:00', value: 68 },
  { hour: '08:00', value: 72 }, { hour: '09:00', value: 75 },
  { hour: '10:00', value: 77 }, { hour: '11:00', value: 79 },
  { hour: '12:00', value: 80 }, { hour: '13:00', value: 81 },
  { hour: '14:00', value: 82 }, { hour: '15:00', value: 85 },
  { hour: '16:00', value: 88 }, { hour: '17:00', value: 91 },
  { hour: '18:00', value: 93 }, { hour: '19:00', value: 92 },
  { hour: '20:00', value: 90 }, { hour: '21:00', value: 85 },
  { hour: '22:00', value: 79 }, { hour: '23:00', value: 72 }
]

function generateBerthHistory() {
  if (_congestionForced) {
    return BERTH_HISTORY_BASE.map(h => ({ ...h, value: Math.min(95, h.value + 8) }))
  }
  return [...BERTH_HISTORY_BASE]
}

// 3-hour moving average projection for next 24 hours (8 × 3h steps).
// Labelled as heuristic — not a trained ML model.
function generateBerthProjection(history) {
  const vals = history.map(h => h.value)
  return Array.from({ length: 8 }, (_, i) => {
    const refIdx = vals.length - 3 + i
    const window = [
      vals[Math.max(0, refIdx - 2)],
      vals[Math.max(0, refIdx - 1)],
      vals[Math.max(0, refIdx)]
    ]
    const avg = Math.round(window.reduce((a, b) => a + b, 0) / 3)
    const hourNum = (i * 3) % 24
    const label = hourNum.toString().padStart(2, '0') + ':00'
    return {
      hour: `+${i * 3}h (${label})`,
      value: Math.min(95, Math.max(55, avg)),
      projected: true
    }
  })
}

export function forceCongestion() { _congestionForced = true }
export function clearCongestion() { _congestionForced = false }
export function isCongestionForced() { return _congestionForced }

// ─── Shipments (exactly 12; exactly 2 cold-chain pharma at 2-8 C) ─────────────
export const SHIPMENTS = [
  // ── Cold-chain pharma #1 — CRITICAL ────────────────────────────────────────
  {
    id: 'SHP-2041',
    vessel: 'SL TRADER',
    imo: 'IMO9874321',
    cargo: 'Pharmaceuticals — Insulin & Vaccines',
    origin: 'Rotterdam, Netherlands',
    destination: 'Singapore (Tuas Mega Port)',
    route: 'Rotterdam → Suez Canal → Malacca Strait → Singapore',
    etaHours: 6,
    status: 'Critical',
    valueSGD: 5880000,
    isColdChain: true,
    temperatureRange: '2-8 C',
    priority: 'Critical',
    riskLevel: 'High',
    currentLocation: 'Malacca Strait — 38 nm from Tuas anchorage',
    inventoryRisk: 'Stockout in 18h',
    customer: 'BioHealth Pharma',
    escalation: 'Active — Director notified'
  },
  // ── Cold-chain pharma #2 — CRITICAL ────────────────────────────────────────
  {
    id: 'SHP-2042',
    vessel: 'AURORA PIONEER',
    imo: 'IMO9761234',
    cargo: 'Biologics — COVID-19 Antivirals & Blood Products',
    origin: 'Hamburg, Germany',
    destination: 'Singapore (Tuas Mega Port)',
    route: 'Hamburg → Suez Canal → Malacca Strait → Singapore',
    etaHours: 18,
    status: 'Watch',
    valueSGD: 3240000,
    isColdChain: true,
    temperatureRange: '2-8 C',
    priority: 'Critical',
    riskLevel: 'High',
    currentLocation: 'Malacca Strait — 190 nm west of Singapore',
    inventoryRisk: 'Stockout in 36h',
    customer: 'MedGlobal AG',
    escalation: 'Monitoring'
  },
  // ── Cold-chain #3 — frozen, not 2-8 C pharma ───────────────────────────────
  {
    id: 'SHP-2043',
    vessel: 'OCEAN VEGA',
    imo: 'IMO9652891',
    cargo: 'Frozen Seafood & Vaccine Reefer (non-pharma)',
    origin: 'Oslo, Norway',
    destination: 'Singapore (Tuas Mega Port)',
    route: 'Oslo → Gibraltar → Suez Canal → Malacca Strait → Singapore',
    etaHours: 22,
    status: 'Watch',
    valueSGD: 2590000,
    isColdChain: true,
    temperatureRange: '-20 C',
    priority: 'High',
    riskLevel: 'Medium',
    currentLocation: 'Malacca Strait — holding at anchorage',
    inventoryRisk: 'Stable — 36h buffer',
    customer: 'AsiaCold Logistics',
    escalation: 'None'
  },
  // ── Non-cold-chain shipments ────────────────────────────────────────────────
  {
    id: 'SHP-2044',
    vessel: 'NORDIC PEARL',
    imo: 'IMO9543210',
    cargo: 'Iron Ore',
    origin: 'Port Hedland, Australia',
    destination: 'Singapore (Tuas Mega Port)',
    route: 'Port Hedland → Lombok Strait → Singapore',
    etaHours: 30,
    status: 'On time',
    valueSGD: 896000,
    isColdChain: false,
    temperatureRange: 'N/A',
    priority: 'Routine',
    riskLevel: 'Low',
    currentLocation: 'South China Sea — 310 nm east of Singapore',
    inventoryRisk: 'Buffer 9 days',
    customer: 'SG Steel Mills',
    escalation: 'None'
  },
  {
    id: 'SHP-2045',
    vessel: 'PACIFIC DAWN',
    imo: 'IMO9432109',
    cargo: 'LNG',
    origin: 'Doha, Qatar',
    destination: 'Singapore (Tuas Mega Port)',
    route: 'Doha → Strait of Hormuz → Malacca Strait → Singapore',
    etaHours: 12,
    status: 'On time',
    valueSGD: 1372000,
    isColdChain: false,
    temperatureRange: 'N/A',
    priority: 'High',
    riskLevel: 'Medium',
    currentLocation: 'Malacca Strait — southern approach',
    inventoryRisk: 'Buffer 4 days',
    customer: 'EnergyCo Singapore',
    escalation: 'None'
  },
  {
    id: 'SHP-2046',
    vessel: 'MERIDIAN STAR',
    imo: 'IMO9321098',
    cargo: 'Consumer Electronics',
    origin: 'Shenzhen, China',
    destination: 'Singapore (Tuas Mega Port)',
    route: 'Shenzhen → South China Sea → Singapore',
    etaHours: 4,
    status: 'On time',
    valueSGD: 728000,
    isColdChain: false,
    temperatureRange: 'N/A',
    priority: 'Routine',
    riskLevel: 'Low',
    currentLocation: 'Approaching Tuas Berth 1',
    inventoryRisk: 'Buffer 14 days',
    customer: 'RetailMart SG',
    escalation: 'None'
  },
  {
    id: 'SHP-2047',
    vessel: 'EAST WIND',
    imo: 'IMO9210987',
    cargo: 'Automotive Parts & Assembly Kits',
    origin: 'Nagoya, Japan',
    destination: 'Singapore (Tuas Mega Port)',
    route: 'Nagoya → East China Sea → South China Sea → Singapore',
    etaHours: 36,
    status: 'Delayed',
    valueSGD: 1540000,
    isColdChain: false,
    temperatureRange: 'N/A',
    priority: 'High',
    riskLevel: 'Medium',
    currentLocation: 'South China Sea — delayed by Typhoon Kimi residual swell',
    inventoryRisk: 'Production line impact in 42h',
    customer: 'AutoAssemble Ltd',
    escalation: 'Monitoring'
  },
  {
    id: 'SHP-2048',
    vessel: 'HONG KONG EXPRESS',
    imo: 'IMO9109876',
    cargo: 'Textiles & Apparel',
    origin: 'Hong Kong',
    destination: 'Singapore (Tuas Mega Port)',
    route: 'Hong Kong → South China Sea → Singapore',
    etaHours: 14,
    status: 'On time',
    valueSGD: 448000,
    isColdChain: false,
    temperatureRange: 'N/A',
    priority: 'Routine',
    riskLevel: 'Low',
    currentLocation: 'South China Sea — 140 nm north-east of Singapore',
    inventoryRisk: 'Buffer 21 days',
    customer: 'FashionHub Asia',
    escalation: 'None'
  },
  {
    id: 'SHP-2049',
    vessel: 'MAJESTIC ACE',
    imo: 'IMO9098765',
    cargo: 'Ro-Ro Vehicles (1,200 units)',
    origin: 'Yokohama, Japan',
    destination: 'Singapore (Tuas Mega Port)',
    route: 'Yokohama → East China Sea → Luzon Strait → South China Sea → Singapore',
    etaHours: 48,
    status: 'On time',
    valueSGD: 2184000,
    isColdChain: false,
    temperatureRange: 'N/A',
    priority: 'High',
    riskLevel: 'Low',
    currentLocation: 'South China Sea — 520 nm north of Singapore',
    inventoryRisk: 'Buffer 7 days',
    customer: 'SG Auto Distributors',
    escalation: 'None'
  },
  {
    id: 'SHP-2050',
    vessel: 'CORAL SEA',
    imo: 'IMO9087654',
    cargo: 'Industrial Chemicals (Class 3)',
    origin: 'Jubail, Saudi Arabia',
    destination: 'Singapore (Tuas Mega Port)',
    route: 'Jubail → Strait of Hormuz → Malacca Strait → Singapore',
    etaHours: 20,
    status: 'Watch',
    valueSGD: 1176000,
    isColdChain: false,
    temperatureRange: 'N/A',
    priority: 'High',
    riskLevel: 'Medium',
    currentLocation: 'Malacca Strait — 220 nm from Tuas',
    inventoryRisk: 'Buffer 5 days',
    customer: 'ChemIndustries SG',
    escalation: 'None'
  },
  {
    id: 'SHP-2051',
    vessel: 'TITAN GLORY',
    imo: 'IMO9076543',
    cargo: 'Steel Coils & Structural Steel',
    origin: 'Pohang, South Korea',
    destination: 'Singapore (Tuas Mega Port)',
    route: 'Pohang → East China Sea → South China Sea → Singapore',
    etaHours: 52,
    status: 'On time',
    valueSGD: 672000,
    isColdChain: false,
    temperatureRange: 'N/A',
    priority: 'Routine',
    riskLevel: 'Low',
    currentLocation: 'South China Sea — 680 nm north-east of Singapore',
    inventoryRisk: 'Buffer 18 days',
    customer: 'BuildCorp SG',
    escalation: 'None'
  },
  {
    id: 'SHP-2052',
    vessel: 'PACIFIC BRIDGE',
    imo: 'IMO9065432',
    cargo: 'Heavy Machinery & Construction Equipment',
    origin: 'Tianjin, China',
    destination: 'Singapore (Tuas Mega Port)',
    route: 'Tianjin → Yellow Sea → East China Sea → South China Sea → Singapore',
    etaHours: 60,
    status: 'On time',
    valueSGD: 2800000,
    isColdChain: false,
    temperatureRange: 'N/A',
    priority: 'Routine',
    riskLevel: 'Low',
    currentLocation: 'East China Sea — 820 nm from Singapore',
    inventoryRisk: 'Buffer 30 days',
    customer: 'MegaBuild Asia',
    escalation: 'None'
  }
]

// ─── Routes (exact spec values) ───────────────────────────────────────────────
export const ROUTES = [
  {
    id: 'R_MALACCA',
    name: 'Malacca Strait (Primary)',
    deltaDays: 0,
    costIndex: 100,
    co2Index: 100,
    riskLevel: 'High',
    notes: 'Primary route. Currently: gale warning active, 3 vessels holding.'
  },
  {
    id: 'R_SUNDA',
    name: 'Sunda Strait (Alternate)',
    deltaDays: 2,
    costIndex: 118,
    co2Index: 115,
    riskLevel: 'Medium',
    notes: 'Adds 2 days transit. Calmer seas. Suitable for non-critical bulk cargo.'
  },
  {
    id: 'R_LOMBOK',
    name: 'Lombok Strait (Deep Alternate)',
    deltaDays: 3.5,
    costIndex: 126,
    co2Index: 124,
    riskLevel: 'Low',
    notes: 'Adds 3.5 days. Minimal congestion. Highest CO2 of all sea routes.'
  },
  {
    id: 'R_AIR',
    name: 'Partial Air Freight',
    deltaDays: -4,
    costIndex: 340,
    co2Index: 610,
    riskLevel: 'Low',
    notes: 'Emergency use only. 340% cost index, 610% CO2 index vs sea baseline. Restricted to critical cold-chain cargo.'
  }
]

// ─── Port summary ─────────────────────────────────────────────────────────────
function getPortSummary(berthOccupancy) {
  return {
    portName: 'Tuas Mega Port',
    avgDelayHours: berthOccupancy >= 90 ? 22 : 14,
    berthOccupancy,
    shipsInPort: 11,
    highRiskShipments: SHIPMENTS.filter(s => s.riskLevel === 'High').length
  }
}

// ─── Orchestration signals ────────────────────────────────────────────────────
function getOrchestrationSignals(weather, berthOccupancy) {
  const coldChainShipments = SHIPMENTS.filter(s => s.isColdChain)
  const pharmaCritical = SHIPMENTS.filter(s => s.isColdChain && s.temperatureRange === '2-8 C')
  const exposedShipments = SHIPMENTS.filter(
    s => s.riskLevel === 'High' || s.status === 'Critical' || s.status === 'Watch'
  )
  const congestionLabel = berthOccupancy >= 90 ? 'Severe' : berthOccupancy >= 75 ? 'High' : 'Moderate'

  return {
    logistics: {
      weatherRisk: weather.riskLevel,
      berthCongestionLevel: congestionLabel,
      avgDelayHours: berthOccupancy >= 90 ? 22 : 14,
      routeRisks: {
        malacca: `${weather.riskLevel === 'Severe' ? 'Severe' : 'High'} — gale warning active`,
        sunda: 'Medium — clear, +2 days detour',
        lombok: 'Low — clear, +3.5 days detour',
        air: 'Low risk — extreme cost (340%) and CO2 (610%)'
      },
      exposedShipments: exposedShipments.map(s => s.id)
    },
    inventory: {
      coldChainShipments: coldChainShipments.map(s => s.id),
      criticalCargoCount: pharmaCritical.length,
      safetyStockRisk: 'High — SHP-2041 insulin stockout projected in 18h without priority berthing',
      estimatedStockoutExposure: 'SGD 5,880,000 (SHP-2041) + SGD 3,240,000 (SHP-2042)'
    },
    procurement: {
      expediteCandidates: pharmaCritical.map(s => s.id),
      holdCandidates: SHIPMENTS.filter(s => s.priority === 'Routine' && s.riskLevel === 'Low').map(s => s.id),
      supplierNotificationRequired: [
        'BioHealth Pharma (SHP-2041 — insulin stockout risk)',
        'MedGlobal AG (SHP-2042 — biologics, monitoring)'
      ],
      customerEscalationRequired: [
        'BioHealth Pharma — Director already notified',
        'National Pharmacy Board — on standby'
      ]
    }
  }
}

// ─── Default decision model ───────────────────────────────────────────────────
export const DEFAULT_DECISION = {
  recommendation: null,
  selectedAction: null,
  confidence: null,
  humanValidationRequired: false,
  tradeoffs: {
    delay: null,
    cost: null,
    co2: null,
    coldChainSafe: null,
    risk: null
  },
  dataUsed: []
}

// ─── News ticker ──────────────────────────────────────────────────────────────
export const NEWS_TICKER = [
  'SIMULATED DATA — All scenarios are for university classroom demonstration only. No real operational data.',
  'Malacca Strait: Gale warning active — winds 42kn, waves 4.8m, visibility 1.8km. Vessel movement restricted.',
  'GOLDEN STAR 1 incident off Batam Island, 5 June 2026 — vessel grounded on shoal, all 22 crew rescued. MPA investigation ongoing.',
  'Hormuz & Red Sea spillover: Elevated re-routing pressure adding congestion to Malacca Strait approaches.',
  'Tuas Mega Port: Berth 7 maintenance window extended 12h — effective capacity reduced to 7 active berths.',
  'BioHealth Pharma: Insulin stockout projected in 18h without SL TRADER priority berthing (SHP-2041).',
  'Jakarta port congestion spilling over — 6 regional vessels diverted to Singapore anchorage.',
  'Market: Bunker fuel +4.2% week-on-week. Air freight rates +18% due to Red Sea diversions.',
  'AURORA PIONEER (SHP-2042): Biologics shipment — ETA 18h, cold-chain monitoring active, 2-8°C confirmed.',
  'OCEAN VEGA holding at anchorage — reefer temperature stable at -18.1°C. Storm window being monitored.',
  'IMO MARPOL emissions compliance tightening effective next quarter — mandatory CO2 voyage reporting.'
]

// ─── getSnapshot ──────────────────────────────────────────────────────────────
export function getSnapshot() {
  const weather = getWeather()
  const berthHistory = generateBerthHistory()
  const berthProjection = generateBerthProjection(berthHistory)
  const currentBerthOccupancy = _congestionForced
    ? 93
    : berthHistory[berthHistory.length - 1].value

  return {
    generatedAt: new Date().toISOString(),
    weather,
    berthHistory,
    berthProjection,
    shipments: SHIPMENTS,
    routes: ROUTES,
    portSummary: getPortSummary(currentBerthOccupancy),
    orchestrationSignals: getOrchestrationSignals(weather, currentBerthOccupancy),
    currentDecision: { ...DEFAULT_DECISION },
    newsTicker: NEWS_TICKER,
    notes: [
      'All data is simulated for university prototype demonstration.',
      'Berth projection is a 3-hour moving-average heuristic, not a trained machine-learning model.'
    ]
  }
}
