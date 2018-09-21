'use strict'
let configCLi = {};
require('../../logger/logger');
let WalletCore  = require('../../core/walletCore');
let ccUtil      = require('../../api/ccUtil');
async function testMain(){
  let wc = new WalletCore(configCLi);
  //console.log(configCLi);
  await wc.init();
  /// test case1: get Src chain and get dst chain
  ///
  ///
  console.log("get Src chains");
  for(let srcName of global.crossInvoker.getSrcChainName()){
    console.log("================================");
    console.log("source chain");
    console.log("contract address");
    console.log(srcName[0]);
    console.log("source chain value");
    console.log(srcName[1]);

    let dstList = global.crossInvoker.getDstChainName(srcName);
    for(let dstName of dstList){
      console.log("******************************");
      console.log("\tdst contract addr:");
      console.log("\t",dstName[0]);
      console.log("\t,dst chain value");
      console.log("\t",dstName[1]);
      console.log("******************************");
    }
    console.log("================================");
  }

  console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
  console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
  console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n\n");
  /// test case2: get storemen group by src and dest
  ///
  ///

  for(let srcName of global.crossInvoker.getSrcChainName()){
    let dstList = global.crossInvoker.getDstChainName(srcName);
    for(let dstName of dstList){
      let stgList = global.crossInvoker.getStoremanGroupList(srcName,dstName);
      for(let stgItem of stgList ){
        console.log("************storemenGroup******************");
        console.log(srcName[1].tokenSymbol+"=>"+dstName[1].tokenSymbol);
        console.log(stgItem.storemenGroupAddr);
        console.log("************storemenGroup******************\n\n");
      }
    }
  }


  /// test case3: get storemen group by src and dest
  ///
  ///
  console.log("************&&&&&&&&&&&&&&&&&&&&&&&&&&&&&******************");


}
testMain();




