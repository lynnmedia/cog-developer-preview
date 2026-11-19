import type { CoreIR } from "../types/ir";
import { domainRegistry } from "../domain/registry";

export interface LibraryCompositionNode {
  id: string;
  label: string;
  type: "library" | "boundary_interface" | "pattern";
}

export interface LibraryCompositionEdge {
  from: string;
  to: string;
  label?: string;
}

export interface LibraryCompositionReport {
  composedLibraries: string[];
  boundaryEntities: string[];
  reusedPatterns: string[];
  nodes: LibraryCompositionNode[];
  edges: LibraryCompositionEdge[];
  mermaidComposition: string;
}

export class LibraryCompositionVisualizer {
  /**
   * Analyzes how different registered domain libraries compose into the given workflow.
   */
  analyzeComposition(ir: CoreIR): LibraryCompositionReport {
    const composedLibraries = new Set<string>();
    const reusedPatterns = new Set<string>();
    const boundaryEntities: string[] = [];

    // Analyze relation kinds and entity kinds
    const relationKinds = new Set(ir.relations.map((r) => r.relationKind));
    const entityKinds = new Set(ir.entities.map((e) => e.entityKind));

    const libs = domainRegistry.listLibraries();
    for (const lib of libs) {
      let matches = false;
      if (
        lib.id.includes("research") &&
        (relationKinds.has("extracts") ||
          relationKinds.has("clustered-into") ||
          entityKinds.has("extraction") ||
          entityKinds.has("cluster"))
      ) {
        matches = true;
        reusedPatterns.add("research-synthesis");
      }
      if (
        lib.id.includes("editorial") &&
        (relationKinds.has("differs-from") ||
          relationKinds.has("has-drift") ||
          entityKinds.has("expectation") ||
          entityKinds.has("drift"))
      ) {
        matches = true;
        reusedPatterns.add("editorial-review");
      }
      if (
        lib.id.includes("decision") &&
        (relationKinds.has("chosen-from") ||
          entityKinds.has("option") ||
          entityKinds.has("decision"))
      ) {
        matches = true;
        reusedPatterns.add("decision-analysis");
      }
      if (
        lib.id.includes("audit") &&
        (relationKinds.has("contains-finding") ||
          entityKinds.has("finding") ||
          entityKinds.has("evaluation"))
      ) {
        matches = true;
        reusedPatterns.add("audit-reasoning");
      }
      if (
        lib.id.includes("planning") &&
        (relationKinds.has("identifies-risk") ||
          relationKinds.has("mitigates-risk") ||
          entityKinds.has("risk") ||
          entityKinds.has("goal"))
      ) {
        matches = true;
        reusedPatterns.add("planning-workflow");
      }
      if (
        lib.id.includes("governance") &&
        (relationKinds.has("verifies-compliance") ||
          entityKinds.has("governance-scope") ||
          entityKinds.has("governance-evidence"))
      ) {
        matches = true;
        reusedPatterns.add("governance-reasoning");
      }

      if (matches) {
        composedLibraries.add(lib.id);
      }
    }

    // Detect boundary interfaces
    for (const ent of ir.entities) {
      const isTargetOfSome = ir.relations.some((r) => r.targetRef === ent.name);
      const isSourceOfSome = ir.relations.some((r) => r.sourceRef === ent.name);
      if (isTargetOfSome && isSourceOfSome) {
        boundaryEntities.push(ent.name);
      }
    }

    const nodes: LibraryCompositionNode[] = [];
    const edges: LibraryCompositionEdge[] = [];

    for (const libId of composedLibraries) {
      const libName = libs.find((l) => l.id === libId)?.name || libId;
      nodes.push({ id: libId, label: libName, type: "library" });
    }

    for (const boundary of boundaryEntities) {
      nodes.push({ id: `boundary:${boundary}`, label: `Boundary: ${boundary}`, type: "boundary_interface" });
    }

    for (const boundary of boundaryEntities) {
      const incoming = ir.relations.find((r) => r.targetRef === boundary);
      const outgoing = ir.relations.find((r) => r.sourceRef === boundary);

      const getLibForRelation = (relKind: string): string => {
        if (relKind === "extracts" || relKind === "clustered-into") {
          return "cog:domain:research";
        }
        if (relKind === "differs-from" || relKind === "has-drift") {
          return "cog:domain:editorial";
        }
        if (relKind === "chosen-from") {
          return "cog:domain:decision";
        }
        if (relKind === "contains-finding") {
          return "cog:domain:audit";
        }
        if (relKind === "identifies-risk" || relKind === "mitigates-risk") {
          return "cog:domain:planning";
        }
        if (relKind === "verifies-compliance") {
          return "cog:domain:governance";
        }
        return "cog:domain:unknown";
      };

      if (incoming) {
        const fromLib = getLibForRelation(incoming.relationKind);
        if (composedLibraries.has(fromLib)) {
          edges.push({ from: fromLib, to: `boundary:${boundary}`, label: incoming.relationKind });
        }
      }
      if (outgoing) {
        const toLib = getLibForRelation(outgoing.relationKind);
        if (composedLibraries.has(toLib)) {
          edges.push({ from: `boundary:${boundary}`, to: toLib, label: outgoing.relationKind });
        }
      }
    }

    let mermaid = "graph LR\n";
    for (const node of nodes) {
      if (node.type === "library") {
        mermaid += `  ${node.id.replace(/[^a-zA-Z0-9]/g, "_")}["[[${node.label}]]"]\n`;
      } else {
        mermaid += `  ${node.id.replace(/[^a-zA-Z0-9]/g, "_")}("${node.label}")\n`;
      }
    }
    for (const edge of edges) {
      const label = edge.label ? `|"${edge.label}"|` : "";
      mermaid += `  ${edge.from.replace(/[^a-zA-Z0-9]/g, "_")} -->${label} ${edge.to.replace(/[^a-zA-Z0-9]/g, "_")}\n`;
    }

    return {
      composedLibraries: Array.from(composedLibraries),
      boundaryEntities,
      reusedPatterns: Array.from(reusedPatterns),
      nodes,
      edges,
      mermaidComposition: mermaid
    };
  }
}
