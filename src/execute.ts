import * as vscode from 'vscode'
import { info } from './logging'

/**
 * Executes a melos command as a VS Code task.
 *
 * Displays a progress notification, which allows cancellation of the command.
 */
export async function executeMelosCommand(options: {
  name: string
  folder: vscode.WorkspaceFolder
}) {
  const task = new vscode.Task(
    {
      type: 'melos',
    },
    options.folder,
    options.name,
    'melos',
    new vscode.ShellExecution(`melos ${options.name}`)
  )
  task.presentationOptions = {
    reveal: vscode.TaskRevealKind.Silent,
    clear: true,
    showReuseMessage: false,
  }

  const taskEnded = new Promise<void>((resolve) => {
    const didEndTaskDisposable = vscode.tasks.onDidEndTask((event) => {
      if (event.execution.task === task) {
        didEndTaskDisposable.dispose()
        resolve()
      }
    })
  })

  const start = Date.now()

  const taskExecution = await vscode.tasks.executeTask(task)

  await vscode.window.withProgress(
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

  info(`Executed 'melos ${options.name}' in ${duration}ms`)
}
