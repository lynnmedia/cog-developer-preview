import type { DomainLibrary } from "../contract";

export const researchLibrary: DomainLibrary = {
  id: "cog:domain:research",
  name: "Research Synthesis Library",
  description: "Library for source observation, claim extraction, comparison, clustering, and final synthesis resolution.",
  capabilities: ["research-synthesis"],
  supportedPatterns: ["source-to-claim", "claim-clustering", "synthesis-resolution"],

  generate(params: {
    sources: Array<{ id: string; value: string }>;
    claims: Array<{ id: string; sourceId: string; value: string }>;
    clusterId?: string;
    clusterValue?: string;
    resolutionId?: string;
    resolutionValue?: string;
  }): string {
    const clusterId = params.clusterId ?? "synthesis-cluster";
    const clusterVal = params.clusterValue ?? "clustered-claims";
    const resolutionId = params.resolutionId ?? "final-resolution";
    const resolutionVal = params.resolutionValue ?? "synthesized-conclusion";

    const lines: string[] = [];

    // Define source entities (L1 observations)
    for (const src of params.sources) {
      lines.push(`define entity "${src.id}" {`);
      lines.push(`  kind: "observation"`);
      lines.push(`  level: L1`);
      lines.push(`  value: "${src.value}"`);
      lines.push(`}`);
      lines.push(``);
    }

    // Define claims (L2 extractions)
    for (const claim of params.claims) {
      lines.push(`define entity "${claim.id}" {`);
      lines.push(`  kind: "extraction"`);
      lines.push(`  level: L2`);
      lines.push(`  value: "${claim.value}"`);
      lines.push(`}`);
      lines.push(``);
    }

    // Define synthesis cluster (L3 cluster)
    lines.push(`define entity "${clusterId}" {`);
    lines.push(`  kind: "cluster"`);
    lines.push(`  level: L3`);
    lines.push(`  value: "${clusterVal}"`);
    lines.push(`}`);
    lines.push(``);

    // Define final resolution (L4 resolution)
    lines.push(`define entity "${resolutionId}" {`);
    lines.push(`  kind: "resolution"`);
    lines.push(`  level: L4`);
    lines.push(`  value: "${resolutionVal}"`);
    lines.push(`}`);
    lines.push(``);

    // Relate sources to claims (claim extraction)
    for (const claim of params.claims) {
      lines.push(`relate "${claim.sourceId}" -> "${claim.id}" {`);
      lines.push(`  kind: "extracts"`);
      lines.push(`  operation: "extract"`);
      lines.push(`}`);
      lines.push(``);
    }

    // Compare claims (Optional/standard comparison step if >1 claim)
    if (params.claims.length > 1) {
      for (let i = 0; i < params.claims.length - 1; i++) {
        const current = params.claims[i];
        const next = params.claims[i + 1];
        if (current && next) {
          lines.push(`relate "${current.id}" -> "${next.id}" {`);
          lines.push(`  kind: "differs-from"`);
          lines.push(`  operation: "compare"`);
          lines.push(`}`);
          lines.push(``);
        }
      }
    }

    // Cluster claims
    for (const claim of params.claims) {
      lines.push(`relate "${claim.id}" -> "${clusterId}" {`);
      lines.push(`  kind: "clustered-into"`);
      lines.push(`  operation: "group"`);
      lines.push(`}`);
      lines.push(``);
    }

    // Resolve cluster to L4 resolution
    lines.push(`resolve "${clusterId}" to L4 {`);
    lines.push(`  operation: "resolve"`);
    lines.push(`  reason: "synthesis-complete"`);
    lines.push(`}`);
    lines.push(``);

    lines.push(`relate "${clusterId}" -> "${resolutionId}" {`);
    lines.push(`  kind: "resolves-to"`);
    lines.push(`  operation: "resolve"`);
    lines.push(`}`);
    lines.push(``);

    // Emit final resolution
    lines.push(`emit {`);
    lines.push(`  target: "${resolutionId}"`);
    lines.push(`  kind: "research-synthesis"`);
    lines.push(`}`);

    return lines.join("\n").trim();
  },
};
