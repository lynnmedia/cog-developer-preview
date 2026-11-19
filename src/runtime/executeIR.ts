import { CognitiveIR } from '../compiler/compileToIR';
import { applyConstraints } from './constraints';
import { evaluateIntegrity, deriveIntegrityAwareConfidence } from './integrity';
import { buildAdaptiveNotes, evolveProfile, extractPatterns, synthesizeSemanticEntries, updatePatterns } from './learning';
import { createIntelligencePlan, deriveRecommendations, expandInsights } from './intelligence';
import { evaluateTransitions } from './transition';
import {
  ExecuteIRResult,
  ExecutionContext,
  MemoryAdapter,
  OutputBundle,
  OutputType,
  Perspective,
  Resolution,
  ValidationStatus
} from './types';

const ACTIONABLE_OUTPUTS = new Set<OutputType>(['action_plan', 'structured_routine', 'checklist']);

function asOutputType(value: unknown): OutputType | undefined {
  if (typeof value !== 'string') return undefined;
  if (['action_plan', 'structured_routine', 'framework', 'checklist', 'reflection', 'analysis'].includes(value)) {
    return value as OutputType;
  }
  return undefined;
}

function deriveRuntimeActions(ir: CognitiveIR, outputType: OutputType | undefined): string[] {
  const target = typeof ir.transforms[0]?.fields.target === 'string' ? ir.transforms[0].fields.target : ir.concepts[0]?.label ?? 'concept';
  const base = [
    `Define a concrete target state for ${target}.`,
    `Create a repeatable execution block for ${target}.`,
    `Review one friction point blocking ${target}.`,
    `Capture the next measurable action for ${target}.`,
    `Close the loop by marking one completed increment for ${target}.`
  ];

  if (outputType && !ACTIONABLE_OUTPUTS.has(outputType)) return [];
  return base;
}

function mergeStatus(...statuses: ValidationStatus[]): ValidationStatus {
  if (statuses.includes('INVALID')) return 'INVALID';
  if (statuses.includes('WARN')) return 'WARN';
  return 'VALID';
}

export function executeIR(
  ir: CognitiveIR,
  context: ExecutionContext,
  memory: MemoryAdapter
): ExecuteIRResult {
  const semanticEntries = memory.getSemanticEntries();
  const patterns = memory.getPatterns();
  const profile = context.profileId ? memory.getProfile(context.profileId) : undefined;
  const priorRuns = memory.getRunRecords().length;

  const plan = createIntelligencePlan(ir, context, semanticEntries, patterns, profile, priorRuns);
  const outputType = asOutputType(ir.emits[0]?.fields.type) ?? plan.outputType;
  const resolution = plan.derivedResolution as Resolution;
  const perspective = plan.derivedPerspective as Perspective;

  const transitionResult = evaluateTransitions(ir, perspective, resolution, outputType);
  const rawActions = deriveRuntimeActions(ir, outputType);
  const constraintResult = applyConstraints(rawActions, ir, resolution, patterns);

  const insights = [
    `The program defines ${ir.concepts.length} concept(s), ${ir.relations.length} relation(s), and ${ir.transforms.length} transform(s).`,
    ...expandInsights(ir, plan, semanticEntries, patterns)
  ];

  const structures = [
    `Resolution target: ${resolution}`,
    `Perspective target: ${perspective}`,
    `Preferred structure: ${plan.preferredStructure}`,
    plan.focusConcepts.length ? `Focus concepts: ${plan.focusConcepts.join(', ')}` : 'Focus concepts: none'
  ];

  const recommendations = deriveRecommendations(ir, plan, context, semanticEntries, patterns);
  const diagnostics = [...transitionResult.diagnostics, ...constraintResult.diagnostics];
  const validationStatus = mergeStatus(transitionResult.status, constraintResult.status);

  const plannerNotes = [
    `The planner selected ${plan.mode} intelligence at ${plan.depth} depth.`,
    `The planner chose ${plan.preferredStructure} structure at ${resolution}.`,
    ...plan.adaptationNotes,
    ...buildAdaptiveNotes(patterns, priorRuns, context.feedback)
  ];

  const narrative = [
    context.intent ? `Intent: ${context.intent}.` : undefined,
    `The planner selected ${plan.mode} intelligence at ${plan.depth} depth.`,
    `Execution ran at ${resolution} using a ${perspective} perspective.`,
    constraintResult.actions.length > 0 ? `Execution produced ${constraintResult.actions.length} action(s).` : 'Execution produced no direct actions.'
  ].filter(Boolean).join(' ');

  const baseConfidence = Number(
    Math.max(
      0.25,
      Math.min(
        0.99,
        0.4 +
          (ir.concepts.length * 0.06) +
          (ir.relations.length * 0.04) +
          (recommendations.length * 0.02) +
          (plan.mode === 'adaptive' ? 0.06 : 0) +
          (patterns.length > 0 ? 0.04 : 0) +
          (validationStatus === 'VALID' ? 0.14 : validationStatus === 'WARN' ? 0.04 : -0.1)
      )
    ).toFixed(2)
  );

  const integrity = evaluateIntegrity(
    ir,
    memory,
    plan,
    context,
    transitionResult,
    constraintResult,
    perspective,
    resolution,
    outputType
  );
  const confidenceScore = deriveIntegrityAwareConfidence(baseConfidence, integrity, validationStatus);

  const timestamp = new Date().toISOString();
  const preLearningBundle: OutputBundle = {
    resolution,
    perspective,
    insights,
    actions: constraintResult.actions,
    structures,
    narrative,
    confidenceScore,
    constraintsApplied: constraintResult.applied,
    transitionsApplied: transitionResult.transitions,
    recommendations,
    intelligence: {
      mode: plan.mode,
      depth: plan.depth,
      focusConcepts: plan.focusConcepts,
      memorySignals: plan.memorySignals,
      plannerNotes,
      learnedPatternIds: plan.learnedPatternIds,
      adaptationNotes: plan.adaptationNotes
    },
    learning: {
      extractedPatternIds: [],
      feedbackApplied: Boolean(context.feedback),
      profileUpdated: false
    },
    integrity,
    validationStatus,
    provenance: {
      requestId: context.requestId,
      intent: context.intent,
      outputType,
      conceptLabels: ir.concepts.map((c) => c.label),
      relationCount: ir.relations.length,
      diagnostics: [...diagnostics, ...integrity.diagnostics]
    }
  };

  const extractedPatterns = extractPatterns(ir, preLearningBundle, context, timestamp);
  const mergedPatterns = updatePatterns(memory, extractedPatterns, context.feedback);
  for (const entry of synthesizeSemanticEntries(mergedPatterns)) memory.saveSemantic(entry);
  const profileState = evolveProfile(memory, context, preLearningBundle, mergedPatterns, timestamp);

  memory.saveEpisodic({
    requestId: context.requestId,
    timestamp,
    summary: preLearningBundle.narrative,
    outputType,
    resolution,
    perspective,
    actionCount: preLearningBundle.actions.length
  });
  memory.recordRun({
    requestId: context.requestId,
    timestamp,
    irStats: {
      concepts: ir.concepts.length,
      relations: ir.relations.length,
      transforms: ir.transforms.length,
      constraints: ir.constraints.length
    },
    outputType,
    resolution,
    perspective,
    validationStatus,
    success: context.feedback?.success,
    rating: context.feedback?.rating,
    meaningScore: integrity.conceptIdentity.score,
    driftRisk: integrity.driftRisk
  });

  const bundle: OutputBundle = {
    ...preLearningBundle,
    intelligence: {
      ...preLearningBundle.intelligence,
      learnedPatternIds: mergedPatterns.map((pattern) => pattern.id).slice(0, 6),
      adaptationNotes: [...preLearningBundle.intelligence.adaptationNotes, ...(profileState ? [`Profile ${profileState.profileId} updated.`] : [])]
    },
    learning: {
      extractedPatternIds: mergedPatterns.map((pattern) => pattern.id),
      feedbackApplied: Boolean(context.feedback),
      profileUpdated: Boolean(profileState)
    }
  };

  return { bundle, validationStatus };
}
