import * as vscode from 'vscode'

/**
 * Reads a file through the VSCode API and returns its contents, or `null` if
 * it does not exist.
 */
export async function readOptionalFile(
  uri: vscode.Uri
): Promise<Uint8Array | null> {
  try {
    return await vscode.workspace.fs.readFile(uri)
  } catch (e) {
    if (e instanceof vscode.FileSystemError && e.code === 'FileNotFound') {
      return null
    }

    throw e
  }
}
