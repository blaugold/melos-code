import * as vscode from 'vscode'

export function showPackageGraphView(options: {
  dotGraph: string
  folder: vscode.WorkspaceFolder
}) {
  const panel = vscode.window.createWebviewPanel(
    'melos.packageGraph',
    `Package graph - ${options.folder.name}`,
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
    }
  )

  panel.webview.html = packageGraphWebviewContent(options.dotGraph)

  return panel
}

function packageGraphWebviewContent(graph: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <script src="https://unpkg.com/@hpcc-js/wasm@1.12.7/dist/index.min.js"></script>
    <script src="https://unpkg.com/d3-graphviz@4.0.0/build/d3-graphviz.js"></script>
    <style>
        html, body {
            margin: 0;
            padding: 0;
        }
    </style>
</head>
<body>
    <div id="graph"></div>

    <script>
        const renderGraph = () => {
            d3.select("#graph")
                .graphviz()
                .renderDot(\`${graph}\`)
                // Make the graph fill the window.
                .width(window.innerWidth)
                .height(window.innerHeight);
        }

        renderGraph()

        window.onresize = renderGraph
    </script>
</body>
`
}
