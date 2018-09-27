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
  //console.log("config is :",wc.config);
  console.log("crossCollection ",wc.config.crossCollection);
  let txHashList = global.wanDb.filterContains(wc.config.crossCollection,'status',['BuddyLocked','Locked']);
  //let txHashList = global.wanDb.filterNotContains(wc.config.crossCollection,'status',['BuddyLocked','Locked']);
  let index = 0;
  console.log("************&&&&&&&&&&&&&&Can Redeem&&&&&&&&&&&&&&&******************");
  for(let record of txHashList){
    let displayOrNot = false;
    let ret = ccUtil.canRedeem(record);
    displayOrNot = ret.code;
    if(displayOrNot === true){
      ++index;
      console.log(record);
    }

    //console.log(record);

  }
  console.log("index: ",index);
  console.log("************&&&&&&&&&&&&&&Can Redeem&&&&&&&&&&&&&&&******************");


  index = 0;
  console.log("************&&&&&&&&&&&&&&Can Revoke&&&&&&&&&&&&&&&******************");
  for(let record of txHashList){
    let displayOrNot = false;
    let ret = ccUtil.canRevoke(record);
    displayOrNot = ret.code;
    if(displayOrNot === true){
      ++index;
      console.log(record);
    }

    //console.log(record);

  }
  console.log("index: ",index);
  console.log("************&&&&&&&&&&&&&&Can Revoke&&&&&&&&&&&&&&&******************");
}
testMain();




