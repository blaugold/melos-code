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
 * A Melos script task definition for a script that uses `melos exec`.
 */
export interface MelosExecScriptTaskDefinition
  extends MelosScriptTaskDefinition {
  /**
   * The options to pass to `melos exec`.
   */
  execOptions?: string[]
  /**
   * The command to execute through `melos exec`.
   */
  command: string
}

function isMelosScriptTaskDefinition(
  definition: vscode.TaskDefinition
): definition is MelosScriptTaskDefinition {
  return definition.type === 'melos' && typeof definition.script === 'string'
}

function isMelosExecScriptTaskDefinition(
  definition: vscode.TaskDefinition
): definition is MelosExecScriptTaskDefinition {
  return (
    isMelosScriptTaskDefinition(definition) &&
    typeof definition.command === 'string' &&
    Array.isArray(definition.execOptions)
  )
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

  public async resolveTask(
    _task: vscode.Task
  ): Promise<vscode.Task | undefined> {
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

    const execDefinition = await this.tryResolveExecDefinition(definition)
    if (isMelosExecScriptTaskDefinition(execDefinition)) {
      return buildMelosExecScriptTask(execDefinition, scope)
    } else {
      return buildMelosScriptTask(definition, scope)
    }
  }

  // Checks whether given definition is an exec script definition and tries to
  // resolve the information that are missing from the task.
  private async tryResolveExecDefinition(
    definition: MelosScriptTaskDefinition
  ): Promise<MelosScriptTaskDefinition> {
    const packageScriptRegex = /^(.+) \[(.+)\]$/
    const regexMatch = definition.script.match(packageScriptRegex)
    if (!regexMatch || regexMatch.length < 3) {
      return definition
    }

    const scriptName = regexMatch[1]
    const packageName = regexMatch[2]
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
    if (!scriptName || !packageName || !workspaceFolder) {
      return definition
    }

    const melosConfig = await loadMelosWorkspaceConfig(this.context, workspaceFolder)
    if (!melosConfig) {
      return definition
    }

    const script = melosConfig.scripts.find(
      (script) => script.name.value === scriptName
    )
    const command = script?.run?.melosExec?.command
    if (!command) {
      return definition
    }

    definition.command = command
    definition.execOptions = ['--scope', packageName]

    return definition
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
  const commandLine = [
    melosExecutableName,
    'exec',
    ...(definition.execOptions ?? []),
    '--',
    definition.command,
  ]

  return new vscode.Task(
    definition,
    workspaceFolder,
    definition.script,
    definition.type,
    new vscode.ShellExecution(commandLine.join(' '))
  )
}
