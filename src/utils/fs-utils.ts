import * as vscode from 'vscode'

/**
 * Returns whether the file with the given {@link uri} exists.
 *
 * The file must be a file or a symbolic link to a file and not a directory.
 */
export async function fileExists(uri: vscode.Uri) {
  try {
    const stat = await vscode.workspace.fs.stat(uri)
    return stat.type === vscode.FileType.File
  } catch (e) {
    if (e instanceof vscode.FileSystemError && e.code === 'FileNotFound') {
      return false
    }
    throw e
  }
}

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
