'use strict'
const   ccUtil          = require('../api/ccUtil');
const BigNumber         = require('bignumber.js');

const utils      = require('../util/util');

let mrLogger;

let self;
let timerStart   = 13000;
let timerInterval= 13000;

let handlingList = {};

/**
 * Used to monitor the cross transaction status.
 *
 */
const   MonitorRecord   = {
    async init(config){
        this.config           = config;
        this.crossCollection  = config.crossCollection;
        this.name             = "monitorCross";

        this.done = false;
        self = this;
        handlingList = {};

        mrLogger = utils.getLogger("monitor.js");

        self.timer = setTimeout(function() {
            self.monitorTask();
        }, timerStart);
    },

    shutdown() {
        this.done = true
        // handlingList = {};
        if (this.timer) {
            clearTimeout(this.timer);
        }
    },

    receiptFailOrNot(receipt, record){
        if(receipt && !(receipt.status === '0x1' || (record.srcChainType === 'EOS' && receipt.trx !== undefined && receipt.trx.receipt.status == 'executed') || (record.dstChainType === 'EOS' && receipt.trx !== undefined && receipt.trx.receipt.status == 'executed'))){
            return true;
        }
        return false;
    },

    checkCrossType(record) {
        let bInbound  = false;
        let chainNameItemSrc;
        let chainNameItemDst;

        let toAddressOrg = record.toAddr;
        let toAddress;
        if (record.dstChainType !== 'EOS') {
          toAddress          = ccUtil.encodeTopic('address',toAddressOrg);
        } else {
          toAddress = toAddressOrg;
        }
        chainNameItemSrc = ccUtil.getSrcChainNameByContractAddr(record.srcChainAddr,record.srcChainType,record.tokenPairID);
        chainNameItemDst = ccUtil.getSrcChainNameByContractAddr(record.dstChainAddr,record.dstChainType,record.tokenPairID);

        if(chainNameItemSrc && global.crossInvoker.isInSrcChainsMap(chainNameItemSrc, record.tokenPairID)){
            // destination is WAN, inbound
            bInbound    = true;
        };

        let bE20      = false;
        let bEos = false;
        let chainNameItem;
        if(bInbound === true){
            chainNameItem = chainNameItemSrc;
        }else{
            chainNameItem = chainNameItemDst;
        }

        if(chainNameItem[1].tokenStand === 'TOKEN'){
          bE20        = true;
        } else if (chainNameItem[1].tokenStand === 'EOS') {
          bEos = true;
        }

        return { bInbound:bInbound, bE20:bE20, bEos:bEos, toAddress:toAddress };
    },

    async getRevokeEvent(record) {
        let ccType = this.checkCrossType(record);
        let bInbound = ccType.bInbound;
        let bE20     = ccType.bE20;
        let bEos     = ccType.bEos;
        let toAddress= ccType.toAddress;

        let logs;
        let abi;
        let chainType = record.srcChainType;
        if(bInbound === true){
          if(bE20 === true){
            // bE20 bInbound
            logs  = await ccUtil.getInErc20RevokeEvent(chainType, record.hashX, toAddress);
            abi   = this.config.crossChainScDict[chainType].CONTRACT.crossScAbi;
          } else if (bEos === true) {
            logs  = await ccUtil.getInEosRevokeEvent(chainType, record.hashX, toAddress, record.lockedTime);
            abi   = this.config.eosHtlcAbi;
          }else{
            logs  = await ccUtil.getInRevokeEvent(chainType, record.hashX, toAddress);
            abi  = this.config.crossChainScDict[chainType].CONTRACT.crossScAbi;
          }
        }else{
          if(bE20 === true){
            logs  = await ccUtil.getOutErc20RevokeEvent(chainType, record.hashX, toAddress);
            abi   = this.config.crossChainScDict[chainType].CONTRACT.crossScAbi;
          } else if (bEos === true) {
            logs  = await ccUtil.getOutEosRevokeEvent(chainType, record.hashX, toAddress);
            abi   = this.config.wanHtlcAbiEos;
          }else{
            logs = await ccUtil.getOutRevokeEvent(chainType, record.hashX, toAddress);
            abi   = this.config.crossChainScDict[chainType].CONTRACT.crossScAbi;
          }
        }
        mrLogger.debug("bInbound = ",bInbound);
        mrLogger.debug("bE20 = ",bE20);
        mrLogger.debug("bEos = ",bEos);
        mrLogger.debug("chainType=",chainType);
        mrLogger.debug("toAddress=",toAddress);

        if(typeof(logs[0]) === "undefined"){
          mrLogger.debug("Revoke event not found");
          return null;
        }

        if (chainType === 'EOS') {
          logs[0].transactionHash = logs[0].hasOwnProperty('action_trace') ? logs[0].action_trace.trx_id : logs[0].trx_id;
          return logs;
        } else {
          return ccUtil.parseLogs(logs,abi);
        }
    },

    async getRedeemEvent(record) {
        let ccType = this.checkCrossType(record);
        let bInbound = ccType.bInbound;
        let bE20     = ccType.bE20;
        let bEos     = ccType.bEos;
        let toAddress= ccType.toAddress;

        let logs;
        let abi;
        let chainType = record.dstChainType;
        if(bInbound === true){
          // if(bE20 === true){
          //   // bE20 bInbound
          //   logs  = await ccUtil.getInErc20RedeemEvent(chainType, record.hashX, toAddress);
          //   abi   = this.config.crossChainScDict[chainType].CONTRACT.crossScAbi;
          // } else 
          if (bEos === true) {
            logs  = await ccUtil.getInEosRedeemEvent(chainType, record.hashX, toAddress);
            abi   = this.config.wanHtlcAbiEos;
          }else{
            logs  = await ccUtil.getInRedeemEvent(chainType, record.hashX, toAddress);
            abi  = this.config.crossChainScDict[chainType].CONTRACT.crossScAbi;
          }
        }else{
          // if(bE20 === true){
          //   logs  = await ccUtil.getOutErc20RedeemEvent(chainType, record.hashX, toAddress);
          //   abi   = this.config.crossChainScDict[chainType].CONTRACT.crossScAbi;
          // } else 
          if (bEos === true) {
            logs  = await ccUtil.getOutEosRedeemEvent(chainType, record.hashX, toAddress, record.lockedTime);
            abi   = this.config.eosHtlcAbi;
          }else{
            logs = await ccUtil.getOutRedeemEvent(chainType, record.hashX, toAddress);
            abi   = this.config.crossChainScDict[chainType].CONTRACT.crossScAbi;
          }
        }
        mrLogger.debug("bInbound = ",bInbound);
        mrLogger.debug("bE20 = ",bE20);
        mrLogger.debug("bEos = ",bEos);
        mrLogger.debug("chainType=",chainType);
        mrLogger.debug("toAddress=",toAddress);

        if(typeof(logs[0]) === "undefined"){
          mrLogger.debug("Redeem event not found");
          return null;
        }

        if (chainType === 'EOS') {
          logs[0].transactionHash = logs[0].hasOwnProperty('action_trace') ? logs[0].action_trace.trx_id : logs[0].trx_id;
          return logs;
        } else {
          return ccUtil.parseLogs(logs,abi);
        }
    },

    async waitLockConfirm(record){
      try{
        mrLogger.debug("Entering waitLockConfirm, lockTxHash = %s",record.lockTxHash);
        let options = {};
        if (record.srcChainType === 'EOS' && record.lockTxBlockNum !== "undefined") {
            // options.blockNumHint = record.lockTxBlockNum;
        }
        let receipt = await ccUtil.waitConfirm(record.lockTxHash,this.config.confirmBlocks,record.srcChainType, options);
        mrLogger.debug("%%%%%%%%%%%%%%%%%%%%%%%response from waitLockConfirm lockTxHash = %s%%%%%%%%%%%%%%%%%%%%%",
          record.lockTxHash);
        mrLogger.debug(JSON.stringify(receipt, null, 4));
        if(receipt && ((receipt.hasOwnProperty('blockNumber') && receipt.status === '0x1') || (record.srcChainType === 'EOS' && receipt.hasOwnProperty('block_num') && receipt.trx.receipt.status === 'executed'))){
          //record.status       = 'Locked';

          let chainType       = record.srcChainType;
          let newTime; // unit s
          if (record.srcChainType === 'EOS') {
            let date = new Date(receipt.block_time + 'Z'); // "Z" is a zero time offset
            newTime = date.getTime()/1000;
            if (Number(newTime) < Number(record.sendTime)) {
              newTime = record.sendTime;
            }
          } else {
            let blockNumber     = receipt.blockNumber;
            let block           = await ccUtil.getBlockByNumber(blockNumber,chainType);
            newTime = Number(block.timestamp); // unit s
          }
          record.lockedTime   = newTime.toString();

          let htlcTimeOut;
          if (record.tokenStand === 'EOS') {
            htlcTimeOut       = newTime+Number(2*global.lockedTimeEOS); // unit:s
          } else{
            htlcTimeOut       = newTime+Number(2*global.lockedTime); // unit:s
          }
          record.htlcTimeOut  = htlcTimeOut.toString();
          record.status       = 'Locked';
          mrLogger.info("waitLockConfirm update record %s, status %s ", record.lockTxHash,record.status);
          this.updateRecord(record);
        }
        if (this.receiptFailOrNot(receipt, record) === true){
          record.status       = 'LockFail';
          mrLogger.info("waitLockConfirm update record %s, status %s ", record.lockTxHash,record.status);
          this.updateRecord(record);
        }
      }catch(error){
        mrLogger.error("error waitLockConfirm, lockTxHash=%s",record.lockTxHash);
        mrLogger.error("error is", error);
      }
    },
    async waitRedeemConfirm(record){
      try{
        mrLogger.debug("Entering waitRedeemConfirm, redeemTxHash = %s",record.redeemTxHash);
        let options = {};
        if (record.dstChainType === 'EOS' && record.redeemTxBlockNum !== "undefined") {
            // options.blockNumHint = record.redeemTxBlockNum;
        }
        let receipt = await ccUtil.waitConfirm(record.redeemTxHash,this.config.confirmBlocks,record.dstChainType, options);
        mrLogger.debug("response from waitRedeemConfirm");
        mrLogger.debug(receipt);
        if(receipt && ((receipt.hasOwnProperty('blockNumber') && receipt.status === '0x1') || (record.dstChainType === 'EOS' && receipt.hasOwnProperty('block_num') && receipt.trx.receipt.status === 'executed'))) {
          record.status = 'Redeemed';
          mrLogger.info("waitRedeemConfirm update record %s, status %s ", record.lockTxHash,record.status);
          this.updateRecord(record);
        }
        if (this.receiptFailOrNot(receipt, record) === true){
          // This is workaround: in un-usual case, wallet may send request to backend API server,
          // but failed to get the response, the wallet may restart, it retry to send request;
          // however, the previous request has been handled, so the later tx will fail,
          // this lead to inconsistent state, which run into loop for one step crosschain.
          // To break it, we check event instead confirmations, cause event must be sent by origianl tx.
          let evt = await this.getRedeemEvent(record);
          if (evt) {
              mrLogger.info("Got redeem event for record");
              if (Array.isArray(evt) && evt.length > 0) {
                  evt = evt[0];
              }
              if (evt.hasOwnProperty('transactionHash')) {
                  // update redeem tx hash !!!
                  mrLogger.info("Update redeemTxHash from %s to %s in event", record.redeemTxHash, evt.transactionHash);
                  record.redeemTxHash = evt.transactionHash
              }
              record.status       = 'Redeemed';
          } else {
              record.status       = 'RedeemFail';
              mrLogger.info("waitRedeemConfirm update record %s, status %s ", record.lockTxHash,record.status);
          }
          this.updateRecord(record);
        }
      }catch(error){
        mrLogger.error("error waitRedeemConfirm, redeemTxHash=%s",record.redeemTxHash);
        mrLogger.error("error is", error);
      }
    },
    async waitRevokeConfirm(record){
      try{
        mrLogger.debug("Entering waitRevokeConfirm, revokeTxHash = %s",record.revokeTxHash);
        let options = {};
        if (record.srcChainType === 'EOS' && record.revokeTxBlockNum !== "undefined") {
            // options.blockNumHint = record.revokeTxBlockNum;
        }
        let receipt = await ccUtil.waitConfirm(record.revokeTxHash,this.config.confirmBlocks,record.srcChainType, options);
        mrLogger.debug("response from waitRevokeConfirm,revokeTxHash = %s",record.revokeTxHash);
        mrLogger.debug(receipt);
        if(receipt && ((receipt.hasOwnProperty('blockNumber') && receipt.status === '0x1') || (record.srcChainType === 'EOS' && receipt.hasOwnProperty('block_num') && receipt.trx.receipt.status === 'executed'))) {
          record.status = 'Revoked';
          mrLogger.info("waitRevokeConfirm update record %s, status %s ", record.lockTxHash,record.status);
          this.updateRecord(record);
        }
        if (this.receiptFailOrNot(receipt, record) === true){
          // This is workaround: in un-usual case, wallet may send request to backend API server,
          // but failed to get the response, the wallet may restart, it retry to send request;
          // however, the previous request has been handled, so the later tx will fail,
          // this lead to inconsistent state, which run into loop for one step crosschain.
          // To break it, we check event instead confirmations, cause event must be sent by origianl tx.
          let redeemEvt = await this.getRedeemEvent(record);
          let evt = await this.getRevokeEvent(record);
          if (redeemEvt) {
            mrLogger.info("Got redeem event for record");
            if (Array.isArray(redeemEvt) && redeemEvt.length > 0) {
              redeemEvt = redeemEvt[0];
            }
            if (redeemEvt.hasOwnProperty('transactionHash')) {
              // update redeem tx hash !!!
              mrLogger.info("Update redeemTxHash from %s to %s in event", record.redeemTxHash, redeemEvt.transactionHash);
              record.redeemTxHash = redeemEvt.transactionHash
            }
            record.status = 'Redeemed';
          } else if (evt) {
              mrLogger.info("Got revoke event for record");
              if (Array.isArray(evt) && evt.length > 0) {
                  evt = evt[0];
              }
              if (evt.hasOwnProperty('transactionHash')) {
                  // update redeem tx hash !!!
                  mrLogger.info("Update revokeTxHash from %s to %s in event", record.revokeTxHash, evt.transactionHash);
                  record.revokeTxHash = evt.transactionHash
              }
              record.status       = 'Revoked';
          } else {
              record.status       = 'RevokeFail';
              mrLogger.info("waitRevokeConfirm update record %s, status %s ", record.lockTxHash,record.status);
          }
          this.updateRecord(record);
        }
      }catch(error){
        mrLogger.error("error waitRevokeConfirm, revokeTxHash=%s",record.revokeTxHash);
        mrLogger.error("error is", error);
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
          mrLogger.info("waitApproveConfirm update record %s, status %s ", record.approveTxHash,record.status);
          this.updateRecord(record);
        }
      }catch(error){
        mrLogger.error("error waitApproveConfirm, approveTxHash=%s",record.approveTxHash);
        mrLogger.error("error is", error);
      }
    },
    async waitApproveZeroConfirm(record){
      try{
        mrLogger.debug("Entering waitApproveZeroConfirm, approveTxHash = %s",record.approveZeroTxHash);
        let receipt = await ccUtil.waitConfirm(record.approveZeroTxHash,this.config.confirmBlocks,record.srcChainType);
        mrLogger.debug("response from waitApproveZeroConfirm, approveZeroTxHash = %s",record.approveZeroTxHash);
        mrLogger.debug(receipt);
        if(receipt && receipt.hasOwnProperty('blockNumber') && receipt.status === '0x1'){
          record.status = 'ApprovedZero';
          mrLogger.info("waitApproveZeroConfirm update record %s, status %s ", record.approveZeroTxHash,record.status);
          this.updateRecord(record);
        }
      }catch(error){
        mrLogger.error("error waitApproveZeroConfirm, approveZeroTxHash=%s",record.approveZeroTxHash);
        mrLogger.error("error is", error);
      }
    },
    async waitBuddyLockConfirm(record){
        mrLogger.debug("Entering waitBuddyLockConfirm, lockTxHash = %s",record.lockTxHash, record.hashX);

        try{
            // step1: get block number by event
            let bInbound  = false;
            let chainNameItemSrc;
            let chainNameItemDst;

            let toAddressOrg;
            let toAddress;
            toAddressOrg       = record.toAddr;
            if (record.dstChainType !== 'EOS') {
              toAddress          = ccUtil.encodeTopic('address',toAddressOrg);
            } else {
              toAddress = toAddressOrg;
            }

            chainNameItemSrc = ccUtil.getSrcChainNameByContractAddr(record.srcChainAddr,record.srcChainType,record.tokenPairID);
            chainNameItemDst = ccUtil.getSrcChainNameByContractAddr(record.dstChainAddr,record.dstChainType,record.tokenPairID);

            if(chainNameItemSrc && global.crossInvoker.isInSrcChainsMap(chainNameItemSrc, record.tokenPairID)){
              // destination is WAN, inbound
              bInbound    = true;
            };

            let bE20      = false;
            let bEos = false;

            let chainNameItem;
            if(bInbound === true){
              chainNameItem = chainNameItemSrc;
            }else{
              chainNameItem = chainNameItemDst;
            }

            if(chainNameItem[1].tokenStand === 'TOKEN'){
              bE20        = true;
            } else if (chainNameItem[1].tokenStand === 'EOS') {
              bEos = true;
            }

            // step2: build the right event by record, consider TOKEN and in bound or out bound
            let logs;
            let abi;
            let chainType = record.dstChainType; // because check buddy event.
            if(bInbound === true){
              // if(bE20 === true){
              //   // bE20 bInbound  getInStgLockEventE20
              //   mrLogger.debug("Entering getInStgLockEventE20");
              //   logs  = await ccUtil.getInStgLockEventE20(chainType,record.hashX,toAddress);
              //   abi   = this.config.crossChainScDict[chainType].CONTRACT.crossScAbi;
              // } else 
              if (bEos === true) {
                mrLogger.debug("Entering getInStgLockEventEos");
                logs  = await ccUtil.getInStgLockEventEos(chainType,record.hashX,toAddress);
                abi   = this.config.wanHtlcAbiEos;
              } else if (record.crossType === "FAST") {
                // mrLogger.debug("Entering getStgFasMintLockEvent");
                // logs  = await ccUtil.getStgFasMintLockEvent(chainType,record.lockTxHash,toAddress);
                if (record.smgCrossMode === "Lock") {
                  mrLogger.debug("Entering getStgBridgeLockEvent");
                  logs  = await ccUtil.getStgBridgeLockEvent(chainType,record.lockTxHash,toAddress);
                } else if (record.smgCrossMode === "Release") {
                  mrLogger.debug("Entering getStgBridgeReleaseEvent");
                  logs  = await ccUtil.getStgBridgeReleaseEvent(chainType,record.lockTxHash,toAddress);
                } else {
                  mrLogger.error("--------------invalid smgCrossMode ----------------", record.hashX, record.smgCrossMode);
                  return;
                }
                abi   = this.config.crossChainScDict[chainType].CONTRACT.crossScAbi;
              }else{
                // bInbound not TOKEN getInStgLockEvent
                mrLogger.debug("Entering getInStgLockEvent");
                logs  = await ccUtil.getInStgLockEvent(chainType,record.hashX,toAddress);
                abi   = this.config.crossChainScDict[chainType].CONTRACT.crossScAbi;
              }
            }else{
              // if(bE20 === true){
              //   // bE20 outBound getOutStgLockEventE20
              //   mrLogger.debug("Entering getOutStgLockEventE20");
              //   logs  = await ccUtil.getOutStgLockEventE20(chainType,record.hashX,toAddress);
              //   abi   = this.config.crossChainScDict[chainType].CONTRACT.crossScAbi;
              // } else 
              if(bEos === true){
                mrLogger.debug("Entering getOutStgLockEventEos");
                logs  = await ccUtil.getOutStgLockEventEos(chainType,record.hashX,toAddress, record.lockedTime);
                abi   = this.config.eosHtlcAbi;
              } else if(record.crossType === "FAST"){
                // mrLogger.debug("Entering getStgFastBurnLockEvent");
                // logs = await ccUtil.getStgFastBurnLockEvent(chainType,record.lockTxHash,toAddress);
                if (record.smgCrossMode === "Lock") {
                  mrLogger.debug("Entering getStgBridgeLockEvent");
                  logs  = await ccUtil.getStgBridgeLockEvent(chainType,record.lockTxHash,toAddress);
                } else if (record.smgCrossMode === "Release") {
                  mrLogger.debug("Entering getStgBridgeReleaseEvent");
                  logs  = await ccUtil.getStgBridgeReleaseEvent(chainType,record.lockTxHash,toAddress);
                } else {
                  mrLogger.error("--------------invalid smgCrossMode ----------------", record.hashX, record.smgCrossMode);
                  return;
                }
                abi  = this.config.crossChainScDict[chainType].CONTRACT.crossScAbi;
              } else{
                // outBound not TOKEN getOutStgLockEvent
                mrLogger.debug("Entering getOutStgLockEvent");
                logs = await ccUtil.getOutStgLockEvent(chainType,record.hashX,toAddress);
                abi  = this.config.crossChainScDict[chainType].CONTRACT.crossScAbi;
              }
            }
            mrLogger.debug("bInbound = ",bInbound);
            mrLogger.debug("bE20 = ",bE20);
            mrLogger.debug("bEos = ",bEos);
            mrLogger.debug("chainType=",chainType);
            mrLogger.debug("toAddress=",toAddress);

            if(typeof(logs[0]) === "undefined"){
              mrLogger.debug("waiting buddy locking", record.hashX);
              return;
            }

            let retResult;
            if (record.dstChainType === 'EOS') {
              retResult = logs;
              let action = logs[0].hasOwnProperty('action_trace') ? logs[0].action_trace : logs[0];
              retResult[0].transactionHash = action.trx_id;
              retResult[0].args = action.act.data;
              let value = ccUtil.eosToFloat(action.act.data.quantity);
              let decimals = action.act.data.quantity.split(' ')[0].split('.')[1] ? action.act.data.quantity.split(' ')[0].split('.')[1].length : 0;
              retResult[0].args.value = ccUtil.tokenToWeiHex(value, decimals);
            } else {
              retResult = ccUtil.parseLogs(logs, abi);
            }

            mrLogger.debug("retResult of parseLogs:", retResult);
            mrLogger.debug("retResult.value of parseLogs:", retResult[0].args.value);
            let valueEvent;
            valueEvent = new BigNumber(retResult[0].args.value);
            valueEvent = '0x'+valueEvent.toString(16);
            let valueContract = record.contractValue;
            mrLogger.debug("valueEvent: valueContract", valueEvent,valueContract);
            let toAddrEvent;
            if (bEos) {
              if (bInbound) {
                toAddrEvent = retResult[0].args.wanAddr.toLowerCase();
              } else {
                toAddrEvent = retResult[0].args.user.toLowerCase();
              }
            } else {
              toAddrEvent = retResult[0].args.userAccount.toLowerCase();
            }
            mrLogger.debug("toAddrEvent: toAddrRecord", toAddrEvent, record.toAddr.toLowerCase());
            if(valueEvent.toString() == valueContract.toString() && (record.toAddr.toLowerCase() === toAddrEvent)){
                mrLogger.debug("--------------equal----------------");

                // step3: get the lock transaction hash of buddy from block number
                let crossTransactionTx;
                if(typeof(retResult[0].transactionHash) !== "undefined"){
                    crossTransactionTx = retResult[0].transactionHash;
                    // step4: get transaction confirmation
                    mrLogger.debug("Entering waitBuddyLockConfirm LockTx %s buddyTx %s", record.lockTxHash,crossTransactionTx);
                    let options = {};
                    if (record.dstChainType === 'EOS') {
                        options.blockNumHint = retResult[0].block_num;
                    }
                    let receipt = await ccUtil.waitConfirm(crossTransactionTx,this.config.confirmBlocks,chainType, options);
                    mrLogger.debug("response from waitBuddyLockConfirm, LockTx %s buddyTx %s", record.lockTxHash,crossTransactionTx);
                    mrLogger.debug(receipt);
                    if((receipt && receipt.hasOwnProperty('blockNumber') && receipt.status === '0x1') || (record.dstChainType === 'EOS' && receipt.hasOwnProperty('block_num') && receipt.trx.receipt.status === 'executed')){

                      let recordTemp    = global.wanDb.getItem(this.crossCollection,{hashX:record.hashX});
                      let currentStatus = recordTemp.status;

                      mrLogger.debug("waitBuddyLockConfirm current record.status is :", record.status);
                      mrLogger.debug("waitBuddyLockConfirm current recordTemp.status is :", recordTemp.status);

                      if(currentStatus != 'Locked') {
                        mrLogger.debug("waitBuddyLockConfirm current status is :", currentStatus, record.hashX);
                        return;
                      }

                      // step5: get the time of buddy lock.
                      let newTime; // unit s
                      if (record.dstChainType === 'EOS') {
                        let date = new Date(receipt.block_time + 'Z'); // "Z" is a zero time offset
                        newTime = date.getTime()/1000;
                        if (Number(newTime) < Number(record.lockedTime)) {
                          newTime = record.lockedTime;
                        }
                      } else {
                        let blockNumber         = receipt.blockNumber;
                        let block               = await ccUtil.getBlockByNumber(blockNumber,chainType);
                        newTime = Number(block.timestamp); // unit s
                      }
                      record.buddyLockedTime  = newTime.toString();

                      record.buddyLockTxHash  = crossTransactionTx;
                      let buddyLockedTimeOut;
                      if(record.tokenStand === 'EOS'){
                        buddyLockedTimeOut    = newTime+Number(global.lockedTimeEOS); // unit:s
                      } else{
                        buddyLockedTimeOut    = newTime+Number(global.lockedTime); // unit:s
                      }
                      record.buddyLockedTimeOut= buddyLockedTimeOut.toString();

                      if (record.crossType === 'FAST') {
                        record.status           = 'Redeemed';
                      } else {
                        record.status           = 'BuddyLocked';
                      }
                      mrLogger.info("waitBuddyLockConfirm update record %s, status %s ", record.lockTxHash,record.status, record.hashX);
                      this.updateRecord(record);
                    }
                }

            }else{
                mrLogger.error("--------------Not equal----------------", record.hashX);
            }
        }catch(err){
            mrLogger.error("waitBuddyLockConfirm error!");
            mrLogger.error("error waitBuddyLockConfirm, lockTxHash=%s",record.lockTxHash, record.hashX);
            mrLogger.error("error is ", err);
        }
    },

    async checkRedeemEvent(record){
      try{
        if (record.dstChainType === 'EOS'){
          mrLogger.debug("Entering checkRedeemEvent, hashX = %s",record.hashX);
          // This is workaround: in un-usual case, wallet may send request to backend API server,
          // but failed to get the response, the wallet may restart, it retry to send request;
          // however, the previous request has been handled, so the later tx will fail,
          // this lead to inconsistent state, which run into loop for one step crosschain.
          // To break it, we check event instead confirmations, cause event must be sent by origianl tx.
          let evt = await this.getRedeemEvent(record);
          if (evt) {
            mrLogger.info("Got redeem event for record, hashX = %s", record.hashX, evt);
            if (Array.isArray(evt) && evt.length > 0) {
                evt = evt[0];
            }
            if (evt.hasOwnProperty('transactionHash')) {
              // update redeem tx hash !!!
              record.status       = 'Redeemed';
              mrLogger.info("Update redeemTxHash from %s to %s in event hashX = %s", record.redeemTxHash, evt.transactionHash, record.hashX);
              mrLogger.info("CheckRedeemEvent update record %s, status %s ", record.lockTxHash,record.status);
              record.redeemTxHash = evt.transactionHash;
              this.updateRecord(record);
            }
          } 
        }
      }catch(error){
        mrLogger.error("error checkRedeemEvent, hashX = %s",record.hashX);
        mrLogger.error("error is", error);
      }
    },
    async checkRevokeEvent(record){
      try{
        if (record.srcChainType === 'EOS'){
          mrLogger.debug("Entering checkRevokeEvent, hashX = %s",record.hashX);
          // This is workaround: in un-usual case, wallet may send request to backend API server,
          // but failed to get the response, the wallet may restart, it retry to send request;
          // however, the previous request has been handled, so the later tx will fail,
          // this lead to inconsistent state, which run into loop for one step crosschain.
          // To break it, we check event instead confirmations, cause event must be sent by origianl tx.
          let evt = await this.getRevokeEvent(record);
          if (evt) {
            mrLogger.info("Got revoke event for record, hashX = %s", record.hashX, evt);
            if (Array.isArray(evt) && evt.length > 0) {
              evt = evt[0];
            }
            if (evt.hasOwnProperty('transactionHash')) {
              // update redeem tx hash !!!
              record.status       = 'Revoked';
              mrLogger.info("Update revokeTxHash from %s to %s in event hashX = %s", record.revokeTxHash, evt.transactionHash, record.hashX);
              mrLogger.info("checkRevokeEvent update record %s, status %s ", record.lockTxHash,record.status);
              record.revokeTxHash = evt.transactionHash
              this.updateRecord(record);
            }
          } 
        }
      }catch(error){
        mrLogger.error("error checkRevokeEvent, hashX = %s",record.hashX);
        mrLogger.error("error is", error);
      }
    },

    updateRecord(record){
        global.wanDb.updateItem(this.crossCollection,{'hashX':record.hashX},record);
    },

    monitorTask(){
        mrLogger.debug("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
        mrLogger.debug("Entering monitor task");
        mrLogger.debug("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
        let records = global.wanDb.filterNotContains(this.config.crossCollection,'status',['Redeemed','Revoked']);
        mrLogger.debug('handlingList length is ', Object.keys(handlingList).length);
        for(let i=0; i<records.length && !self.done; i++){
            let record = records[i];
            let cur = Date.now();
            if(handlingList[record.hashX]) {
              if(handlingList[record.hashX]+300000 < cur){
                  delete handlingList[record.hashX];
              }else{
                mrLogger.debug('handingList already have this record, hashX is ', record.hashX, handlingList[record.hashX]);
                continue;
              }
            }
            handlingList[record.hashX] = cur;
            mrLogger.debug('handingList add the record, hashX is ', record.hashX, handlingList[record.hashX], record.status);
            this.monitorRecord(record);
        }

        if (!self.done) {
            self.timer = setTimeout(function() {
                self.monitorTask();
            }, timerInterval);
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
          // await this.waitApproveConfirm(record);
          break;
        }
        case 'Approved':
        {
          break;
        }
        /// approve begin
        case 'ApproveZeroSending':
        {
          //this.approveSendRetry(record);
          break;
        }
        case 'ApproveZeroSendFail':
        {
          //this.approveSendRetry(record);
          break;
        }
        case 'ApproveZeroSendFailAfterRetries':
        {
          break;
        }
        case 'ApproveZeroSent':
        {
          // await this.waitApproveZeroConfirm(record);
          break;
        }
        case 'ApprovedZero':
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
          await this.waitLockConfirm(record);
          // Locked
          break;
        }
        case 'Locked':
        {
          await this.waitBuddyLockConfirm(record);
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
          await this.waitRedeemConfirm(record);
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
          await this.waitRevokeConfirm(record);
          break;
        }
        case 'Revoked':
        {
          break;
        }
        case 'RedeemFail':
        {
          await this.checkRedeemEvent(record);
          break;
        }
        case 'RevokeFail':
        {
          await this.checkRevokeEvent(record);
          break;
        }
        /// revoke   end
        /// default  begin
        default:
          break;
      }
      if( handlingList[record.hashX]) {
        mrLogger.debug("handlingList delete already handled hashX", record.hashX);
        delete handlingList[record.hashX];
      }
    },
}
exports.MonitorRecord = MonitorRecord;
