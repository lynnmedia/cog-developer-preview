import { domainRegistry } from "../domain/registry";

export class CanonicalDocumentationSynchronizer {
  /**
   * Verifies that the provided documentation content is synchronized with the registered domain catalog.
   * Throws an error detailing any drift (e.g. missing library documentation).
   */
  verifySynchronization(manualContent: string): void {
    const libs = domainRegistry.listLibraries();

    for (const libInfo of libs) {
      // 1. Verify library ID is explicitly present
      if (!manualContent.includes(libInfo.id)) {
        throw new Error(
          `Documentation drift detected: Manual is missing registry details for library ID "${libInfo.id}".`
        );
      }

      // 2. Verify library name is documented
      if (!manualContent.includes(libInfo.name)) {
        throw new Error(
          `Documentation drift detected: Manual is missing registry name reference for "${libInfo.name}".`
        );
      }

      // 3. Verify all supported patterns are referenced
      for (const pattern of libInfo.supportedPatterns) {
        if (!manualContent.includes(pattern)) {
          throw new Error(
            `Documentation drift detected: Manual is missing reference to supported pattern "${pattern}" of library "${libInfo.id}".`
          );
        }
      }
    }
  }
}
