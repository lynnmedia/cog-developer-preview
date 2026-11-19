import assert from "node:assert/strict";
import test from "node:test";
import { lex, parseCog, compileCog, executeCog, validateCog } from "../index";
import type { CogDomainAdapter } from "../types/adapter";
import type { CoreExecutionContext } from "../types/context";

// A reusable Personal Coda revalidation template
const makeSource = (consentValue: string) => `
  define entity "reader-request" {
    kind: "personal_coda_request"
    level: L1
  }
  define entity "reader-consent" {
    kind: "consent_state"
    level: L1
    value: "${consentValue}"
  }
  define entity "coda-plan" {
    kind: "personal_coda_plan"
    level: L3
  }
  relate "reader-consent" -> "coda-plan" {
    kind: "permits"
  }
  resolve "coda-plan" to L4 {
    output: "ready"
  }
  emit {
    kind: "personal_coda_plan"
    target: "coda-plan"
  }
`.trim();

// Custom adapter verifying consent validation and persistence decisions
const makeAdapter = (): CogDomainAdapter => ({
  adapterId: "mom-revalidation-adapter",
  version: "0.1.0",
  validateProgram(ir, context) {
    const consentEntity = ir.entities.find(e => e.name === "reader-consent");
    const consentValue = consentEntity?.attributes?.value;
    
    if (consentValue !== "approved") {
      return {
        issues: [
          {
            code: "PCC_CONSENT_MISSING",
            severity: "error",
            message: "Execution blocked: Personal Coda requires explicit approved consent.",
          },
        ],
      };
    }
    return { issues: [] };
  },
  mapEmission(emission, ir, context) {
    const consentEntity = ir.entities.find(e => e.name === "reader-consent");
    const consentValue = consentEntity?.attributes?.value;
    const shouldPersist = consentValue === "approved";

    return {
      emissionId: emission.id,
      adapterId: this.adapterId,
      target: emission.targetRef,
      kind: "mom_personal_coda_plan",
      payload: {
        target: emission.targetRef,
        persistenceDecision: {
          persist: shouldPersist,
          reason: shouldPersist ? "User approved personalization consent." : "Consent denied or missing.",
        },
      },
    };
  },
});

test("Personal Coda Blocked Plan due to Denied/Missing Consent", async () => {
  const source = makeSource("denied");
  const ir = compileCog(parseCog(lex(source)));
  const adapter = makeAdapter();

  const context: CoreExecutionContext = {
    runId: "run-blocked-coda-1",
    mode: "strict",
    startedAt: new Date().toISOString(),
  };

  const result = await executeCog(ir, context, adapter);

  // Verification: Plan execution is blocked (success is false)
  assert.equal(result.success, false);
  assert.equal(result.validation.valid, false);
  assert.ok(result.validation.issues.find(i => i.code === "PCC_CONSENT_MISSING"));
  assert.equal(result.emissions.length, 0); // No emissions because execution was blocked
});

test("Personal Coda Persistence Decision Evidence when Consent Approved", async () => {
  const source = makeSource("approved");
  const ir = compileCog(parseCog(lex(source)));
  const adapter = makeAdapter();

  const context: CoreExecutionContext = {
    runId: "run-approved-coda-1",
    mode: "strict",
    startedAt: new Date().toISOString(),
  };

  const result = await executeCog(ir, context, adapter);

  // Verification: Plan execution succeeds
  assert.equal(result.success, true);
  assert.equal(result.validation.valid, true);
  assert.equal(result.emissions.length, 1);

  // Verification: Persistence decision is evidenced as true in payload
  const payload = result.emissions[0].payload as any;
  assert.ok(payload.persistenceDecision);
  assert.equal(payload.persistenceDecision.persist, true);
  assert.equal(payload.persistenceDecision.reason, "User approved personalization consent.");
});
