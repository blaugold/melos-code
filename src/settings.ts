import * as vscode from 'vscode'
import { melosWorkspaces } from './melos-workspace'

/**
 * Ensure that Melos workspaces have default VS Code settings.
 */
export async function registerDefaultMelosWorkspaceSettings(
  context: vscode.ExtensionContext
) {
  await Promise.all(
    melosWorkspaces.workspaceFolders.map(applyDefaultMelosWorkspaceSettings)
  )

  context.subscriptions.push(
    melosWorkspaces.onDidChangeWorkspaceFolders(async (event) => {
      return Promise.all(event.added.map(applyDefaultMelosWorkspaceSettings))
    })
  )
}

/**
 * The default VS Code settings to apply to a Melos workspace.
 */
const melosWorkspaceDefaultSettings = {
  'dart.runPubGetOnPubspecChanges': false,
}

async function applyDefaultMelosWorkspaceSettings(
  folder: vscode.WorkspaceFolder
) {
  const settings = vscode.workspace.getConfiguration(undefined, folder)

  for (const [key, value] of Object.entries(melosWorkspaceDefaultSettings)) {
    const { workspaceFolderValue } = settings.inspect(key)!

    if (workspaceFolderValue) {
      // Either the user or the extension has already configured this setting.
      continue
    }

    await settings.update(
      key,
      value,
      vscode.ConfigurationTarget.WorkspaceFolder
    )
  }
}
