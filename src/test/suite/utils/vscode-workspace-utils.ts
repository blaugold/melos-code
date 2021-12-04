import * as vscode from 'vscode'
import { clearDirectory } from './fs-utils'

export function workspaceFolder(): vscode.WorkspaceFolder {
  return vscode.workspace.workspaceFolders![0]
}

export async function resetWorkspace() {
  await vscode.commands.executeCommand('workbench.action.closeAllEditors')
  await clearDirectory(workspaceFolder().uri)
}
