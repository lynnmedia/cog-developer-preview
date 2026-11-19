# Cog Domain Library Tutorials

This document provides tutorials for four standard reference domain libraries provided with `@winmedia/cog-core`: **Editorial Review**, **Research Synthesis**, **Decision Analysis**, and **Audit Reasoning**. Each tutorial explains the domain ontology mapping and demonstrates how to execute it on the Cog kernel.

---

## 1. Editorial Review Tutorial (`cog:domain:editorial`)

### Ontology & Concept
The Editorial Review domain models structured document drafting, claim verification, and revision:
- **Intake**: Defining initial draft documents and source text.
- **Review**: Reconciling disputed claims and recording status changes.
- **Verification**: Emitting editorial review records with explicit approval states.

### DSL Code Example (`editorial_review.cog`)
```cog
define entity "draft-document" {
  kind: "editorial:draft"
  level: L1
  value: "Initial manuscript chapter."
}

define entity "reviewed-chapter" {
  kind: "editorial:chapter"
  level: L2
  value: "Reconciled manuscript chapter."
}

relate "draft-document" -> "reviewed-chapter" {
  kind: "reconciled_to"
}

resolve "reviewed-chapter" to L2 {
  editorial_status: "approved"
}

emit {
  target: "reviewed-chapter"
  kind: "editorial:publication_ready"
}
```

---

## 2. Research Synthesis Tutorial (`cog:domain:research`)

### Ontology & Concept
The Research Synthesis domain models scientific synthesis, observation extraction, and hypothesis resolution:
- **Observation Intake**: Collecting empirical observations and citation evidence.
- **Claim Extraction**: Extracting structured claims from primary sources.
- **Clustering & Resolution**: Grouping corroborated claims into synthesis resolutions.

### DSL Code Example (`research_synthesis.cog`)
```cog
define entity "signal-observation" {
  kind: "research:observation"
  level: L1
  value: "Telemetry confirms latency reduction."
}

define entity "latency-claim" {
  kind: "research:claim"
  level: L2
  value: "Optimized indexing reduces p99 latency by 35%."
}

relate "signal-observation" -> "latency-claim" {
  kind: "supports"
}

resolve "latency-claim" to L3 {
  evidence_weight: 0.95
}

emit {
  target: "latency-claim"
  kind: "research:findings_report"
}
```

---

## 3. Decision Analysis Tutorial (`cog:domain:decision`)

### Ontology & Concept
The Decision Analysis domain models multi-option evaluation, criteria scoring, and structured decision records:
- **Problem Statement**: Specifying the architectural or business problem.
- **Alternative Evaluation**: Evaluating multiple candidate options against constraints.
- **Decision Resolution**: Emitting a binding decision artifact with rationales.

### DSL Code Example (`decision_analysis.cog`)
```cog
define entity "problem-statement" {
  kind: "decision:problem"
  level: L1
  value: "Select storage backend for distributed cache."
}

define entity "chosen-option" {
  kind: "decision:option"
  level: L2
  value: "In-memory replicated Redis cluster."
}

relate "problem-statement" -> "chosen-option" {
  kind: "resolved_by"
}

resolve "chosen-option" to L2 {
  score: 0.92
  rationale: "Lowest latency with automated failover."
}

emit {
  target: "chosen-option"
  kind: "decision:record"
}
```

---

## 4. Audit Reasoning Tutorial (`cog:domain:audit`)

### Ontology & Concept
The Audit Reasoning domain models compliance checking, ledger verification, and certification:
- **Ledger Ingestion**: Loading verifiable entries and transaction records.
- **Policy Audit**: Validating entries against security and accounting rules.
- **Certification**: Emitting a cryptographically traceable audit certificate.

### DSL Code Example (`audit_reasoning.cog`)
```cog
define entity "ledger-entry" {
  kind: "audit:entry"
  level: L1
  value: "Transaction TX-9842 verified."
}

define entity "audit-certificate" {
  kind: "audit:certificate"
  level: L4
  value: "Clean compliance verification."
}

relate "ledger-entry" -> "audit-certificate" {
  kind: "certified_by"
}

resolve "audit-certificate" to L4 {
  status: "compliant"
}

emit {
  target: "audit-certificate"
  kind: "audit:certification"
}
```
