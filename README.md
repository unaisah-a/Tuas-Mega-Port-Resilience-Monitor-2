# Tuas Mega Port Resilience Monitor (TMPRM)

**Course:** Supply Chain 4.0 — Intelligent Decision Support Systems

---

## Executive Summary

In 2026, global supply chains face compounding disruptions: extreme weather events, port congestion, geopolitical route closures, and rising pressure to decarbonise logistics. The Tuas Mega Port Resilience Monitor (TMPRM) is a browser-based decision support dashboard that demonstrates how AI-assisted orchestration can help supply chain operators navigate these challenges in real time.

TMPRM combines a deterministic rule engine (MOCK mode) with an optional live LLM backend (LIVE mode via Anthropic Claude) to provide structured, auditable recommendations across three operational domains — Logistics, Inventory, and Procurement. Every recommendation is logged with a simulated hash-chain for audit trail integrity, making the system suitable as a conceptual prototype for regulated supply chain environments.

The system is deliberately built as a demo artefact: all data is simulated, the "blockchain" is a browser-side hash simulation, and the LLM calls are made directly from the browser. These choices are documented in the Caveats section with a production pathway for each.

---

## What It Demonstrates

| Capability | Implementation |
|---|---|
| Real-time port situational awareness | 8-second auto-refresh snapshot with weather, vessel, berth, and news data |
| Multi-modal disruption simulation | One-click storm and port congestion toggles with cascading UI updates |
| AI-assisted risk triage | Chat advisor with MOCK (deterministic) and LIVE (Anthropic Claude) modes |
| Structured LLM output parsing | Four-section response format: LOGISTICS / INVENTORY / PROCUREMENT / ORCHESTRATOR |
| What-if scenario planning | 3 presets + free-text input, 3-option comparison table, challenge loop |
| Cold-chain integrity enforcement | Hard rule: cold-chain integrity outranks cost in all decision paths |
| Auditable decision logging | localStorage hash-chain log with simulated previousHash / currentHash |
| Graceful degradation | LIVE → timeout or API error → DEGRADED (mock) with amber banner |
| Rubric-aligned UI | Demo Test Panel with 5 exact assessment prompts, Rubric Alignment card |
| Shipment-level risk prefill | Click any shipment card to pre-fill the chat with its ID |

---

## Run Steps

**Prerequisites:** Node.js 18+ and npm

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Open in browser
# http://localhost:5173
```

No environment variables are required for MOCK mode. The application runs fully offline in MOCK mode.

**To enable LIVE mode:**
1. Click the **MOCK** badge in the header to open the mode selector
2. Select **LIVE**
3. Enter your Anthropic API key in the settings panel
4. The model defaults to `claude-opus-4-8` — change if needed
5. Send any message; the system will call the Anthropic API directly from the browser

---

## MOCK vs LIVE Mode

| Aspect | MOCK Mode | LIVE Mode |
|---|---|---|
| Data source | Deterministic rule engine (`src/agent/mockBrain.js`) | Anthropic Claude API (`src/agent/liveBrain.js`) |
| API key required | No | Yes (Anthropic) |
| Response time | ~300 ms (simulated) | 3–15 s (network dependent) |
| Response format | Structured 4-section output | Parsed from Claude's structured response |
| Failure mode | Never fails | Falls back to DEGRADED (mock) on timeout or error |
| Cost | Free | Anthropic API tokens |
| Consistency | Deterministic — same input gives same output | Non-deterministic |
| Cold-chain rule | Always enforced | Enforced via prompt instruction |
| Suitable for demo | Yes | Yes (requires API key) |
| Suitable for assessment | Yes | Yes |

**DEGRADED mode** activates automatically when LIVE mode encounters a 30-second timeout or any API error. An amber banner displays in the chat panel and the mode chip changes to DEGRADED. The system continues operating using the mock engine until the user manually switches back to LIVE.

---

## ASCII Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Browser (React 18 + Vite)                        │
│                                                                     │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────────────────────┐   │
│  │  Header  │  │  Scenario Bar│  │       App.jsx (state)       │   │
│  │mode chip │  │storm/cong/   │  │  mode, apiKey, stormActive  │   │
│  └──────────┘  │filter toggles│  │  congestionActive, filters  │   │
│                └──────────────┘  └─────────┬───────────────────┘   │
│                                            │ props                  │
│  ┌─────────────────────────────────────────▼───────────────────┐   │
│  │                    Main Dashboard Grid                       │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │   │
│  │  │ WeatherCard │  │PortSummaryCard│  │ CommandMap (SVG)   │  │   │
│  │  │ recharts    │  │ BerthOccupancy│  │ vessel dots        │  │   │
│  │  │ sparklines  │  │ recharts bar  │  │ storm blob         │  │   │
│  │  └─────────────┘  └──────────────┘  │ Sunda alt route    │  │   │
│  │  ┌─────────────────────────────┐    │ SL TRADER popover  │  │   │
│  │  │ ShipmentRiskBoard           │    └────────────────────┘  │   │
│  │  │ 12 shipment cards (click)   │                            │   │
│  │  │ RouteRiskSummary            │                            │   │
│  │  └─────────────────────────────┘                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐    │
│  │     ChatAdvisor          │  │     DecisionInterface        │    │
│  │  forwardRef + imperative │  │  Logistics/Inventory/Procure │    │
│  │  pushAlert / prefill     │  │  5 TradeoffCards (grid)      │    │
│  │  MOCK → mockBrain.js     │  │  Orchestrator rationale      │    │
│  │  LIVE → liveBrain.js     │  │  Accept button + username    │    │
│  │  DEGRADED → mockBrain.js │  │  localStorage hash-chain log │    │
│  └──────────────────────────┘  └──────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              WhatIfSimulator                                 │   │
│  │  3 presets + free text → whatIfEngine.js (deterministic)    │   │
│  │  3-option table → challenge loop → decision log              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────┐  ┌─────────────────────────────────────┐     │
│  │  DemoTestPanel   │  │         RubricCard                  │     │
│  │  5 test prompts  │  │  rubric alignment checklist         │     │
│  └──────────────────┘  └─────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
         │ API call (LIVE mode only)            │ localStorage
         ▼                                      ▼
┌─────────────────────┐             ┌─────────────────────────┐
│  Anthropic Claude   │             │  tmprm_decision_history  │
│  api.anthropic.com  │             │  tmprm_whatif_decisions  │
│  claude-opus-4-8    │             │  tmprm_username          │
└─────────────────────┘             └─────────────────────────┘
```

---

## Optional Features Implemented

- **LIVE LLM Mode** — Direct Anthropic API integration with structured response parsing
- **Graceful Degradation** — Automatic MOCK fallback with amber DEGRADED banner on API failure
- **Browser Notifications** — Optional push alerts for storm and congestion events (requires permission)
- **localStorage Decision Log** — Persistent audit trail with simulated hash-chain integrity
- **What-if Challenge Loop** — Constraint challenge with Lombok route specs, unsafe refusal, CO2 re-ranking
- **Shipment Click-to-Prefill** — Click any shipment card to pre-fill the chat advisor
- **Vessel Type Filtering** — Filter CommandMap and ShipmentRiskBoard by Cold-chain Pharma / General Cargo
- **Username Logging** — Optional username stored in localStorage, included in all decision log entries
- **Demo Test Panel** — 5 assessment-ready prompts accessible from the right sidebar
- **Rubric Alignment Card** — In-UI display of which rubric criteria are addressed and how

---

## Caveats

**This is a proof-of-concept demo artefact. The following simplifications apply:**

| Simplification | Detail |
|---|---|
| Simulated data | All shipment, vessel, weather, and berth data is hard-coded in `src/data/simulation.js`. No live AIS, port, or weather feeds are connected. |
| Browser-side LLM calls | LIVE mode calls the Anthropic API directly from the browser. This exposes the API key in browser network traffic — not suitable for production. |
| Simulated hash-chain | The "blockchain" audit log uses a browser-side bitwise XOR hash (`simpleHash()`). It is not a real distributed ledger and provides no cryptographic guarantees. |
| No authentication | There is no user authentication. The username field is stored in localStorage only. |
| Deterministic mock engine | The MOCK brain uses hardcoded rule patterns. It does not learn, adapt, or reflect real operational data. |
| 8-second refresh | The auto-refresh updates the in-memory snapshot state only. It does not fetch real external data. |
| Cold-chain rule | The cold-chain integrity rule is enforced in code logic. In LIVE mode it is enforced via prompt instruction, which a sufficiently adversarial prompt could circumvent. |

---

## Production Pathway

| Demo Component | Production Equivalent |
|---|---|
| Hard-coded simulation data | AIS vessel tracking API (e.g., MarineTraffic), real-time weather API (OpenWeatherMap / Copernicus), port EDI feeds |
| Browser-side Anthropic calls | Backend API gateway (Node.js / Python FastAPI) with server-side API key management and rate limiting |
| Simulated hash-chain | Permissioned blockchain (Hyperledger Fabric) or append-only tamper-evident log (AWS QLDB, Azure Confidential Ledger) |
| localStorage decision log | Relational database (PostgreSQL) with audit schema, user authentication, and role-based access control |
| Single-user demo | Multi-tenant SaaS with Supabase Auth, RLS policies per organisation |
| Rule-based MOCK brain | Fine-tuned domain LLM with retrieval-augmented generation (RAG) over port operations knowledge base |
| Browser notifications | Server-sent events (SSE) or WebSocket push with a notification service (e.g., FCM) |
| Vite dev server | Containerised deployment (Docker + Kubernetes) behind a CDN with CI/CD pipeline |

---

## Critical Reflection

**What worked well:**

The structured 4-section LLM response format (LOGISTICS / INVENTORY / PROCUREMENT / ORCHESTRATOR) proved effective as a parsing target. By constraining the output format via prompt instruction, the system can extract actionable recommendations reliably in both MOCK and LIVE modes. The deterministic mock engine also made it possible to build and test the full UI without requiring an API key, lowering the barrier for development and assessment.

The `forwardRef` + `useImperativeHandle` pattern for the ChatAdvisor enabled clean imperative control from App.jsx (storm alerts, shipment prefill) without introducing a complex message queue or global state. This kept the component interface predictable.

**What would change in production:**

The most significant architectural change would be moving API calls server-side. Browser-side LLM calls are a demo convenience, not a security posture. A backend gateway would also enable semantic caching, request logging, cost controls, and the ability to swap model providers without redeploying the frontend.

The simulated hash-chain is intentionally labelled as "simulated" in the UI, but a production audit trail would require a proper append-only log with cryptographic integrity guarantees. The cold-chain integrity rule, currently enforced in JavaScript, would need to be enforced at the data layer and validated independently of the LLM output.

**On AI assistance in supply chain decisions:**

The most important design constraint in TMPRM is that the system recommends but never decides. The "Accept" button, the human validation required (HVR) flag, the confidence badge, and the challenge loop all exist to ensure a human operator remains in the loop. This is not incidental — in safety-critical logistics (cold-chain pharmaceuticals, hazardous cargo), automated AI decisions without human oversight would be operationally and legally unacceptable. TMPRM is designed to augment human judgment, not replace it.
