'use strict'
const   pu              = require('promisefy-util');
const   ccUtil          = require('../api/ccUtil');
const   MonitorRecord   = {
  async init(config){
    this.config           = config;
    this.crossCollection  = config.crossCollection;
    this.name             = "monitorETH&E20";
  },
  async waitLockConfirm(record){
    try{
      let receipt = await ccUtil.waitConfirm(record.lockTxHash,this.config.confirmBlocks,record.srcChainType);
      console.log("%%%%%%%%%%%%%%%%%%%%%%%response from waitLockConfirm%%%%%%%%%%%%%%%%%%%%%");
      console.log(receipt);
      if(receipt && receipt.hasOwnProperty('blockNumber')){
        record.status       = 'Locked';
        let blockNumber     = receipt.blockNumber;
        let chainType       = record.srcChainType;
        let block           = await ccUtil.getBlockByNumber(blockNumber,chainType);
        let newTime         = Number(block.timestamp)*1000;
        record.lockedTime   = newTime.toString();
        this.updateRecord(record);
      }
    }catch(error){
      console.log("error waitLockConfirm");
      console.log(error);
    }
  },
  async waitRefundConfirm(record){
    try{
      let receipt = await ccUtil.waitConfirm(record.refundTxHash,this.config.confirmBlocks,record.dstChainType);
      console.log("response from waitRefundConfirm");
      console.log(receipt);
      if(receipt && receipt.hasOwnProperty('blockNumber')) {
        record.status = 'Refunded';
        this.updateRecord(record);
      }
    }catch(error){
      console.log("error waitRefundConfirm");
      console.log(error);
    }
  },
  async waitRevokeConfirm(record){
    try{
      let receipt = await ccUtil.waitConfirm(record.revokeTxHash,this.config.confirmBlocks,record.srcChainType);
      console.log("response from waitRevokeConfirm");
      console.log(receipt);
      if(receipt && receipt.hasOwnProperty('blockNumber')) {
        record.status = 'Revoked';
        this.updateRecord(record);
      }
    }catch(error){
      console.log("error waitRevokeConfirm");
      console.log(error);
    }
  },
  async waitApproveConfirm(record){
    try{
      let receipt = await ccUtil.waitConfirm(record.approveTxHash,this.config.confirmBlocks,record.srcChainType);
      console.log("response from waitApproveConfirm");
      console.log(receipt);
      if(receipt && receipt.hasOwnProperty('blockNumber')){
        record.status = 'Approved';
        this.updateRecord(record);
      }
    }catch(error){
      console.log("error waitApproveConfirm");
      console.log(error);
    }
  },
  async waitBuddyLockConfirm(record){
    console.log("Entering waitBuddyLockConfirm");
    try{
      // step1: get block number by event
      let bInbound  = false;
      let keyTemp   = record.dstChainAddr;
      if(global.crossInvoker.srcChainsMap.has(record.srcChainAddr)){
        // destination is WAN, inbound
        bInbound    = true;
        keyTemp     = record.srcChainAddr;
      };

      let bE20      = false;
      let chainNameItem;

      if(bInbound === true){
        chainNameItem = ccUtil.getSrcChainNameByContractAddr(record.srcChainAddr);
      }else{
        chainNameItem = ccUtil.getSrcChainNameByContractAddr(record.dstChainAddr);
      }

      if(chainNameItem[1].tokenStand === 'E20'){
        bE20        = true;
      }

      // step2: build the right event by record, consider E20 and in bound or out bound
      let logs;
      let chainType = record.dstChainType; // because check buddy event.
      if(bInbound === true){
        if(bE20 === true){
          // bE20 bInbound  getInStgLockEventE20
          logs = await ccUtil.getInStgLockEventE20(chainType,record.hashX);
        }else{
          // bInbound not E20 getInStgLockEvent
          logs = await ccUtil.getInStgLockEvent(chainType,record.hashX);
        }
      }else{
        if(bE20 === true){
          // bE20 outBound getOutStgLockEventE20
          logs = await ccUtil.getOutStgLockEventE20(chainType,record.hashX);
        }else{
          // outBound not E20 getOutStgLockEvent
          logs = await ccUtil.getOutStgLockEvent(chainType,record.hashX);
        }
      }
      // step3: get the lock transaction hash of buddy from block number
      let crossTransactionTx = logs[0].transactionHash;
      // step4: get transaction confirmation
      let receipt = await ccUtil.waitConfirm(crossTransactionTx,this.config.confirmBlocks,chainType);
      console.log("response from waitBuddyLockConfirm");
      console.log(receipt);
      if(receipt && receipt.hasOwnProperty('blockNumber')){
        record.status           = 'BuddyLocked';
        let blockNumber         = receipt.blockNumber;
        // step5: get the time of buddy lock.
        let block               = await ccUtil.getBlockByNumber(blockNumber,chainType);
        let newTime             = Number(block.timestamp)*1000;
        record.buddyLockedTime  = newTime.toString();
        this.updateRecord(record);
      }
    }catch(err){
      console.log("waitBuddyLockConfirm error!");
      console.log(err);
    }
  },
  updateRecord(record){
    global.wanDb.updateItem(this.crossCollection,{'hashX':record.hashX},record);
  },
  monitorTask(){
    let records = global.wanDb.filterNotContains(this.config.crossCollection,'status',['Refunded','Revoked']);
    for(let i=0; i<records.length; i++){
      let record = records[i];
      this.monitorRecord(record);
    }
  },
  async monitorRecord(record){
    //console.log(this.name);
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
      /// refund  begin
      case 'RefundSending':
      {
        //this.refundSendRetry(record);
        break;
      }
      case 'RefundSendFail':
      {
        //this.refundSendRetry(record);
        break;
      }
      case 'RefundSendFailAfterRetries':
      {
        break;
      }
      case 'RefundSent':
      {
        this.waitRefundConfirm(record);
        break;
      }
      case 'Refunded':
      {
        break;
      }
      /// refund  end
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
