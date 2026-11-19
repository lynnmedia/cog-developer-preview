import { lex } from "../lexer/lexer";
import { parseCog } from "../parser/parser";

export class WorkflowRefactoringService {
  /**
   * Extracts specified entities and their associated relationships/resolves from a source program
   * into a separate reusable workflow DSL block.
   */
  extractSubWorkflow(source: string, entityNames: string[]): string {
    const tokens = lex(source);
    const ast = parseCog(tokens);
    const namesSet = new Set(entityNames);
    const lines: string[] = [];

    for (const stmt of ast.statements) {
      if (stmt.kind === "DefineEntity" && namesSet.has(stmt.name.name)) {
        if (stmt.span) {
          lines.push(source.slice(stmt.span.start.offset, stmt.span.end.offset));
        }
      } else if (stmt.kind === "Relate" && namesSet.has(stmt.source.name) && namesSet.has(stmt.target.name)) {
        if (stmt.span) {
          lines.push(source.slice(stmt.span.start.offset, stmt.span.end.offset));
        }
      } else if (stmt.kind === "Resolve" && namesSet.has(stmt.target.name)) {
        if (stmt.span) {
          lines.push(source.slice(stmt.span.start.offset, stmt.span.end.offset));
        }
      }
    }

    return lines.join("\n\n").trim();
  }

  /**
   * Inlines a sub-workflow into a parent workflow while avoiding duplicate entity definitions.
   */
  inlineWorkflow(parentSource: string, subWorkflowSource: string): string {
    const parentTokens = lex(parentSource);
    const parentAst = parseCog(parentTokens);
    const parentEntities = new Set(
      parentAst.statements.filter((s) => s.kind === "DefineEntity").map((s: any) => s.name.name)
    );

    const subTokens = lex(subWorkflowSource);
    const subAst = parseCog(subTokens);
    const linesToInline: string[] = [];

    for (const stmt of subAst.statements) {
      if (stmt.kind === "DefineEntity" && parentEntities.has(stmt.name.name)) {
        continue;
      }
      if (stmt.span) {
        linesToInline.push(subWorkflowSource.slice(stmt.span.start.offset, stmt.span.end.offset));
      }
    }

    return `${parentSource.trim()}\n\n// Inlined Sub-Workflow\n${linesToInline.join("\n\n")}`.trim();
  }

  /**
   * Renames an entity across the workflow source code.
   */
  renameEntity(source: string, oldName: string, newName: string): string {
    const tokens = lex(source);
    const targets = tokens.filter(t => 
      (t.type === "STRING" || t.type === "IDENTIFIER") && t.lexeme === oldName
    );

    // Sort descending by start offset
    targets.sort((a, b) => b.span.start.offset - a.span.start.offset);

    let result = source;
    for (const token of targets) {
      const start = token.span.start.offset;
      const end = token.span.end.offset;
      const rawText = source.slice(start, end);
      const hasQuotes = (rawText.startsWith('"') && rawText.endsWith('"')) ||
                        (rawText.startsWith("'") && rawText.endsWith("'"));
      
      let replacement = newName;
      if (hasQuotes) {
        const quoteChar = rawText[0];
        replacement = `${quoteChar}${newName}${quoteChar}`;
      }
      
      result = result.slice(0, start) + replacement + result.slice(end);
    }

    return result;
  }

  /**
   * Merges two pattern workflows, deduplicating entity definitions.
   */
  mergePatterns(sourceA: string, sourceB: string): string {
    const astA = parseCog(lex(sourceA));
    const astB = parseCog(lex(sourceB));

    const entities = new Map<string, string>();
    const otherStmts: string[] = [];

    const getRawStmt = (stmt: any, source: string): string => {
      if (stmt.span) {
        return source.slice(stmt.span.start.offset, stmt.span.end.offset);
      }
      return "";
    };

    for (const stmt of astA.statements) {
      if (stmt.kind === "DefineEntity") {
        entities.set(stmt.name.name, getRawStmt(stmt, sourceA));
      } else {
        const raw = getRawStmt(stmt, sourceA);
        if (raw) otherStmts.push(raw);
      }
    }

    for (const stmt of astB.statements) {
      if (stmt.kind === "DefineEntity") {
        if (!entities.has(stmt.name.name)) {
          entities.set(stmt.name.name, getRawStmt(stmt, sourceB));
        }
      } else {
        const raw = getRawStmt(stmt, sourceB);
        if (raw) otherStmts.push(raw);
      }
    }

    const entityLines = Array.from(entities.values());
    return `${entityLines.join("\n\n")}\n\n${otherStmts.join("\n\n")}`.trim();
  }
}
