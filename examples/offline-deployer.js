const p = require('path');
var { config } = require('./conf/config');
const WalletCore  = require("../index").walletCore;
const hdUtil = require("../index").hdUtil;
const offlineDeployer = require("../index").offlineDeployer;

async function main(){
  /* init wallet */
  config.walletPathPrex = p.join('C:/Users/zhangwei/AppData/Roaming/Wan Wallet/test/Db', 'walletDB');
  config.databasePathPrex = p.join('C:/Users/zhangwei/AppData/Roaming/Wan Wallet/Db', `${config.network}DB`, 'sdk');
	walletCore = new WalletCore(config);
	await walletCore.init();

  let phrase = hdUtil.revealMnemonic("wallet-password");
  hdUtil.initializeHDWallet(phrase);
  hdUtil.newKeyStoreWallet("wallet-password");

  /******** WAN ********/
  {
    let walletId = 5;
    let path = "m/44'/5718350'/0'/0/0";

    let txs = [
      {
        toAddress: '0xBC874a59aCb43B21315f399E648eFF114f4E2f41', // gpk
        abi: [{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"groupMap","outputs":[{"name":"groupId","type":"bytes32"},{"name":"round","type":"uint16"},{"name":"ployCommitPeriod","type":"uint32"},{"name":"defaultPeriod","type":"uint32"},{"name":"negotiatePeriod","type":"uint32"},{"name":"smNumber","type":"uint16"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"cfg","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"admin","type":"address"}],"name":"removeAdmin","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"smg","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"transferOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"admin","type":"address"}],"name":"addAdmin","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"renounceOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"acceptOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"changeOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"newOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"mapAdmin","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"groupId","type":"bytes32"},{"indexed":true,"name":"round","type":"uint16"},{"indexed":true,"name":"curveIndex","type":"uint8"},{"indexed":false,"name":"storeman","type":"address"}],"name":"SetPolyCommitLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"groupId","type":"bytes32"},{"indexed":true,"name":"round","type":"uint16"},{"indexed":true,"name":"curveIndex","type":"uint8"},{"indexed":false,"name":"src","type":"address"},{"indexed":false,"name":"dest","type":"address"}],"name":"SetEncSijLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"groupId","type":"bytes32"},{"indexed":true,"name":"round","type":"uint16"},{"indexed":true,"name":"curveIndex","type":"uint8"},{"indexed":false,"name":"src","type":"address"},{"indexed":false,"name":"dest","type":"address"},{"indexed":false,"name":"isValid","type":"bool"}],"name":"SetCheckStatusLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"groupId","type":"bytes32"},{"indexed":true,"name":"round","type":"uint16"},{"indexed":true,"name":"curveIndex","type":"uint8"},{"indexed":false,"name":"src","type":"address"},{"indexed":false,"name":"dest","type":"address"}],"name":"RevealSijLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"admin","type":"address"}],"name":"AddAdmin","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"admin","type":"address"}],"name":"RemoveAdmin","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"constant":false,"inputs":[{"name":"cfgAddr","type":"address"},{"name":"smgAddr","type":"address"}],"name":"setDependence","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"ployCommitPeriod","type":"uint32"},{"name":"defaultPeriod","type":"uint32"},{"name":"negotiatePeriod","type":"uint32"}],"name":"setPeriod","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"roundIndex","type":"uint16"},{"name":"curveIndex","type":"uint8"},{"name":"polyCommit","type":"bytes"}],"name":"setPolyCommit","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"curveIndex","type":"uint8"}],"name":"polyCommitTimeout","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"roundIndex","type":"uint16"},{"name":"curveIndex","type":"uint8"},{"name":"dest","type":"address"},{"name":"encSij","type":"bytes"}],"name":"setEncSij","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"roundIndex","type":"uint16"},{"name":"curveIndex","type":"uint8"},{"name":"src","type":"address"},{"name":"isValid","type":"bool"}],"name":"setCheckStatus","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"curveIndex","type":"uint8"},{"name":"src","type":"address"}],"name":"encSijTimeout","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"roundIndex","type":"uint16"},{"name":"curveIndex","type":"uint8"},{"name":"dest","type":"address"},{"name":"sij","type":"uint256"},{"name":"ephemPrivateKey","type":"uint256"}],"name":"revealSij","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"curveIndex","type":"uint8"},{"name":"dest","type":"address"}],"name":"checkSijTimeout","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"curveIndex","type":"uint8"},{"name":"src","type":"address"}],"name":"SijTimeout","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"curveIndex","type":"uint8"}],"name":"terminate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"roundIndex","type":"int32"}],"name":"getGroupInfo","outputs":[{"name":"queriedRound","type":"uint16"},{"name":"curve1","type":"address"},{"name":"curve1Status","type":"uint8"},{"name":"curve1StatusTime","type":"uint256"},{"name":"curve2","type":"address"},{"name":"curve2Status","type":"uint8"},{"name":"curve2StatusTime","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"roundIndex","type":"uint16"},{"name":"curveIndex","type":"uint8"},{"name":"src","type":"address"}],"name":"getPolyCommit","outputs":[{"name":"polyCommit","type":"bytes"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"roundIndex","type":"uint16"},{"name":"curveIndex","type":"uint8"},{"name":"src","type":"address"},{"name":"dest","type":"address"}],"name":"getSijInfo","outputs":[{"name":"encSij","type":"bytes"},{"name":"checkStatus","type":"uint8"},{"name":"setTime","type":"uint256"},{"name":"checkTime","type":"uint256"},{"name":"sij","type":"uint256"},{"name":"ephemPrivateKey","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"index","type":"uint16"}],"name":"getGpkShare","outputs":[{"name":"gpkShare1","type":"bytes"},{"name":"gpkShare2","type":"bytes"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"groupId","type":"bytes32"}],"name":"getGpk","outputs":[{"name":"gpk1","type":"bytes"},{"name":"gpk2","type":"bytes"}],"payable":false,"stateMutability":"view","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"groupId","type":"bytes32"},{"indexed":true,"name":"round","type":"uint16"},{"indexed":false,"name":"gpk1","type":"bytes"},{"indexed":false,"name":"gpk2","type":"bytes"}],"name":"GpkCreatedLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"groupId","type":"bytes32"},{"indexed":true,"name":"slashType","type":"uint8"},{"indexed":true,"name":"slashed","type":"address"},{"indexed":false,"name":"partner","type":"address"},{"indexed":false,"name":"round","type":"uint16"},{"indexed":false,"name":"curveIndex","type":"uint8"}],"name":"SlashLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"groupId","type":"bytes32"},{"indexed":true,"name":"round","type":"uint16"}],"name":"ResetLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"groupId","type":"bytes32"},{"indexed":true,"name":"round","type":"uint16"}],"name":"CloseLogger","type":"event"}],
        method: 'addAdmin',
        paras: ['0xb9dd855dc6a9340ea6b566a5b454202115bcf485']
      },
      {
        toAddress: '0xBC874a59aCb43B21315f399E648eFF114f4E2F41', // gpk
        abi: [{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"groupMap","outputs":[{"name":"groupId","type":"bytes32"},{"name":"round","type":"uint16"},{"name":"ployCommitPeriod","type":"uint32"},{"name":"defaultPeriod","type":"uint32"},{"name":"negotiatePeriod","type":"uint32"},{"name":"smNumber","type":"uint16"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"cfg","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"admin","type":"address"}],"name":"removeAdmin","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"smg","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"transferOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"admin","type":"address"}],"name":"addAdmin","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"renounceOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"acceptOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"changeOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"newOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"mapAdmin","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"groupId","type":"bytes32"},{"indexed":true,"name":"round","type":"uint16"},{"indexed":true,"name":"curveIndex","type":"uint8"},{"indexed":false,"name":"storeman","type":"address"}],"name":"SetPolyCommitLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"groupId","type":"bytes32"},{"indexed":true,"name":"round","type":"uint16"},{"indexed":true,"name":"curveIndex","type":"uint8"},{"indexed":false,"name":"src","type":"address"},{"indexed":false,"name":"dest","type":"address"}],"name":"SetEncSijLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"groupId","type":"bytes32"},{"indexed":true,"name":"round","type":"uint16"},{"indexed":true,"name":"curveIndex","type":"uint8"},{"indexed":false,"name":"src","type":"address"},{"indexed":false,"name":"dest","type":"address"},{"indexed":false,"name":"isValid","type":"bool"}],"name":"SetCheckStatusLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"groupId","type":"bytes32"},{"indexed":true,"name":"round","type":"uint16"},{"indexed":true,"name":"curveIndex","type":"uint8"},{"indexed":false,"name":"src","type":"address"},{"indexed":false,"name":"dest","type":"address"}],"name":"RevealSijLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"admin","type":"address"}],"name":"AddAdmin","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"admin","type":"address"}],"name":"RemoveAdmin","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"constant":false,"inputs":[{"name":"cfgAddr","type":"address"},{"name":"smgAddr","type":"address"}],"name":"setDependence","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"ployCommitPeriod","type":"uint32"},{"name":"defaultPeriod","type":"uint32"},{"name":"negotiatePeriod","type":"uint32"}],"name":"setPeriod","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"roundIndex","type":"uint16"},{"name":"curveIndex","type":"uint8"},{"name":"polyCommit","type":"bytes"}],"name":"setPolyCommit","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"curveIndex","type":"uint8"}],"name":"polyCommitTimeout","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"roundIndex","type":"uint16"},{"name":"curveIndex","type":"uint8"},{"name":"dest","type":"address"},{"name":"encSij","type":"bytes"}],"name":"setEncSij","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"roundIndex","type":"uint16"},{"name":"curveIndex","type":"uint8"},{"name":"src","type":"address"},{"name":"isValid","type":"bool"}],"name":"setCheckStatus","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"curveIndex","type":"uint8"},{"name":"src","type":"address"}],"name":"encSijTimeout","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"roundIndex","type":"uint16"},{"name":"curveIndex","type":"uint8"},{"name":"dest","type":"address"},{"name":"sij","type":"uint256"},{"name":"ephemPrivateKey","type":"uint256"}],"name":"revealSij","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"curveIndex","type":"uint8"},{"name":"dest","type":"address"}],"name":"checkSijTimeout","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"curveIndex","type":"uint8"},{"name":"src","type":"address"}],"name":"SijTimeout","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"curveIndex","type":"uint8"}],"name":"terminate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"roundIndex","type":"int32"}],"name":"getGroupInfo","outputs":[{"name":"queriedRound","type":"uint16"},{"name":"curve1","type":"address"},{"name":"curve1Status","type":"uint8"},{"name":"curve1StatusTime","type":"uint256"},{"name":"curve2","type":"address"},{"name":"curve2Status","type":"uint8"},{"name":"curve2StatusTime","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"roundIndex","type":"uint16"},{"name":"curveIndex","type":"uint8"},{"name":"src","type":"address"}],"name":"getPolyCommit","outputs":[{"name":"polyCommit","type":"bytes"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"roundIndex","type":"uint16"},{"name":"curveIndex","type":"uint8"},{"name":"src","type":"address"},{"name":"dest","type":"address"}],"name":"getSijInfo","outputs":[{"name":"encSij","type":"bytes"},{"name":"checkStatus","type":"uint8"},{"name":"setTime","type":"uint256"},{"name":"checkTime","type":"uint256"},{"name":"sij","type":"uint256"},{"name":"ephemPrivateKey","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"index","type":"uint16"}],"name":"getGpkShare","outputs":[{"name":"gpkShare1","type":"bytes"},{"name":"gpkShare2","type":"bytes"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"groupId","type":"bytes32"}],"name":"getGpk","outputs":[{"name":"gpk1","type":"bytes"},{"name":"gpk2","type":"bytes"}],"payable":false,"stateMutability":"view","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"groupId","type":"bytes32"},{"indexed":true,"name":"round","type":"uint16"},{"indexed":false,"name":"gpk1","type":"bytes"},{"indexed":false,"name":"gpk2","type":"bytes"}],"name":"GpkCreatedLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"groupId","type":"bytes32"},{"indexed":true,"name":"slashType","type":"uint8"},{"indexed":true,"name":"slashed","type":"address"},{"indexed":false,"name":"partner","type":"address"},{"indexed":false,"name":"round","type":"uint16"},{"indexed":false,"name":"curveIndex","type":"uint8"}],"name":"SlashLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"groupId","type":"bytes32"},{"indexed":true,"name":"round","type":"uint16"}],"name":"ResetLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"groupId","type":"bytes32"},{"indexed":true,"name":"round","type":"uint16"}],"name":"CloseLogger","type":"event"}],
        method: 'setPeriod',
        paras: ['0x000000000000000000000000000000000000000000746573746e65745f303038', 86400, 86400, 86400]
      },
      {
        toAddress: '0x165d1526ECbb8F3DAD789C640C5b0d6a3D499496', // transfer wan coin
        value: 1
      }
    ];

    await offlineDeployer.initNonce('WAN', walletId, path);
    await offlineDeployer.buildTx('WAN', walletId, path, txs);
    await offlineDeployer.setFilePath('sendTx', p.join(config.databasePathPrex, 'offlineDeployer/txData/WAN-0xb9dd855dc6a9340ea6b566a5b454202115bcf485.dat'));
    await offlineDeployer.sendTx('WAN');
  }

  /******** ETH ********/
  {
    let walletId = 1;
    let path = "m/44'/60'/0'/0/0";

    let txs = [
      {
        toAddress: '0xC7CD13b3f36f79B6dE4A1ac527882D9d37fB9C9E', // usdt
        abi: [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_upgradedAddress","type":"address"}],"name":"deprecate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"deprecated","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_evilUser","type":"address"}],"name":"addBlackList","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"upgradedAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balances","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"maximumFee","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"_totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"unpause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_maker","type":"address"}],"name":"getBlackListStatus","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"address"}],"name":"allowed","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"paused","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"pause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newBasisPoints","type":"uint256"},{"name":"newMaxFee","type":"uint256"}],"name":"setParams","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"amount","type":"uint256"}],"name":"issue","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"amount","type":"uint256"}],"name":"redeem","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"basisPointsRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"isBlackListed","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_clearedUser","type":"address"}],"name":"removeBlackList","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"MAX_UINT","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_blackListedUser","type":"address"}],"name":"destroyBlackFunds","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_initialSupply","type":"uint256"},{"name":"_name","type":"string"},{"name":"_symbol","type":"string"},{"name":"_decimals","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"}],"name":"Issue","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"}],"name":"Redeem","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"newAddress","type":"address"}],"name":"Deprecate","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"feeBasisPoints","type":"uint256"},{"indexed":false,"name":"maxFee","type":"uint256"}],"name":"Params","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_blackListedUser","type":"address"},{"indexed":false,"name":"_balance","type":"uint256"}],"name":"DestroyedBlackFunds","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_user","type":"address"}],"name":"AddedBlackList","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_user","type":"address"}],"name":"RemovedBlackList","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[],"name":"Pause","type":"event"},{"anonymous":false,"inputs":[],"name":"Unpause","type":"event"}],
        method: 'transfer',
        paras: ['0x5f59488d1aacb3eb6832891836c8b47a0824de62', 1],
        gasPrice: 1000000000,
        gasLimit: 50000
      }
    ]

    await offlineDeployer.initNonce('ETH', walletId, path);
    await offlineDeployer.buildTx('ETH', walletId, path, txs);
    await offlineDeployer.setFilePath('sendTx', p.join(config.databasePathPrex, 'offlineDeployer/txData/ETH-0x37df4abe767c9f16399fb567f596746290bc8eb0.dat'));
    await offlineDeployer.sendTx('ETH');
  }

  console.log("offlineDeployer finished");
}

main();