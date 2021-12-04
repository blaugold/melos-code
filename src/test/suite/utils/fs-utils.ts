import * as vscode from 'vscode'

export async function writeFileAsString(uri: vscode.Uri, content: string) {
  await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'))
}

export async function clearDirectory(
  uri: vscode.Uri,
  filter: (uri: vscode.Uri) => boolean = () => true
) {
  const files = await vscode.workspace.fs.readDirectory(uri)

  for (const file of files) {
    const fileUri = vscode.Uri.joinPath(uri, file[0])
    if (!filter(fileUri)) {
      continue
    }

    if (file[1] === vscode.FileType.Directory) {
      await clearDirectory(fileUri, filter)
    }

    await vscode.workspace.fs.delete(fileUri, {
      useTrash: false,
    })
  }
}
