import * as vscode from 'vscode'
import { executeMelosCommand, melosList, MelosListFormat } from './execute'
import { debug } from './logging'
import { showPackageGraphView } from './package_graph_view'
import { buildMelosScriptTask } from './script-task-provider'
import { resolveWorkspaceFolder } from './utils/vscode-utils'

export function registerMelosCommands(context: vscode.ExtensionContext) {
  registerMelosToolCommand(context, { name: 'bootstrap' })
  registerMelosToolCommand(context, { name: 'clean' })

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'melos.runScript',
      runScriptCommandHandler()
    )
  )

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'melos.showPackageGraph',
      showPackageGraphCommandHandler()
    )
  )
}

function registerMelosToolCommand(
  context: vscode.ExtensionContext,
  options: { name: string }
) {
  context.subscriptions.push(
    vscode.commands.registerCommand(`melos.${options.name}`, async () => {
      debug(`command:${options.name}`)

      const workspaceFolder = await resolveWorkspaceFolder()
      if (!workspaceFolder) {
        return
      }

      return executeMelosCommand({
        name: options.name,
        folder: workspaceFolder,
      })
    })
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
    debug(`command:runScript`, {
      ...args,
      workspaceFolder: args.workspaceFolder.name,
    })

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

function showPackageGraphCommandHandler() {
  return async () => {
    // Get melos workspace folder.
    const workspaceFolder = await resolveWorkspaceFolder()
    if (!workspaceFolder) {
      return
    }

    // Get package graph data.
    const dotGraph = await melosList({
      format: MelosListFormat.gviz,
      folder: workspaceFolder,
    })

    // Show package graph.
    return showPackageGraphView({ dotGraph, folder: workspaceFolder })
  }
}
