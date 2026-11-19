import { compileToIR } from '../compiler/compileToIR';
import { lex } from '../lexer/lexer';
import { parse } from '../parser/parser';
import { validateProgram } from '../semantics/validator';
import { executeIR } from './executeIR';
import { InMemoryAdapter } from './memory';
import { ExecuteCogResult, ExecutionContext, MemoryAdapter } from './types';

export function executeCog(
  source: string,
  context: ExecutionContext,
  memory: MemoryAdapter = new InMemoryAdapter()
): ExecuteCogResult {
  const tokens = lex(source);
  const ast = parse(tokens);
  const validation = validateProgram(ast);
  if (!validation.ok || !validation.value) {
    throw new Error(`Cannot execute invalid .cog program: ${validation.diagnostics.map((d) => d.code).join(', ')}`);
  }
  const ir = compileToIR(validation.value);
  const execution = executeIR(ir, context, memory);
  return {
    astDiagnostics: validation.diagnostics,
    ir,
    bundle: execution.bundle,
    validationStatus: execution.validationStatus
  };
}
