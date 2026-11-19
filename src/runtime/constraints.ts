import { CognitiveIR } from '../compiler/compileToIR';
import { LearnedPattern, Resolution, ValidationStatus } from './types';

export interface ConstraintResult {
  actions: string[];
  applied: string[];
  diagnostics: string[];
  status: ValidationStatus;
}

function durationToMinutes(value: unknown): number | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as { value?: unknown; unit?: unknown };
  if (typeof raw.value !== 'number' || typeof raw.unit !== 'string') return undefined;
  if (raw.unit === 'min') return raw.value;
  if (raw.unit === 'h') return raw.value * 60;
  if (raw.unit === 'd') return raw.value * 60 * 24;
  return undefined;
}

function learnedMaxSteps(patterns: LearnedPattern[]): number | undefined {
  const pattern = patterns
    .filter((entry) => entry.category === 'constraint_preference' && entry.key === 'max_steps')
    .sort((a, b) => b.weight - a.weight)[0];
  if (!pattern) return undefined;
  const value = Number(pattern.value);
  return Number.isFinite(value) ? value : undefined;
}

export function applyConstraints(
  actions: string[],
  ir: CognitiveIR,
  resolution: Resolution,
  patterns: LearnedPattern[] = []
): ConstraintResult {
  let nextActions = [...actions];
  const applied: string[] = [];
  const diagnostics: string[] = [];
  let status: ValidationStatus = 'VALID';

  const fields = ir.constraints[0]?.fields ?? {};
  const declaredMaxSteps = typeof fields.max_steps === 'number' ? fields.max_steps : undefined;
  const adaptiveMaxSteps = learnedMaxSteps(patterns);
  const effectiveMaxSteps = adaptiveMaxSteps ?? declaredMaxSteps;
  const durationMinutes = durationToMinutes(fields.duration);

  if (typeof effectiveMaxSteps === 'number' && nextActions.length > effectiveMaxSteps) {
    nextActions = nextActions.slice(0, effectiveMaxSteps);
    applied.push(`max_steps:${effectiveMaxSteps}`);
    if (adaptiveMaxSteps && adaptiveMaxSteps !== declaredMaxSteps) applied.push(`adaptive_max_steps:${adaptiveMaxSteps}`);
  } else if (typeof effectiveMaxSteps === 'number') {
    applied.push(`max_steps:${effectiveMaxSteps}`);
    if (adaptiveMaxSteps && adaptiveMaxSteps !== declaredMaxSteps) applied.push(`adaptive_max_steps:${adaptiveMaxSteps}`);
  }

  if (typeof durationMinutes === 'number') {
    applied.push(`duration:${durationMinutes}min`);
    if (durationMinutes < nextActions.length * 10) {
      diagnostics.push('constraint:duration_tight');
      if (status === 'VALID') status = 'WARN';
    }
  }

  if (resolution === 'R5' && nextActions.length === 0) {
    diagnostics.push('constraint:r5_requires_actions');
    status = 'INVALID';
  }

  if (applied.length === 0) {
    diagnostics.push('constraint:none_applied');
    if (status === 'VALID') status = 'WARN';
  }

  return { actions: nextActions, applied, diagnostics, status };
}
