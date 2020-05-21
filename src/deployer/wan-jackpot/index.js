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
let buildJackPotContract = require('./offline/1_buildJackPotContract.js');    //step 1  - offline
let deployJackPotContract = require('./online/2_deployJackPotContract.js');   //step 2  - online
let buildJackPotConfig = require('./offline/3_buildJackPotConfig.js');        //step 3  - offline
let sendJackPotConfig = require('./online/4_sendJackPotConfig.js');           //step 4  - online
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

  buildJackPotContract,
  deployJackPotContract,
  buildJackPotConfig,
  sendJackPotConfig,
};
