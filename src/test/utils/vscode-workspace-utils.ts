import * as vscode from 'vscode'

export function workspaceFolder(): vscode.WorkspaceFolder {
  return vscode.workspace.workspaceFolders![0]
}
