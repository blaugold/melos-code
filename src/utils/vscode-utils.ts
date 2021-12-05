import * as vscode from 'vscode'

/**
 * Type guard to check whether the given value is a {@link vscode.WorkspaceFolder}.
 */
export function isWorkspaceFolder(value: any): value is vscode.WorkspaceFolder {
  return (
    typeof value === 'object' &&
    'uri' in value &&
    'name' in value &&
    'index' in value
  )
}

/**
 * Returns whether the given {@link folder} is currently an open workspace folder.
 */
export function isOpenWorkspaceFolder(folder: vscode.WorkspaceFolder): boolean {
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders) {
    return false
  }
  return workspaceFolders.includes(folder)
}
