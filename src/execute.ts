import { exec } from 'child_process'
import { promisify } from 'util'
import * as vscode from 'vscode'
import { melosExecutableName } from './env'
import { info } from './logging'

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
  return output.stdout
}

export enum MelosListFormat {
  json = 'json',
  graph = 'graph',
  gviz = 'gviz',
}

export function melosList(options: {
  format: MelosListFormat.gviz
  folder: vscode.WorkspaceFolder
}): Promise<string>

export async function melosList(options: {
  format: MelosListFormat
  folder: vscode.WorkspaceFolder
}): Promise<any> {
  const rawResult = await executeMelosCommandForResult({
    args: ['list', `--${options.format}`],
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
