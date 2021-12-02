import * as vscode from 'vscode'
import { registerMelosYamlCodeLenseProvider } from './code-lenses'
import { registerMelosCommands } from './commands'
import { registerMelosScriptTaskProvider } from './script-task-provider'

export function activate(context: vscode.ExtensionContext) {
  registerMelosScriptTaskProvider(context)
  registerMelosCommands(context)
  registerMelosYamlCodeLenseProvider(context)
}
