import assert from "node:assert/strict";
import test from "node:test";
import { WorkflowFixtureLibrary } from "../service/workflowFixtureLibrary";
import { CogDomainBuilder } from "../builder/cogDomainBuilder";
import { compileCog, lex, parseCog, validateCog } from "../index";

test("WorkflowFixtureLibrary generates valid structures for all domain builders and validates successfully", async () => {
  const lib = new WorkflowFixtureLibrary();

  // 1. Check generated values are present and structured correctly
  const research = lib.getResearchFixture();
  assert.equal(research.sources.length, 2);
  assert.equal(research.claims.length, 4);

  const decision = lib.getDecisionFixture();
  assert.equal(decision.metricId, "performance-metric");

  const audit = lib.getAuditFixture();
  assert.equal(audit.findings.length, 2);

  const editorial = lib.getEditorialFixture();
  assert.ok(editorial.draftValue);

  const planning = lib.getPlanningFixture();
  assert.ok(planning.goalValue);

  const gov = lib.getGovernanceFixture();
  assert.ok(gov.scopeValue);

  // 2. Compile and validate a program built using all these fixtures
  const builder = new CogDomainBuilder()
    .researchPattern(research)
    .decisionPattern(decision)
    .auditPattern(audit)
    .editorialPattern(editorial)
    .planningPattern(planning)
    .governancePattern(gov);

  const programText = builder.build();
  const ir = compileCog(parseCog(lex(programText)));
  const validation = await validateCog(ir, {
    context: { runId: "test-fixtures", mode: "batch", startedAt: new Date().toISOString() }
  });

  assert.equal(validation.valid, true);
});
