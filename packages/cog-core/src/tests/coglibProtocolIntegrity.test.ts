import assert from "node:assert/strict";
import test from "node:test";
import {
  CognitiveObjectEnvelope,
  applyGovernedEnvelopeTransformation,
  validateTransformationIntegrity,
} from "../index";

const baseEnvelope: CognitiveObjectEnvelope<{ title: string; status: string }> = {
  envelopeId: "cogop:env:task-alpha-001",
  protocolVersion: "cogop/1.0",
  objectId: "obj-task-alpha",
  objectType: "task_plan",
  scope: "project:cog",
  frameAndIntent: { frame: "planning", intent: "Execute phase 1" },
  payload: { title: "Phase 1 Planning", status: "draft" },
  assumptions: ["Team available full time"],
  epistemicState: {
    confidence: 0.8,
    tensions: ["Uncertain bandwidth during sprint"],
  },
  grounding: {
    sourceAnchors: ["spec-alpha.md"],
    groundingSources: ["doc:spec-alpha"],
  },
  provenance: {
    originRuntime: "runtime:node-a",
    lineage: ["genesis"],
    createdAt: "2026-08-18T20:00:00Z",
  },
  memoryContext: {
    authorityLevel: "project",
  },
  permissions: {
    allowMutation: true,
    permittedOperations: ["shape", "compare", "challenge"],
    allowAuthorityEscalation: false,
    requireChangeDisclosure: true,
  },
};

test("HDCP-COG-PROTOCOL-INTEGRITY-AND-AUTHORITY-034: Permitted transformations record declared mutations, append anchors, and preserve lineage", () => {
  const transformed = applyGovernedEnvelopeTransformation(baseEnvelope, {
    transformerRuntime: "runtime:node-b",
    newPayload: { title: "Phase 1 Planning", status: "reviewed" },
    addedAssumptions: ["CI/CD automated pipeline active"],
    addedTensions: ["Staging environment flaky"],
    addedSourceAnchors: ["audit-review-2026.md"],
    addedGroundingSources: ["tool:audit:linter"],
    mutationRecords: [
      {
        timestamp: "2026-08-18T20:05:00Z",
        transformerRuntime: "runtime:node-b",
        action: "MODIFIED",
        field: "payload.status",
        rationale: "Reviewed against automated lint criteria",
        previousValueSummary: "draft",
        newValueSummary: "reviewed",
      },
    ],
  });

  // Valid transformation passes integrity validation
  const report = validateTransformationIntegrity(baseEnvelope, transformed);
  assert.equal(report.valid, true);

  // Lineage is monotonically extended
  assert.ok(transformed.provenance.lineage.includes("transformed_by(runtime:node-b)"));
  // Source anchors and tensions are monotonically preserved & unioned
  assert.ok(transformed.grounding.sourceAnchors.includes("spec-alpha.md"));
  assert.ok(transformed.grounding.sourceAnchors.includes("audit-review-2026.md"));
  assert.ok(transformed.epistemicState.tensions.includes("Uncertain bandwidth during sprint"));
  assert.ok(transformed.epistemicState.tensions.includes("Staging environment flaky"));
});

test("HDCP-COG-PROTOCOL-INTEGRITY-AND-AUTHORITY-034: Unauthorized semantic mutations fail closed", () => {
  // 1. Identity substitution
  const substitutedIdEnvelope: CognitiveObjectEnvelope = {
    ...baseEnvelope,
    objectId: "obj-task-substituted",
  };
  const report1 = validateTransformationIntegrity(baseEnvelope, substitutedIdEnvelope);
  assert.equal(report1.valid, false);
  assert.ok(report1.violations.some((v) => v.includes("Concept Identity violated")));

  // 2. Stripped source anchors
  const strippedAnchorEnvelope: CognitiveObjectEnvelope = {
    ...baseEnvelope,
    grounding: { sourceAnchors: [], groundingSources: [] },
  };
  const report2 = validateTransformationIntegrity(baseEnvelope, strippedAnchorEnvelope);
  assert.equal(report2.valid, false);
  assert.ok(report2.violations.some((v) => v.includes("Source anchor stripped")));

  // 3. Tension deletion / suppression
  const deletedTensionEnvelope: CognitiveObjectEnvelope = {
    ...baseEnvelope,
    epistemicState: { confidence: 0.8, tensions: [] }, // Deleted active tension!
  };
  const report3 = validateTransformationIntegrity(baseEnvelope, deletedTensionEnvelope);
  assert.equal(report3.valid, false);
  assert.ok(report3.violations.some((v) => v.includes("Unresolved tension suppressed")));

  // 4. Confidence inflation without new anchors
  const inflatedConfidenceEnvelope: CognitiveObjectEnvelope = {
    ...baseEnvelope,
    epistemicState: { confidence: 1.0, tensions: baseEnvelope.epistemicState.tensions }, // Inflated from 0.8 to 1.0
  };
  const report4 = validateTransformationIntegrity(baseEnvelope, inflatedConfidenceEnvelope);
  assert.equal(report4.valid, false);
  assert.ok(report4.violations.some((v) => v.includes("Confidence inflation detected")));

  // 5. Mutation when allowMutation = false
  const immutableEnvelope: CognitiveObjectEnvelope = {
    ...baseEnvelope,
    permissions: { ...baseEnvelope.permissions, allowMutation: false },
  };
  const mutatedImmutable: CognitiveObjectEnvelope = {
    ...immutableEnvelope,
    payload: { title: "Changed Title", status: "draft" },
  };
  const report5 = validateTransformationIntegrity(immutableEnvelope, mutatedImmutable);
  assert.equal(report5.valid, false);
  assert.ok(report5.violations.some((v) => v.includes("Unauthorized mutation")));
});
