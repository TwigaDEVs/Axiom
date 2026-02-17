# Axiom (AI-Powered Prediction Market Oracle)

## Solution Architecture & Technical Design

---

## 1. System Purpose

This system resolves prediction markets using **reasoned verification** rather than blind data ingestion.

Instead of trusting single sources or binary signals, the oracle evaluates:

- Information quality
- Source credibility
- Consistency across sources
- Narrative evolution over time

before settling a market.

**Core objective:** establish defensible ground truth under uncertainty.

---

## 2. Core Design Principles

- **Source-aware intelligence** — credibility is explicitly modeled
- **Multi-agent verification** — independent agents analyze different dimensions of truth
- **Temporal reasoning** — facts evolve, not static snapshots
- **Confidence-weighted outcomes** — probabilistic settlement, not absolute
- **Auditability** — every decision has an evidence trail

---

## 3. High-Level Architecture

The oracle operates as an **off-chain intelligence layer** coordinated by a decentralized workflow, with final settlement executed **on-chain**.

### Flow Overview

1. Market is created on-chain
2. Oracle workflow is triggered
3. Market is categorized
4. Evidence is gathered and verified by agents
5. Signals are synthesized into a confidence-scored outcome
6. Market is settled (or deferred) based on thresholds

---

## 4. Market Categorization Layer

An AI classifier determines the verification strategy required for each market.

### Market Categories

#### Category A — Objective / Verifiable

Examples:

- Numerical outcomes
- Protocol events
- Timestamps

#### Category B — News-Based

Examples:

- Elections
- Court rulings
- Public announcements

#### Category C — Ambiguous / Interpretive

Examples:

- Intent-based outcomes
- Subjective or loosely defined events

> Category selection controls agent activation and confidence strictness.

---

## 5. Multi-Source Intelligence Pipeline

Specialized agents gather, evaluate, and filter information.

### Agent 1 — Web Search Aggregator

- Collects from multiple independent news/search providers
- Ensures viewpoint diversity
- Outputs raw evidence corpus

---

### Agent 2 — Source Credibility Scorer

Assigns credibility using:

- Domain reputation
- Historical accuracy
- Prior oracle performance

Maintains a **dynamic reputation registry**.

---

### Agent 3 — Fake News & Manipulation Detector

- Analyzes linguistic patterns
- Detects virality anomalies
- Identifies coordinated misinformation

Flags suspicious narratives and sources.

---

### Agent 4 — Fact-Check Validator

- Cross-references fact-check databases
- Identifies false or disputed claims
- Annotates evidence with verification status

---

### Agent 5 — Temporal Evidence Tracker

- Monitors narrative evolution
- Detects corrections and retractions
- Prioritizes recent authoritative updates

---

## 6. AI Consensus Engine

All agent outputs are combined into a probabilistic decision model.

### Core Functions

- Normalize agent scores
- Weight by credibility and recency
- Resolve contradictions
- Output:

**Result:** `YES / NO / UNDETERMINED`  
**Confidence Score:** `0–100%`

> The engine prefers uncertainty over false certainty.

---

## 7. Confidence-Based Settlement Logic

| Confidence Level | Action                           |
| ---------------- | -------------------------------- |
| **> 85%**        | Automatic settlement             |
| **70–85%**       | Delay + re-evaluation            |
| **< 70%**        | Dispute or governance escalation |

This prevents forced resolution under weak evidence.

---

## 8. On-Chain Settlement & State Updates

Once finalized:

- Market outcome is written on-chain
- Source reputation scores updated
- Evidence hashes stored for auditability

> On-chain data is minimal — full evidence remains verifiable off-chain.

---

## 9. Security & Manipulation Resistance

- Multi-source redundancy
- Reputation decay for unreliable sources
- Temporal tracking to counter late misinformation
- Governance escalation for edge cases

---

## 10. Extensibility

The system supports:

- New verification agents
- Custom confidence thresholds
- Domain-specific credibility models
- DAO-governed tuning

---

## 11. Final Outcome

This oracle functions as a **verification engine**, not a data pipe.

It enables prediction markets to resolve outcomes with:

✅ Resilience  
✅ Transparency  
✅ Quantified uncertainty  
✅ Manipulation resistance

---
