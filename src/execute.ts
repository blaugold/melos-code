import * as vscode from 'vscode'
import { melosExecutableName } from './env'
import { info } from './logging'

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
