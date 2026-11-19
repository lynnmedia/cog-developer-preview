import assert from "node:assert/strict";
import test from "node:test";
import {
  CognitiveObjectEnvelope,
  ToolResultEvidence,
  driftLensInstrument,
  epistemicMapInstrument,
  provenanceLineageInstrument,
  tensionFieldInstrument,
} from "../index";

test("HDCP-COG-INSTRUMENT-COMPOSED-PROOF-045: Four instruments together project rich longitudinal multi-runtime cognitive lifecycle", () => {
  // =========================================================================
  // 1. Prior Baseline State (V1 - Genesis)
  // =========================================================================
  const priorNavEnvelope: CognitiveObjectEnvelope<{ localizationEngine: string }> = {
    envelopeId: "cogop:env:rover-nav-v1",
    protocolVersion: "cogop/1.0",
    objectId: "obj-rover-navigation-subsystem",
    objectType: "navigation_architecture",
    scope: "rover:localization",
    frameAndIntent: { frame: "autonomous_robotics", intent: "Define rover localization pipeline" },
    payload: { localizationEngine: "Differential_GPS_with_Wheel_Odometry" },
    assumptions: [
      "GPS satellite constellation is continuously available",
      "Wheel slip on loose regolith is negligible (<2%)",
    ],
    epistemicState: {
      confidence: 0.9,
      tensions: [],
    },
    grounding: {
      sourceAnchors: ["spec/gps-nav-spec-2025.md"],
      groundingSources: ["doc:gps-spec"],
    },
    provenance: {
      originRuntime: "runtime:rover-edge",
      lineage: ["genesis", "shape:v1"],
      createdAt: "2026-01-01T00:00:00Z",
    },
    permissions: { allowMutation: true, permittedOperations: ["compare", "challenge"], allowAuthorityEscalation: false, requireChangeDisclosure: true },
  };

  // =========================================================================
  // 2. Current State (V2 - After SLAM revision, Tool Evidence, Science ME, and CogOP exchange)
  // =========================================================================
  const currentNavEnvelope: CognitiveObjectEnvelope<{ localizationEngine: string }> = {
    envelopeId: "cogop:env:rover-nav-v2",
    protocolVersion: "cogop/1.0",
    objectId: "obj-rover-navigation-subsystem", // Same Concept Identity
    objectType: "navigation_architecture",
    scope: "rover:localization",
    frameAndIntent: { frame: "autonomous_robotics", intent: "Upgrade to LiDAR SLAM with IMU fusion" },
    payload: { localizationEngine: "LiDAR_SLAM_with_Extended_Kalman_Filter" },
    assumptions: [
      "Wheel slip on loose regolith is negligible (<2%)", // Kept
      // Dropped: GPS continuity
      "Dust storms will not completely blind optical LiDAR receptors", // Added
    ],
    epistemicState: {
      confidence: 0.75,
      tensions: [
        "LiDAR receptor blinding during Martian dust storm causes catastrophic localization loss",
      ],
    },
    grounding: {
      sourceAnchors: ["spec/gps-nav-spec-2025.md", "trials/lunar-regolith-slam.log"],
      groundingSources: ["doc:gps-spec", "trial:slam"],
    },
    provenance: {
      originRuntime: "runtime:rover-edge",
      lineage: [
        "genesis",
        "shape:v1",
        "transformed_by(runtime:mission-control-verifier)",
        "science:sensor_noise_distribution",
        "transformed_by(runtime:rover-edge)",
      ],
      createdAt: "2026-01-01T00:00:00Z",
    },
    capabilityContext: {
      mountedCapabilities: ["capability:domain:scientific-inquiry"],
    },
    declaredMutations: [
      {
        timestamp: "2026-08-18T20:15:00Z",
        transformerRuntime: "runtime:mission-control-verifier",
        action: "MODIFIED",
        field: "payload.localizationEngine",
        rationale: "Replaced GPS with LiDAR SLAM due to crater satellite shadowing",
        previousValueSummary: "Differential_GPS",
        newValueSummary: "LiDAR_SLAM",
      },
    ],
    permissions: { allowMutation: true, permittedOperations: ["compare", "challenge"], allowAuthorityEscalation: false, requireChangeDisclosure: true },
  };

  const attachedEvidence: ToolResultEvidence[] = [
    {
      evidenceId: "evidence:tool:imu-telemetry-live",
      epistemicRole: "MEASUREMENT",
      governanceAuthority: "canonical",
      evidentiaryStrength: "decisive",
      sourceReliability: "calibrated_hardware",
      scope: "rover:localization",
      observedAt: "2026-08-18T20:18:00Z",
      confidence: 0.99,
      data: { angularVelocityDegSec: 0.05 },
      limitations: [],
      tensionsSurfaced: [],
      provenance: { toolId: "tool:sensor:imu", executionInvocationId: "inv-imu-1" },
    },
    {
      evidenceId: "evidence:tool:expired-crater-sim",
      epistemicRole: "SIMULATION",
      governanceAuthority: "advisory",
      evidentiaryStrength: "suggestive",
      sourceReliability: "stochastic_model",
      scope: "rover:localization",
      observedAt: "2024-01-01T00:00:00Z",
      freshnessExpiresAt: "2024-01-02T00:00:00Z", // Stale
      confidence: 0.65,
      data: { craterShadowPercent: 90 },
      limitations: ["Low fidelity crater mesh"],
      tensionsSurfaced: [],
      provenance: { toolId: "tool:sim:crater", executionInvocationId: "inv-crater-expired" },
    },
  ];

  const dependentObjectManifest = [
    { objectId: "rover-autonomous-path-planner", dependsOn: "obj-rover-navigation-subsystem" },
    { objectId: "rover-emergency-obstacle-brake", dependsOn: "obj-rover-navigation-subsystem" },
  ];

  // =========================================================================
  // 3. Apply All Four Instruments
  // =========================================================================

  // Instrument 1: Drift Lens
  const driftReport = driftLensInstrument.project({
    priorState: priorNavEnvelope,
    currentState: currentNavEnvelope,
  });
  assert.equal(driftReport.structuredProjection.identityContinuity, true);
  assert.equal(driftReport.structuredProjection.driftSeverity, "material");
  assert.deepEqual(driftReport.structuredProjection.assumptionDrift.dropped, [
    "GPS satellite constellation is continuously available",
  ]);

  // Instrument 2: Epistemic Map
  const epistemicReport = epistemicMapInstrument.project({
    envelope: currentNavEnvelope,
    attachedEvidence,
  });
  assert.equal(epistemicReport.structuredProjection.overallEpistemicPosture, "degraded"); // Due to stale simulation
  assert.equal(epistemicReport.structuredProjection.categoryCounts.STALE, 1);
  assert.equal(epistemicReport.structuredProjection.categoryCounts.DOMAIN_DERIVED, 1);

  // Instrument 3: Provenance & Lineage
  const lineageReport = provenanceLineageInstrument.project({
    envelope: currentNavEnvelope,
    attachedEvidence,
  });
  assert.equal(lineageReport.structuredProjection.runtimesInvolved.length, 2);
  assert.ok(lineageReport.structuredProjection.timeline.some((e) => e.stepKind === "declared_mutation"));

  // Instrument 4: Tension Field
  const tensionReport = tensionFieldInstrument.project({
    envelope: currentNavEnvelope,
    dependentObjectManifest,
  });
  assert.equal(tensionReport.structuredProjection.impactedDownstreamCount, 2);
  assert.ok(tensionReport.structuredProjection.tensionVectors.some((v) => v.description.includes("dust storm")));

  // =========================================================================
  // 4. Verification: No Underlying State Was Mutated
  // =========================================================================
  assert.equal(currentNavEnvelope.payload.localizationEngine, "LiDAR_SLAM_with_Extended_Kalman_Filter");
  assert.equal(currentNavEnvelope.epistemicState.confidence, 0.75);
});
