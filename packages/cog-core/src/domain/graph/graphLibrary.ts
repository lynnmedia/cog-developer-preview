import type { DomainLibrary } from "../contract";

export const graphLibrary: DomainLibrary = {
  id: "cog:domain:graph",
  name: "Knowledge Graph Library",
  description: "Library for sensor observation, entity profile identification, multi-relation linking, clustering, and explanatory correlation logic.",
  capabilities: ["knowledge-graph"],
  supportedPatterns: ["profile-identification", "graph-clustering", "correlation-explanation"],

  generate(params: {
    sensorId?: string;
    sensorVal?: string;
    profiles?: Array<{ id: string; value: string }>;
    clusterId?: string;
    clusterVal?: string;
    explanationId?: string;
    explanationVal?: string;
  }): string {
    const sensorId = params.sensorId ?? "sensor-stream";
    const sensorVal = params.sensorVal ?? "network-log-data";
    const profiles = params.profiles ?? [
      { id: "profile-host", value: "host-10.0.0.1" },
      { id: "profile-user", value: "user-admin" },
    ];
    const clusterId = params.clusterId ?? "network-cluster";
    const clusterVal = params.clusterVal ?? "admin-activity-graph";
    const explanationId = params.explanationId ?? "explanation-node";
    const explanationVal = params.explanationVal ?? "correlated-admin-access-reasoning";

    const lines: string[] = [];

    // Define sensor (L1 observation)
    lines.push(`define entity "${sensorId}" {`);
    lines.push(`  kind: "observation"`);
    lines.push(`  level: L1`);
    lines.push(`  value: "${sensorVal}"`);
    lines.push(`}`);
    lines.push(``);

    // Define profiles (L1 profiles)
    for (const p of profiles) {
      lines.push(`define entity "${p.id}" {`);
      lines.push(`  kind: "profile"`);
      lines.push(`  level: L1`);
      lines.push(`  value: "${p.value}"`);
      lines.push(`}`);
      lines.push(``);
    }

    // Define cluster (L2 cluster)
    lines.push(`define entity "${clusterId}" {`);
    lines.push(`  kind: "cluster"`);
    lines.push(`  level: L2`);
    lines.push(`  value: "${clusterVal}"`);
    lines.push(`}`);
    lines.push(``);

    // Define explanation (L3 explanation)
    lines.push(`define entity "${explanationId}" {`);
    lines.push(`  kind: "explanation"`);
    lines.push(`  level: L3`);
    lines.push(`  value: "${explanationVal}"`);
    lines.push(`}`);
    lines.push(``);

    // Observe Sensor
    lines.push(`constrain {`);
    lines.push(`  target: "${sensorId}"`);
    lines.push(`  operation: "observe"`);
    lines.push(`}`);
    lines.push(``);

    // Identify profiles from sensor
    for (const p of profiles) {
      lines.push(`relate "${sensorId}" -> "${p.id}" {`);
      lines.push(`  kind: "identifies"`);
      lines.push(`  operation: "identify"`);
      lines.push(`}`);
      lines.push(``);
    }

    // Relate profiles (sequentially linking them in the graph)
    if (profiles.length > 1) {
      for (let i = 0; i < profiles.length - 1; i++) {
        const current = profiles[i];
        const next = profiles[i + 1];
        if (current && next) {
          lines.push(`relate "${current.id}" -> "${next.id}" {`);
          lines.push(`  kind: "accesses"`);
          lines.push(`  operation: "relate"`);
          lines.push(`}`);
          lines.push(``);
        }
      }
    }

    // Cluster profiles
    for (const p of profiles) {
      lines.push(`relate "${p.id}" -> "${clusterId}" {`);
      lines.push(`  kind: "clustered-into"`);
      lines.push(`  operation: "group"`);
      lines.push(`}`);
      lines.push(``);
    }

    // Resolve / explain
    lines.push(`resolve "${clusterId}" to L3 {`);
    lines.push(`  operation: "resolve"`);
    lines.push(`  reason: "clustering-complete"`);
    lines.push(`}`);
    lines.push(``);

    lines.push(`relate "${clusterId}" -> "${explanationId}" {`);
    lines.push(`  kind: "explained-by"`);
    lines.push(`  operation: "explain"`);
    lines.push(`}`);
    lines.push(``);

    // Emit
    lines.push(`emit {`);
    lines.push(`  target: "${explanationId}"`);
    lines.push(`  kind: "knowledge-graph"`);
    lines.push(`}`);

    return lines.join("\n").trim();
  },
};
