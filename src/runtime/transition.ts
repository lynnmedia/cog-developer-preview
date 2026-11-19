import { CognitiveIR } from '../compiler/compileToIR';
import { Perspective, Resolution, ValidationStatus } from './types';

const ALLOWED_PERSPECTIVES = new Set<Perspective>([
  'descriptive',
  'conceptual',
  'structural',
  'advisory',
  'actionable',
  'reflective'
]);

export interface TransitionApplication {
  from: Perspective;
  to: Perspective;
  target: string;
}

export interface TransitionEvaluation {
  transitions: TransitionApplication[];
  diagnostics: string[];
  status: ValidationStatus;
}

function toPerspective(value: unknown): Perspective | undefined {
  if (typeof value !== 'string') return undefined;
  return ALLOWED_PERSPECTIVES.has(value as Perspective) ? (value as Perspective) : undefined;
}

export function evaluateTransitions(
  ir: CognitiveIR,
  runtimePerspective: Perspective,
  runtimeResolution: Resolution,
  outputType?: string
): TransitionEvaluation {
  const diagnostics: string[] = [];
  const transitions: TransitionApplication[] = [];
  let status: ValidationStatus = 'VALID';

  for (const transform of ir.transforms) {
    const from = toPerspective(transform.fields.from);
    const to = toPerspective(transform.fields.to);
    const target = typeof transform.fields.target === 'string' ? transform.fields.target : 'unknown';

    if (!from || !to) {
      diagnostics.push(`transition:invalid:${target}`);
      status = 'INVALID';
      continue;
    }

    transitions.push({ from, to, target });

    if (to !== runtimePerspective) {
      diagnostics.push(`transition:perspective_mismatch:${target}:${to}->${runtimePerspective}`);
      if (status === 'VALID') status = 'WARN';
    }

    if (runtimeResolution === 'R5' && !['action_plan', 'structured_routine', 'checklist'].includes(String(outputType ?? ''))) {
      diagnostics.push(`transition:r5_requires_actionable_output:${target}`);
      if (status === 'VALID') status = 'WARN';
    }
  }

  if (ir.transforms.length === 0) {
    diagnostics.push('transition:none_declared');
    if (status === 'VALID') status = 'WARN';
  }

  return { transitions, diagnostics, status };
}
