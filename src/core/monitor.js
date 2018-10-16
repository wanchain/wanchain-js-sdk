'use strict'
const   pu              = require('promisefy-util');
const   ccUtil          = require('../api/ccUtil');
let  Logger             = require('../logger/logger');
const BigNumber         = require('bignumber.js');
let  mrLogger;
const   MonitorRecord   = {
  async init(config){
    this.config           = config;
    this.crossCollection  = config.crossCollection;
    this.name             = "monitorETH&E20";

    mrLogger              = new Logger("Monitor",this.config.logfileNameMR, this.config.errfileNameMR,this.config.loglevel);
    global.mrLogger       = mrLogger;
  },
  receiptFailOrNot(receipt){
    if(receipt && receipt.status !== '0x1'){
      return true;
    }
    return false;
  },
  async waitLockConfirm(record){
    try{
      mrLogger.debug("Entering waitLockConfirm, lockTxHash = %s",record.lockTxHash);
      let receipt = await ccUtil.waitConfirm(record.lockTxHash,this.config.confirmBlocks,record.srcChainType);
      mrLogger.debug("%%%%%%%%%%%%%%%%%%%%%%%response from waitLockConfirm lockTxHash = %s%%%%%%%%%%%%%%%%%%%%%",
        record.lockTxHash);
      mrLogger.debug(receipt);
      if(receipt && receipt.hasOwnProperty('blockNumber') && receipt.status === '0x1'){
        record.status       = 'Locked';
        let blockNumber     = receipt.blockNumber;
        let chainType       = record.srcChainType;
        let block           = await ccUtil.getBlockByNumber(blockNumber,chainType);
        let newTime         = Number(block.timestamp); // unit s
        record.lockedTime   = newTime.toString();

        let htlcTimeOut;
        if(record.tokenStand === 'E20'){
          htlcTimeOut       = Number(block.timestamp)+Number(2*global.lockedTimeE20); // unit:s
        }else{
          htlcTimeOut       = Number(block.timestamp)+Number(2*global.lockedTime); // unit:s
        }
        record.htlcTimeOut  = htlcTimeOut.toString();
        mrLogger.info("waitLockConfirm update record %s, status %s ", record.lockTxHash,record.status);
        this.updateRecord(record);
      }
      if (this.receiptFailOrNot(receipt) === true){
        record.status       = 'LockFail';
        mrLogger.info("waitLockConfirm update record %s, status %s ", record.lockTxHash,record.status);
        this.updateRecord(record);
      }
    }catch(error){
      mrLogger.error("error waitLockConfirm");
      mrLogger.error(error);
    }
  },
  async waitRedeemConfirm(record){
    try{
      mrLogger.debug("Entering waitRedeemConfirm, redeemTxHash = %s",record.redeemTxHash);
      let receipt = await ccUtil.waitConfirm(record.redeemTxHash,this.config.confirmBlocks,record.dstChainType);
      mrLogger.debug("response from waitRedeemConfirm");
      mrLogger.debug(receipt);
      if(receipt && receipt.hasOwnProperty('blockNumber') && receipt.status === '0x1') {
        record.status = 'Redeemed';
        mrLogger.info("waitRedeemConfirm update record %s, status %s ", record.lockTxHash,record.status);
        this.updateRecord(record);
      }
      if (this.receiptFailOrNot(receipt) === true){
        record.status       = 'RedeemFail';
        mrLogger.info("waitRedeemConfirm update record %s, status %s ", record.lockTxHash,record.status);
        this.updateRecord(record);
      }
    }catch(error){
      mrLogger.error("error waitRedeemConfirm");
      mrLogger.error(error);
    }
  },
  async waitRevokeConfirm(record){
    try{
      mrLogger.debug("Entering waitRevokeConfirm, revokeTxHash = %s",record.revokeTxHash);
      let receipt = await ccUtil.waitConfirm(record.revokeTxHash,this.config.confirmBlocks,record.srcChainType);
      mrLogger.debug("response from waitRevokeConfirm,revokeTxHash = %s",record.revokeTxHash);
      mrLogger.debug(receipt);
      if(receipt && receipt.hasOwnProperty('blockNumber') && receipt.status === '0x1') {
        record.status = 'Revoked';
        mrLogger.info("waitRevokeConfirm update record %s, status %s ", record.lockTxHash,record.status);
        this.updateRecord(record);
      }
      if (this.receiptFailOrNot(receipt) === true){
        record.status       = 'RevokeFail';
        mrLogger.info("waitRevokeConfirm update record %s, status %s ", record.lockTxHash,record.status);
        this.updateRecord(record);
      }
    }catch(error){
      mrLogger.error("error waitRevokeConfirm");
      mrLogger.error(error);
    }
  },
  async waitApproveConfirm(record){
    try{
      mrLogger.debug("Entering waitApproveConfirm, approveTxHash = %s",record.approveTxHash);
      let receipt = await ccUtil.waitConfirm(record.approveTxHash,this.config.confirmBlocks,record.srcChainType);
      mrLogger.debug("response from waitApproveConfirm, approveTxHash = %s",record.approveTxHash);
      mrLogger.debug(receipt);
      if(receipt && receipt.hasOwnProperty('blockNumber') && receipt.status === '0x1'){
        record.status = 'Approved';
        mrLogger.info("waitApproveConfirm update record %s, status %s ", record.lockTxHash,record.status);
        this.updateRecord(record);
      }
    }catch(error){
      mrLogger.error("error waitApproveConfirm");
      mrLogger.error(error);
    }
  },
  async waitBuddyLockConfirm(record){
    mrLogger.debug("Entering waitBuddyLockConfirm, lockTxHash = %s",record.lockTxHash);

    try{
      // step1: get block number by event
      let bInbound  = false;
      let chainNameItemSrc;
      let chainNameItemDst;

      chainNameItemSrc = ccUtil.getSrcChainNameByContractAddr(record.srcChainAddr,record.srcChainType);
      chainNameItemDst = ccUtil.getSrcChainNameByContractAddr(record.dstChainAddr,record.dstChainType);

      if(global.crossInvoker.isInSrcChainsMap(chainNameItemSrc)){
        // destination is WAN, inbound
        bInbound    = true;
      };

      let bE20      = false;
      let chainNameItem;
      if(bInbound === true){
        chainNameItem = chainNameItemSrc;
      }else{
        chainNameItem = chainNameItemDst;
      }

      if(chainNameItem[1].tokenStand === 'E20'){
        bE20        = true;
      }

      // step2: build the right event by record, consider E20 and in bound or out bound
      let logs;
      let abi;
      let chainType = record.dstChainType; // because check buddy event.
      if(bInbound === true){
        if(bE20 === true){
          // bE20 bInbound  getInStgLockEventE20
          mrLogger.debug("Entering getInStgLockEventE20");
          logs  = await ccUtil.getInStgLockEventE20(chainType,record.hashX,record.contractValue);
          abi   = this.config.wanAbiE20;
        }else{
          // bInbound not E20 getInStgLockEvent
          mrLogger.debug("Entering getInStgLockEvent");
          logs  = await ccUtil.getInStgLockEvent(chainType,record.hashX,record.contractValue);
          abi   = this.config.HtlcWANAbi;
        }
      }else{
        if(bE20 === true){
          // bE20 outBound getOutStgLockEventE20
          mrLogger.debug("Entering getOutStgLockEventE20");
          logs  = await ccUtil.getOutStgLockEventE20(chainType,record.hashX,record.contractValue);
          abi   = this.config.ethAbiE20;
        }else{
          // outBound not E20 getOutStgLockEvent
          mrLogger.debug("Entering getOutStgLockEvent");
          logs = await ccUtil.getOutStgLockEvent(chainType,record.hashX,record.contractValue);
          abi  = this.config.HtlcETHAbi;
        }
      }
      mrLogger.debug("bInbound = ",bInbound);
      mrLogger.debug("bE20 = ",bE20);
      mrLogger.debug("chainType=",chainType);
      // mrLogger.debug("logs[0]",logs[0]);
      // mrLogger.debug("typeof logs[0]",typeof(logs[0]));

      if(typeof(logs[0]) === "undefined"){
        mrLogger.debug("waiting buddy locking");
        return;
      }

      let retResult = ccUtil.parseLogs(logs,abi);
      mrLogger.debug("retResult of parseLogs:", retResult);
      mrLogger.debug("retResult.value of parseLogs:", retResult[0].args.value);
      let valueEvent;
      valueEvent = new BigNumber(retResult[0].args.value);
      valueEvent = '0x'+valueEvent.toString(16);
      let valueContract = record.contractValue;
      mrLogger.debug("valueEvent: valueContract", valueEvent,valueContract);
      if(valueEvent.toString() == valueContract.toString()){
        mrLogger.debug("--------------equal----------------");

        // step3: get the lock transaction hash of buddy from block number
        let crossTransactionTx;
        if(typeof(logs[0].transactionHash) !== "undefined"){
          crossTransactionTx = logs[0].transactionHash;
          // step4: get transaction confirmation
          mrLogger.debug("Entering waitBuddyLockConfirm LockTx %s buddyTx %s", record.lockTxHash,crossTransactionTx);
          let receipt = await ccUtil.waitConfirm(crossTransactionTx,this.config.confirmBlocks,chainType);
          mrLogger.debug("response from waitBuddyLockConfirm, LockTx %s buddyTx %s", record.lockTxHash,crossTransactionTx);
          mrLogger.debug(receipt);
          if(receipt && receipt.hasOwnProperty('blockNumber') && receipt.status === '0x1'){

            let recordTemp    = global.wanDb.getItem(this.crossCollection,{hashX:record.hashX});
            let currentStatus = recordTemp.status;

            mrLogger.debug("waitBuddyLockConfirm current record.status is :", record.status);
            mrLogger.debug("waitBuddyLockConfirm current recordTemp.status is :", recordTemp.status);

            if(currentStatus != 'Locked') {
              mrLogger.debug("waitBuddyLockConfirm current status is :", currentStatus);
              return;
            }

            record.status           = 'BuddyLocked';
            let blockNumber         = receipt.blockNumber;
            // step5: get the time of buddy lock.
            let block               = await ccUtil.getBlockByNumber(blockNumber,chainType);
            let newTime             = Number(block.timestamp);  // unit : s
            record.buddyLockedTime  = newTime.toString();

            record.buddyLockTxHash  = crossTransactionTx;
            let buddyLockedTimeOut;
            if(record.tokenStand === 'E20'){
              buddyLockedTimeOut    = Number(block.timestamp)+Number(global.lockedTimeE20); // unit:s
            }else{
              buddyLockedTimeOut    = Number(block.timestamp)+Number(global.lockedTime); // unit:s
            }
            record.buddyLockedTimeOut= buddyLockedTimeOut.toString();
            mrLogger.info("waitBuddyLockConfirm update record %s, status %s ", record.lockTxHash,record.status);
            this.updateRecord(record);
          }
        }

      }else{
        mrLogger.error("--------------Not equal----------------");
      }

    }catch(err){
      mrLogger.error("waitBuddyLockConfirm error!");
      mrLogger.error(err);
    }
  },
  updateRecord(record){
    global.wanDb.updateItem(this.crossCollection,{'hashX':record.hashX},record);
  },
  monitorTask(){
    mrLogger.info("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    mrLogger.info("Entering monitor task");
    mrLogger.info("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    let records = global.wanDb.filterNotContains(this.config.crossCollection,'status',['Redeemed','Revoked']);
    for(let i=0; i<records.length; i++){
      let record = records[i];
      this.monitorRecord(record);
    }
  },
  async monitorRecord(record){
    //mrLogger.debug(this.name);
    switch(record.status) {
      /// approve begin
      case 'ApproveSending':
      {
        //this.approveSendRetry(record);
        break;
      }
      case 'ApproveSendFail':
      {
        //this.approveSendRetry(record);
        break;
      }
      case 'ApproveSendFailAfterRetries':
      {
        break;
      }
      case 'ApproveSent':
      {
        this.waitApproveConfirm(record);
        break;
      }
      case 'Approved':
      {
        break;
      }
      /// approve end
      /// lock   begin
      case 'LockSending':
      {
        //this.lockSendRetry(record);
        break;
      }
      case 'LockSendFail':
      {
        //this.lockSendRetry(record);
        break;
      }
      case 'LockSendFailAfterRetries':
      {
        break;
      }
      case 'LockSent':
      {
        this.waitLockConfirm(record);
        // Locked
        break;
      }
      case 'Locked':
      {
        this.waitBuddyLockConfirm(record);
        break;
      }
      case 'BuddyLocked':
      {
        break;
      }
      /// lock   end
      /// redeem  begin
      case 'RedeemSending':
      {
        //this.redeemSendRetry(record);
        break;
      }
      case 'RedeemSendFail':
      {
        //this.redeemSendRetry(record);
        break;
      }
      case 'RedeemSendFailAfterRetries':
      {
        break;
      }
      case 'RedeemSent':
      {
        this.waitRedeemConfirm(record);
        break;
      }
      case 'Redeemed':
      {
        break;
      }
      /// redeem  end
      /// revoke   begin
      case 'RevokeSending':
      {
        //this.revokeSendRetry(record);
        break;
      }
      case 'RevokeSendFail':
      {
        //this.revokeSendRetry(record);
        break;
      }
      case 'RevokeSendFailAfterRetries':
      {
        break;
      }
      case 'RevokeSent':
      {
        this.waitRevokeConfirm(record);
        break;
      }
      case 'Revoked':
      {
        break;
      }
      /// revoke   end
      /// default  begin
      default:
        break;
    }
  },
}
exports.MonitorRecord = MonitorRecord;
