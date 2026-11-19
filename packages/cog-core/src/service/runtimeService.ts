import { lex } from "../lexer/lexer";
import { parseCog } from "../parser/parser";
import { compileCog } from "../compiler/compileCog";
import { validateCog } from "../validator/validateCog";
import { planCog } from "../planner/planCog";
import { executeCog } from "../runtime/executeCog";
import { domainRegistry } from "../domain/registry";
import type { CoreExecutionContext } from "../types/context";
import type { CogDomainAdapter } from "../types/adapter";
import type { CoreExecutionResult } from "../types/execution";

export class RuntimeService {
  /**
   * Executes raw .cog source code through the full compiled pipeline.
   * Runs local validation and deterministic execution safely.
   */
  async executeWorkflow(
    source: string,
    context: CoreExecutionContext,
    adapter?: CogDomainAdapter
  ): Promise<CoreExecutionResult> {
    const tokens = lex(source);
    const ast = parseCog(tokens);
    const ir = compileCog(ast);

    const validation = await validateCog(ir, { context, adapter });
    if (!validation.valid) {
      throw new Error(`Validation failed: ${JSON.stringify(validation.issues)}`);
    }

    // Force plan creation as part of execution pipeline validation
    await planCog(ir, { context, adapter });

    return executeCog(ir, context, adapter);
  }

  /**
   * Generates and executes a domain-specific workflow using library templates.
   */
  async executeDomainLibrary(
    domainId: string,
    params: Record<string, any>,
    context: CoreExecutionContext,
    adapter?: CogDomainAdapter
  ): Promise<CoreExecutionResult> {
    const library = domainRegistry.getLibrary(domainId);

    if (!library) {
      throw new Error(`Domain library not found: ${domainId}`);
    }

    const source = library.generate(params);
    return this.executeWorkflow(source, context, adapter);
  }
}
