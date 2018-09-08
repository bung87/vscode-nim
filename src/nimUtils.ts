/*---------------------------------------------------------
 * Copyright (C) Xored Software Inc. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------*/

'use strict';

import fs = require('fs');
import path = require('path');
import os = require('os');
import cp = require('child_process');
import vscode = require('vscode');
import lstat = require('lstat');
import bluebird = require('bluebird');

// import { showNimStatus, hideNimStatus } from './nimStatus';

let _pathesCache: { [tool: string]: string; } = {};
var _projects: string[] = [];

export async function getNimExecPath(): Promise<string> {
    var binPath;
    let nimsuggest: string = vscode.workspace.getConfiguration('nim').get('nimsuggest');
    if (nimsuggest) {
        binPath = path.resolve(path.dirname(nimsuggest), 'nim');
    }else if (typeof _pathesCache['nimsuggest']!=='undefined'){
        binPath = path.resolve(path.dirname(_pathesCache['nimsuggest']), 'nim');
    } else {
        binPath = await getBinPath('nim');
    }
    if (!binPath) {
        vscode.window.showErrorMessage('No \'nim\' binary could be found in PATH environment variable');
        return Promise.reject()
    }
    return Promise.resolve(binPath);
}

/**
 * Returns full path to nimpretty executables or '' if file not found.
 */
export async function getNimPrettyExecPath(): Promise<string> {
    let toolname = 'nimpretty';
    // since nimpretty not packaged with nim distrubtion,not use getNimExecPath here
    return getBinPath(toolname);
}

export function setPathesCache(tool,path:string):void{
    _pathesCache[tool] = path
}

export function getProjectFile(filename: string) {
    if (filename && !path.isAbsolute(filename)) {
        filename = path.relative(vscode.workspace.rootPath, filename);
    }
    
    if (!isProjectMode()) {
        return filename;
    }
    for (var i = 0; i < _projects.length; i++) {
        let project = _projects[i];
        if (filename.startsWith(path.dirname(project))) {
            return project;
        }
    }
    return _projects[0];
}

/**
 * Returns temporary file path of edited document.
 */
export function getDirtyFile(document: vscode.TextDocument): string {
    var dirtyFilePath = path.normalize(path.join(os.tmpdir(), 'vscodenimdirty.nim'));
    fs.writeFileSync(dirtyFilePath, document.getText());
    return dirtyFilePath;
}

export function isProjectMode(): boolean {
    return _projects.length > 0;
}

export function getProjects(): string[] {
    return _projects;
}

export function prepareConfig(): void {
    let config = vscode.workspace.getConfiguration('nim');
    let projects = config['project'];
    _projects = [];
    if (projects) {
        if (projects instanceof Array) {
            projects.forEach((project) => {
                _projects.push(path.isAbsolute(project) ? project : path.resolve(vscode.workspace.rootPath, project));
            });
        } else {
            _projects.push(path.isAbsolute(projects) ? projects : path.resolve(vscode.workspace.rootPath, projects));
        }
    }
}

export  function promiseSymbolLink(path: string): Promise<{path:string,type:string}>{
    return new Promise<{path:string,type:string}>( (resolve, reject) =>{
        if(!fs.existsSync(path)){
             reject("")
        }
        try {
             lstat(path).then(stat => {
                if (stat.isSymbolicLink()){
                     resolve({path:path,type:"link"})
                }else if(stat.isFile()) {
                     resolve({path:path,type:"file"})
                }else{
                     reject()
                }
              }).catch( e => {
                  console.error(e);
                 reject("");
              });
        } catch ( e ) {
            console.error(e);
             reject("");
        }
    })
   
}

export async function getBinPath(tool: string): Promise<string> {
    if (_pathesCache[tool]) return Promise.resolve(_pathesCache[tool]);
    if (process.env['PATH']) {
        var quikePath = ""
        try{
            quikePath = path.normalize(cp.execSync(`which ${tool}`).toString().trim())
        }catch(e){
            console.error(e)
        }
        if(quikePath){
            _pathesCache[tool] = path.normalize(quikePath);
            return Promise.resolve(quikePath)
        }
        var pathparts = (<string>process.env.PATH).split((<any>path).delimiter)
            .filter( (value, index, self) => self.indexOf(value) === index )
            .reverse();
        pathparts = pathparts.filter(x => x.indexOf("/sbin") === -1)
        pathparts = pathparts.filter(x => {
            if(x.match("([a-zA-Z0-9_-]+)+[0-9\.]+") || x.match("\.[a-zA-Z]+")){
                return x.toLowerCase().indexOf("nim") !== -1
            }else{
                return true
            }
        })
        // _pathesCache[tool] = pathparts.map(dir => path.join(dir, correctBinname(tool))).filter(candidate => fs.existsSync(candidate))[0];
        let pathes = pathparts.map(dir => path.join(dir, correctBinname(tool)));
        let promises = bluebird.map(pathes,x => promiseSymbolLink(x))
        let anyLink = await promises.any().catch(e =>{
            console.error(e)
        });
        let msg = `No ${tool} binary could be found in PATH environment variable`
        if (typeof anyLink !=='undefined'){
            if(anyLink.type === 'link'){
                _pathesCache[tool] = anyLink.path;
            }else{
                return Promise.resolve(anyLink.path)
            }
        }else{
            // vscode.window.showInformationMessage(msg);
            // return Promise.reject(msg)
        }
        if ( process.platform !== 'win32') {
            try {
                let nimPath;
                if (process.platform === 'darwin') {
                    nimPath = cp.execFileSync('readlink', [_pathesCache[tool]]).toString().trim();
                    if (nimPath.length > 0 && !path.isAbsolute(nimPath)) {
                        nimPath = path.normalize(path.join(path.dirname(_pathesCache[tool]), nimPath));
                    }
                } else if (process.platform === 'linux') {
                    nimPath = cp.execFileSync('readlink', ['-f', _pathesCache[tool]]).toString().trim();
                } else {
                    nimPath = cp.execFileSync('readlink', [_pathesCache[tool]]).toString().trim();
                }

                if (nimPath.length > 0) {
                    _pathesCache[tool] = nimPath;
                }
            } catch (e) {
                console.error(e);
                vscode.window.showErrorMessage(msg);
                return Promise.reject()
                // ignore exception
            }
        }
    }
    return Promise.resolve(_pathesCache[tool]);
}

export function correctBinname(binname: string): string {
    if (process.platform === 'win32') {
        return binname + '.exe';
    } else {
        return binname;
    }
}

export function removeDirSync(p: string): void {
    if (fs.existsSync(p)) {
        fs.readdirSync(p).forEach((file, index) => {
            var curPath = path.resolve(p, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                removeDirSync(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(p);
    }
};