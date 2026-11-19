export interface MockResearchParams {
  sourceCount?: number;
  claimsPerSource?: number;
}

export class WorkflowFixtureLibrary {
  /**
   * Generates mock data structures for the research synthesis domain library.
   */
  getResearchFixture(params?: MockResearchParams) {
    const sourceCount = params?.sourceCount ?? 2;
    const claimsPerSource = params?.claimsPerSource ?? 2;

    const sources: Array<{ id: string; value: string }> = [];
    const claims: Array<{ id: string; sourceId: string; value: string }> = [];

    for (let s = 1; s <= sourceCount; s++) {
      const sourceId = `src-${s}`;
      sources.push({
        id: sourceId,
        value: `Mock observation source content ${s}`
      });
      for (let c = 1; c <= claimsPerSource; c++) {
        claims.push({
          id: `claim-${s}-${c}`,
          sourceId,
          value: `Extracted claim ${c} from source ${s}`
        });
      }
    }

    return {
      sources,
      claims,
      clusterId: "synthesis-cluster",
      clusterValue: "Clustered research claims",
      resolutionId: "synthesis-resolution",
      resolutionValue: "Final synthesized conclusion"
    };
  }

  /**
   * Generates mock data structures for the decision-analysis domain library.
   */
  getDecisionFixture() {
    return {
      metricId: "performance-metric",
      metricValue: 98.5,
      optionId: "option-deploy",
      optionValue: "Deploy production build",
      decisionId: "deployment-decision",
      decisionValue: "Approve deployment"
    };
  }

  /**
   * Generates mock data structures for the audit-reasoning domain library.
   */
  getAuditFixture() {
    return {
      targetId: "target-host",
      targetValue: "production-server-01",
      findings: [
        { id: "finding-port-open", value: "Port 22 is open to the public" },
        { id: "finding-old-kernel", value: "Linux kernel version is outdated" }
      ],
      evaluationId: "security-evaluation",
      evaluationValue: "Server security compliance failed",
      reportId: "compliance-report"
    };
  }

  /**
   * Generates mock data structures for the editorial-review domain library.
   */
  getEditorialFixture() {
    return {
      draftId: "article-draft",
      draftValue: "Hello word, this is a draft.",
      goldenId: "article-golden",
      goldenValue: "Hello world, this is a draft.",
      driftId: "typo-drift",
      driftValue: "Typo 'word' instead of 'world'",
      actionId: "correct-typo-action",
      actionValue: "Replace 'word' with 'world'",
      explanationId: "editorial-explanation",
      explanationValue: "Corrected common spelling typo."
    };
  }

  /**
   * Generates mock data structures for the planning-workflow domain library.
   */
  getPlanningFixture() {
    return {
      goalId: "q3-objective",
      goalValue: "Reduce latency by 20%",
      riskId: "database-bottleneck",
      riskValue: "Database I/O limits max throughput",
      planId: "db-caching-plan",
      planValue: "Implement Redis read-through caching"
    };
  }

  /**
   * Generates mock data structures for the governance-reasoning domain library.
   */
  getGovernanceFixture() {
    return {
      scopeId: "soc2-compliance-scope",
      scopeValue: "User authentication controls",
      evidenceId: "mfa-enforcement-log",
      evidenceValue: "MFA is active for all employees",
      resolutionId: "audit-pass-resolution",
      resolutionValue: "Authentication controls comply with SOC2"
    };
  }
}
