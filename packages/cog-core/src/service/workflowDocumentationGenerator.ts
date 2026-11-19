import type { CoreIR } from "../types/ir";

export class WorkflowDocumentationGenerator {
  /**
   * Generates Markdown and Mermaid documentation representing a workflow's compiled CoreIR.
   */
  generateMarkdown(ir: CoreIR, title = "Cog Workflow Documentation"): string {
    const lines: string[] = [];

    // Title
    lines.push(`# ${title}`);
    lines.push(``);
    lines.push(`Generated automatically from compiled Cog IR.`);
    lines.push(``);

    // Section 1: Workflow Topology Diagram (Mermaid)
    lines.push(`## Workflow Topology`);
    lines.push(``);
    lines.push(`\`\`\`mermaid`);
    lines.push(`graph TD`);

    // Add entities as mermaid nodes
    for (const ent of ir.entities) {
      const label = ent.level ? `${ent.name} [${ent.level}]` : ent.name;
      lines.push(`  ${ent.name.replace(/[^a-zA-Z0-9]/g, "_")}["${label}"]`);
    }

    // Add relations as mermaid edges
    for (const rel of ir.relations) {
      lines.push(
        `  ${rel.sourceRef.replace(/[^a-zA-Z0-9]/g, "_")} -->|"${rel.relationKind}"| ${rel.targetRef.replace(
          /[^a-zA-Z0-9]/g,
          "_"
        )}`
      );
    }

    // Add resolutions as mermaid edges
    for (const res of ir.resolutions) {
      const targetId = res.targetRef.replace(/[^a-zA-Z0-9]/g, "_");
      const resId = res.resolutionRef ? res.resolutionRef.replace(/[^a-zA-Z0-9]/g, "_") : "resolution_point";
      lines.push(`  ${targetId} -->|"resolve to ${String(res.level ?? res.value ?? "")}"| ${resId}`);
    }

    // Add emissions
    for (const emit of ir.emissions) {
      const nodeName = `emit_${emit.id.replace(/[^a-zA-Z0-9]/g, "_")}`;
      lines.push(`  ${emit.targetRef.replace(/[^a-zA-Z0-9]/g, "_")} -->|"emit: ${emit.emissionKind}"| ${nodeName}`);
      lines.push(`  ${nodeName}["Emit: ${emit.emissionKind}"]`);
    }

    lines.push(`\`\`\``);
    lines.push(``);

    // Section 2: Entity Catalog
    lines.push(`## Entity Catalog`);
    lines.push(``);
    lines.push(`| Name | Kind | Verification Level | Value |`);
    lines.push(`| --- | --- | --- | --- |`);
    for (const ent of ir.entities) {
      lines.push(`| ${ent.name} | ${ent.entityKind} | ${ent.level || "None"} | ${ent.attributes.value || ""} |`);
    }
    lines.push(``);

    // Section 3: Relations Catalog
    if (ir.relations.length > 0) {
      lines.push(`## Relations Catalog`);
      lines.push(``);
      lines.push(`| Source | Relationship Kind | Target | Operation |`);
      lines.push(`| --- | --- | --- | --- |`);
      for (const rel of ir.relations) {
        lines.push(
          `| ${rel.sourceRef} | ${rel.relationKind} | ${rel.targetRef} | ${rel.attributes.operation || ""} |`
        );
      }
      lines.push(``);
    }

    // Section 4: Resolution Rules
    if (ir.resolutions.length > 0) {
      lines.push(`## Resolution Rules`);
      lines.push(``);
      lines.push(`| Target Entity | Target Level | Reason |`);
      lines.push(`| --- | --- | --- |`);
      for (const res of ir.resolutions) {
        lines.push(`| ${res.targetRef} | ${String(res.level ?? res.value ?? "")} | ${res.attributes.reason || ""} |`);
      }
      lines.push(``);
    }

    return lines.join("\n").trim();
  }
}
