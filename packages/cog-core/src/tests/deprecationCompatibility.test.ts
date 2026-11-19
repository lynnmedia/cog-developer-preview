import assert from "node:assert/strict";
import test from "node:test";
import {
  compileCog,
  executeCog,
  lex,
  parseCog,
  type CogDomainAdapter,
  type CoreExecutionContext
} from "../index";

test("Deprecated loadCanonicalRef is invoked as fallback if resolveExternalRef is absent", async () => {
  let loadCanonicalRefCalled = false;

  const legacyAdapter: CogDomainAdapter = {
    adapterId: "legacy-test-adapter",
    enrichPlan: (plan) => ({
      ...plan,
      steps: [
        {
          id: "adapter-bind-legacy-record",
          phase: "bind",
          targetKind: "external-ref",
          targetId: "legacy-record",
          targetRef: "legacy:record",
          status: "PENDING",
        },
        ...plan.steps,
      ],
    }),
    async loadCanonicalRef(ref, context) {
      loadCanonicalRefCalled = true;
      return {
        ref: `legacy:${ref.ref}`,
        kind: "legacy-record",
        adapterId: "legacy-test-adapter",
        origin: "adapter",
      };
    }
  };

  const source = `
define entity "signal" {
  kind: record
}

emit {
  kind: digest
}
  `.trim();

  const ir = compileCog(parseCog(lex(source)));
  const context: CoreExecutionContext = {
    runId: "legacy-compatibility-run",
    mode: "batch",
    startedAt: new Date().toISOString()
  };

  const result = await executeCog(ir, context, legacyAdapter);

  assert.equal(result.success, true);
  assert.equal(loadCanonicalRefCalled, true, "loadCanonicalRef should be called since resolveExternalRef is not implemented");
  assert.deepEqual(result.bindings["legacy:record"], {
    ref: "legacy:legacy:record",
    kind: "legacy-record",
    adapterId: "legacy-test-adapter",
    origin: "adapter",
  });
});
