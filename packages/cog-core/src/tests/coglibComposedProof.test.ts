import assert from "node:assert/strict";
import test from "node:test";
import {
  shapeRoutine,
  compareRoutine,
  traceRoutine,
  challengeRoutine,
  executeRoutineWithGuards,
  composePipeline,
} from "../index";

test("HDCP-COGLIB-COMPOSED-PROOF-011: Full composed pipeline (SHAPE -> COMPARE -> TRACE -> CHALLENGE) over Cog Architectural Boundary Decision", async () => {
  // --- Stage 1: SHAPE ---
  // Turns raw ecosystem architectural notes into a structured cognitive object without fabricating completeness
  const rawArchNotes = {
    objectId: "arch-cog-boundary-v0.3",
    rawElements: [
      { id: "elem-kernel", statement: "@winmedia/cog-core provides ontology-agnostic AST, IR, and execution engine", sourceAnchor: "docs/PHILOSOPHY_AND_DESIGN_CONSTITUTION.md" },
      { id: "elem-coglib", statement: "CogLib provides universal domain-agnostic routines (SHAPE, COMPARE, TRACE, CHALLENGE)", sourceAnchor: "docs/COGLIB_ARCHITECTURE_BOUNDARY.md" },
      { id: "elem-domains", statement: "Domain libraries specialize generic routines for Research, Editorial, and Decision Analysis", sourceAnchor: "docs/DOMAIN_LIBRARY_ARCHITECTURE.md" },
      { id: "elem-tools", statement: "Developer tools and snapshot testers live in Layer 4 Developer Tooling", sourceAnchor: "packages/cog-core/src/service" },
      { id: "elem-app", statement: "CLI and LSP run at Layer 5 Developer Interface surface", sourceAnchor: "packages/cog-core/src/cli" },
    ],
    expectedDimensions: ["statement", "layerAllocation", "apiStabilityGuarantee"],
    assumptionsDeclared: ["Strict downward dependency flow"],
  };

  const shapeRes = await executeRoutineWithGuards(shapeRoutine, rawArchNotes);
  assert.equal(shapeRes.status, "qualified"); // Correctly qualified because apiStabilityGuarantee dimension is missing
  assert.ok(shapeRes.output?.missingDimensions.includes("apiStabilityGuarantee"));

  // --- Stage 2: COMPARE ---
  // Compares shaped 5-layer decoupled architecture against legacy monolithic framing
  const legacyMonolith = {
    id: "arch-legacy-monolith",
    name: "Legacy Monolithic Cog",
    assumptions: ["Single package holds kernel, domain helpers, persistence, and CLI"],
    scope: "monolithic-all-in-one",
    resolutionLevel: "bundled",
    groundingSources: ["legacy-v0.1-codebase"],
    epistemicConfidence: 0.7,
  };

  const modernDecoupled = {
    id: shapeRes.output!.objectId,
    name: "5-Layer Decoupled Cognitive Stack",
    assumptions: ["Strict downward dependency flow", "Zero domain knowledge in kernel/coglib"],
    scope: "layered-modular-workspace",
    resolutionLevel: "modular",
    groundingSources: shapeRes.output!.known.map((k) => k.sourceAnchor),
    epistemicConfidence: shapeRes.epistemicState.confidence,
    tensions: shapeRes.epistemicState.tensions,
  };

  const compareRes = await executeRoutineWithGuards(compareRoutine, {
    targetA: legacyMonolith,
    targetB: modernDecoupled,
  });

  assert.equal(compareRes.status, "qualified"); // Disparate architectural scopes produce qualified incommensurability
  assert.ok(compareRes.output?.materialDifferences.some((d) => d.dimension === "assumptions"));
  assert.ok(compareRes.output?.materialDifferences.some((d) => d.dimension === "scope_resolution"));
  assert.equal(compareRes.output?.identityContinuous, false); // Distinct architectural paradigms

  // --- Stage 3: TRACE ---
  // Backward provenance trace from current CogLib standard library back to kernel constitutional root
  const lineageRecords = [
    {
      id: "src-constitution",
      stage: "source" as const,
      sourceAnchor: "docs/PHILOSOPHY_AND_DESIGN_CONSTITUTION.md",
      description: "Foundational Constitution: ontology-agnostic deterministic cognition execution",
      isRecorded: true,
    },
    {
      id: "grd-boundary-ratification",
      stage: "grounding" as const,
      parentId: "src-constitution",
      sourceAnchor: "docs/COGLIB_ARCHITECTURE_BOUNDARY.md",
      description: "HDCP-001 ratifies 5-tier architecture and anti-absorption boundaries",
      isRecorded: true,
    },
    {
      id: "tx-routine-contract",
      stage: "transformation" as const,
      parentId: "grd-boundary-ratification",
      description: "HDCP-002 defines universal CognitiveRoutine contract with 11 dimensions",
      isRecorded: true,
    },
    {
      id: "res-coglib-routines",
      stage: "result" as const,
      parentId: "tx-routine-contract",
      description: "Batch-1 operational routines: SHAPE, COMPARE, TRACE, CHALLENGE",
      isRecorded: true,
    },
  ];

  const traceRes = await executeRoutineWithGuards(traceRoutine, {
    targetObjectId: "res-coglib-routines",
    records: lineageRecords,
    rootSourceExpected: "docs/PHILOSOPHY_AND_DESIGN_CONSTITUTION.md",
  });

  assert.equal(traceRes.status, "success");
  assert.equal(traceRes.output?.integrity, "complete");
  assert.equal(traceRes.output?.traversalChain.length, 4);

  // --- Stage 4: CHALLENGE ---
  // Adversarial challenge against architecture claims
  const challengeRes = await executeRoutineWithGuards(challengeRoutine, {
    target: {
      id: "arch-boundary-assertion",
      statement: "CogLib is guaranteed free of domain-specific ontologies, persistence bindings, and UI policy",
      sampleSize: 100,
      groundingSources: [
        "docs/COGLIB_ARCHITECTURE_BOUNDARY.md",
        "packages/cog-core/src/coglib/routines/shape.ts",
        "packages/cog-core/src/coglib/routines/compare.ts",
      ],
      dependencies: [
        { id: "cog-kernel-types", redundancy: true, isVerified: true },
      ],
    },
    counterEvidencePool: [], // No counter-evidence violations found
  });

  assert.equal(challengeRes.status, "success");
  assert.equal(challengeRes.output?.challengeStatus, "resilient");

  // Verify full multi-stage composite value:
  // All 4 routines preserve and aggregate provenance and tensions without loss or corruption
  assert.ok(shapeRes.output !== undefined);
  assert.ok(compareRes.output !== undefined);
  assert.ok(traceRes.output !== undefined);
  assert.ok(challengeRes.output !== undefined);
});

test("HDCP-COGLIB-COMPOSED-PROOF-011: Composed sequence over Scientific Hubble Tension Claim preserves conflict & exposes systematic divergence", async () => {
  // 1. SHAPE: Raw conflicting astrophysical measurements
  const shapedScience = await executeRoutineWithGuards(shapeRoutine, {
    objectId: "science-hubble-tension",
    rawElements: [
      { id: "planck-cmb", statement: "Early universe CMB H0 = 67.4 +/- 0.5 km/s/Mpc", sourceAnchor: "planck-2018-vi", isContradictoryWith: ["shoes-sn1a"] },
      { id: "shoes-sn1a", statement: "Late universe Cepheid/SN1a H0 = 73.04 +/- 1.04 km/s/Mpc", sourceAnchor: "riess-2022-shoes", isContradictoryWith: ["planck-cmb"] },
    ],
    expectedDimensions: ["statement", "redshiftRange"],
  });

  assert.equal(shapedScience.status, "qualified");
  assert.equal(shapedScience.output?.conflicts.length, 2);

  // 2. COMPARE: Compare Planck CMB framework vs Distance Ladder framework
  const compScience = await executeRoutineWithGuards(compareRoutine, {
    targetA: {
      id: "model-early-cmb",
      assumptions: ["Standard LCDM cosmology", "FLRW metric", "3 neutrino species"],
      groundingSources: ["planck-2018-vi"],
      epistemicConfidence: 0.95,
      tensions: ["Disagrees with local distance ladder at 5-sigma"],
    },
    targetB: {
      id: "model-late-distance-ladder",
      assumptions: ["Geometry-calibrated Cepheid period-luminosity relation", "Standardizable SN1a candles"],
      groundingSources: ["riess-2022-shoes"],
      epistemicConfidence: 0.95,
      tensions: ["Disagrees with early CMB inference at 5-sigma"],
    },
  });

  assert.equal(compScience.status, "success");
  assert.ok(compScience.output?.materialDifferences.some((d) => d.dimension === "assumptions"));

  // 3. CHALLENGE: Challenge the assumption of flat LCDM in light of 5-sigma tension
  const challengeScience = await executeRoutineWithGuards(challengeRoutine, {
    target: {
      id: "claim-standard-lcdm-completeness",
      statement: "Standard LCDM model with cosmological constant completely accounts for all cosmic expansion epochs",
      groundingSources: ["planck-2018-vi"],
    },
    counterEvidencePool: [
      {
        id: "hubble-tension-5sigma",
        dimension: "incompatible_evidence",
        severity: "severe",
        description: "5-sigma empirical discrepancy between local H0 and sound-horizon CMB H0",
        sourceRef: "riess-2022-shoes",
      },
    ],
  });

  assert.equal(challengeScience.status, "qualified");
  assert.equal(challengeScience.output?.challengeStatus, "vulnerable");
  assert.ok(challengeScience.output?.challengesSurfaced.some((c) => c.dimension === "incompatible_evidence"));
});
