// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
// import Main from './main.js'

let isActive = false
// let main = new Main()

function toggle() {
	if (vscode.window.visibleTextEditors.length === 0) {
		vscode.window.showErrorMessage("An editor must be open before toggling")
		return
	}

	let msg
	if (isActive) {
		msg = 'Stopped VSCode Hydra'
		isActive = false
		HydraPanels.disposePanels()
		// main.stop()
	} else {
		msg = 'Started VSCode Hydra'
		isActive = true
		HydraPanels.createPanels()
		// main.start()
	}
	vscode.window.showInformationMessage(msg)
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "vscode-hydra" is now active!')
	context.subscriptions.push(vscode.commands.registerCommand('vscode-hydra.toggle', () => {
		toggle()
	}))
	// context.subscriptions.push(vscode.commands.registerCommand('vscode-hydra.evalBlock', () => {
	// 	main.evalBlock()
	// }))
	// context.subscriptions.push(vscode.commands.registerCommand('vscode-hydra.evalLine', () => { main.evalLine() }))
}

// this method is called when your extension is deactivated
export function deactivate() {}


class HydraPanels {
	public static hydraVisualsPanel: HydraVisualsPanel | undefined
	public static hydraDocsPanel: HydraDocsPanel | undefined

	public static createPanels() {
		// Create panel for hydra visuals
		const hydraVisualPanel = vscode.window.createWebviewPanel(
			'hydra-visuals',
			'Hydra Visuals',
			{
				preserveFocus: true,
				viewColumn: vscode.ViewColumn.Beside
			},
			{
				// Enable javascript in the webview
				enableScripts: true,
			}
		)

		// TODO: Modify to show actual docs
		const hydraDocsPanel = vscode.window.createWebviewPanel(
			'hydra-docs',
			'Hydra Docs',
			{
				preserveFocus: true,
				viewColumn: vscode.ViewColumn.Beside
			},
			{
				// Enable javascript in the webview
				enableScripts: true,
			}
		)

		HydraPanels.hydraVisualsPanel = new HydraVisualsPanel(hydraVisualPanel)
		HydraPanels.hydraDocsPanel = new HydraDocsPanel(hydraDocsPanel)
		
		// Listen for when the panels are disposed
		// This happens when the user closes a panel or when a panel is closed programatically
		HydraPanels.hydraVisualsPanel.panel.onDidDispose(() =>
			HydraPanels.hydraVisualsPanel.dispose(), null, HydraPanels.hydraVisualsPanel.disposables
		)
		HydraPanels.hydraDocsPanel.panel.onDidDispose(() =>
			HydraPanels.hydraDocsPanel.dispose(), null, HydraPanels.hydraDocsPanel.disposables
		)

	}

	public static disposePanels() {
		HydraPanels.hydraVisualsPanel.dispose()
		HydraPanels.hydraVisualsPanel = undefined
		HydraPanels.hydraDocsPanel.dispose()
		HydraPanels.hydraDocsPanel = undefined
	}
}

abstract class HydraPanel {
	public panel: vscode.WebviewPanel
	public disposables: vscode.Disposable[] = []

	constructor(panel: vscode.WebviewPanel) {
		this.panel = panel

		// Set the webview's initial html content
		this._update()

		// // Update the content based on view changes
		// this._panel.onDidChangeViewState(
		// 	e => {
		// 		if (this._panel.visible) {
		// 			this._update()
		// 		}
		// 	},
		// 	null,
		// 	this._disposables
		// )

		// // Handle messages from the webview
		// this._panel.webview.onDidReceiveMessage(
		// 	message => {
		// 		switch (message.command) {
		// 			case 'alert':
		// 				vscode.window.showErrorMessage(message.text)
		// 				return
		// 		}
		// 	},
		// 	null,
		// 	this._disposables
		// )
	}

	private _update() {
		this.panel.webview.html = this._getHtmlForWebview()
	}

	public dispose() {
		// Clean up our resources
		this.panel.dispose()

		while (this.disposables.length) {
			const x = this.disposables.pop()
			if (x) {
				x.dispose()
			}
		}
	}

	public doRefactor() {
		// Send a message to the webview webview.
		// You can send any JSON serializable data.
		this.panel.webview.postMessage({ command: 'refactor' })
	}

	abstract _getHtmlForWebview() : string
}


class HydraVisualsPanel extends HydraPanel {
	_getHtmlForWebview() {
		return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <!--
                Use a content security policy to only allow loading images from https or from our extension directory,
                and only allow scripts that have a specific nonce.
                -->
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Hydra Visuals</title>
            </head>
            <body>
                <h1 id="lines-of-code-counter">Some hydra visuals</h1>
            </body>
            </html>`
	}
}


class HydraDocsPanel extends HydraPanel {
	_getHtmlForWebview() {
		return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <!--
                Use a content security policy to only allow loading images from https or from our extension directory,
                and only allow scripts that have a specific nonce.
                -->
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Hydra Visuals</title>
            </head>
            <body>
                <h1 id="lines-of-code-counter">Some hydra docs</h1>
            </body>
            </html>`
	}
}