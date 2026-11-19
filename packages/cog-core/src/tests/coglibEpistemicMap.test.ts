import assert from "node:assert/strict";
import test from "node:test";
import {
  CognitiveObjectEnvelope,
  ToolResultEvidence,
  epistemicMapInstrument,
  validateCognitiveInstrumentContract,
} from "../index";

test("HDCP-COG-EPISTEMIC-MAP-042: Epistemic Map categorizes complex cognitive state without scalar collapse", () => {
  assert.equal(validateCognitiveInstrumentContract(epistemicMapInstrument).valid, true);

  const complexEnvelope: CognitiveObjectEnvelope<{ architecture: string }> = {
    envelopeId: "cogop:env:complex-system-001",
    protocolVersion: "cogop/1.0",
    objectId: "obj-autonomous-flight-control",
    objectType: "avionics_architecture",
    scope: "aviation:control_loop",
    frameAndIntent: { frame: "avionics_safety", intent: "Certify fly-by-wire redundancy" },
    payload: { architecture: "Triple Modular Redundancy (TMR)" },
    assumptions: [
      "Common mode software failure will not crash all 3 flight computers simultaneously",
      "Sensor drift is zero mean Gaussian",
    ],
    epistemicState: {
      confidence: 0.85,
      tensions: [
        "Direct conflict between Boeing FAA certification spec and Airbus EASA cert rule",
        "Unresolved latency jitter under hydraulic actuator saturation",
      ],
    },
    grounding: {
      sourceAnchors: ["spec:faa-dox-178c", "report:nasa-tmr-study-2022"],
      groundingSources: ["doc:faa", "doc:nasa"],
    },
    provenance: {
      originRuntime: "runtime:avionics-lab",
      lineage: ["genesis", "shape:tmr"],
      createdAt: "2026-08-18T20:00:00Z",
    },
    capabilityContext: {
      mountedCapabilities: ["capability:domain:aerospace-safety"],
    },
    permissions: { allowMutation: true, permittedOperations: ["compare", "challenge"], allowAuthorityEscalation: false, requireChangeDisclosure: true },
  };

  const attachedEvidence: ToolResultEvidence[] = [
    {
      evidenceId: "evidence:tool:pitot-static-sensor",
      epistemicRole: "MEASUREMENT",
      governanceAuthority: "canonical",
      evidentiaryStrength: "decisive",
      sourceReliability: "calibrated_hardware",
      scope: "aviation:control_loop",
      observedAt: "2026-08-18T20:10:00Z",
      confidence: 0.99,
      data: { airspeedKnots: 240 },
      limitations: [],
      tensionsSurfaced: [],
      provenance: { toolId: "tool:pitot-probe", executionInvocationId: "inv-pitot-1" },
    },
    {
      evidenceId: "evidence:tool:expired-wind-tunnel",
      epistemicRole: "SIMULATION",
      governanceAuthority: "advisory",
      evidentiaryStrength: "suggestive",
      sourceReliability: "stochastic_model",
      scope: "aviation:control_loop",
      observedAt: "2024-01-01T00:00:00Z",
      freshnessExpiresAt: "2024-01-02T00:00:00Z", // Stale!
      confidence: 0.7,
      data: { stallMarginDeg: 4.5 },
      limitations: ["Sub-scale wind tunnel test"],
      tensionsSurfaced: [],
      provenance: { toolId: "tool:sim:cfd", executionInvocationId: "inv-sim-expired" },
    },
  ];

  const report = epistemicMapInstrument.project({
    envelope: complexEnvelope,
    attachedEvidence,
  });

  const proj = report.structuredProjection;

  // Verify Multidimensional Categorization
  assert.equal(proj.categoryCounts.ASSUMED, 2);
  assert.equal(proj.categoryCounts.KNOWN, 1); // spec:faa-dox-178c
  assert.equal(proj.categoryCounts.REMEMBERED, 1); // report:nasa-tmr-study-2022
  assert.equal(proj.categoryCounts.CONFLICTING, 1); // Direct conflict Boeing vs Airbus
  assert.equal(proj.categoryCounts.UNRESOLVED, 1); // Latency jitter tension
  assert.equal(proj.categoryCounts.MEASURED, 1); // Pitot sensor
  assert.equal(proj.categoryCounts.STALE, 1); // Expired wind tunnel
  assert.equal(proj.categoryCounts.DOMAIN_DERIVED, 1); // Aerospace safety ME

  // Epistemic Posture: Stale evidence & conflicting tensions make posture degraded/vulnerable
  assert.equal(proj.overallEpistemicPosture, "degraded");
  assert.ok(proj.criticalVulnerabilities.some((v) => v.includes("stale evidence")));
  assert.ok(proj.criticalVulnerabilities.some((v) => v.includes("conflicting contradictions")));

  // Verify Findings
  assert.ok(report.findings.length >= 2);
  assert.ok(report.findings.every((f) => f.sourceEvidence.includes("obj-autonomous-flight-control")));
});
