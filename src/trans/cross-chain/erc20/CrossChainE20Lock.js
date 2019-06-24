'use strict'
let Transaction          = require('../../transaction/common/Transaction');
let E20DataSign          = require('../../data-sign/erc20/E20DataSign');
let E20DataSignWan       = require('../../data-sign/wan/WanDataSign');
let LockTxE20DataCreator = require('../../tx-data-creator/erc20/LockTxE20DataCreator');
let CrossChain           = require('../common/CrossChain');
let ccUtil               = require('../../../api/ccUtil');
let utils                = require('../../../util/util');
let CrossStatus          = require('../../status/Status').CrossStatus;
let CrossChainE20Approve = require('./CrossChainE20Approve');

let logger = utils.getLogger('CrossChainE20Lock.js');

/**
 * @class
 * @augments CrossChain
 */
class CrossChainE20Lock extends CrossChain{
    /**
     * @constructor
     * @param {Object} input  - {@link CrossChain#input input} of final users.(gas, gasPrice, value and so on)
     * @param {Object} config - {@link CrossChain#config config} of cross chain used.
     */
    constructor(input,config) {
      super(input,config);
      this.input.chainType    = config.srcChainType;
      this.input.keystorePath = config.srcKeystorePath;
      // this.input.hashX = null;     // from approve
      // this.input.x    = null;     // from approve
    }

    /**
     * @override
     * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
     */
    createDataCreator(){
      logger.debug("Entering CrossChainE20Lock::createDataCreator");
      this.retResult.code = true;
      this.retResult.result = new LockTxE20DataCreator(this.input,this.config);
      return this.retResult;
    }

    /**
     * @override
     * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
     */
    createDataSign(){
      logger.debug("Entering CrossChainE20Lock::createDataSign");
      this.retResult.code = true;
      if(this.input.chainType === 'WAN'){
        this.retResult.result = new E20DataSignWan(this.input,this.config);
      }else{
        this.retResult.result = new E20DataSign(this.input,this.config);
      }
      return this.retResult;
    }

    /**
     * @override
     * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
     */
    preSendTrans(signedData){
      if(this.input.hasOwnProperty('testOrNot')){
        let record = {
          "hashX"             :this.trans.commonData.hashX,
          "x"                 :this.trans.commonData.x,
          "from"              :this.input.from,
          "fromAddr"          :this.trans.commonData.from,
          "to"                :this.input.to,
          "toAddr"            :this.input.toAddr,
          "storeman"          :this.input.storeman,
          "value"             :this.trans.commonData.value,
          "contractValue"     :ccUtil.tokenToWeiHex(this.input.amount,this.config.tokenDecimals),
          "sendTime"          :parseInt(Number(Date.now())/1000).toString(),
          "lockedTime"        :"",
          "buddyLockedTime"   :"",
          "srcChainAddr"      :this.config.srcSCAddrKey,
          "dstChainAddr"      :this.config.dstSCAddrKey,
          "srcChainType"      :this.config.srcChainType,
          "dstChainType"      :this.config.dstChainType,
          "status"            :"LockSending",
          "approveTxHash"     :"",
          "lockTxHash"        :this.trans.commonData.hashX, // will update when sent successfully.,
          "redeemTxHash"      :"",
          "revokeTxHash"      :"",
          "buddyLockTxHash"   :"",
          "tokenSymbol"       :this.config.tokenSymbol,
          "tokenStand"        :this.config.tokenStand,
          "htlcTimeOut"       :"", //unit: s
          "buddyLockedTimeOut":"",
        };
        logger.debug("CrossChainE20Lock::preSendTrans");
        global.wanDb.insertItem(this.config.crossCollection,record);
        this.retResult.code = true;
        return this.retResult;
      }else{
        let record = global.wanDb.getItem(this.config.crossCollection,{hashX:this.input.hashX});

        record.status   = 'LockSending';
        record.fromAddr = this.trans.commonData.from,
        record.toAddr   = this.input.toAddr,
        logger.info("CrossChainE20Lock::preSendTrans");
        logger.info("collection is :",this.config.crossCollection);
        logger.info("record is :",ccUtil.hiddenProperties(record,['x']));
        global.wanDb.updateItem(this.config.crossCollection,{hashX:record.hashX},record);
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
      logger.info("CrossChainE20Lock::transFailed");
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
      logger.debug("Entering CrossChainE20Lock::postSendTrans");
      let txHash = resultSendTrans;
      let record = global.wanDb.getItem(this.config.crossCollection,{hashX:this.input.hashX});
      record.lockTxHash             = txHash;
      record.approveZeroTxHash      = this.input.approveZeroTxHash;
      record.status                 = 'LockSent';

      logger.info("CrossChainE20Lock::postSendTrans");
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
    async run(){
        let ret = {};
        let amount;
        let allowance ;
        let hashX;
        let x;
        let approveNonce;
        try{
            //tokenScAddr,ownerAddr,spenderAddr,chainType='ETH'
            let chain = global.chainManager.getChain(this.input.chainType);
            let addr = await chain.getAddress(this.input.from.walletID, this.input.from.path);
            let tokenScAddr;

            tokenScAddr = this.input.chainType === 'WAN'? this.config.buddySCAddr:this.config.srcSCAddr;
            allowance = await ccUtil.getErc20Allowance(tokenScAddr,
                ccUtil.hexAdd0x(addr.address),
                this.config.midSCAddr,
                this.input.chainType);

            logger.info("CrossChainE20Lock:async run tokenScAddr=%s,ownerAddr=%s,spenderAddr=%s,chainType=%s, allowance=%s",
                tokenScAddr,
                ccUtil.hexAdd0x(addr.address),
                this.config.midSCAddr,
                this.input.chainType,
                allowance);

        }catch(err){
          logger.error("CrossChainE20Lock:async run");
          logger.error(err);
          ret.code = false;
          ret.result = err;
          return ret;
        }

        amount = this.input.amount;
        this.input.approveZero = false;
        if(Number(allowance) !== 0){
          // approve 0;
          this.input.amount = 0;
          this.input.approveZero = true;
          let  crossChainE20ApproveZero = new CrossChainE20Approve(this.input,this.config);
          try{
            if(this.input.hasOwnProperty('testOrNot') === false){
              ret         = await crossChainE20ApproveZero.run();

              hashX       = crossChainE20ApproveZero.trans.commonData.hashX;
              x           = crossChainE20ApproveZero.trans.commonData.x;
              // transfer hashX and X to approve from approveZero
              this.input.hashX        = hashX;
              this.input.x            = x;

              if(ret.code === false){
                logger.debug("before lock, in crossChainE20ApproveZero error:",ret.result);
                return ret;
              }
              this.input.approveZeroTxHash = ret.result;
            }
          }catch(err){
            logger.error("CrossChainE20Lock:async crossChainE20ApproveZero run");
            logger.error(err);
            ret.code = false;
            ret.result = err;
            return ret;
          }
        }

        this.input.amount       = amount;
        this.input.approveZero  = false;
        let  crossChainE20Approve = new CrossChainE20Approve(this.input,this.config);
        try{

          if(this.input.hasOwnProperty('testOrNot') === false){
            ret         = await crossChainE20Approve.run();
            hashX       = crossChainE20Approve.trans.commonData.hashX;
            x           = crossChainE20Approve.trans.commonData.x;
            approveNonce = crossChainE20Approve.trans.commonData.nonce;
            if(ret.code === false){
              logger.debug("before lock, in approve error:",ret.result);
              return ret;
            }
            logger.debug("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&");
            logger.debug("hashX:",hashX);
            //logger.debug("x:",x);
            logger.debug("this.input is :",ccUtil.hiddenProperties(this.input,['password','x']));
          }


          // for test
          if(this.input.hasOwnProperty('testOrNot')){
            x     = ccUtil.generatePrivateKey();
            hashX = ccUtil.getHashKey(x);
          }
          // transfer hashX and X to lock from approve
          this.input.hashX        = hashX;
          this.input.x            = x;
          this.input.approveNonce = approveNonce;

          // logger.debug("CrossChainE20Lock: trans");
          // logger.debug(this.trans);
          ret = await super.run();
          if(ret.code === true){
            logger.debug("send lock transaction success!");
          }else{
            logger.debug("send lock transaction fail!");
            logger.debug(ret.result);
          }
          return ret;
        }catch(err){
          logger.error("CrossChainE20Lock:async run");
          logger.error(err);
          ret.code = false;
          ret.result = err;
          return ret;
        }
    }
}

module.exports = CrossChainE20Lock;
