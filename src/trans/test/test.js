global.wanchain_js_testnet = true;
let invokeLocks     = true;
let invokeRedeem    = true;
let invokeRevoke    = true;
let configCLi   = {};
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
} = require('../../trans/cross-chain');
let lockTrans               = new Set();
//================================should change begin===================
let everyLockAmount         =  0.000002;
let numberLockTrans         =  2;
/// A note inbound
/**
 * before stress test, need change srcChainKeyA (Token key)
 */
let srcChainKeyA      = '0xdbf193627ee704d38495c2f5eb3afc3512eafa4c';     // DAI
let dstChainKeyA      = 'WAN';     // WAN
let storemanAddrEth   = '0x41623962c5d44565de623d53eb677e0f300467d2';
let storemanAddrWan   = '0x06daa9379cbe241a84a65b217a11b38fe3b4b063';


let inputA       = {
  from:         '0xf47a8bb5c9ff814d39509591281ae31c0c7c2f38',
  /**
   * before stress test, need change storeman group
   */
  storeman:     storemanAddrEth,
  txFeeRatio:   '1',
  to:           '0x393e86756d8d4cf38493ce6881eb3a8f2966bb27',
  amount:       everyLockAmount,
  gasPrice:     '2',
  gasLimit:     '4700000',
  password:     'wanglu123',
  testOrNOT:    'YES'
}
let inputB       = {
  from:         '0x393e86756d8d4cf38493ce6881eb3a8f2966bb27',
  storeman:     storemanAddrWan,
  txFeeRatio:   '1',
  to:           '0xf47a8bb5c9ff814d39509591281ae31c0c7c2f38',
  amount:       everyLockAmount,
  gasPrice:     '200',
  gasLimit:     '4700000',
  password:     'wanglu123',
  testOrNOT:    'YES'
}
//================================should change end===================
let nonceEth             = 0x0;
let nonceWan             = 0x0;

async function testMain(){

  let walletCore = new WalletCore(configCLi);
  await walletCore.init();

  let config = walletCore.config;

  let srcChainNameA     = ccUtil.getSrcChainNameByContractAddr(srcChainKeyA,'ETH');
  let dstChainNameA     = ccUtil.getSrcChainNameByContractAddr(dstChainKeyA,'WAN');

  nonceEth              = await  ccUtil.getNonce(inputA.from,'ETH');
  ccUtil.setInitNonceTest(Number(nonceEth)-1);

  nonceWan              = await   ccUtil.getNonce(inputA.to,'WAN');

  console.log("==================================================");
  console.log("/************** brute test begin *****************");
  console.log("==================================================");

  ///================================================================================
  /// inbound
  ///================================================================================
  if(invokeLocks === true){
    // lock little amount
    let promiseLockArray = [];
    console.log(new Date().toLocaleString()+" start invoke "+numberLockTrans+" lock transactions");
    try{
      for(let i = 0; i<numberLockTrans;i++){
        let  crossInvokerConfig;
        let  crossInvokerInput;
        let  crossInvokerClass;
        let  invoke = null;
        crossInvokerConfig = global.crossInvoker.getCrossInvokerConfig(srcChainNameA,dstChainNameA);
        crossInvokerClass  = global.crossInvoker.getCrossInvokerClass(crossInvokerConfig,"LOCK");
        let inputAct = {};
        Object.assign(inputAct,inputA);
        invoke = global.crossInvoker.getInvoker(crossInvokerClass,inputAct,crossInvokerConfig);
        // promiseLockArray.push((invoke.run()).then(ret=>{
        //   if(ret.code === true){
        //     console.log("lock %s result %s",inputAct.amount, ret.result);
        //     lockTrans.add(ret.result);
        //   }else{
        //     console.log("Error lock %s result %s",inputAct.amount, ret.result);
        //     console.log(ret.result);
        //   }
        // }))
        let ret = await invoke.run();
        console.log("lock %s result %s",inputAct.amount, ret.result);
        lockTrans.add(ret.result);
      }
    }catch(e){
      console.log("batch locke error :",e);
      process.exit();
    }
    try{
      //await Promise.all(promiseLockArray);
      //Not use Promise all, because approve1, approve2, lock1, lock2. expected is approve1, lock1. approve2, lock2.
      // for(let promiseLock of promiseLockArray){
      //   await promiseLock;
      // }
      console.log(new Date().toLocaleString()+" End invoke "+numberLockTrans+" lock transactions");
    }catch(err){
      console.log("batch locke error(promise all) :",err);
      process.exit();
    }
    /// check number of buddyLocked

    while(true){
      let numberBuddyLockedTrans = 0;
      let records = global.wanDb.filterNotContains(config.crossCollection,'status',['Redeemed','Revoked']);
      for(let i=0; i<records.length; i++){
        let record = records[i];
        if(record.status === 'BuddyLocked' && lockTrans.has(record.lockTxHash)){
          ++numberBuddyLockedTrans;
        }
      }
      if(numberBuddyLockedTrans === numberLockTrans){
        console.log("success: %s Transaction buddy locked",numberLockTrans);
        break;
      }else{
        console.log("%s Transaction % buddyLocked",numberLockTrans,numberBuddyLockedTrans);
      }
      await MySleep(15000);
    }
  }
  console.log(new Date().toLocaleString()+" all  "+numberLockTrans+" buddyLock recieved!");
  if(invokeRedeem === true){
    /// redeem
    try {
      // initial nonce wan
      nonceWan              = await   ccUtil.getNonce(inputA.to,'WAN');
      ccUtil.setInitNonceTest(Number(nonceWan)-1);

      let txHashList = global.wanDb.filterNotContains(config.crossCollection,'status',['Redeemed','Revoked']);
      console.log("length of txHashList is ：",txHashList.length);
      for(let record of txHashList) {
        let retCheck;
        retCheck = ccUtil.canRedeem(record);
        //console.log("checking canRedeem,canRedeem ", retCheck.code);
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
          input.testOrNOT = inputB.testOrNOT;
          let ret = await global.crossInvoker.invoke(srcChain, dstChain, action, input);
          console.log("Redeem hashX: result", record.hashX,ret.result);
        }
      }
      console.log("handled all txHashList for redeem");

    } catch (e) {
      console.log("Error:",e);
      process.exit();
    }

    while(true){
      let numberRedeemedTrans = 0;
      let records = global.wanDb.getItemAll(config.crossCollection,{status:'Redeemed'});
      for(let i=0; i<records.length; i++){
        let record = records[i];
        if(record.status === 'Redeemed' && lockTrans.has(record.lockTxHash)){
          ++numberRedeemedTrans;
        }
      }
      if(numberRedeemedTrans === numberLockTrans){
        console.log("%s Transaction redeemed",numberLockTrans);
        break;
      }else{
        console.log("%s Transaction % Redeemed",numberLockTrans,numberRedeemedTrans);
      }
      await MySleep(5000);
    }

  }

  if(invokeRevoke === true){
    /// revoke
    try {
      // init eth nonce.
      nonceEth              = await   ccUtil.getNonce(inputA.from,'ETH');
      ccUtil.setInitNonceTest(Number(nonceEth)-1);

      let txHashList = global.wanDb.filterNotContains(config.crossCollection,'status',['Redeemed','Revoked']);
      console.log("length of txHashList is ：",txHashList.length);
      for(let record of txHashList) {
        let retCheck;
        retCheck = ccUtil.canRevoke(record);
        //console.log("checking revoke,can Revoke ", retCheck.code);
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
          input.testOrNOT = inputA.testOrNOT;

          let ret = await global.crossInvoker.invoke(srcChain, dstChain, action, input);
          console.log("Revoke hashX: result", record.hashX,ret.result);
        }
      }
      console.log("handled all txHashList for revoke");
    } catch (e) {
      console.log("Error:",e);
      process.exit();
    }

    console.log("Check balance after stress test");
  }

}
testMain();

function MySleep(time){
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve();
    }, time);
  });
};



