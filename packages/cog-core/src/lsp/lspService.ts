import { lex } from "../lexer/lexer";
import { parseCog } from "../parser/parser";
import { compileCog } from "../compiler/compileCog";
import { validateCog } from "../validator/validateCog";
import { domainRegistry } from "../domain/registry";
import type { SourceSpan } from "../types/ast";
import { CogDiagnosticError } from "../types/errors";

export interface LspPosition {
  line: number;
  character: number;
}

export interface LspRange {
  start: LspPosition;
  end: LspPosition;
}

export interface LspDiagnostic {
  range: LspRange;
  severity: number; // 1 = Error, 2 = Warning
  message: string;
  source: string;
}

export interface LspCompletionItem {
  label: string;
  kind: number; // 1 = Text, 6 = Variable, 14 = Keyword, 2 = Method
  detail?: string;
  documentation?: string;
}

export interface LspTextEdit {
  range: LspRange;
  newText: string;
}

export interface LspCodeAction {
  title: string;
  kind: string; // "quickfix"
  diagnostics?: LspDiagnostic[];
  edit?: {
    changes: Record<string, LspTextEdit[]>;
  };
}

export class LspService {
  /**
   * Validates a document source and returns a list of LSP-compatible diagnostics.
   */
  async validateDocument(source: string): Promise<LspDiagnostic[]> {
    const diagnostics: LspDiagnostic[] = [];

    try {
      const tokens = lex(source);
      const ast = parseCog(tokens);
      const ir = compileCog(ast);

      const validation = await validateCog(ir, {
        context: { runId: "lsp-validation", mode: "batch", startedAt: new Date().toISOString() }
      });

      if (!validation.valid) {
        validation.issues.forEach((issue) => {
          const range = issue.span
            ? this.mapSpanToRange(issue.span)
            : {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 100 }
              };

          diagnostics.push({
            range,
            severity: issue.severity === "error" ? 1 : 2,
            message: `[${issue.code}] ${issue.message}`,
            source: "cog-lsp"
          });
        });
      }
    } catch (err: any) {
      let range: LspRange = {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 100 }
      };
      let code = "PARSE_ERROR";
      let message = err.message || String(err);

      if (err instanceof CogDiagnosticError) {
        code = err.code;
        if (err.span) {
          range = this.mapSpanToRange(err.span);
        }
        if (err.remediation) {
          message = `${message} (Remediation: ${err.remediation})`;
        }
      } else {
        // Fallback to fragile string parsing if needed
        const match = /at (\d+):(\d+)/.exec(err.message || "");
        if (match && match[1] && match[2]) {
          const line = parseInt(match[1], 10) - 1;
          const col = parseInt(match[2], 10) - 1;
          range = {
            start: { line, character: col },
            end: { line, character: col + 1 }
          };
        }
      }

      diagnostics.push({
        range,
        severity: err.severity === "warning" ? 2 : 1,
        message: `[${code}] ${message}`,
        source: "cog-lsp"
      });
    }

    return diagnostics;
  }

  /**
   * Computes semantic autocompletions based on context and registry.
   */
  async getCompletions(source: string, _position: LspPosition): Promise<LspCompletionItem[]> {
    const items: LspCompletionItem[] = [];

    // 1. Standard Keywords
    const keywords = ["define", "entity", "kind", "level", "value", "relate", "resolve", "emit", "constrain"];
    for (const kw of keywords) {
      items.push({
        label: kw,
        kind: 14, // Keyword
        detail: "Cog language keyword"
      });
    }

    // 2. Levels
    const levels = ["L1", "L2", "L3", "L4", "L5"];
    for (const lvl of levels) {
      items.push({
        label: lvl,
        kind: 1, // Text
        detail: "Cognition verification level"
      });
    }

    // 3. Extract defined entities from current document via regex (handles partial/invalid source)
    const entityRegex = /define\s+entity\s+"([^"]+)"/g;
    const definedNames = new Set<string>();
    let match;
    while ((match = entityRegex.exec(source)) !== null) {
      if (match[1]) {
        definedNames.add(match[1]);
      }
    }
    for (const name of definedNames) {
      items.push({
        label: name,
        kind: 6, // Variable
        detail: "Defined Entity"
      });
    }

    // 4. Register-defined Domain Patterns
    const libs = domainRegistry.listLibraries();
    for (const lib of libs) {
      for (const pattern of lib.supportedPatterns) {
        items.push({
          label: pattern,
          kind: 2, // Method
          detail: `Pattern from ${lib.name}`,
          documentation: lib.description
        });
      }
    }

    return items;
  }

  /**
   * Helper to map a SourceSpan to an LSP-compatible 0-indexed range.
   */
  private mapSpanToRange(span: SourceSpan): LspRange {
    return {
      start: {
        line: span.start.line - 1,
        character: span.start.column - 1
      },
      end: {
        line: span.end.line - 1,
        character: span.end.column - 1
      }
    };
  }

  /**
   * Retrieves defined symbol names from a document.
   */
  async getSymbols(source: string): Promise<string[]> {
    try {
      const tokens = lex(source);
      const ast = parseCog(tokens);
      const symbols: string[] = [];
      for (const stmt of ast.statements) {
        if (stmt.kind === "DefineEntity") {
          symbols.push(stmt.name.name);
        }
      }
      return symbols;
    } catch {
      // Fallback to regex
      const entityRegex = /define\s+entity\s+"([^"]+)"/g;
      const symbols: string[] = [];
      let match;
      while ((match = entityRegex.exec(source)) !== null) {
        if (match[1]) {
          symbols.push(match[1]);
        }
      }
      return symbols;
    }
  }

  /**
   * Finds the definition range for a symbol.
   */
  async getDefinition(source: string, targetName: string): Promise<LspRange | null> {
    const tokens = lex(source);
    const ast = parseCog(tokens);
    for (const stmt of ast.statements) {
      if (stmt.kind === "DefineEntity" && stmt.name.name === targetName && stmt.name.span) {
        return this.mapSpanToRange(stmt.name.span);
      }
    }
    return null;
  }

  /**
   * Finds all references of a symbol.
   */
  async findReferences(source: string, targetName: string): Promise<LspRange[]> {
    const tokens = lex(source);
    const ast = parseCog(tokens);
    const references: LspRange[] = [];

    const addRef = (node: any) => {
      if (node && node.name === targetName && node.span) {
        references.push(this.mapSpanToRange(node.span));
      }
    };

    for (const stmt of ast.statements) {
      if (stmt.kind === "Relate") {
        addRef(stmt.source);
        addRef(stmt.target);
      } else if (stmt.kind === "Resolve") {
        addRef(stmt.target);
      } else if (stmt.kind === "Constrain") {
        addRef(stmt.target);
      } else if (stmt.kind === "Emit") {
        addRef(stmt.target);
      }
    }

    return references;
  }

  /**
   * Deterministically renames a symbol definition and all references.
   */
  async renameSymbol(source: string, oldName: string, newName: string): Promise<string> {
    const tokens = lex(source);
    const ast = parseCog(tokens);
    const replacements: Array<{ start: number; end: number }> = [];

    const addReplacement = (node: any) => {
      if (node && node.name === oldName && node.span) {
        replacements.push({
          start: node.span.start.offset,
          end: node.span.end.offset
        });
      }
    };

    for (const stmt of ast.statements) {
      if (stmt.kind === "DefineEntity") {
        addReplacement(stmt.name);
      } else if (stmt.kind === "Relate") {
        addReplacement(stmt.source);
        addReplacement(stmt.target);
      } else if (stmt.kind === "Resolve") {
        addReplacement(stmt.target);
      } else if (stmt.kind === "Constrain") {
        addReplacement(stmt.target);
      } else if (stmt.kind === "Emit") {
        addReplacement(stmt.target);
      }
    }

    // Sort replacements in descending order of their start offset
    replacements.sort((a, b) => b.start - a.start);

    let output = source;
    for (const repl of replacements) {
      const originalText = source.slice(repl.start, repl.end);
      let replacementText = newName;

      // Preserve quotes if original was a string literal
      if (originalText.startsWith('"') && originalText.endsWith('"')) {
        replacementText = `"${newName}"`;
      } else if (originalText.startsWith("'") && originalText.endsWith("'")) {
        replacementText = `'${newName}'`;
      }

      output = output.slice(0, repl.start) + replacementText + output.slice(repl.end);
    }

    return output;
  }

  /**
   * Computes Quick Fix code action suggestions for common diagnostics.
   */
  async getQuickFixes(source: string, diagnostic: LspDiagnostic): Promise<LspCodeAction[]> {
    const actions: LspCodeAction[] = [];
    const message = diagnostic.message;

    // We target missing entity references in relates, resolves, transforms and constraints
    if (
      message.includes("missing_relation_source_entity") ||
      message.includes("missing_relation_target_entity") ||
      message.includes("missing_resolution_target") ||
      message.includes("missing_transform_target") ||
      message.includes("missing_constraint_target")
    ) {
      // Extract target entity name
      const match = /references missing (?:source entity |target entity |target )?"([^"]+)"/.exec(message);
      if (match && match[1]) {
        const entityName = match[1];

        // We append a definition block at the end of the document
        // Find line count of the source to map range
        const lines = source.split("\n");
        const lastLineIndex = lines.length - 1;
        const lastLineLen = lines[lastLineIndex]?.length ?? 0;

        const newDefinitionText = `\n\ndefine entity "${entityName}" {\n  kind: "observation"\n  level: L1\n  value: "auto-generated"\n}\n`;

        actions.push({
          title: `Define missing entity "${entityName}"`,
          kind: "quickfix",
          diagnostics: [diagnostic],
          edit: {
            changes: {
              document: [
                {
                  range: {
                    start: { line: lastLineIndex, character: lastLineLen },
                    end: { line: lastLineIndex, character: lastLineLen }
                  },
                  newText: newDefinitionText
                }
              ]
            }
          }
        });
      }
    }

    return actions;
  }
}
