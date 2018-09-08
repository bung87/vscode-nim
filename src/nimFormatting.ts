/*---------------------------------------------------------
 * Copyright (C) Xored Software Inc. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------*/

'use strict';

import vscode = require('vscode');
import cp = require('child_process');
import fs = require('fs');
import path = require('path');
import { getDirtyFile, getNimPrettyExecPath } from './nimUtils';

const binError = 'No \'nimpretty\' binary could be found in PATH environment variable'

export class NimFormattingProvider implements vscode.DocumentFormattingEditProvider {

  public  provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.TextEdit[] | Thenable<vscode.TextEdit[]> {
    return new Promise((resolve, reject) => {
      getNimPrettyExecPath().then( binPath =>{
        if (binPath === '') {
          vscode.window.showErrorMessage(binError);
          resolve([]);
        } else {
          let file = getDirtyFile(document);
          let res = cp.spawnSync(binPath, ['--backup:Off', file], { cwd: vscode.workspace.rootPath });
          if (res.status !== 0) {
            let msg = res.stderr.toString()
            console.error(msg);
            let niceMsg = msg.substr(msg.indexOf("Error"))
            vscode.window.showWarningMessage(niceMsg);
            reject(msg);
          } else {
            let ext = path.extname(file);
            let prettyFile = path.join(path.dirname(file), path.basename(file, ext)  + ext);
            if (!fs.existsSync(prettyFile)) {
              let msg = prettyFile + ' file not found'
              console.error(msg)
              reject(msg);
            } else {
              let content = fs.readFileSync(prettyFile, 'utf-8');
              console.log(prettyFile)
              let range = document.validateRange(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(1000000, 1000000)));
              resolve([vscode.TextEdit.replace(range, content)]);
            }
          }
        }
      }).catch(e=>{
        vscode.window.showErrorMessage(binError);
      })
    });
  }
}