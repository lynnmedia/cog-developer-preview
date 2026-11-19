/**
 * CogLib Machine Edition Domain Capability Adapter
 *
 * Dependency-inverted boundary allowing qualified Machine Editions and domain libraries
 * to mount governed capabilities onto CogLib routines without CogLib importing domain specifics.
 *
 * Architectural Flow:
 * CogLib Routine -> Domain Capability Interface -> Mounted ME / Domain Provider
 */

import { CognitiveRoutine, CognitiveRoutineExecutionResult, executeRoutineWithGuards } from "./routineContract";
import { DomainCapability, validateDomainCapabilityContract, applyGovernedSpecialization } from "./domainCapability";

export interface MachineEditionCapabilityProvider {
  readonly providerId: string; // e.g. "provider:me:mandala-of-music"
  readonly providerVersion: string;
  getCapability(): DomainCapability;
}

export interface CapabilityMountOptions {
  provider?: MachineEditionCapabilityProvider;
  strictCompatibility?: boolean;
}

export class CapabilityMountError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, any>,
  ) {
    super(`[CapabilityMountError] ${code}: ${message}`);
    this.name = "CapabilityMountError";
  }
}

/**
 * Validates whether a Machine Edition capability provider is compatible and safe to mount.
 */
export function validateCapabilityProvider(
  provider: MachineEditionCapabilityProvider,
  targetRoutineId: string,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!provider) {
    errors.push("Provider instance is null or undefined");
    return { valid: false, errors };
  }

  if (!provider.providerId || !provider.providerId.startsWith("provider:me:")) {
    errors.push("Provider providerId must begin with 'provider:me:' prefix");
  }

  const capability = provider.getCapability();
  const capReport = validateDomainCapabilityContract(capability);
  if (!capReport.valid) {
    errors.push(...capReport.defects);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Executes a CognitiveRoutine with an optionally mounted domain capability provider
 * via dependency inversion, applying strict governance guards over all specializations.
 */
export async function executeRoutineWithCapability<TInput, TOutput>(
  routine: CognitiveRoutine<TInput, TOutput>,
  input: TInput,
  options: CapabilityMountOptions = {},
): Promise<CognitiveRoutineExecutionResult<TOutput>> {
  // 1. Execute base domain-neutral routine through standard guarded pipeline
  const baseResult = await executeRoutineWithGuards(routine, input);

  // If no capability provider is mounted, return clean base result
  if (!options.provider) {
    return baseResult;
  }

  const provider = options.provider;
  const validation = validateCapabilityProvider(provider, routine.metadata.id);

  if (!validation.valid) {
    if (options.strictCompatibility) {
      throw new CapabilityMountError(
        "INCOMPATIBLE_CAPABILITY_PROVIDER",
        `Capability provider '${provider.providerId}' failed compatibility validation`,
        { errors: validation.errors },
      );
    }
    // Fail-closed non-fatal: return base result with qualification note
    return {
      ...baseResult,
      status: "qualified",
      epistemicState: {
        ...baseResult.epistemicState,
        tensions: [
          ...baseResult.epistemicState.tensions,
          `Capability mount rejected for '${provider.providerId}': ${validation.errors.join("; ")}`,
        ],
      },
    };
  }

  const capability = provider.getCapability();
  let specializationDelta: {
    enhancedOutput?: Partial<TOutput>;
    domainTensions?: string[];
    domainMetrics?: Record<string, any>;
    attemptedConfidenceOverride?: number;
  } = {};

  try {
    // 2. Dispatch to appropriate governed routine specialization hook based on routine ID
    if (routine.metadata.id === "coglib:routine:shape" && capability.hooks.onShape) {
      const shapeSpecialization = capability.hooks.onShape;
      const rawElements = (input as any).rawElements ?? [];
      const domainTensions: string[] = [];
      const recognizedClasses: string[] = [];

      for (const elem of rawElements) {
        if (shapeSpecialization.categorizeRawElement) {
          const cat = shapeSpecialization.categorizeRawElement(elem);
          if (cat.domainClass) recognizedClasses.push(cat.domainClass);
          if (cat.domainAnchorValid === false) {
            domainTensions.push(`Domain element '${elem.id ?? "unknown"}' failed domain anchor validity`);
          }
        }
      }

      specializationDelta = {
        enhancedOutput: {
          recognizedDomainClasses: Array.from(new Set(recognizedClasses)),
          domainAssumptions: shapeSpecialization.domainAssumptions ?? [],
        } as any,
        domainTensions,
        domainMetrics: {
          recognizedDomainClassCount: recognizedClasses.length,
        },
      };
    } else if (routine.metadata.id === "coglib:routine:compare" && capability.hooks.onCompare) {
      const compareSpecialization = capability.hooks.onCompare;
      if (compareSpecialization.evaluateDomainDifference) {
        const diffEval = compareSpecialization.evaluateDomainDifference((input as any).targetA, (input as any).targetB);
        const domainTensions = diffEval.incommensurabilityLimits?.map((l) => `Domain incommensurability [${l.dimension}]: ${l.reason}`) ?? [];

        specializationDelta = {
          enhancedOutput: {
            domainDifferences: diffEval.differences,
            domainIncommensurabilityLimits: diffEval.incommensurabilityLimits,
          } as any,
          domainTensions,
          domainMetrics: {
            domainDifferenceCount: diffEval.differences.length,
          },
        };
      }
    } else if (routine.metadata.id === "coglib:routine:challenge" && capability.hooks.onChallenge) {
      const challengeSpecialization = capability.hooks.onChallenge;
      if (challengeSpecialization.inspectDomainVulnerabilities) {
        const domainVulns = challengeSpecialization.inspectDomainVulnerabilities(
          (input as any).target,
          (input as any).counterEvidencePool,
        );

        const domainTensions = domainVulns.map((v) => `Domain challenge [${v.dimension}]: ${v.description}`);

        specializationDelta = {
          enhancedOutput: {
            domainVulnerabilities: domainVulns,
          } as any,
          domainTensions,
          domainMetrics: {
            domainVulnerabilityCount: domainVulns.length,
          },
        };
      }
    }
  } catch (err: any) {
    // Fail-closed: hook execution error must not crash the kernel or falsify results
    return {
      ...baseResult,
      status: "qualified",
      epistemicState: {
        ...baseResult.epistemicState,
        tensions: [
          ...baseResult.epistemicState.tensions,
          `Capability hook error in '${capability.id}': ${err.message}`,
        ],
      },
    };
  }

  // 3. Pass through strict CogLib governance guard
  return applyGovernedSpecialization(baseResult, specializationDelta, capability);
}
