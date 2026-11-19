import type { CoreIR } from "../types/ir";

/**
 * Supported core cognitive capabilities of domain libraries.
 */
export type DomainLibraryCapability =
  | "research-synthesis"
  | "document-review"
  | "decision-analysis"
  | "audit-reasoning"
  | "knowledge-graph"
  | "orientation-support"
  | "cognitive-ecology"
  | "devotional-intelligence"
  | "governance-reasoning"
  | "learning-workflow"
  | "planning-workflow";

/**
 * Standard contract that every Cog domain library must implement.
 */
export interface DomainLibrary {
  /**
   * Unique identifier of the domain library.
   * Format: `cog:domain:<name>` (e.g. `cog:domain:research`)
   */
  readonly id: string;

  /**
   * Human readable name of the library.
   */
  readonly name: string;

  /**
   * Description of the library's purpose and logic.
   */
  readonly description: string;

  /**
   * List of cognitive capabilities this library supports.
   */
  readonly capabilities: readonly DomainLibraryCapability[];

  /**
   * Names of specific composition patterns exposed by this library.
   */
  readonly supportedPatterns: readonly string[];

  /**
   * Generates a valid .cog source code program string from domain parameters.
   * @param params Input parameters specific to the library's template logic.
   */
  generate(params: Record<string, any>): string;
}

/**
 * Metadata for a registered domain library.
 */
export interface RegisteredLibraryInfo {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly capabilities: readonly DomainLibraryCapability[];
  readonly supportedPatterns: readonly string[];
  readonly validationStatus: "valid" | "invalid" | "unverified";
}
