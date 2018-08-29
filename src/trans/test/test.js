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

// let ccE20Approve = new CrossChinE20Approve(input,config);
// ccE20Approve.run();

(new CrossChainBtcLock(input,config)).run();
console.log("========================");
(new CrossChainBtcRefund(input,config)).run();
console.log("========================");
(new CrossChainBtcRevoke(input,config)).run();
console.log("========================");
(new CrossChainEthLock(input,config)).run();
console.log("========================");
(new CrossChainEthRefund(input,config)).run();
console.log("========================");
(new CrossChainEthRevoke(input,config)).run();
console.log("========================");
(new CrossChainE20Approve(input,config)).run();
console.log("========================");
(new CrossChainE20Lock(input,config)).run();
console.log("========================");
(new CrossChainE20Revoke(input,config)).run();
console.log("========================");
(new CrossChainE20Refund(input,config)).run();
console.log("========================");



