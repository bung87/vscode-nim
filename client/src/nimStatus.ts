/*---------------------------------------------------------
 * Copyright (C) Xored Software Inc. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------*/

'use strict';

import { NIM_MODE } from './nimMode';
import * as vscode from 'vscode';

var statusBarEntry: vscode.StatusBarItem;
var progressBarEntry: vscode.StatusBarItem;
export var nimVerEntry: vscode.StatusBarItem;

export function showHideStatus() {
  if (!statusBarEntry) {
    return;
  }
  if (!vscode.window.activeTextEditor) {
    statusBarEntry.hide();
    nimVerEntry.hide();
    return;
  }
  if (vscode.languages.match(NIM_MODE, vscode.window.activeTextEditor.document)) {
    statusBarEntry.show();
    nimVerEntry.show();
    return;
  }
  statusBarEntry.hide();
}

export function hideNimStatus() {
  statusBarEntry.dispose();
}

export function hideNimProgress() {
  progressBarEntry.dispose();
}

export function showNimStatus(message: string, command: string, tooltip?: string) {
  statusBarEntry = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, Number.MIN_VALUE);
  statusBarEntry.text = message;
  statusBarEntry.command = command;
  statusBarEntry.color = 'yellow';
  statusBarEntry.tooltip = tooltip;
  statusBarEntry.show();
}

export function showNimProgress(message: string) {
  progressBarEntry = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, Number.MIN_VALUE);
  progressBarEntry.text = message;
  progressBarEntry.tooltip = message;
  progressBarEntry.show();
}

export function showNimVer(version,path: string) {
  nimVerEntry = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
  nimVerEntry.text = `Nimsuggest ${version}`;
  nimVerEntry.command = 'nim.setSuggester';
  nimVerEntry.tooltip = path;
  nimVerEntry.show();
}


export function updateNimProgress(message: string) {
    progressBarEntry.text = message;
}