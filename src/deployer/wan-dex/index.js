'use strict'

// common
let setFilePath = require('./utils/tool').setFilePath;
let getOutputPath = require('./utils/tool').getOutputPath;
let getNonceOffline = require('./utils/tool').getNonce;
let updateNonce = require('./utils/tool').updateNonce;
let initNonce = require('./utils/scTool').initNonce;
let getNonceOnline = updateNonce;
let getContractVar = require('./utils/scTool').getContractVar;

//---
let buildPrepareContract = require('./offline/1_buildPrepareContract.js');    //step 1  - offline
let deployPrepareContract = require('./online/2_deployPrepareContract.js');   //step 2  - online
let buildExchangeContract = require('./offline/3_buildExchangeContract.js');  //step 3  - offline
let deployExchangeContract = require('./online/4_deployExchangeContract.js'); //step 4  - online
let buildProxyConfig = require('./offline/5_buildProxyConfig.js');            //step 5  - offline
let sendProxyConfig = require('./online/6_sendProxyConfig.js');               //step 6  - online
let buildRelayerDelegate = require('./offline/7_buildRelayerDelegate.js');    //step 7  - offline
let sendRelayerDelegate = require('./online/8_sendRelayerDelegate.js');       //step 8  - online
let buildRelayerApprove = require('./offline/9_buildRelayerApprove.js');      //step 9  - offline
let sendRelayerApprove = require('./online/10_sendRelayerApprove.js');        //step 10 - online
let verifySmartContract = require('./online/11_verifySmartContract.js');      //step 11 - online
//---


module.exports = {
  setFilePath,
  getOutputPath,
  getNonceOffline,
  getNonceOnline,
  getContractVar,
  // deploy
  initNonce,             // called by online
  updateNonce,           // called by offline

  buildPrepareContract,
  deployPrepareContract,
  buildExchangeContract,
  deployExchangeContract,
  buildProxyConfig,
  sendProxyConfig,
  buildRelayerDelegate,
  sendRelayerDelegate,
  buildRelayerApprove,
  sendRelayerApprove,
  verifySmartContract,
};
