import * as vscode from 'vscode'
import { melosExecutableName } from './env'
import { info } from './logging'
import { isWorkspaceFolder } from './utils/vscode-utils'
import { loadMelosWorkspaceConfig } from './workspace-config'

export function registerMelosScriptTaskProvider(
  context: vscode.ExtensionContext
) {
  context.subscriptions.push(
    vscode.tasks.registerTaskProvider(
      'melos',
      new MelosScriptTaskProvider(context)
    )
  )
}

/**
 * A Melos script task definition.
 */
export interface MelosScriptTaskDefinition extends vscode.TaskDefinition {
  type: 'melos'

  /**
   * The name of the script to run as defined in melos.yaml.
   */
  script: string
}

/**
 * A Melos script task definition.
 */
export interface MelosExecScriptTaskDefinition
  extends MelosScriptTaskDefinition {
  /**
   * The command to execute through `melos exec`.
   */
  command: string
  /**
   * If defined, the only package to run the script in.
   */
  package?: string
}

function isMelosScriptTaskDefinition(
  definition: vscode.TaskDefinition
): definition is MelosScriptTaskDefinition {
  return definition.type === 'melos' && typeof definition.script === 'string'
}

class MelosScriptTaskProvider implements vscode.TaskProvider {
  constructor(private context: vscode.ExtensionContext) {}

  public async provideTasks(): Promise<vscode.Task[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders) {
      return []
    }

    return (
      await Promise.all(
        workspaceFolders.map((folder) => this.loadWorkspaceFolderTasks(folder))
      )
    ).flatMap((tasks) => tasks)
  }

  private async loadWorkspaceFolderTasks(
    folder: vscode.WorkspaceFolder
  ): Promise<vscode.Task[]> {
    const melosConfig = await loadMelosWorkspaceConfig(this.context, folder)

    if (!melosConfig || !melosConfig.scripts) {
      return []
    }

    info(
      `Loaded scripts for tasks in '${folder.name}' folder`,
      melosConfig.scripts.map((script) => script.name.value)
    )

    return melosConfig.scripts.map((script) => {
      const task = buildMelosScriptTask(
        {
          type: 'melos',
          script: script.name.value,
        },
        folder
      )

      task.detail = script.run?.value

      return task
    })
  }

  public resolveTask(_task: vscode.Task): vscode.Task | undefined {
    const definition = _task.definition
    if (!isMelosScriptTaskDefinition(definition)) {
      return undefined
    }

    const scope = _task.scope
    if (!isWorkspaceFolder(scope)) {
      // Only WorkspaceFolder scope is supported since Melos scripts are
      // defined in a melos.yaml in some workspace folder.
      return undefined
    }

    return buildMelosScriptTask(definition, scope)
  }
}

export function buildMelosScriptTask(
  definition: MelosScriptTaskDefinition,
  workspaceFolder: vscode.WorkspaceFolder
): vscode.Task {
  return new vscode.Task(
    definition,
    workspaceFolder,
    definition.script,
    definition.type,
    new vscode.ShellExecution(
      `${melosExecutableName} run --no-select ${definition.script}`
    )
  )
}

export function buildMelosExecScriptTask(
  definition: MelosExecScriptTaskDefinition,
  workspaceFolder: vscode.WorkspaceFolder
) {
  const options: string[] = []

  if (definition.package) {
    options.push('--scope', definition.package)
  }

  return vscode.tasks.executeTask(
    new vscode.Task(
      definition,
      workspaceFolder,
      definition.script,
      definition.name,
      new vscode.ShellExecution(
        `${melosExecutableName} exec ${options.join(' ')} -- ${
          definition.command
        }`
      )
    )
  )
}
