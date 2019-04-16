'use strict'
let     TxDataCreator = require('../common/TxDataCreator');
let     ccUtil        = require('../../../api/ccUtil');
let     utils         = require('../../../util/util');

let logger = utils.getLogger('LockTxE20DataCreator.js');
/**
 * @class
 * @augments  TxDataCreator
 */
class LockTxE20DataCreator extends TxDataCreator{
    /**
     * @constructor
     * @param {Object} input  - {@link CrossChain#input input} of final users.(gas, gasPrice, value and so on)
     * @param {Object} config - {@link CrossChain#config config} of cross chain used.
     */
    constructor(input,config) {
        super(input,config);
    }

    /**
     * @override
     * @returns {Promise<{code: boolean, result: null}>}
     */
    async createCommonData(){
        logger.debug("Entering LockTxE20DataCreator::createCommonData");

        this.retResult.code      = true;
        let  commonData     = {};

        let chain = global.chainManager.getChain(this.input.chainType);
        let addr = await chain.getAddress(this.input.from.walletID, this.input.from.path);
        utils.addBIP44Param(this.input, this.input.from.walletID, this.input.from.path);

        this.input.fromAddr = ccUtil.hexAdd0x(addr.address);

        commonData.from     = ccUtil.hexAdd0x(addr.address);
        commonData.to       = this.config.midSCAddr;
        commonData.value    = 0;
        commonData.gasPrice = ccUtil.getGWeiToWei(this.input.gasPrice);
        commonData.gasLimit = Number(this.input.gasLimit);
        commonData.gas      = Number(this.input.gasLimit);
        commonData.nonce    = null;
        try{
            if(this.input.hasOwnProperty('testOrNot')){
                commonData.nonce  = ccUtil.getNonceTest();
            }else{
                //commonData.nonce  = await ccUtil.getNonce(commonData.from,this.input.chainType,true);
                let nonce = Number(this.input.approveNonce);
                logger.info("approveNonce = ",this.input.approveNonce);
                logger.info("nonce = ",this.input.approveNonce);
                //commonData.nonce  = nonce + 1;
                commonData.nonce  = await ccUtil.getNonceByLocal(commonData.from,this.input.chainType);
                logger.info("LockTxE20DataCreator::createCommonData getNonceByLocal,%s",commonData.nonce);
            }
            logger.info("nonce:is ",commonData.nonce);
        }catch(error){
            logger.error("error:",error);
            this.retResult.code   = false;
            this.retResult.result = error;
        }
        commonData.x      = this.input.x;
        commonData.hashX  = this.input.hashX;
        //logger.debug("x:",commonData.x);
        logger.debug("hash x:",commonData.hashX);

        if(this.input.chainType === 'WAN'){
            commonData.Txtype = '0x01';
            //let coin2WanRatio = global.coin2WanRatio;
            let coin2WanRatio = this.config.token2WanRatio;
            let txFeeRatio    = this.input.txFeeRatio;
            logger.info("amount:coin2WanRatio:txFeeRatio",Number(this.input.amount), coin2WanRatio, txFeeRatio);
            let value         = ccUtil.calculateLocWanFee(Number(this.input.amount), coin2WanRatio, txFeeRatio);
            logger.info("amount:coin2WanRatio:txFeeRatio:Fee",Number(this.input.amount), coin2WanRatio, txFeeRatio, value);
            commonData.value  = value;
        }
        this.retResult.result  = commonData;
        return Promise.resolve(this.retResult);
    }

    /**
     * @override
     * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
     */
    async createContractData(){
        logger.debug("Entering LockTxE20DataCreator::createContractData");
        try{
            let chain;
            let addr;

            if(this.input.chainType === 'WAN'){
                chain = global.chainManager.getChain('ETH');
                addr = await chain.getAddress(this.input.to.walletID, this.input.to.path);

                let data = ccUtil.getDataByFuncInterface(this.config.midSCAbi,
                  this.config.midSCAddr,
                  this.config.lockScFunc,
                  this.config.srcSCAddr,
                  this.input.hashX,
                  this.input.storeman,
                  ccUtil.hexAdd0x(addr.address),
                  ccUtil.tokenToWeiHex(this.input.amount,this.config.tokenDecimals)
                );
                this.retResult.result    = data;
                this.retResult.code      = true;
            }else{
                chain = global.chainManager.getChain('WAN');
                addr = await chain.getAddress(this.input.to.walletID, this.input.to.path);

                let data = ccUtil.getDataByFuncInterface(this.config.midSCAbi,
                  this.config.midSCAddr,
                  this.config.lockScFunc,
                  this.config.srcSCAddr,
                  this.input.hashX,
                  this.input.storeman,
                  ccUtil.hexAdd0x(addr.address),
                  ccUtil.tokenToWeiHex(this.input.amount,this.config.tokenDecimals)
                  );
                this.retResult.result    = data;
                this.retResult.code      = true;
            }
            this.input.toAddr = ccUtil.hexAdd0x(addr.address);
        }catch(error){
            logger.error("createContractData: error: ",error);
            this.retResult.result      = error;
            this.retResult.code        = false;
        }
        return this.retResult;
    }
}

module.exports = LockTxE20DataCreator;
