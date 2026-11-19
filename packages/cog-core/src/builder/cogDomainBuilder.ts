import { CogProgramBuilder } from "./cogProgramBuilder";

export class CogDomainBuilder extends CogProgramBuilder {
  researchPattern(params: {
    sources: Array<{ id: string; value: string }>;
    claims: Array<{ id: string; sourceId: string; value: string }>;
    clusterId: string;
    clusterValue: string;
    resolutionId: string;
    resolutionValue: string;
  }): this {
    for (const src of params.sources) {
      this.entity(src.id, { kind: "observation", level: "L1", value: src.value });
    }
    for (const cl of params.claims) {
      this.entity(cl.id, { kind: "extraction", level: "L2", value: cl.value });
      this.relate(cl.sourceId, cl.id, { kind: "extracts", operation: "extract" });
    }
    this.entity(params.clusterId, { kind: "cluster", level: "L3", value: params.clusterValue });
    for (const cl of params.claims) {
      this.relate(cl.id, params.clusterId, { kind: "clustered-into", operation: "group" });
    }
    this.entity(params.resolutionId, { kind: "resolution", level: "L4", value: params.resolutionValue });
    this.resolve(params.clusterId, "L4", { operation: "resolve", reason: "synthesis-complete" });
    this.relate(params.clusterId, params.resolutionId, { kind: "resolves-to", operation: "resolve" });
    this.emit(params.resolutionId, "research-synthesis");
    return this;
  }

  decisionPattern(params: {
    metricId: string;
    metricValue: number;
    optionId: string;
    optionValue: string;
    decisionId: string;
    decisionValue: string;
  }): this {
    this.entity(params.metricId, { kind: "metric", level: "L1", value: String(params.metricValue) });
    this.entity(params.optionId, { kind: "option", level: "L1", value: params.optionValue });
    this.entity(params.decisionId, { kind: "decision", level: "L2", value: params.decisionValue });
    this.relate(params.metricId, params.decisionId, { kind: "triggers", operation: "evaluate" });
    this.relate(params.optionId, params.decisionId, { kind: "chosen-from", operation: "evaluate" });
    this.emit(params.decisionId, "decision-workflow");
    return this;
  }

  auditPattern(params: {
    targetId: string;
    targetValue: string;
    findings: Array<{ id: string; value: string }>;
    evaluationId: string;
    evaluationValue: string;
    reportId: string;
  }): this {
    this.entity(params.targetId, { kind: "observation", level: "L1", value: params.targetValue });
    for (const f of params.findings) {
      this.entity(f.id, { kind: "finding", level: "L1", value: f.value });
      this.relate(params.targetId, f.id, { kind: "contains-finding", operation: "identify" });
    }
    this.entity(params.evaluationId, { kind: "evaluation", level: "L2", value: params.evaluationValue });
    for (const f of params.findings) {
      this.relate(f.id, params.evaluationId, { kind: "evaluated-by", operation: "classify" });
      this.resolve(f.id, "L2", { operation: "resolve", reason: "policy-violation" });
    }
    this.entity(params.reportId, { kind: "resolution", level: "L3", value: "completed-report" });
    this.relate(params.evaluationId, params.reportId, { kind: "resolves-to", operation: "resolve" });
    this.emit(params.reportId, "audit-report");
    return this;
  }

  editorialPattern(params: {
    draftId: string;
    draftValue: string;
    goldenId: string;
    goldenValue: string;
    driftId: string;
    driftValue: string;
    actionId: string;
    actionValue: string;
    explanationId: string;
    explanationValue: string;
  }): this {
    this.entity(params.draftId, { kind: "observation", level: "L1", value: params.draftValue });
    this.entity(params.goldenId, { kind: "expectation", level: "L1", value: params.goldenValue });
    this.entity(params.driftId, { kind: "drift", level: "L2", value: params.driftValue });
    this.entity(params.actionId, { kind: "action", level: "L2", value: params.actionValue });
    this.entity(params.explanationId, { kind: "explanation", level: "L3", value: params.explanationValue });

    this.constrain(params.draftId, "observe");
    this.relate(params.draftId, params.goldenId, { kind: "differs-from", operation: "compare" });
    this.relate(params.draftId, params.driftId, { kind: "has-drift", operation: "detect-drift" });
    this.resolve(params.driftId, "L2", { operation: "resolve", reason: "drift-detected" });
    this.relate(params.driftId, params.actionId, { kind: "mitigated-by", operation: "resolve" });
    this.relate(params.actionId, params.explanationId, { kind: "explained-by", operation: "explain" });
    this.emit(params.explanationId, "document-review");
    return this;
  }

  planningPattern(params: {
    goalId: string;
    goalValue: string;
    riskId: string;
    riskValue: string;
    planId: string;
    planValue: string;
  }): this {
    this.entity(params.goalId, { kind: "goal", level: "L1", value: params.goalValue });
    this.entity(params.riskId, { kind: "risk", level: "L2", value: params.riskValue });
    this.entity(params.planId, { kind: "formulated-plan", level: "L3", value: params.planValue });
    this.relate(params.goalId, params.riskId, { kind: "identifies-risk", operation: "classify" });
    this.relate(params.riskId, params.planId, { kind: "mitigates-risk", operation: "relate" });
    this.emit(params.planId, "planning-workflow");
    return this;
  }

  governancePattern(params: {
    scopeId: string;
    scopeValue: string;
    evidenceId: string;
    evidenceValue: string;
    resolutionId: string;
    resolutionValue: string;
  }): this {
    this.entity(params.scopeId, { kind: "governance-scope", level: "L1", value: params.scopeValue });
    this.entity(params.evidenceId, { kind: "governance-evidence", level: "L2", value: params.evidenceValue });
    this.entity(params.resolutionId, { kind: "governance-evaluation", level: "L3", value: params.resolutionValue });
    this.relate(params.scopeId, params.evidenceId, { kind: "evaluated-by", operation: "classify" });
    this.relate(params.evidenceId, params.resolutionId, { kind: "verifies-compliance", operation: "relate" });
    this.emit(params.resolutionId, "governance-reasoning");
    return this;
  }
}
