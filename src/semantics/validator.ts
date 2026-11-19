import {
  EmitNode,
  FieldNode,
  ProgramNode,
  StatementNode,
  ValueNode,
  ViewNode
} from '../parser/ast';
import { Diagnostic, ValidationResult } from './diagnostics';

const ALLOWED_PERSPECTIVES = new Set([
  'descriptive',
  'conceptual',
  'structural',
  'advisory',
  'actionable',
  'reflective'
]);

const ALLOWED_TRANSFORM_MODES = new Set([
  'descriptive',
  'conceptual',
  'structural',
  'actionable',
  'reflective',
  'advisory'
]);

const ALLOWED_OUTPUT_TYPES = new Set([
  'action_plan',
  'structured_routine',
  'framework',
  'checklist',
  'reflection',
  'analysis'
]);

function asScalar(value: ValueNode): string | number | boolean | null {
  switch (value.kind) {
    case 'StringValue':
    case 'IdentifierValue':
    case 'ResolutionValue':
      return value.value;
    case 'NumberValue':
      return value.value;
    case 'BooleanValue':
      return value.value;
    case 'NullValue':
      return null;
    case 'DurationValue':
      return value.raw;
    default:
      return '[complex]';
  }
}

function fieldMap(fields: FieldNode[]): Map<string, FieldNode> {
  const map = new Map<string, FieldNode>();
  for (const field of fields) map.set(field.name, field);
  return map;
}

function error(code: string, message: string, span: Diagnostic['span']): Diagnostic {
  return { severity: 'error', code, message, span };
}

function warning(code: string, message: string, span: Diagnostic['span']): Diagnostic {
  return { severity: 'warning', code, message, span };
}

export function validateProgram(program: ProgramNode): ValidationResult<ProgramNode> {
  const diagnostics: Diagnostic[] = [];
  const concepts = new Map<string, StatementNode>();

  for (const statement of program.statements) {
    if (statement.kind === 'DefineConcept') {
      if (concepts.has(statement.name)) {
        diagnostics.push(error('COG101', `Duplicate concept '${statement.name}'`, statement.span));
      } else {
        concepts.set(statement.name, statement);
      }
      const fields = fieldMap(statement.fields);
      if (!fields.has('type')) diagnostics.push(warning('COG102', `Concept '${statement.name}' has no type`, statement.span));
      if (!fields.has('description')) diagnostics.push(warning('COG103', `Concept '${statement.name}' has no description`, statement.span));
    }
  }

  for (const statement of program.statements) {
    switch (statement.kind) {
      case 'Relate': {
        if (!concepts.has(statement.from)) diagnostics.push(error('COG201', `Unknown concept '${statement.from}'`, statement.span));
        if (!concepts.has(statement.to)) diagnostics.push(error('COG202', `Unknown concept '${statement.to}'`, statement.span));
        const fields = fieldMap(statement.fields);
        if (!fields.has('type')) diagnostics.push(error('COG203', 'relate requires field type', statement.span));
        break;
      }
      case 'View': {
        validateView(statement, concepts, diagnostics);
        break;
      }
      case 'Resolve': {
        if (!concepts.has(statement.target)) diagnostics.push(error('COG301', `Unknown concept '${statement.target}'`, statement.span));
        break;
      }
      case 'Transform': {
        const fields = fieldMap(statement.fields);
        for (const required of ['from', 'to', 'target']) {
          if (!fields.has(required)) diagnostics.push(error('COG401', `transform requires field ${required}`, statement.span));
        }
        const from = fields.get('from');
        const to = fields.get('to');
        const target = fields.get('target');
        if (from && !ALLOWED_TRANSFORM_MODES.has(String(asScalar(from.value)))) {
          diagnostics.push(error('COG402', `Invalid transform mode '${String(asScalar(from.value))}'`, from.span));
        }
        if (to && !ALLOWED_TRANSFORM_MODES.has(String(asScalar(to.value)))) {
          diagnostics.push(error('COG403', `Invalid transform mode '${String(asScalar(to.value))}'`, to.span));
        }
        if (target && typeof asScalar(target.value) === 'string' && !concepts.has(String(asScalar(target.value)))) {
          diagnostics.push(error('COG404', `Unknown concept '${String(asScalar(target.value))}'`, target.span));
        }
        if (from && to && String(asScalar(from.value)) === String(asScalar(to.value))) {
          diagnostics.push(warning('COG405', 'transform from and to are identical', statement.span));
        }
        break;
      }
      case 'Constrain': {
        const fields = fieldMap(statement.fields);
        const maxSteps = fields.get('max_steps');
        if (maxSteps && maxSteps.value.kind !== 'NumberValue') {
          diagnostics.push(error('COG451', 'constrain max_steps must be a number', maxSteps.span));
        }
        break;
      }
      case 'Emit':
        validateEmit(statement, diagnostics);
        break;
      case 'Sequence':
        break;
      case 'DefineConcept':
        break;
      default:
        break;
    }
  }

  return {
    ok: diagnostics.every((d) => d.severity !== 'error'),
    diagnostics,
    value: diagnostics.every((d) => d.severity !== 'error') ? program : undefined
  };
}

function validateView(
  statement: ViewNode,
  concepts: Map<string, StatementNode>,
  diagnostics: Diagnostic[]
): void {
  if (!concepts.has(statement.target)) diagnostics.push(error('COG204', `Unknown concept '${statement.target}'`, statement.span));
  if (!ALLOWED_PERSPECTIVES.has(statement.perspective)) {
    diagnostics.push(error('COG205', `Invalid perspective '${statement.perspective}'`, statement.span));
  }
}

function validateEmit(statement: EmitNode, diagnostics: Diagnostic[]): void {
  const fields = fieldMap(statement.fields);
  const typeField = fields.get('type');
  if (!typeField) {
    diagnostics.push(error('COG501', 'emit requires field type', statement.span));
    return;
  }
  const outputType = String(asScalar(typeField.value));
  if (!ALLOWED_OUTPUT_TYPES.has(outputType)) {
    diagnostics.push(error('COG502', `Invalid output type '${outputType}'`, typeField.span));
  }
}
