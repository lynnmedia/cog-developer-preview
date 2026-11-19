import type { DomainLibrary } from "../contract";

export const researchToBookPipeline: DomainLibrary = {
  id: "cog:domain:research-to-book-pipeline",
  name: "Research-to-Book Pipeline Library",
  description: "Pipeline library that processes chapter-wise research observations, claim extractions, clustering/synthesis, and compiles an outline-ready output.",
  capabilities: ["research-synthesis"],
  supportedPatterns: ["research-extraction-pipeline", "outline-synthesis"],

  generate(params: {
    bookTitle?: string;
    chapters?: Array<{ id: string; notes: string }>;
    outlineId?: string;
  }): string {
    const bookTitle = params.bookTitle ?? "Default Book Title";
    const chapters = params.chapters ?? [
      { id: "ch-1", notes: "Chapter 1 raw notes" },
      { id: "ch-2", notes: "Chapter 2 raw notes" },
    ];
    const outlineId = params.outlineId ?? "book-outline";

    const lines: string[] = [];

    // Define book info/concept
    lines.push(`// Book Title: ${bookTitle}`);

    // Define chapter observations (L1)
    for (const ch of chapters) {
      lines.push(`define entity "${ch.id}" {`);
      lines.push(`  kind: "observation"`);
      lines.push(`  level: L1`);
      lines.push(`  value: "${ch.notes}"`);
      lines.push(`}`);
      lines.push(``);
    }

    // Define extractions (L2) for each chapter
    for (const ch of chapters) {
      lines.push(`define entity "extract-${ch.id}" {`);
      lines.push(`  kind: "extraction"`);
      lines.push(`  level: L2`);
      lines.push(`  value: "extracted-claims-from-${ch.id}"`);
      lines.push(`}`);
      lines.push(``);
    }

    // Define book synthesis cluster (L3)
    lines.push(`define entity "book-synthesis-cluster" {`);
    lines.push(`  kind: "cluster"`);
    lines.push(`  level: L3`);
    lines.push(`  value: "synthesized-book-claims"`);
    lines.push(`}`);
    lines.push(``);

    // Define final book outline (L4 resolution)
    lines.push(`define entity "${outlineId}" {`);
    lines.push(`  kind: "resolution"`);
    lines.push(`  level: L4`);
    lines.push(`  value: "structured-book-outline-draft"`);
    lines.push(`}`);
    lines.push(``);

    // Observe chapters
    for (const ch of chapters) {
      lines.push(`constrain {`);
      lines.push(`  target: "${ch.id}"`);
      lines.push(`  operation: "observe"`);
      lines.push(`}`);
      lines.push(``);
    }

    // Relate chapters to extractions
    for (const ch of chapters) {
      lines.push(`relate "${ch.id}" -> "extract-${ch.id}" {`);
      lines.push(`  kind: "extracts"`);
      lines.push(`  operation: "extract"`);
      lines.push(`}`);
      lines.push(``);
    }

    // Relate extractions to cluster
    for (const ch of chapters) {
      lines.push(`relate "extract-${ch.id}" -> "book-synthesis-cluster" {`);
      lines.push(`  kind: "clustered-into"`);
      lines.push(`  operation: "group"`);
      lines.push(`}`);
      lines.push(``);
    }

    // Resolve cluster to outline
    lines.push(`resolve "book-synthesis-cluster" to L4 {`);
    lines.push(`  operation: "resolve"`);
    lines.push(`  reason: "book-synthesis-completed"`);
    lines.push(`}`);
    lines.push(``);

    lines.push(`relate "book-synthesis-cluster" -> "${outlineId}" {`);
    lines.push(`  kind: "resolves-to"`);
    lines.push(`  operation: "resolve"`);
    lines.push(`}`);
    lines.push(``);

    // Emit final outline
    lines.push(`emit {`);
    lines.push(`  target: "${outlineId}"`);
    lines.push(`  kind: "book-outline"`);
    lines.push(`}`);

    return lines.join("\n").trim();
  },
};
