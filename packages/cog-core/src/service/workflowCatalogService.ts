export interface WorkflowInfo {
  id: string;
  name: string;
  description: string;
  dependencies: string[];
  adapterRequirements: string[];
  expectedInputs: string[];
  expectedOutputs: string[];
}

export class WorkflowCatalogService {
  private workflows: WorkflowInfo[] = [
    {
      id: "research-to-book-pipeline",
      name: "Research to Book Pipeline",
      description: "Synthesizes raw notes into a unified structured outline under L4 and passes it through an editorial gate.",
      dependencies: ["cog:domain:research", "cog:domain:editorial"],
      adapterRequirements: ["momAdapter"],
      expectedInputs: ["sources", "claims", "clusterId", "clusterValue", "resolutionId", "resolutionValue"],
      expectedOutputs: ["research-synthesis-emission", "editorial-reconciliation-emission"]
    },
    {
      id: "audit-compliance",
      name: "Audit and Compliance Evaluation",
      description: "Analyzes system observations against threshold boundaries to issue compliance resolutions.",
      dependencies: ["cog:domain:audit", "cog:domain:decision"],
      adapterRequirements: ["decisionAdapter"],
      expectedInputs: ["observations", "rules", "metricId", "metricValue", "optionId", "optionValue", "decisionId", "decisionValue", "threshold"],
      expectedOutputs: ["audit-explain-emission", "decision-outcome-emission"]
    }
  ];

  /**
   * Returns a list of runnable workflows, expected inputs, outputs, dependencies and adapter requirements.
   */
  listWorkflows(): WorkflowInfo[] {
    return this.workflows;
  }

  /**
   * Retrieves specific workflow details.
   */
  getWorkflow(id: string): WorkflowInfo | undefined {
    return this.workflows.find((w) => w.id === id);
  }
}
