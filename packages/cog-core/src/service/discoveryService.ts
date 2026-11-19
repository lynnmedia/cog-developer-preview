import { domainRegistry } from "../domain/registry";
import type { RegisteredLibraryInfo } from "../domain/contract";

export class DiscoveryService {
  /**
   * Lists descriptive metadata for all registered domain libraries.
   */
  discoverLibraries(): RegisteredLibraryInfo[] {
    return domainRegistry.listLibraries();
  }

  /**
   * Retrieves registered contract and validation details for a specific library by ID.
   */
  getLibraryContract(id: string): RegisteredLibraryInfo | undefined {
    const list = this.discoverLibraries();
    return list.find((lib) => lib.id === id);
  }
}
