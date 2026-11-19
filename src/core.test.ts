import assert from 'node:assert/strict';
import test from 'node:test';

import { compileToIR } from './compiler/compileToIR';
import { lex } from './lexer/lexer';
import { parse } from './parser/parser';
import { validateProgram } from './semantics/validator';
import { executeCog } from './runtime/executeCog';
import type { ExecutionContext } from './runtime/types';

const validProgram = `
define concept "discipline" {
  type: behavioral_pattern
  description: "consistent execution over time"
}

define concept "completion" {
  type: outcome_state
  description: "finished work exists"
}

relate "discipline" -> "completion" {
  type: enables
}

view "discipline" as advisory {
  audience: self
}

resolve "discipline" to R5 {
  output: structured_routine
}

transform {
  from: conceptual
  to: actionable
  target: "discipline"
}

constrain {
  max_steps: 4
  duration: 45min
}

emit {
  type: structured_routine
}
`.trim();

const context: ExecutionContext = {
  requestId: 'test_core_001',
  intent: 'verify_core_path',
  domain: 'testing',
  memoryScope: ['canonical', 'episodic', 'semantic'],
  targetResolution: 'R5',
  targetPerspective: 'actionable',
  intelligenceMode: 'adaptive',
  intelligenceDepth: 'standard',
};

test('parse handles a valid .cog program', () => {
  const tokens = lex(validProgram);
  const ast = parse(tokens);

  assert.equal(ast.kind, 'Program');
  assert.equal(ast.statements.length > 0, true);
});

test('validate and compile produce a usable IR', () => {
  const ast = parse(lex(validProgram));
  const validation = validateProgram(ast);

  assert.equal(validation.ok, true);
  assert.equal(validation.value?.statements.length, ast.statements.length);

  const ir = compileToIR(validation.value!);
  assert.equal(ir.concepts.length, 2);
  assert.equal(ir.transforms.length, 1);
});

test('executeCog returns actions for an actionable program', () => {
  const result = executeCog(validProgram, context);

  assert.equal(result.bundle.resolution, 'R5');
  assert.equal(result.bundle.perspective, 'actionable');
  assert.equal(result.bundle.actions.length > 0, true);
});
