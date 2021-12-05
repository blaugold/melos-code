import * as vscode from 'vscode'
import { registerMelosYamlCodeLenseProvider } from './code-lenses'
import { registerMelosCommands } from './commands'
import { initMelosWorkspaces } from './melos-workspace'
import { registerMelosScriptTaskProvider } from './script-task-provider'
import { registerDefaultMelosWorkspaceSettings } from './settings'

export async function activate(context: vscode.ExtensionContext) {
  // Must be initialized before the rest of the extension, since it is used by
  // other components.
  await initMelosWorkspaces(context)

  registerMelosScriptTaskProvider(context)
  registerMelosCommands(context)
  registerMelosYamlCodeLenseProvider(context)
  await registerDefaultMelosWorkspaceSettings(context)
}
