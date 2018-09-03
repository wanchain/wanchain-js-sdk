"use strict";

const path=require('path');
const HOME = process.env.HOME;
const PLATFORM = process.platform;
const APPDATA = process.env.APPDATA;
const wanchainNet = 'testnet' + (PLATFORM === 'win32' ? '\\' : '/');

let rpcIpcPath;
let wanPath;
let crosschainPath;
let databasePath;
switch (PLATFORM) {
    case 'darwin':
        rpcIpcPath = `${HOME}/Library/wanchain/${wanchainNet}gwan.ipc`;
        wanPath = `${HOME}/Library/wanchain/${wanchainNet}keystore/`;
        crosschainPath = `${HOME}/Library/ethereum/${ethereumNet}keystore/`;
        databasePath = path.join(HOME, 'LocalDb');
        break;
    case 'freebsd':
    case 'linux':
    case 'sunos':
        rpcIpcPath = `${HOME}/.wanchain/${wanchainNet}gwan.ipc`;
        wanPath = `${HOME}/.wanchain/${wanchainNet}keystore/`;
        crosschainPath = `${HOME}/.ethereum/${ethereumNet}keystore/`;
        databasePath = path.join(HOME, 'LocalDb');
        break;
    case 'win32':
        rpcIpcPath = '\\\\.\\pipe\\gwan.ipc';
        wanPath = `${APPDATA}\\wanchain\\${wanchainNet}keystore\\`;
        crosschainPath = `${APPDATA}\\ethereum\\${ethereumNet}keystore\\`;
        databasePath = path.join(APPDATA, 'LocalDb');
        break;
}

module.exports = {
    version: '1.0.0',
    host: '// http://localhost',
    socketUrl: 'ws://18.236.235.133:80/',
    net: 'testnet',
    port: 8545,
    OTAMixNumber: 8,
    StampMixNumber: 3,
    useLocalNode: true,
    listOption: true,
    loglevel: 'debug',
    rpcIpcPath: rpcIpcPath,

    wanPath: wanPath,
    crosschainPath: crosschainPath,
    databasePath: databasePath,
    crossDbname : 'crossTransDb',
    crossCollection : 'crossTransaction',
};
