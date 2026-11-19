import { domainRegistry } from "../domain/registry";

export class LibraryDocumentationGenerator {
  /**
   * Automatically generates a comprehensive Markdown reference manual from registered domain library metadata and templates.
   */
  generateReferenceManual(): string {
    const lines: string[] = [];

    lines.push(`# Cog Domain Library Reference Manual`);
    lines.push(``);
    lines.push(`This manual document catalog details all registered domain libraries in the Cog kernel ecosystem.`);
    lines.push(``);

    const libs = domainRegistry.listLibraries();

    for (const libInfo of libs) {
      const fullLib = domainRegistry.getLibrary(libInfo.id);

      lines.push(`## Library: ${libInfo.name}`);
      lines.push(``);
      lines.push(`- **ID**: \`${libInfo.id}\``);
      lines.push(`- **Purpose**: ${libInfo.description}`);
      lines.push(`- **Supported Capabilities**: ${libInfo.capabilities.map((c) => `\`${c}\``).join(", ")}`);
      lines.push(`- **Composition Patterns**: ${libInfo.supportedPatterns.map((p) => `\`${p}\``).join(", ")}`);
      lines.push(``);

      if (fullLib) {
        try {
          const sampleDsl = fullLib.generate({});
          lines.push(`### Usage Example (.cog DSL)`);
          lines.push(``);
          lines.push(`\`\`\`cog`);
          lines.push(sampleDsl);
          lines.push(`\`\`\``);
          lines.push(``);
        } catch {
          lines.push(`*Note: Usage example generation requires custom parameters.*`);
          lines.push(``);
        }
      }
    }

    return lines.join("\n").trim();
  }
}
