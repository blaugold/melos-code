import * as vscode from 'vscode'
import { buildMelosScriptTask } from './script-task-provider'

export function registerMelosCommands(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'melos.runScript',
      runScriptCommandHandler()
    )
  )
}

/**
 * The arguments for the `melos.runScript` command.
 */
export interface MelosRunScriptCommandArgs {
  /**
   * The workspace folder which contains the melos.yaml file which defines the
   * {@link script}.
   */
  workspaceFolder: vscode.WorkspaceFolder
  /**
   * The name of the script to run.
   */
  script: string
}

function runScriptCommandHandler() {
  return (args: MelosRunScriptCommandArgs) => {
    return vscode.tasks.executeTask(
      buildMelosScriptTask(
        {
          type: 'melos',
          script: args.script,
        },
        args.workspaceFolder
      )
    )
  }
}
