import * as vscode from 'vscode'
import { registerMelosYamlCodeLenseProvider } from './code-lenses'
import { registerMelosCommands } from './commands'
import { info, initLogging } from './logging'
import { initMelosWorkspaces } from './melos-workspace'
import { registerMelosScriptTaskProvider } from './script-task-provider'

export async function activate(context: vscode.ExtensionContext) {
  initLogging(context)

  info('Activating...')

  // Must be initialized before the rest of the extension, since it is used by
  // other components.
  await initMelosWorkspaces(context)

  registerMelosScriptTaskProvider(context)
  registerMelosCommands(context)
  registerMelosYamlCodeLenseProvider(context)

  info('Activated')
}
