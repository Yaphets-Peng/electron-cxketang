"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

exports.getActiveSync = exports.getActive = exports.getByPidSync = exports.getByPid = exports.getByHidSync = exports.getByHid = void 0;
const util = require("util");
const child_process = require("child_process");
const path = require("path");
const execFile = util.promisify(child_process.execFile);
function parseJSON(text) {
	try {
		return JSON.parse(text);
	} catch (e1) {
		console.error(`${e1.message}`);
		try {
			return eval("(" + text + ")");
		} catch (e2) {
			console.error(`${e2.message}: \n${text}`);
		}
		throw new Error('Error parsing data');
	}
}
const EXEC_MAP = {
    win32: 'win-info-win32.exe',
    linux: 'win-info-x11.js',
    freebsd: 'win-info-x11.js',
    sunos: 'win-info-x11.js',
    openbsd: 'win-info-x11.js',
    darwin: 'win-info-darwin'
};
function getCmdWithArgs(arg, platform) {
    let cmd = EXEC_MAP[platform || process.platform];
    if (!cmd) {
        throw new Error('macOS, Windows and X11 platforms only');
    }
    cmd = path.resolve(__dirname, 'bin', cmd);
    let args = [];
    if (cmd.endsWith('.js')) { // Node script
        [cmd, args] = [process.argv[0], [cmd]];
    }
    if (arg) {
        args.push(`${arg}`);
    }
    return { cmd, args };
}
function getCmdWithArgsForWin(arg1, arg2) {
	if(process.platform !="win32"){
		throw new Error('Windows platforms only');
	}
	let cmd = EXEC_MAP["win32"];
	cmd = path.resolve(__dirname, 'bin', cmd);
	let args= [];
	if (cmd.endsWith('.js')) { // Node script
		[cmd, args] = [process.argv[0], [cmd]];
	}
	if (arg1) {
		args.push(`${arg1}`);
	}
	if (arg2) {
		args.push(`${arg2}`);
	}
    if (args.length != 2) {
        throw new Error('Must have two parameters');
    }
	return {cmd, args};
}
class WinInfo {
    static async getByHid(hid) {
        const {cmd, args} = getCmdWithArgsForWin('findHandle', hid);
        return parseJSON((await execFile(cmd, args, {encoding: 'utf8'})).stdout);
    }
    static async getByPid(pid, platform) {
        const {cmd, args} = getCmdWithArgs(pid, platform);
        return parseJSON((await execFile(cmd, args, {encoding: 'utf8'})).stdout);
    }
    static async getActive(platform) {
        const {cmd, args} = getCmdWithArgs('active', platform);
        return parseJSON((await execFile(cmd, args, {encoding: 'utf8'})).stdout);
    }
    static getByHidSync(hid) {
        const {cmd, args} = getCmdWithArgsForWin('findHandle', hid);
        return parseJSON((child_process.execFileSync(cmd, args, {encoding: 'utf8'})));
    }
    static getByPidSync(pid, platform) {
        const {cmd, args} = getCmdWithArgs(pid, platform);
        return parseJSON((child_process.execFileSync(cmd, args, {encoding: 'utf8'})));
    }
    static getActiveSync(platform) {
        const {cmd, args} = getCmdWithArgs('active', platform);
        return parseJSON((child_process.execFileSync(cmd, args, {encoding: 'utf8'})));
    }
}
exports.getByHid = WinInfo.getByHid;
exports.getByHidSync = WinInfo.getByHidSync;
exports.getByPid = WinInfo.getByPid;
exports.getByPidSync = WinInfo.getByPidSync;
exports.getActive = WinInfo.getActive;
exports.getActiveSync = WinInfo.getActiveSync;
