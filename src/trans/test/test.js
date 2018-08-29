'use strict'

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
let config = {

};
let input = {

};
console.log("==================================");
console.log("============BTC Lock============");
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
console.log("==================================");
console.log("============E20 Approve============");
(new CrossChainE20Approve(input,config)).run();
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



