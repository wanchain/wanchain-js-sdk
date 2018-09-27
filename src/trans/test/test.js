'use strict'
let configCLi   = {};
require('../../logger/logger');

let WalletCore  = require('../../core/walletCore');
let ccUtil      = require('../../api/ccUtil');
let {
  CrossChainBtcLock,
  CrossChainBtcRedeem,
  CrossChainBtcRevoke,
  CrossChainEthLock,
  CrossChainEthRedeem,
  CrossChainEthRevoke,
  CrossChainE20Approve,
  CrossChainE20Lock,
  CrossChainE20Revoke,
  CrossChainE20Redeem
} = require('../../trans/CrossChain');

let firstApproveAmout      =  100;       //100x10^18
let everyLockAmout         =  0.000002;



let inputA       = {
  from:         '0xf47a8bb5c9ff814d39509591281ae31c0c7c2f38',
  //storeman:     '0xc27ecd85faa4ae80bf5e28daf91b605db7be1ba8',
  storeman:     '0xa89f7702fb9f237aad805e8f99a2793f58e81242',
  txFeeRatio:   '1',
  to:           '0x393e86756d8d4cf38493ce6881eb3a8f2966bb27',
  amount:       everyLockAmout,
  gasPrice:     '2',
  gasLimit:     '2000000',
  password:     'wanglu',
  testOrNot:    'YES'
}
let inputB       = {
  from:         '0x393e86756d8d4cf38493ce6881eb3a8f2966bb27',
  storeman:     '0xb755dc08ee919f9d80ecac014ad0a7e1d0b3b231',
  txFeeRatio:   '1',
  to:           '0xf47a8bb5c9ff814d39509591281ae31c0c7c2f38',
  amount:       everyLockAmout,
  gasPrice:     '200',
  gasLimit:     '4700000',
  password:     'wanglu',
  testOrNot:    'YES'
}

/// A note inbound
let srcChainKeyA      = '0xb410aa9124e5623d62cbb82b4fbe38a7230c6590';     // WCT
let dstChainKeyA      = 'WAN';     // WAN

/// B note outbound
let srcChainKeyB      = 'WAN';     // WAN
let dstChainKeyB      = '0xb410aa9124e5623d62cbb82b4fbe38a7230c6590';     // WCT

let nonceEth             = 0x0;
let nonceWan             = 0x0;

async function testMain(){

  let walletCore = new WalletCore(configCLi);
  await walletCore.init();

  let config = walletCore.config;

  let srcChainNameA     = ccUtil.getSrcChainNameByContractAddr(srcChainKeyA,'ETH');
  let dstChainNameA     = ccUtil.getSrcChainNameByContractAddr(dstChainKeyA,'WAN');

  let srcChainNameB     = ccUtil.getSrcChainNameByContractAddr(srcChainKeyB,'WAN');
  let dstChainNameB     = ccUtil.getSrcChainNameByContractAddr(dstChainKeyB,'ETH');

  nonceEth              = await  ccUtil.getNonce(inputA.from,'ETH');
  ccUtil.setInitNonceTest(Number(nonceEth)-1);

  nonceWan              = await   ccUtil.getNonce(inputA.to,'WAN');

  global.logger.debug("==================================================");
  global.logger.debug("/************** brute test begin *****************");
  global.logger.debug("==================================================");

  ///================================================================================
  /// inbound
  ///================================================================================

  // //approve 0;  E20->WAN
  // {
  //
  //   let inputAApprove_0     = JSON.parse(JSON.stringify(inputA));
  //   inputAApprove_0.amount   = 0;
  //
  //
  //   nonceEth                = (Number(nonceEth)+1);
  //   inputAApprove_0.nonce    = nonceEth;
  //
  //   global.logger.debug(inputAApprove_0.nonce);
  //   global.logger.debug(inputAApprove_0.gasPrice);
  //   let ret = await global.crossInvoker.invoke(srcChainNameA,dstChainNameA,"APPROVE",inputAApprove_0);
  //   console.log("approve 0 result:", ret.result);
  // }
  //
  //
  // //approve firstApproveAmount big number(100) E20->WAN
  // {
  //   let inputAInit    = JSON.parse(JSON.stringify(inputA));
  //   inputAInit.amount =  firstApproveAmout;
  //
  //   nonceEth                = (Number(nonceEth)+1);
  //   inputAInit.nonce    = nonceEth;
  //
  //   global.logger.debug(inputAInit.nonce);
  //   global.logger.debug(inputAInit.gasPrice);
  //   let ret = await global.crossInvoker.invoke(srcChainNameA,dstChainNameA,"APPROVE",inputAInit);
  //   console.log("approve big number result:", ret.result);
  // }
  //
  //
  // // lock little amount
  // for(let i = 0; i<2;i++){
  //   inputA.gasPrice = Number((Number(inputA.gasPrice) + 0.16)).toFixed(9);
  //   global.logger.debug(inputA.gasPrice);
  //   let ret = await global.crossInvoker.invoke(srcChainNameA,dstChainNameA,"LOCK",inputA);
  //   console.log("lock %s result %s",inputA.amount, ret.result);
  // }

  while(true)
  {
    /// redeem
    try {
      let txHashList = global.wanDb.filterContains(config.crossCollection,'status',['BuddyLocked','Locked']);
      console.log("length of txHashList is ：",txHashList.length);
      for(let record of txHashList) {
        let retCheck;
        retCheck = ccUtil.canRedeem(record);
        console.log("checking canRedeem,canRedeem ", retCheck.code);
        // revoke
        if (retCheck.code === true) {
          let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(record.srcChainAddr, record.srcChainType);
          let dstChain = global.crossInvoker.getSrcChainNameByContractAddr(record.dstChainAddr, record.dstChainType);
          let action = 'Redeem';
          let input = {};
          input.x = record.x;
          input.hashX = record.hashX;
          input.gasPrice = inputB.gasPrice;
          input.gasLimit = inputB.gasLimit;
          input.password = inputB.password;
          input.testOrNot = inputB.testOrNot;

          console.log("srcChain:",srcChain);
          console.log("dstChain:",dstChain);
          console.log("action:",action);
          console.log("input:",input);
          let ret = await global.crossInvoker.invoke(srcChain, dstChain, action, input);
          console.log("Redeem hashX: result", record.hashX,ret.result);
        }
      }
      console.log("handled all txHashList for redeem");

    } catch (e) {
      console.log("Error:",e);
      return;
    }

    /// revoke
    try {
      let txHashList = global.wanDb.filterContains(config.crossCollection,'status',['BuddyLocked','Locked']);
      console.log("length of txHashList is ：",txHashList.length);
      for(let record of txHashList) {
        let retCheck;
        retCheck = ccUtil.canRevoke(record);
        console.log("checking revoke,can Revoke ", retCheck.code);
        // revoke
        if (retCheck.code === true) {
          let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(record.srcChainAddr, record.srcChainType);
          let dstChain = global.crossInvoker.getSrcChainNameByContractAddr(record.dstChainAddr, record.dstChainType);
          let action = 'Revoke';
          let input = {};
          input.x = record.x;
          input.hashX = record.hashX;
          input.gasPrice = inputA.gasPrice;
          input.gasLimit = inputA.gasLimit;
          input.password = inputA.password;
          input.testOrNot = inputA.testOrNot;
          // let ret = await global.crossInvoker.invoke(srcChain, dstChain, action, input);
          // console.log("Revoke hashX: result", record.hashX,ret.result);

          console.log("srcChain:",srcChain);
          console.log("dstChain:",dstChain);
          console.log("action:",action);
          console.log("input:",input);

          let ret = await global.crossInvoker.invoke(srcChain, dstChain, action, input);
          console.log("Revoke hashX: result", record.hashX,ret.result);
        }
      }
      console.log("handled all txHashList for revoke");
    } catch (e) {
      console.log("Error:",e);
      return;
    }

    await MySleep(150000);
  }

  ///================================================================================
  /// outbound
  ///================================================================================
}
testMain();

function MySleep(time){
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve();
    }, time);
  });
};



