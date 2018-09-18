'use strict'
let configCLi   = {};
require('../../logger/logger');

let WalletCore  = require('../../core/walletCore');
let ccUtil      = require('../../api/ccUtil');
let {
  CrossChainBtcLock,
  CrossChainBtcRefund,
  CrossChainBtcRevoke,
  CrossChainEthLock,
  CrossChainEthRefund,
  CrossChainEthRevoke,
  CrossChainE20Approve,
  CrossChainE20Lock,
  CrossChainE20Revoke,
  CrossChainE20Refund
} = require('../../trans/CrossChain');

let firstApproveAmout      =  100;       //100x10^18
let everyLockAmout         =  0.00002;



let inputA       = {
  from:         '0xf47a8bb5c9ff814d39509591281ae31c0c7c2f38',
  storeman:     '0xc27ecd85faa4ae80bf5e28daf91b605db7be1ba8',
  txFeeRatio:   '1',
  to:           '0x393e86756d8d4cf38493ce6881eb3a8f2966bb27',
  amount:       everyLockAmout,
  gasPrice:     '1',
  gasLimit:     '4700000',
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
let dstChainKeyA      = '0xfbaffb655906424d501144eefe35e28753dea037';     // WAN
/// B note outbound
let srcChainKeyB      = '0xfbaffb655906424d501144eefe35e28753dea037';     // WAN
let dstChainKeyB      = '0xb410aa9124e5623d62cbb82b4fbe38a7230c6590';     // WCT

let nonceEth             = 0x0;
let nonceWan             = 0x0;

async function testMain(){

  let walletCore = new WalletCore(configCLi);
  await walletCore.init();

  let srcChainNameA     = ccUtil.getSrcChainNameByContractAddr(srcChainKeyA);
  let dstChainNameA     = ccUtil.getSrcChainNameByContractAddr(dstChainKeyA);

  let srcChainNameB     = ccUtil.getSrcChainNameByContractAddr(srcChainKeyB);
  let dstChainNameB     = ccUtil.getSrcChainNameByContractAddr(dstChainKeyB);

  nonceEth              = await  ccUtil.getNonce(inputA.from,'ETH');
  ccUtil.setInitNonceTest(Number(nonceEth)-1);

  nonceWan              = await   ccUtil.getNonce(inputA.to,'WAN');

  global.logger.debug("==================================================");
  global.logger.debug("/************** brute test begin *****************");
  global.logger.debug("==================================================");

  ///================================================================================
  /// inbound
  ///================================================================================

  //approve 0;  E20->WAN
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
  //   await global.crossInvoker.invoke(srcChainNameA,dstChainNameA,"APPROVE",inputAApprove_0);
  // }


  // approve firstApproveAmount big number(100) E20->WAN
  // {
  //   let inputAInit    = JSON.parse(JSON.stringify(inputA));
  //   inputAInit.amount =  firstApproveAmout;
  //
  //   nonceEth                = (Number(nonceEth)+1);
  //   inputAInit.nonce    = nonceEth;
  //
  //   global.logger.debug(inputAInit.nonce);
  //   global.logger.debug(inputAInit.gasPrice);
  //   await global.crossInvoker.invoke(srcChainNameA,dstChainNameA,"APPROVE",inputAInit);
  // }


  // lock little amount
  for(let i = 0; i<50;i++){
    inputA.gasPrice = Number((Number(inputA.gasPrice) + 0.16)).toFixed(9);
    global.logger.debug(inputA.gasPrice);
    await global.crossInvoker.invoke(srcChainNameA,dstChainNameA,"LOCK",inputA);
  }

  ///================================================================================
  /// outbound
  ///================================================================================
}
testMain();




