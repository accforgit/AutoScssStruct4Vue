import * as vscode from 'vscode'
import { excuteWhenSave, updateScssFile, generateProcess, updateConfig } from './util'
import VARS from './vars'

export function activate(context: vscode.ExtensionContext) {
	console.log('扩展激活')
	// 更新配置项变量
	updateConfig()
	let listener: vscode.Disposable | null = null
	// 监控配置项 change
	vscode.workspace.onDidChangeConfiguration(() => {
		// 更新配置项变量
		updateConfig()
		if (VARS.config.autoScssStruct4VueConf.excuteMode === 'onCommand') {
			// 从 onSave&onCommand 变成 onCommand
			if (!listener) return
			listener.dispose()
		} else {
			// 从 onCommand 变成 onSave&onCommand
			listener = excuteWhenSave()
		}
	})
	if (VARS.config.autoScssStruct4VueConf.excuteMode === 'onSave&onCommand') {
		// 当文件保存时执行
		listener = excuteWhenSave()
	}
	// 当使用 autoScssStruct 命令时执行
	context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.autoScssStruct', async textEditor => {
		console.log('autoScssStruct 执行命令启动')
		if (!textEditor) return console.log('no textEditor')
		const activeDocument = textEditor.document
		// 当前文件未保存，则尝试保存
		if (activeDocument.isDirty) {
			let saveRst = false
			try {
				saveRst = await activeDocument.save()
			} catch (e) {
				console.log('save error:', e)
			}
			if (!saveRst) {
				return vscode.window.showInformationMessage('请先保存当前文件')
			}
		}
		if (activeDocument.languageId !== 'vue') {
			return vscode.window.showInformationMessage('当前不是 vue 文件')
		}
		const fileStr = generateProcess(activeDocument)
		updateScssFile(activeDocument.uri.fsPath, fileStr, () => {
			textEditor.edit((editorBuilder: vscode.TextEditorEdit) => {
				editorBuilder.replace(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(activeDocument.lineCount + 1, 0)), <string>fileStr)
				setTimeout(() => {
					activeDocument.save().then(rst => {
						console.log('保存结果：', rst)
					})
				}, 0)
			})
		})
	}))
}

// this method is called when your extension is deactivated
export function deactivate() {
	console.log('扩展释放')
}
