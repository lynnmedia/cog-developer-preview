# Cog Cognitive Test Capability Matrix (v0.1)

## Executive Summary
This document records the cognitive testing capabilities, observable semantics, assertable invariants, empirical corpus proofs, and identified semantic gaps across the Cog Developer Preview kernel (`@cog/core`).

Testing is conducted directly through the typed scenario model (`packages/cog-core/src/testing/scenario.ts`) and suite runner (`packages/cog-core/src/testing/runner.ts`) integrated with Node.js native test infrastructure.

---

## 1. Cognitive Property Matrix

| Cognitive Property | Observable in Runtime? | Assertable in Vocabulary? | Corpus Proof? | Status & Gap Notes |
| :--- | :---: | :---: | :---: | :--- |
| **Output Emissions** | Yes | Yes (`assertCogOutput`) | Yes (`POS-01..06`, `MR-1A..2B`) | Fully proven across Core and companion adapters. |
| **Execution State** | Yes | Yes (`assertCogState`) | Yes (`POS-01..06`, `NEG-01..06`) | Deterministic status, adapter ID, errors. |
| **Execution Trace** | Yes | Yes (`assertTraceContains`) | Yes (`POS-01`, `INV-01`, `MR-1A`) | Step-by-step phase timing and status inspection. |
| **Level Transitions** | Yes | Yes (`assertTransitionOccurred`) | Yes (`POS-01..04`, `REC-01..02`) | Resolution level transitions (L1–L5) verified. |
| **Invalid Rejection** | Yes | Yes (`assertBlockedBecause`) | Yes (`NEG-01..06`) | Compile/parse/syntax and structural errors rejected with diagnostic messages. |
| **Governed Blocking** | Yes | Yes (`assertBlocked`) | Yes (`BLK-01..05`) | Structural validity preserved; blocked by constraint guards, authority limits, or evidence expiry. |
| **Recovery Paths** | Yes | Yes (`assertCogOutput`, `assertTransitionOccurred`) | Yes (`REC-01..04`) | Governed fallbacks, multi-source corroboration, advisory routing, and memory conflict resolution proven. |
| **Authority Precedence** | Yes | Yes (`getAuthorityRank`, `assertInvariantPreserved`) | Yes (`INV-02`, `REC-04`, `BLK-02`) | Monotonic authority ranking (canonical > project > episodic > semantic > inferred). |
| **Memory Isolation** | Yes | Yes (`assertMemoryUnchanged`, `assertInvariantPreserved`) | Yes (`INV-05`) | Context memory remains unmutated across execution runs. |
| **Provenance Retention** | Yes | Yes (`assertInvariantPreserved`) | Yes (`INV-04`) | Transformed entities retain origin metadata and compiled bindings. |
| **Anti-Data-Laundering**| Yes | Yes (`assertInvariantPreserved`) | Yes (`INV-06`, `BLK-02`) | Untrusted external tool evidence cannot masquerade as canonical memory without review. |
| **Semantic Equivalence** | Yes | Yes (`assertCogOutput`, deep equality) | Yes (`MR-2A`, `MR-2B`) | Text source vs `CogProgramBuilder` and independent statement permutations proven equivalent. |
| **Context Stability** | Yes | Yes (`assertCogOutput`, step length) | Yes (`MR-1A`, `MR-1B`) | Extraneous environment vars and irrelevant metadata do not alter outputs or trace steps. |
| **Evidence Monotonicity**| Yes | Yes (`assertCogOutput`, `effectiveConfidence`) | Yes (`MR-3A`, `MR-3B`) | Corroborating evidence increases confidence without unauthorized level elevation. |
| **Restriction Monotonicity**| Yes | Yes (`assertBlocked`) | Yes (`MR-4A`, `MR-4B`) | Adding STRICT constraints only restricts or preserves outcomes, never expands success. |
| **Intent Preservation** | Partial | Partial (`assertEvaluation`) | Recorded Gap | Intent is implicit in AST/IR graphs; no separate formal intent specification language exists (recorded gap). |

---

## 2. Six Corpus Classes & Classifications

```text
Class 1: POSITIVE (6/6 PASS)
  POS-01: Research Evidence Synthesis                   -> PASS
  POS-02: Editorial Content Refinement                  -> PASS
  POS-03: Decision Analysis & Tradeoff Selection        -> PASS
  POS-04: Audit Verification & Compliance Trail         -> PASS
  POS-05: Graph Knowledge Multi-Node Connection         -> PASS
  POS-06: Companion Adapter Execution (@cog/adapter-mom)-> PASS

Class 2: NEGATIVE (6/6 PASS)
  NEG-01: Undefined Entity in Relation Source           -> EXPECTED_REJECTION
  NEG-02: Undefined Entity in Relation Target           -> EXPECTED_REJECTION
  NEG-03: View Referencing Non-Existent Target          -> EXPECTED_REJECTION
  NEG-04: Resolution on Undeclared Target               -> EXPECTED_REJECTION
  NEG-05: Constraint with Missing Target                -> EXPECTED_REJECTION
  NEG-06: Transform Referencing Undeclared Target       -> EXPECTED_REJECTION

Class 3: BLOCKED (5/5 PASS)
  BLK-01: Structurally Valid Program Blocked by Guard   -> EXPECTED_BLOCK
  BLK-02: Blocked by Low-Authority Tool Memory Update   -> EXPECTED_BLOCK
  BLK-03: Blocked by Stale Epistemic Evidence Window    -> EXPECTED_BLOCK
  BLK-04: Blocked by Invalid Domain Capability Def      -> EXPECTED_BLOCK
  BLK-05: Blocked by Guarded Envelope Rejection         -> EXPECTED_BLOCK

Class 4: RECOVERY (4/4 PASS)
  REC-01: Governed Fallback to Provisional Level        -> RECOVERY_PROVEN
  REC-02: Recovery via Corroborating Multi-Source Supp  -> RECOVERY_PROVEN
  REC-03: Recovery through Advisory Constraint Pathway  -> RECOVERY_PROVEN
  REC-04: Memory Conflict Recovery via Authority Recon  -> RECOVERY_PROVEN

Class 5: INVARIANT (6/6 PASS)
  INV-01: Deterministic Trace Repeatability Invariant   -> INVARIANT_PROVEN
  INV-02: Authority Rank Monotonic Order Invariant      -> INVARIANT_PROVEN
  INV-03: Recommendation is not Authorization Invariant -> INVARIANT_PROVEN
  INV-04: Provenance Attachment Invariant Across Trace  -> INVARIANT_PROVEN
  INV-05: Memory Isolation Scope Invariant              -> INVARIANT_PROVEN
  INV-06: Zero Data Laundering Invariant                -> INVARIANT_PROVEN

Class 6: METAMORPHIC (8/8 PASS)
  MR-1A: Irrelevant Environment Variables Stability    -> METAMORPHIC_RELATION_PROVEN
  MR-1B: Irrelevant Entity Metadata Stability           -> METAMORPHIC_RELATION_PROVEN
  MR-2A: Programmatic Builder vs Text Equivalence       -> METAMORPHIC_RELATION_PROVEN
  MR-2B: Permutation of Independent Declarations Equiv  -> METAMORPHIC_RELATION_PROVEN
  MR-3A: Corroborating Evidence Monotonicity            -> METAMORPHIC_RELATION_PROVEN
  MR-3B: Tool Evidence Epistemic Influence Monotonicity -> METAMORPHIC_RELATION_PROVEN
  MR-4A: STRICT Constraint Monotonic Restriction        -> METAMORPHIC_RELATION_PROVEN
  MR-4B: Restriction Monotonicity on Enforcement        -> METAMORPHIC_RELATION_PROVEN
```

---

## 3. Discovered Semantic & Architectural Gaps

1. **Intent Formalization Gap**:
   - Cog represents transformations, entities, relations, constraints, and views explicitly in AST/IR. However, it does not currently define a standalone formal specification of "intent" separate from the executable graph. Testing of intent preservation relies on graph structural invariants and emission evaluations.
2. **Dynamic Runtime Feedback Channel Gap**:
   - In single-pass batch execution (`executeCog`), blocked programs do not automatically execute retry loops within the kernel runtime itself; recovery branches must currently be modeled as explicit alternative paths or composed pipelines in the IR graph.
