import * as vscode from 'vscode'

export function isWorkspaceFolder(value: any): value is vscode.WorkspaceFolder {
  return (
    typeof value === 'object' &&
    'uri' in value &&
    'name' in value &&
    'index' in value
  )
}
