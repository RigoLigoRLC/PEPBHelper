/* eslint-disable @typescript-eslint/naming-convention */

import * as fs from 'fs';
import * as vscode from 'vscode';

interface CMakeKits {
    name: string;
    toolchainFile: string;
    compilers: {
        C: string;
        CXX: string;
    }
}

export interface ExtensionPathsConfig {
    armGnuToolchainBin: string,
    openOcdBin: string
}

let config: ExtensionPathsConfig = {
    armGnuToolchainBin: '',
    openOcdBin: ''
};
let executableExtension: string = '';

function checkExtensionConfiguration(): Boolean {
    let cfg: ExtensionPathsConfig = vscode.workspace.getConfiguration('pepb-helper.paths') as any;

    if (!cfg.armGnuToolchainBin || !cfg.openOcdBin) {
        return false;
    }

    config.armGnuToolchainBin = cfg.armGnuToolchainBin.replace(/\\/g, '/');
    config.openOcdBin = cfg.openOcdBin.replace(/\\/g, '/');

    executableExtension = (process.platform === 'win32' ? '.exe' : '');

    return true;
}

function ensureFileExists(path: string) {
    if (fs.existsSync(path)) {
        if (!fs.statSync(path).isFile()) {
            throw Error(`Wants to ensure file "${path}" exists, but it is already a non-file object.`);
        }
    } else {
        fs.closeSync(fs.openSync(path, 'w'));
    }
}

function ensureDirectoryExists(path: string) {
    if (fs.existsSync(path)) {
        if (!fs.statSync(path).isDirectory()) {
            throw Error(`Wants to ensure directory "${path}" exists, but it is already a non-directory file.`);
        }
    } else {
        fs.mkdirSync(path);
    }
}

function writePepbCMakeKits(path: string): Boolean {
    let text: string;
    let cmakeKits: any;
    const filePath: string = path + '/.vscode/cmake-kits.json';
    let getSuitableKit = () => {
        let ret: CMakeKits = {
            name: 'ARM GCC TarsGo-PEPB',
            toolchainFile: path + '/embedded-toolchain.json',
            compilers: {
                C: config.armGnuToolchainBin + '/arm-none-eabi-gcc' + executableExtension,
                CXX: config.armGnuToolchainBin + '/arm-none-eabi-g++' + executableExtension
            }
        };
        return ret;
    };

    try {
        ensureDirectoryExists(path);
        ensureFileExists(filePath);
        text = fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
        vscode.window.showErrorMessage(
            vscode.l10n.t('Cannot open {0}, kit is not modified!', [filePath])
        );
        return false;
    }

    try {
        cmakeKits = JSON.parse(text);
        let found = false;

        if (!Array.isArray(cmakeKits)) {
            throw Error('cmake-kits.json root is not array!');
        }

        for (let i = 0; i < cmakeKits.length; i++) {
            let ii: CMakeKits = cmakeKits[i];
            if (ii.name === 'ARM GCC TarsGo-PEPB') {
                cmakeKits[i] = getSuitableKit();
                found = true;
                break;
            }
        }

        if (!found) {
            cmakeKits.push(getSuitableKit());
        }
    } catch (err) {
        vscode.window.showErrorMessage(
            vscode.l10n.t('Cannot parse {0}, kit is not modified!', [filePath])
        );
        return false;
    }

    try {
        fs.writeFileSync(filePath, JSON.stringify(cmakeKits, undefined, 4), { encoding: 'utf-8' });
    } catch (err) {
        vscode.window.showErrorMessage(
            vscode.l10n.t('Cannot write back to {0}, kit is probably corrupt, please check manually!', [filePath])
        );
        return false;
    }

    return true;
}

function writeVscodeWorkspaceSettings(path: string): Boolean {
    let text: string;
    let settings: any;
    const filePath: string = path + '/.vscode/settings.json';
    const clangdQueryDriver = `--query-driver=${config.armGnuToolchainBin}/arm-none-eabi-*.exe`;

    try {
        ensureDirectoryExists(path);
        ensureFileExists(filePath);
        text = fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
        vscode.window.showErrorMessage(
            vscode.l10n.t('Cannot open {0}, workspace settings is not modified!', [filePath])
        );
        return false;
    }

    try {
        settings = JSON.parse(text);
        let found = false;

        if (typeof settings !== 'object') {
            throw Error('settings.json root is not Object!');
        }

        // Edit clangd.arguments
        if (!settings['clangd.arguments']) {
            settings['clangd.arguments'] = [clangdQueryDriver];
        } else {
            let clangdArgs = settings['clangd.arguments'];
            for (let i = 0; i < clangdArgs.length; i++) {
                if ((clangdArgs[i] as string).startsWith('--query-driver=')) {
                    clangdArgs[i] = clangdQueryDriver;
                    found = true;
                    break;
                }
            }
            if (!found) {
                clangdArgs.push(clangdQueryDriver);
            }
            settings['clangd.arguments'] = clangdArgs;
        }
    } catch (err) {
        vscode.window.showErrorMessage(
            vscode.l10n.t('Cannot parse {0}, workspace settings is not modified!', [filePath])
        );
        return false;
    }

    try {
        fs.writeFileSync(filePath, JSON.stringify(settings, undefined, 4), { encoding: 'utf-8' });
    } catch (err) {
        vscode.window.showErrorMessage(
            vscode.l10n.t('Cannot write back to {0}, workspace settings is probably corrupt, please check manually!', [filePath])
        );
        return false;
    }

    return true;
}

function writePepbSettings(path: string): Boolean {
    let text: string;
    let pepbSettings: any;
    const filePath: string = path + '/.vscode/PEPBSettings.json';
    let getSuitableKit = () => {
        let ret: CMakeKits = {
            name: 'ARM GCC TarsGo-PEPB',
            toolchainFile: path + '/embedded-toolchain.cmake',
            compilers: {
                C: config.armGnuToolchainBin + '/arm-none-eabi-gcc' + executableExtension,
                CXX: config.armGnuToolchainBin + '/arm-none-eabi-g++' + executableExtension
            }
        };
        return ret;
    };

    try {
        ensureDirectoryExists(path);
        ensureFileExists(filePath);
        text = fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
        vscode.window.showErrorMessage(
            vscode.l10n.t('Cannot open {0}, PEPB settings is not modified!', [filePath])
        );
        return false;
    }

    try {
        pepbSettings = JSON.parse(text);
        let found = false;

        if (typeof pepbSettings !== 'object') {
            throw Error('PEPBSettings.json root is not array!');
        }

        // Don't care about robustness, edit it directly,
        // crash with any illegal input
        pepbSettings['OpenOcd']['Path'] = config.openOcdBin;
    } catch (err) {
        vscode.window.showErrorMessage(
            vscode.l10n.t('Cannot parse {0}, PEPB settings is not modified!', [filePath])
        );
        return false;
    }

    try {
        fs.writeFileSync(filePath, JSON.stringify(pepbSettings, undefined, 4), { encoding: 'utf-8' });
    } catch (err) {
        vscode.window.showErrorMessage(
            vscode.l10n.t('Cannot write back to {0}, PEPB settings is probably corrupt, please check manually!', [filePath])
        );
        return false;
    }

    return true;
}

export function modifyForWorkspace(path: string) {
    path = path.replace(/\\/g, '/');

    // if (!fs.existsSync(path + '/.vscode/PEPB'))

    if (!checkExtensionConfiguration()) {
        vscode.window.showErrorMessage(
            vscode.l10n.t('Settings of this extension is not complete, please retry after revising configuration!')
        );
        return;
    }

    let result: Boolean = true;

    result &&= writePepbCMakeKits(path);
    result &&= writeVscodeWorkspaceSettings(path);
    result &&= writePepbSettings(path);

    if (result) {
        vscode.window.showInformationMessage(
            vscode.l10n.t('Successfully updated PEPB paths for project "{0}"!', path)
        );
    }
}
