import type { DomainLibrary } from "../contract";

export const auditLibrary: DomainLibrary = {
  id: "cog:domain:audit",
  name: "Audit Reasoning Library",
  description: "Library for repository observation, finding identification, finding relation, severity resolution, and audit report emissions.",
  capabilities: ["audit-reasoning"],
  supportedPatterns: ["finding-identification", "finding-relationship", "severity-resolution"],

  generate(params: {
    repoRootId?: string;
    repoRootVal?: string;
    findings?: Array<{ id: string; value: string }>;
    severityId?: string;
    severityVal?: string;
  }): string {
    const repoRootId = params.repoRootId ?? "repository-root";
    const repoRootVal = params.repoRootVal ?? "git-repository";
    const findings = params.findings ?? [
      { id: "finding-unauthorized-api", value: "unauthorized-api-call-detected" },
      { id: "dependency-declaration", value: "package-json-dependencies" },
    ];
    const severityId = params.severityId ?? "severity-evaluation";
    const severityVal = params.severityVal ?? "severity-high";

    const lines: string[] = [];

    // Define repo root (L1 observation)
    lines.push(`define entity "${repoRootId}" {`);
    lines.push(`  kind: "observation"`);
    lines.push(`  level: L1`);
    lines.push(`  value: "${repoRootVal}"`);
    lines.push(`}`);
    lines.push(``);

    // Define findings (L1 findings)
    for (const f of findings) {
      lines.push(`define entity "${f.id}" {`);
      lines.push(`  kind: "finding"`);
      lines.push(`  level: L1`);
      lines.push(`  value: "${f.value}"`);
      lines.push(`}`);
      lines.push(``);
    }

    // Define severity evaluation (L2 evaluation)
    lines.push(`define entity "${severityId}" {`);
    lines.push(`  kind: "evaluation"`);
    lines.push(`  level: L2`);
    lines.push(`  value: "${severityVal}"`);
    lines.push(`}`);
    lines.push(``);

    // Observe Repository
    lines.push(`constrain {`);
    lines.push(`  target: "${repoRootId}"`);
    lines.push(`  operation: "observe"`);
    lines.push(`}`);
    lines.push(``);

    // Identify findings
    for (const f of findings) {
      lines.push(`relate "${repoRootId}" -> "${f.id}" {`);
      lines.push(`  kind: "contains-finding"`);
      lines.push(`  operation: "identify"`);
      lines.push(`}`);
      lines.push(``);
    }

    // Relate findings sequentially if multiple findings exist (e.g. finding-1 blocks finding-2)
    if (findings.length > 1) {
      for (let i = 0; i < findings.length - 1; i++) {
        const current = findings[i];
        const next = findings[i + 1];
        if (current && next) {
          lines.push(`relate "${current.id}" -> "${next.id}" {`);
          lines.push(`  kind: "blocks"`);
          lines.push(`  operation: "relate"`);
          lines.push(`}`);
          lines.push(``);
        }
      }
    }

    // Resolve severity of first finding
    if (findings.length > 0 && findings[0]) {
      const firstFindingId = findings[0].id;
      lines.push(`resolve "${firstFindingId}" to L2 {`);
      lines.push(`  operation: "resolve"`);
      lines.push(`  reason: "policy-violation"`);
      lines.push(`}`);
      lines.push(``);

      lines.push(`relate "${firstFindingId}" -> "${severityId}" {`);
      lines.push(`  kind: "severity-resolved-to"`);
      lines.push(`  operation: "resolve"`);
      lines.push(`}`);
      lines.push(``);
    }

    // Emit report
    lines.push(`emit {`);
    lines.push(`  target: "${severityId}"`);
    lines.push(`  kind: "audit-report"`);
    lines.push(`}`);

    return lines.join("\n").trim();
  },
};
