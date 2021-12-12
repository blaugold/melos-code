import { exec } from 'child_process'
import { kebabCase } from 'lodash'
import { promisify } from 'util'
import * as vscode from 'vscode'
import { melosExecutableName } from './env'
import { info, trace } from './logging'
import { MelosPackageFilters } from './package-filters'

const execAsync = promisify(exec)

/**
 * Executes a melos command as a VS Code task.
 *
 * Displays a progress notification, which allows cancellation of the command.
 */
export async function executeMelosCommand(options: {
  name: string
  folder: vscode.WorkspaceFolder
}): Promise<number | undefined> {
  const task = new vscode.Task(
    {
      type: 'melos',
    },
    options.folder,
    options.name,
    'melos',
    new vscode.ShellExecution(`${melosExecutableName} ${options.name}`)
  )
  task.presentationOptions = {
    reveal: vscode.TaskRevealKind.Silent,
    clear: true,
    showReuseMessage: false,
  }

  const taskEnded = new Promise<number | undefined>((resolve) => {
    const didEndTaskDisposable = vscode.tasks.onDidEndTaskProcess((event) => {
      if (event.execution.task === task) {
        didEndTaskDisposable.dispose()
        resolve(event.exitCode)
      }
    })
  })

  const start = Date.now()

  const taskExecution = await vscode.tasks.executeTask(task)

  const exitCode = await vscode.window.withProgress(
    {
      title: `Executing 'melos ${options.name}'`,
      location: vscode.ProgressLocation.Notification,
      cancellable: true,
    },
    (_, cancellationToken) => {
      cancellationToken.onCancellationRequested(() => taskExecution.terminate())
      return taskEnded
    }
  )

  const end = Date.now()
  const duration = end - start

  info(
    `Executed 'melos ${options.name}' in ${duration}ms with exit code ${exitCode}`
  )

  return exitCode
}

export async function executeMelosCommandForResult(options: {
  args: string[]
  folder: vscode.WorkspaceFolder
}): Promise<string> {
  const commandLine = `${melosExecutableName} ${options.args.join(' ')}`
  const result = execAsync(commandLine, {
    encoding: 'utf8',
    cwd: options.folder.uri.fsPath,
  })
  const output = await result
  const exitCode = result.child.exitCode
  if (exitCode !== 0) {
    throw new Error(
      `Expected to get exit code 0 but got ${exitCode}, when executing:\n'${commandLine}'`
    )
  }
  trace(
    `Executed '${commandLine}'\nStdout:\n${output.stdout}\nStderr:\n${output.stderr}`
  )
  return output.stdout
}

export enum MelosListFormat {
  json = 'json',
  graph = 'graph',
  gviz = 'gviz',
}

export enum MelosPackageType {
  dartPackage,
  flutterPackage,
  flutterPlugin,
  flutterApp,
}

export interface MelosListResult {
  name: string
  version: string
  private: boolean
  location: string
  type: MelosPackageType
}

export function melosList(options: {
  format: MelosListFormat.json
  folder: vscode.WorkspaceFolder
  filters?: MelosPackageFilters
}): Promise<MelosListResult[]>

export function melosList(options: {
  format: MelosListFormat.gviz
  folder: vscode.WorkspaceFolder
  filters?: MelosPackageFilters
}): Promise<string>

export async function melosList(options: {
  format: MelosListFormat
  folder: vscode.WorkspaceFolder
  filters?: MelosPackageFilters
}): Promise<any> {
  const args = ['list', `--${options.format}`]

  if (options.filters) {
    args.push(...buildPackageFilterOption(options.filters))
  }

  const rawResult = await executeMelosCommandForResult({
    args,
    folder: options.folder,
  })

  switch (options.format) {
    case MelosListFormat.json:
    case MelosListFormat.graph:
      return JSON.parse(rawResult)
    case MelosListFormat.gviz:
      return rawResult
  }
}

function buildPackageFilterOption(filters: MelosPackageFilters): string[] {
  const result: string[] = []

  for (const key of Object.keys(filters)) {
    const optionFlag = `--${kebabCase(key)}`
    const value = (filters as any)[key]

    if (value === undefined) {
      continue
    }

    if (Array.isArray(value)) {
      for (const valueItem of value) {
        result.push(optionFlag, String(valueItem))
      }
    } else {
      result.push(optionFlag, String(value))
    }
  }

  return result
}
