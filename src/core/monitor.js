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
      global.logger.debug("%%%%%%%%%%%%%%%%%%%%%%%response from waitLockConfirm%%%%%%%%%%%%%%%%%%%%%");
      global.logger.debug(receipt);
      if(receipt && receipt.hasOwnProperty('blockNumber') && receipt.status === '0x1'){
        record.status       = 'Locked';
        let blockNumber     = receipt.blockNumber;
        let chainType       = record.srcChainType;
        let block           = await ccUtil.getBlockByNumber(blockNumber,chainType);
        let newTime         = Number(block.timestamp)*1000;
        record.lockedTime   = newTime.toString();
        this.updateRecord(record);
      }
    }catch(error){
      global.logger.debug("error waitLockConfirm");
      global.logger.debug(error);
    }
  },
  async waitRefundConfirm(record){
    try{
      let receipt = await ccUtil.waitConfirm(record.refundTxHash,this.config.confirmBlocks,record.dstChainType);
      global.logger.debug("response from waitRefundConfirm");
      global.logger.debug(receipt);
      if(receipt && receipt.hasOwnProperty('blockNumber') && receipt.status === '0x1') {
        record.status = 'Refunded';
        this.updateRecord(record);
      }
    }catch(error){
      global.logger.debug("error waitRefundConfirm");
      global.logger.debug(error);
    }
  },
  async waitRevokeConfirm(record){
    try{
      let receipt = await ccUtil.waitConfirm(record.revokeTxHash,this.config.confirmBlocks,record.srcChainType);
      global.logger.debug("response from waitRevokeConfirm");
      global.logger.debug(receipt);
      if(receipt && receipt.hasOwnProperty('blockNumber') && receipt.status === '0x1') {
        record.status = 'Revoked';
        this.updateRecord(record);
      }
    }catch(error){
      global.logger.debug("error waitRevokeConfirm");
      global.logger.debug(error);
    }
  },
  async waitApproveConfirm(record){
    try{
      let receipt = await ccUtil.waitConfirm(record.approveTxHash,this.config.confirmBlocks,record.srcChainType);
      global.logger.debug("response from waitApproveConfirm");
      global.logger.debug(receipt);
      if(receipt && receipt.hasOwnProperty('blockNumber') && receipt.status === '0x1'){
        record.status = 'Approved';
        this.updateRecord(record);
      }
    }catch(error){
      global.logger.debug("error waitApproveConfirm");
      global.logger.debug(error);
    }
  },
  async waitBuddyLockConfirm(record){
    global.logger.debug("Entering waitBuddyLockConfirm");
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
      global.logger.debug("bInbound = ",bInbound);
      global.logger.debug("bE20 = ",bE20);
      global.logger.debug("chainType=",chainType);
      // global.logger.debug("logs[0]",logs[0]);
      // global.logger.debug("typeof logs[0]",typeof(logs[0]));
      if(typeof(logs[0]) === "undefined"){
        global.logger.debug("waiting buddy locking");
        return;
      }
      // step3: get the lock transaction hash of buddy from block number
      let crossTransactionTx;
      if(typeof(logs[0].transactionHash) !== "undefined"){
        crossTransactionTx = logs[0].transactionHash;
        // step4: get transaction confirmation
        let receipt = await ccUtil.waitConfirm(crossTransactionTx,this.config.confirmBlocks,chainType);
        global.logger.debug("response from waitBuddyLockConfirm");
        global.logger.debug(receipt);
        if(receipt && receipt.hasOwnProperty('blockNumber') && receipt.status === '0x1'){
          record.status           = 'BuddyLocked';
          let blockNumber         = receipt.blockNumber;
          // step5: get the time of buddy lock.
          let block               = await ccUtil.getBlockByNumber(blockNumber,chainType);
          let newTime             = Number(block.timestamp)*1000;
          record.buddyLockedTime  = newTime.toString();
          this.updateRecord(record);
        }
      }
    }catch(err){
      global.logger.debug("waitBuddyLockConfirm error!");
      global.logger.debug(err);
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
    //global.logger.debug(this.name);
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
