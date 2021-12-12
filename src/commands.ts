import * as vscode from 'vscode'
import { executeMelosCommand, melosList, MelosListFormat } from './execute'
import { debug } from './logging'
import { showPackageGraphView } from './package_graph_view'
import {
  buildMelosExecScriptTask,
  buildMelosScriptTask,
} from './script-task-provider'
import { resolveWorkspaceFolder } from './utils/vscode-utils'
import {
  isMelosExecScript,
  loadMelosWorkspaceConfig,
  MelosScriptConfig,
  parseMelosExecCommand,
} from './workspace-config'

export function registerMelosCommands(context: vscode.ExtensionContext) {
  registerMelosToolCommand(context, { name: 'bootstrap' })
  registerMelosToolCommand(context, { name: 'clean' })

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'melos.runScript',
      runScriptCommandHandler(context)
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
  /**
   * Whether to run the script in all packages.
   *
   * This only applies to scripts, that use `melos exec` to run across multiple
   * packages. The default is `false`.
   *
   * If this option is `false`, and the script could be executed in multiple
   * packages, the user will be asked to select one.
   */
  runInAllPackages?: boolean
}

function runScriptCommandHandler(context: vscode.ExtensionContext) {
  return async (args?: MelosRunScriptCommandArgs) => {
    debug(`command:runScript`, {
      ...args,
      workspaceFolder: args?.workspaceFolder.name,
    })

    const workspaceFolder =
      args?.workspaceFolder ?? (await resolveWorkspaceFolder())

    if (!workspaceFolder) {
      // User did not select a workspace folder.
      return
    }

    const melosConfig = await loadMelosWorkspaceConfig(context, workspaceFolder)
    if (!melosConfig) {
      vscode.window.showErrorMessage('No melos.yaml file found.')
      return
    }

    // Resolve the full script configuration.
    let scriptConfig: MelosScriptConfig | undefined
    if (args) {
      scriptConfig = melosConfig.scripts.find(
        (script) => script.name.value === args.script
      )

      if (!scriptConfig) {
        throw new Error(`Script ${args.script} not found.`)
      }
    } else {
      // Ask the user to select a script.
      const scriptPickItems = melosConfig.scripts.map((script) => ({
        label: script.name.value,
        detail: script.run?.value,
        script,
      }))

      const scriptPickItem = await vscode.window.showQuickPick(
        scriptPickItems,
        {
          title: 'Select a script to run',
        }
      )
      if (!scriptPickItem) {
        // User did not select a script.
        return
      }

      scriptConfig = scriptPickItem.script
    }

    function runMelosScriptTask() {
      return vscode.tasks.executeTask(
        buildMelosScriptTask(
          {
            type: 'melos',
            script: scriptConfig!.name.value,
          },
          workspaceFolder!
        )
      )
    }

    if (args?.runInAllPackages || !isMelosExecScript(scriptConfig)) {
      return runMelosScriptTask()
    }

    // Resolve the package to run the script in.
    const packages = await melosList({
      format: MelosListFormat.json,
      folder: workspaceFolder,
      filters: scriptConfig.packageSelect,
    })

    if (packages.length === 0) {
      vscode.window.showWarningMessage(
        `No packages found for script ${scriptConfig.name.value}.`
      )
      return
    }

    let packageName: string | undefined
    if (packages.length === 1) {
      packageName = packages[0].name
    } else {
      // Ask the user to select a package.
      const selectedPackage = await vscode.window.showQuickPick(
        [
          { label: 'All packages', pkg: undefined },
          ...packages.map((pkg) => ({
            label: pkg.name,
            detail: vscode.workspace.asRelativePath(pkg.location),
            pkg,
          })),
        ],
        {
          title: 'Select package to run script in',
        }
      )
      if (!selectedPackage) {
        // User did not select a package.
        return
      }
      if (!selectedPackage.pkg) {
        // Run in all packages.
        return runMelosScriptTask()
      }
      packageName = selectedPackage.pkg.name
    }

    const melosExecCommand = parseMelosExecCommand(scriptConfig.run!.value)
    if (!melosExecCommand) {
      vscode.window.showErrorMessage(
        `Invalid melos exec command: ${scriptConfig.run!.value}`
      )
      return
    }

    // Execute the script in a single package.
    return buildMelosExecScriptTask(
      {
        type: 'melos',
        script: scriptConfig!.name.value,
        package: packageName,
        command: melosExecCommand.command,
      },
      workspaceFolder
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
