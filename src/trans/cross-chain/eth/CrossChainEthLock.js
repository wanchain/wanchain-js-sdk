'use strict'
let     Transaction             = require('../../transaction/common/Transaction');
let     EthDataSign             = require('../../data-sign/eth/EthDataSign');
let     BscDataSign             = require('../../data-sign/bsc/BscDataSign');
let     WanDataSign             = require('../../data-sign/wan/WanDataSign');
let     LockTxEthDataCreator    = require('../../tx-data-creator/eth/LockTxEthDataCreator');
let     CrossChain              = require('../common/CrossChain');

let     ccUtil                  = require('../../../api/ccUtil');
let     utils                   = require('../../../util/util');
let     CrossStatus             = require('../../status/Status').CrossStatus;
let     CrossChainEthApprove = require('./CrossChainEthApprove');

let logger = utils.getLogger('CrossChainEthLock.js');

/**
 * @class
 * @augments CrossChain
 */
class CrossChainEthLock extends CrossChain{
  /**
   * @constructor
   * @param {Object} input  - {@link CrossChain#input input} of final users.(gas, gasPrice, value and so on)
   * @param {Object} config - {@link CrossChain#config config} of cross chain used.
   */
  constructor(input,config) {
    super(input,config);
    this.input.chainType = config.srcChainType;
    this.input.keystorePath = config.srcKeystorePath;
  }

  /**
   * @override
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  createDataCreator(){
    logger.debug("Entering CrossChainEthLock::createDataCreator");
    this.retResult.code = true;
    this.retResult.result = new LockTxEthDataCreator(this.input,this.config);
    return this.retResult;
  }

  /**
   * @override
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  createDataSign(){
    logger.debug("Entering CrossChainEthLock::createDataSign");

    this.retResult.code = true;
    if (this.input.chainType === 'ETH'){
      this.retResult.result = new EthDataSign(this.input,this.config)
    }else if(this.input.chainType === 'BNB'){
      this.retResult.result = new BscDataSign(this.input,this.config);
    }else if (this.input.chainType === 'WAN'){
      this.retResult.result = new WanDataSign(this.input,this.config);
    }else{
      this.retResult.code = false;
      this.retResult.result = "chainType is error.";
    }

    return this.retResult;
  }

  /**
   * @override
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  preSendTrans(signedData) {
    if (this.config.tokenStand !== 'TOKEN' && this.config.crossMode === 'Lock') {
      let record = {
        "hashX": this.input.hashX,
        "x": this.input.x,
        "from": this.input.from,
        "fromAddr": this.input.fromAddr,
        "to": this.input.to,
        "toAddr": this.input.toAddr,
        "storeman": this.input.storeman,
        "tokenPairID": this.input.tokenPairID,
        "value": this.trans.commonData.value,
        "contractValue": ccUtil.tokenToWeiHex(this.input.amount, this.config.tokenDecimals),
        "crossValue": ccUtil.hexAdd0x(this.input.crossValue.toString(16)),
        "networkFee": ccUtil.hexAdd0x(this.input.networkFee.toString(16)),
        "sendTime": parseInt(Number(Date.now()) / 1000).toString(),
        "lockedTime": "",
        "buddyLockedTime": "",
        "srcChainAddr": this.config.srcSCAddrKey,
        "dstChainAddr": this.config.dstSCAddrKey,
        "srcChainType": this.config.srcChainType,
        "dstChainType": this.config.dstChainType,
        "crossMode": this.config.crossMode,
        "smgCrossMode": this.config.smgCrossMode,
        "crossType": this.input.crossType,
        "status": CrossStatus.LockSending,
        "approveTxHash": "",
        "lockTxHash": "",
        "redeemTxHash": "",
        "revokeTxHash": "",
        "buddyLockTxHash": "",
        "tokenSymbol": this.config.tokenSymbol,
        "tokenStand": this.config.tokenStand,
        "htlcTimeOut": "", //unit: s
        "buddyLockedTimeOut": "",
      };
      logger.info("CrossChainEthLock::preSendTrans");
      logger.info("collection is :", this.config.crossCollection);
      logger.info("record is :", ccUtil.hiddenProperties(record, ['x']));
      global.wanDb.insertItem(this.config.crossCollection, record);
      this.retResult.code = true;
      return this.retResult;
    } else {
      let record = global.wanDb.getItem(this.config.crossCollection, { hashX: this.input.hashX });
      let newRecord = false;
      if (!record) {
        newRecord = true;
        record = {
          "hashX": this.input.hashX,
          "x": this.input.x,
          "from"              :this.input.from,
          "to"                :this.input.to,
          "storeman"          :this.input.storeman,
          "tokenPairID"       : this.input.tokenPairID,
          "value"             :this.trans.commonData.value,
          "contractValue"     :ccUtil.tokenToWeiHex(this.input.amount,this.config.tokenDecimals),
          "crossValue"        :ccUtil.hexAdd0x(this.input.crossValue.toString(16)),
          "networkFee"        :ccUtil.hexAdd0x(this.input.networkFee.toString(16)),
          "sendTime"          :parseInt(Number(Date.now())/1000).toString(),
          "lockedTime"        :"",
          "buddyLockedTime"   :"",
          "srcChainAddr"      :this.config.srcSCAddrKey,
          "dstChainAddr"      :this.config.dstSCAddrKey,
          "srcChainType"      :this.config.srcChainType,
          "dstChainType"      :this.config.dstChainType,
          "crossMode"         : this.config.crossMode,
          "smgCrossMode"      : this.config.smgCrossMode,
          "crossType"         : this.input.crossType,
          "status"            :"",
          "approveTxHash"     :"",
          "lockTxHash"        :"",
          "redeemTxHash"      :"",
          "revokeTxHash"      :"",
          "buddyLockTxHash"   :"",
          "tokenSymbol"       :this.config.tokenSymbol,
          "tokenStand"        :this.config.tokenStand,
          "htlcTimeOut"       :"", //unit: s
          "buddyLockedTimeOut":"",
        };
      }
      if (this.config.dstChainType === 'XRP' && this.input.LedgerVersion) {
        record.LedgerVersion = this.input.LedgerVersion;
      }
      record.value = this.trans.commonData.value;
      record.contractValue = ccUtil.tokenToWeiHex(this.input.amount,this.config.tokenDecimals);
      record.crossValue = ccUtil.hexAdd0x(this.input.crossValue.toString(16));
      record.networkFee = ccUtil.hexAdd0x(this.input.networkFee.toString(16));
      record.action = this.input.action;
      record.status = 'LockSending';
      record.fromAddr = this.trans.commonData.from,
      record.to = this.input.to,
      record.toAddr = this.input.toAddr,
      logger.info("CrossChainEthLock::preSendTrans");
      logger.info("collection is :", this.config.crossCollection);
      logger.info("record is :", ccUtil.hiddenProperties(record, ['x']));
      if (newRecord) {
        global.wanDb.insertItem(this.config.crossCollection, record);
      } else {
        global.wanDb.updateItem(this.config.crossCollection, { hashX: record.hashX }, record);
      }
      this.retResult.code = true;
      return this.retResult;
    }
  }

  /**
   * @override
   */
  transFailed(){
    let hashX  = this.input.hashX;
    let record = global.wanDb.getItem(this.config.crossCollection,{hashX:hashX});
    record.status = CrossStatus.LockFail;
    logger.info("CrossChainEthLock::transFailed");
    logger.info("collection is :",this.config.crossCollection);
    logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
    this.retResult.code = true;
    return this.retResult;
  }

  /**
   * @override
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  postSendTrans(resultSendTrans){
    logger.debug("Entering CrossChainEthLock::postSendTrans");
    let txHash = resultSendTrans;
    let hashX  = this.input.hashX;
    let record = global.wanDb.getItem(this.config.crossCollection,{hashX:hashX});
    record.status = CrossStatus.LockSent;
    record.lockTxHash = txHash;
    logger.info("CrossChainEthLock::postSendTrans");
    logger.info("collection is :",this.config.crossCollection);
    logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
    global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
    this.retResult.code = true;
    return this.retResult;
  }

  /**
 * @override
 * @returns {Promise<*>}
 */
  async run(isSend) {
    let ret = {};
    let amount;
    let allowance;
    let hashX;
    let x;
    let approveNonce;
    try {
      //tokenScAddr,ownerAddr,spenderAddr,chainType='ETH'
      let addr;
      if (this.input.from && (typeof this.input.from === 'object')) {
        let chain = global.chainManager.getChain(this.input.chainType);
        addr = await chain.getAddress(this.input.from.walletID, this.input.from.path);
      } else {
        addr = {
          address: this.input.from.toLowerCase()
        }
      }
      let tokenScAddr;
      let midSCAddr;

      if (!(this.config.tokenStand !== 'TOKEN' && this.config.crossMode === 'Lock')) {
        tokenScAddr = this.config.srcSCAddr;
        midSCAddr = this.config.midSCAddr;
        // rewrite for FNX testnet
        if (tokenScAddr.toLowerCase() === '0xcbf7eab1639c175545a0d8b24ac47ea36a2720ed') {
          console.log('rewrite for FNX testnet');
          tokenScAddr = '0x0664b5e161a741bcdec503211beeec1e8d0edb37';
          midSCAddr = '0xcbf7eab1639c175545a0d8b24ac47ea36a2720ed';
        } 

        // rewrite for FNX mainnet
        if (tokenScAddr.toLowerCase() === '0xdab498c11f19b25611331cebffd840576d1dc86d') {
          console.log('rewrite for FNX mainnet');
          tokenScAddr = '0xc6f4465a6a521124c8e3096b62575c157999d361';
          midSCAddr = '0xdab498c11f19b25611331cebffd840576d1dc86d';
        } 
        
        // rewrite for CFNX testnet
        if (tokenScAddr.toLowerCase() === '0xcbf7eab1639c175545a0d8b24ac47ea36a2720ed') { 
          console.log('rewrite for CFNX testnet');
          tokenScAddr = '0x55bdda9679274368e529905b70bf90e48d6c9cbb';
          midSCAddr = '0xfdbc6f64407bd15f36fbedf2dfbd9d93ee61309c';
        } 

        allowance = await ccUtil.getErc20Allowance(tokenScAddr,
          ccUtil.hexAdd0x(addr.address),
          midSCAddr,
          this.input.chainType);

        logger.info("CrossChainEthLock:async run tokenScAddr=%s,ownerAddr=%s,spenderAddr=%s,chainType=%s, allowance=%s",
          tokenScAddr,
          ccUtil.hexAdd0x(addr.address),
          this.config.midSCAddr,
          this.input.chainType,
          allowance);

        amount = this.input.amount;
        this.input.approveZero = false;
        if (Number(allowance) < Number(ccUtil.tokenToWei(this.input.amount, this.config.tokenDecimals))) {
          if (Number(allowance) !== 0) {
            // approve 0;
            this.input.amount = 0;
            this.input.approveZero = true;
            let crossChainEthApproveZero = new CrossChainEthApprove(this.input, this.config);
            try {
              if (this.input.hasOwnProperty('testOrNot') === false) {
                ret = await crossChainEthApproveZero.run(isSend);

                hashX = crossChainEthApproveZero.trans.commonData.hashX;
                x = crossChainEthApproveZero.trans.commonData.x;
                // transfer hashX and X to approve from approveZero
                this.input.hashX = hashX;
                this.input.x = x;

                if (ret.code === false) {
                  logger.debug("before lock, in crossChainEthApproveZero error:", ret.result);
                  return ret;
                }
                this.input.approveZeroTxHash = ret.result;
              }
            } catch (err) {
              logger.error("CrossChainEthLock:async crossChainEthApproveZero run");
              logger.error(err);
              ret.code = false;
              ret.result = err;
              return ret;
            }
          }

          // this.input.amount = amount;
          this.input.amount = ccUtil.weiToToken(utils.toBigNumber(2).pow(256).minus(1).trunc(), this.config.tokenDecimals);
          this.input.approveZero = false;
          let crossChainEthApprove = new CrossChainEthApprove(this.input, this.config);
          try {
            if (this.input.hasOwnProperty('testOrNot') === false) {
              ret = await crossChainEthApprove.run(isSend);
              hashX = crossChainEthApprove.trans.commonData.hashX;
              x = crossChainEthApprove.trans.commonData.x;
              approveNonce = crossChainEthApprove.trans.commonData.nonce;
              if (ret.code === false) {
                logger.debug("before lock, in approve error:", ret.result);
                return ret;
              }
              this.input.approveTxHash = ret.result;
              logger.debug("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&");
              logger.debug("hashX:", hashX);
              //logger.debug("x:",x);
              logger.debug("this.input is :", ccUtil.hiddenProperties(this.input, ['password', 'x']));
            }
            this.input.amount = amount;
          } catch (err) {
            logger.error("CrossChainEthLock:async crossChainEthApprove run");
            logger.error(err);
            ret.code = false;
            ret.result = err;
            return ret;
          }
        } else {
          x = ccUtil.generatePrivateKey();
          hashX = ccUtil.getSha256HashKey(x);
        }
      } else {
        x = ccUtil.generatePrivateKey();
        hashX = ccUtil.getSha256HashKey(x);
      }

      // transfer hashX and X to lock from approve
      this.input.hashX = hashX;
      this.input.x = x;
      this.input.approveNonce = approveNonce;

      // logger.debug("CrossChainEthLock: trans");
      // logger.debug(this.trans);
      ret = await super.run(isSend);
      if (ret.code === true) {
        ret.approveZeroTx = this.input.approveZeroTxHash;
        ret.approveTx = this.input.approveTxHash;
        if (ret.approveZeroTxHash) {
          ret.result.nonce = Number(ret.result.nonce) + 2;
          ret.approveTx.nonce = Number(ret.approveTx.nonce) + 1;
        } else if (ret.approveTx) {
          ret.result.nonce = Number(ret.result.nonce) + 1;
        }
        logger.debug("send lock transaction success!");
      } else {
        logger.debug("send lock transaction fail!");
        logger.debug(JSON.stringify(ret.result));
      }
      return ret;
    } catch (err) {
      logger.error("CrossChainEthLock:async run");
      logger.error(err);
      ret.code = false;
      ret.result = err;
      return ret;
    }
  }
}

module.exports = CrossChainEthLock;
