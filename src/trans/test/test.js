'use strict'
let configCLi = require('./config.js');
require('../../logger/logger');

let WalletCore  = require('../../core/walletCore');

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
} = require('../CrossChain');
let configApproveEw20 = {
    srcChain: 'DPY',
    dstChain: 'WAN',
    srcSCAddr: configCLi.orgChainAddrE20,
    midSCAddr: configCLi.originalChainHtlcE20,
    dstSCAddr: configCLi.wanchainHtlcAddrE20,
    srcAbi:     configCLi.orgAbiE20,
    midSCAbi:   configCLi.originalChainHtlcE20,
    dstAbi:     configCLi.wanchainHtlcAddrE20,
    srcKeystorePath: '/home/jason/.ethereum/testnet/keystore',
    dstKeyStorePath: '/home/jason/.ethereum/testnet/keystore',
    lockClass: 'CrossChainEthLock',
    refundClass: 'CrossChainEthRefund',
    revokeClass: 'CrossChainEthRevoke',
    approveScFunc: 'approve',
    lockScFunc: 'eth2wethLock',
    refundScFunc: 'eth2wethRefund',
    revokeScFunc: 'eth2wethRevoke',
    srcChainType: 'ETH',
    dstChainType: 'WAN'
};
let input = {
    from: '0xf47a8bb5c9ff814d39509591281ae31c0c7c2f38',
    //to  : '0x393e86756d8d4cf38493ce6881eb3a8f2966bb27',
    to    : '0xc5bc855056d99ef4bda0a4ae937065315e2ae11a',
    amount:'0.00001',
    password:'wanglu',
    gasPrice:'8',  // GWei
    gasLimit:'4700005', // GWei
    srcChain:'DPY',
    dstChain:'WAN',
    action:   'Approve',
    storemanAddr:'0xc27ecd85faa4ae80bf5e28daf91b605db7be1ba8'
};
async function testMain(){
  console.log("come here!");
  let wc = new WalletCore(configCLi);
  //console.log(configCLi);
  await wc.init();
  /*
  console.log("==================================");
  console.log("============BTC Lock==============");
  (new CrossChainBtcLock(input,config)).run();
  console.log("==================================");
  console.log("============BTC Refund============");
  (new CrossChainBtcRefund(input,config)).run();
  console.log("==================================");
  console.log("============BTC Revoke============");
  (new CrossChainBtcRevoke(input,config)).run();
  console.log("==================================");
  console.log("============ETH Lock============");
  (new CrossChainEthLock(input,config)).run();
  console.log("==================================");
  console.log("============ETH Refund============");
  (new CrossChainEthRefund(input,config)).run();
  console.log("==================================");
  console.log("============ETH Revoke============");
  (new CrossChainEthRevoke(input,config)).run();
  */
  console.log("==================================");
  console.log("============E20 Approve============");
  // console.log(global.sendByWebSocket);
  (new CrossChainE20Approve(input,configApproveEw20)).run();
  /*
  console.log("==================================");
  console.log("============E20 Lock============");
  (new CrossChainE20Lock(input,config)).run();
  console.log("==================================");
  console.log("============E20 Revoke============");
  (new CrossChainE20Revoke(input,config)).run();
  console.log("==================================");
  console.log("============E20 Refund============");
  (new CrossChainE20Refund(input,config)).run();
  console.log("==================================");
  */
}
testMain();




