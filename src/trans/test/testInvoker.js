'use strict'
let configCLi = {};
require('../../logger/logger');
let WalletCore  = require('../../core/walletCore');
async function testMain(){
  let wc = new WalletCore(configCLi);
  //global.logger.debug(configCLi);
  await wc.init();
  /// test case1: get Src chain and get dst chain
  ///
  ///
  global.logger.debug("get Src chains");
  for(let srcName of global.crossInvoker.getSrcChainName()){
    global.logger.debug("================================");
    global.logger.debug("source chain");
    global.logger.debug("contract address");
    global.logger.debug(srcName[0]);
    global.logger.debug("source chain value");
    global.logger.debug(srcName[1]);

    let dstList = global.crossInvoker.getDstChainName(srcName);
    for(let dstName of dstList){
      global.logger.debug("******************************");
      global.logger.debug("\tdst contract addr:");
      global.logger.debug("\t",dstName[0]);
      global.logger.debug("\t,dst chain value");
      global.logger.debug("\t",dstName[1]);
      global.logger.debug("******************************");
    }
    global.logger.debug("================================");
  }

  global.logger.debug("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
  global.logger.debug("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
  global.logger.debug("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n\n");
  /// test case2: get storemen group by src and dest
  ///
  ///

  for(let srcName of global.crossInvoker.getSrcChainName()){
    let dstList = global.crossInvoker.getDstChainName(srcName);
    for(let dstName of dstList){
      let stgList = global.crossInvoker.getStoremanGroupList(srcName,dstName);
      for(let stgItem of stgList ){
        global.logger.debug("************storemenGroup******************");
        global.logger.debug(srcName[1].tokenSymbol+"=>"+dstName[1].tokenSymbol);
        global.logger.debug(stgItem.storemenGroupAddr);
        global.logger.debug("************storemenGroup******************\n\n");
      }
    }
  }

}
testMain();




