
import * as vscode from 'vscode';
import { modifyForWorkspace } from './ConfigModifier';

export function activate(context: vscode.ExtensionContext) {
	console.log('PEPB Helper activated');

	context.subscriptions.push(vscode.commands.registerCommand('pepb-helper.configure_project', () => {
		if (!vscode.workspace.workspaceFolders) {
			vscode.window.showWarningMessage(vscode.l10n.t("PEPB Helper require a workspace to function!"));
			return;
		}

		if (vscode.workspace.workspaceFolders.length > 1) {
			vscode.window.showWarningMessage(vscode.l10n.t("PEPB Helper does not support workspaces with multiple roots!"));
			return;
		}

		modifyForWorkspace(vscode.workspace.workspaceFolders![0].uri.fsPath);
	}));
}



// This method is called when your extension is deactivated
export function deactivate() {}
