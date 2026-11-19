import type { DomainLibrary, DomainLibraryCapability, RegisteredLibraryInfo } from "./contract";
import { researchLibrary } from "./research/researchLibrary";
import { editorialLibrary } from "./editorial/editorialLibrary";
import { decisionLibrary } from "./decision/decisionLibrary";
import { auditLibrary } from "./audit/auditLibrary";
import { graphLibrary } from "./graph/graphLibrary";
import { orientationLibrary } from "./orientation/orientationLibrary";
import { cognitiveEcologyLibrary } from "./cognitiveEcology/cognitiveEcologyLibrary";
import { devotionalIntelligenceLibrary } from "./devotionalIntelligence/devotionalIntelligenceLibrary";
import { governanceLibrary } from "./governance/governanceLibrary";
import { learningLibrary } from "./learning/learningLibrary";
import { planningLibrary } from "./planning/planningLibrary";
import { researchToBookPipeline } from "./research/researchToBookPipeline";
import { momLibraryProof } from "./proofs/momLibraryProof";
import { decisionAdapterLibraryProof } from "./proofs/decisionAdapterLibraryProof";

class DomainRegistry {
  private libraries = new Map<string, DomainLibrary>();

  constructor() {
    this.register(researchLibrary);
    this.register(editorialLibrary);
    this.register(decisionLibrary);
    this.register(auditLibrary);
    this.register(graphLibrary);
    this.register(orientationLibrary);
    this.register(cognitiveEcologyLibrary);
    this.register(devotionalIntelligenceLibrary);
    this.register(governanceLibrary);
    this.register(learningLibrary);
    this.register(planningLibrary);






    this.register(researchToBookPipeline);
    this.register(momLibraryProof);
    this.register(decisionAdapterLibraryProof);
  }









  /**
   * Registers a domain library.
   */
  register(library: DomainLibrary): void {
    this.libraries.set(library.id, library);
  }

  /**
   * Retrieves a domain library by its ID.
   */
  getLibrary(id: string): DomainLibrary | undefined {
    return this.libraries.get(id);
  }

  /**
   * Lists descriptive metadata for all registered libraries.
   */
  listLibraries(): RegisteredLibraryInfo[] {
    return Array.from(this.libraries.values()).map((lib) => ({
      id: lib.id,
      name: lib.name,
      description: lib.description,
      capabilities: lib.capabilities,
      supportedPatterns: lib.supportedPatterns,
      validationStatus: "valid" as const,
    }));
  }

  /**
   * Retrieves registered domain libraries supporting a specific capability.
   */
  getLibrariesByCapability(capability: DomainLibraryCapability): DomainLibrary[] {
    return Array.from(this.libraries.values()).filter((lib) =>
      lib.capabilities.includes(capability),
    );
  }
}

export const domainRegistry = new DomainRegistry();
