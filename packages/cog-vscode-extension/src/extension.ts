import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand("cog.validateWorkflow", () => {
    vscode.window.showInformationMessage("Validating Cog Workflow...");
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
