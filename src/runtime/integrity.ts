import { CognitiveIR } from '../compiler/compileToIR';
import { ConstraintResult } from './constraints';
import { TransitionEvaluation } from './transition';
import { ExecutionContext, IntegrityReport, IntelligencePlan, MemoryAdapter, OutputType, Perspective, Resolution, ValidationStatus } from './types';

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '_');
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function deriveCanonicalConcepts(memory: MemoryAdapter): Set<string> {
  const values = memory.getCanonicalEntries().flatMap((entry) => {
    if (entry.key === 'canonical_concepts' && Array.isArray(entry.value)) {
      return entry.value.filter((v): v is string => typeof v === 'string').map(normalize);
    }
    if (typeof entry.value === 'string' && entry.key.startsWith('canonical_concept.')) {
      return [normalize(entry.value)];
    }
    return [] as string[];
  });
  return new Set(values);
}

export function buildTransformationTrace(
  ir: CognitiveIR,
  plan: IntelligencePlan,
  transitionResult: TransitionEvaluation,
  constraintResult: ConstraintResult,
  context: ExecutionContext
): IntegrityReport['trace'] {
  const steps: IntegrityReport['trace']['steps'] = [
    { stage: 'interpret', detail: context.intent ? `Intent interpreted as ${context.intent}.` : 'Intent not provided.', status: 'INFO' },
    { stage: 'plan', detail: `Planner chose ${plan.mode} mode at ${plan.depth} depth.`, status: 'INFO' },
    { stage: 'bind', detail: `Bound ${ir.concepts.length} concepts and ${ir.relations.length} relations.`, status: 'INFO' },
    {
      stage: 'transform',
      detail: transitionResult.transitions.length ? `Applied ${transitionResult.transitions.length} declared transition(s).` : 'No declared transitions were applied.',
      status: transitionResult.status
    },
    {
      stage: 'constrain',
      detail: constraintResult.applied.length ? `Applied constraints: ${constraintResult.applied.join(', ')}.` : 'No constraints were applied.',
      status: constraintResult.status
    }
  ];

  const mutations = transitionResult.transitions.map((transition) => `${transition.target}:${transition.from}->${transition.to}`);
  const justifications = [
    `Resolution target ${plan.derivedResolution} shaped the output structure.`,
    `Perspective target ${plan.derivedPerspective} shaped the narrative frame.`,
    ...plan.adaptationNotes
  ];

  return {
    steps,
    transitions: transitionResult.transitions,
    mutations,
    justifications
  };
}

export function evaluateIntegrity(
  ir: CognitiveIR,
  memory: MemoryAdapter,
  plan: IntelligencePlan,
  context: ExecutionContext,
  transitionResult: TransitionEvaluation,
  constraintResult: ConstraintResult,
  runtimePerspective: Perspective,
  runtimeResolution: Resolution,
  outputType?: OutputType
): IntegrityReport {
  const violations: string[] = [];
  const diagnostics: string[] = [];
  let score = 1;

  const conceptSet = new Set(ir.concepts.map((concept) => normalize(concept.label)));
  const canonicalConcepts = deriveCanonicalConcepts(memory);

  for (const transform of ir.transforms) {
    const target = typeof transform.fields.target === 'string' ? normalize(transform.fields.target) : undefined;
    if (!target || !conceptSet.has(target)) {
      violations.push(`identity:unknown_transform_target:${String(transform.fields.target ?? 'unknown')}`);
      score -= 0.2;
    }
  }

  for (const relation of ir.relations) {
    if (!conceptSet.has(normalize(relation.from)) || !conceptSet.has(normalize(relation.to))) {
      violations.push(`identity:relation_endpoint_missing:${relation.from}->${relation.to}`);
      score -= 0.15;
    }
  }

  if (transitionResult.diagnostics.some((d) => d.includes('perspective_mismatch'))) {
    violations.push('identity:perspective_mismatch');
    score -= 0.18;
  }

  if (runtimeResolution === 'R5' && outputType && !['action_plan', 'structured_routine', 'checklist'].includes(outputType)) {
    violations.push(`identity:r5_non_actionable_output:${outputType}`);
    score -= 0.2;
  }

  if (constraintResult.status === 'INVALID') score -= 0.2;
  if (transitionResult.status === 'WARN') score -= 0.08;
  if (constraintResult.status === 'WARN') score -= 0.05;

  const canonicalViolations: string[] = [];
  for (const target of transitionResult.transitions.map((transition) => normalize(transition.target))) {
    if (canonicalConcepts.has(target)) {
      canonicalViolations.push(`canonical:mutation_attempt:${target}`);
      score -= 0.25;
    }
  }

  diagnostics.push(...violations, ...canonicalViolations);

  const driftBase = Math.max(0, transitionResult.diagnostics.length + constraintResult.diagnostics.length + canonicalViolations.length + violations.length);
  const driftRisk = Number(clamp(0.08 + driftBase * 0.12 + (context.feedback?.success === false ? 0.1 : 0), 0, 0.98).toFixed(2));
  const trace = buildTransformationTrace(ir, plan, transitionResult, constraintResult, context);

  return {
    conceptIdentity: {
      preserved: violations.length === 0,
      score: Number(clamp(score, 0, 1).toFixed(2)),
      violations
    },
    canonicalProtection: {
      preserved: canonicalViolations.length === 0,
      violations: canonicalViolations
    },
    driftRisk,
    trace,
    diagnostics
  };
}

export function deriveIntegrityAwareConfidence(
  baseConfidence: number,
  integrity: IntegrityReport,
  validationStatus: ValidationStatus
): number {
  const adjustment =
    (integrity.conceptIdentity.score - 0.75) * 0.35 -
    integrity.driftRisk * 0.2 -
    (integrity.canonicalProtection.preserved ? 0 : 0.18) -
    (validationStatus === 'VALID' ? 0 : validationStatus === 'WARN' ? 0.04 : 0.12);

  return Number(clamp(baseConfidence + adjustment, 0.1, 0.99).toFixed(2));
}
