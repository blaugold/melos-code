import * as vscode from 'vscode'

export async function writeFileAsString(uri: vscode.Uri, content: string) {
  await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'))
}

export async function clearDirectory(uri: vscode.Uri) {
  const files = await vscode.workspace.fs.readDirectory(uri)
  for (const file of files) {
    await vscode.workspace.fs.delete(vscode.Uri.joinPath(uri, file[0]), {
      recursive: true,
      useTrash: false,
    })
  }
}
