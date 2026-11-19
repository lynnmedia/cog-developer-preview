# WORKFLOW.md — Milestone Execution Protocol v1.0

## Purpose
Establish a deterministic, milestone-driven development workflow using:
- ChatGPT (Planning / Validation)
- Codex (Implementation)
- Human (Arbiter)

---

## Core Principles

1. Work is executed in **Milestones**, not tasks
2. Only **one active milestone per repo**
3. Every milestone must be:
   - Clearly defined
   - Fully validated
   - Explicitly closed

---

## Milestone Contract (Required Before Work Begins)

Each milestone MUST define:

- **Objective**
  What is being achieved

- **Scope**
  What is included and excluded

- **Acceptance Criteria**
  Binary conditions for completion

- **Evidence Requirements**
  What must be shown to prove completion

---

## Execution Loop (Per Round)

1. ChatGPT produces Codex Prompt
2. Codex executes
3. Human provides Codex summary
4. ChatGPT evaluates:
   - PASS / FAIL / PARTIAL
   - Corrections
   - Next step

---

## Milestone Completion Requirements

A milestone is COMPLETE only when:

- All acceptance criteria are satisfied
- Evidence requirements are met
- No regressions detected
- STATE.md is updated

---

## Regression Safety (Required)

Each milestone must verify:

- Build passes
- No broken routes/pages
- No API regressions
- No unintended side effects

---

## Milestone Sizing Rules

- Small: 1–3 rounds
- Standard: 4–10 rounds
- Large: MUST be split

If validation is unclear → milestone is too large

---

## STATE.md Responsibilities

STATE.md must always reflect:

- Current Milestone
- Completed Milestones
- Known Issues
- Active Feature Flags
- System Health Notes

---

## End-of-Session Protocol

Before stopping work:

1. Validate milestone completion OR checkpoint partial state
2. Update STATE.md
3. Define next milestone (if known)

---

## Non-Negotiables

- No drifting scope mid-milestone
- No skipping validation
- No partial milestone closure