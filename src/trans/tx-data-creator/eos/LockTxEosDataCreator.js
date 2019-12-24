'use strict'
let     TxDataCreator = require('../common/TxDataCreator');
let     ccUtil        = require('../../../api/ccUtil');
let     utils         = require('../../../util/util');

let logger = utils.getLogger('LockTxEosDataCreator.js');
/**
 * @class
 * @augments  TxDataCreator
 */
class LockTxEosDataCreator extends TxDataCreator{
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
        logger.debug("Entering LockTxEosDataCreator::createCommonData");

        this.retResult.code      = true;
        let  commonData     = {};

        let address;
        if (this.input.from && (typeof this.input.from === 'object')) {
            if(this.input.chainType !== 'WAN'){
                address = this.input.from.address;
            } else {
                let chain = global.chainManager.getChain('WAN');
                let addr = await chain.getAddress(this.input.from.walletID, this.input.from.path);
                address = addr.address;
            }
            utils.addBIP44Param(this.input, this.input.from.walletID, this.input.from.path);
        } else {
            address = this.input.from;
            if(this.input.chainType !== 'WAN'){
                this.input.from = {
                    walletID: this.input.walletID,
                    path: this.input.BIP44Path,
                    address: this.input.from
                }
            }
        }
        if(this.input.chainType === 'WAN'){
            address = ccUtil.hexAdd0x(address);
        }

        this.input.fromAddr = address;
        commonData.from     = address;
        commonData.to       = this.config.midSCAddr;
        commonData.value    = 0;
        commonData.nonce    = null;

        if(this.input.chainType === 'WAN'){
            commonData.gasPrice = ccUtil.getGWeiToWei(this.input.gasPrice);
            commonData.gasLimit = Number(this.input.gasLimit);
            commonData.gas      = Number(this.input.gasLimit);

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
                    logger.info("LockTxEosDataCreator::createCommonData getNonceByLocal,%s",commonData.nonce);
                }
                logger.info("nonce:is ",commonData.nonce);
            }catch(error){
                logger.error("error:",error);
                this.retResult.code   = false;
                this.retResult.result = error;
            }

            commonData.Txtype = '0x01';
            //let coin2WanRatio = global.coin2WanRatio;
            let coin2WanRatio = this.config.token2WanRatio;
            let txFeeRatio    = this.input.txFeeRatio;
            logger.info("amount:coin2WanRatio:txFeeRatio",Number(this.input.amount), coin2WanRatio, txFeeRatio);
            let value         = ccUtil.calculateLocWanFee(Number(this.input.amount), coin2WanRatio, txFeeRatio);
            logger.info("amount:coin2WanRatio:txFeeRatio:Fee",Number(this.input.amount), coin2WanRatio, txFeeRatio, value);
            commonData.value  = value;
        } else {
            commonData.value  = this.input.amount;
        }

        commonData.x      = this.input.x;
        commonData.hashX  = this.input.hashX;
        //logger.debug("x:",commonData.x);
        logger.debug("hash x:",commonData.hashX);

        this.retResult.result  = commonData;
        return Promise.resolve(this.retResult);
    }

    /**
     * @override
     * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
     */
    async createContractData(){
        logger.debug("Entering LockTxEosDataCreator::createContractData");
        try{
            let address;
            if (this.input.to && (typeof this.input.to === 'object')) {
                if(this.input.chainType === 'WAN'){
                    address = this.input.to.address;
                } else {
                    let chain = global.chainManager.getChain('WAN');
                    let addr = await chain.getAddress(this.input.to.walletID, this.input.to.path);
                    address = addr.address;
                }
            } else {
                address = this.input.to;
                if(this.input.chainType === 'WAN'){
                    this.input.to = {
                        walletID: this.input.toWalletID,
                        path: this.input.toBIP44Path,
                        address: this.input.to
                    }
                }
            }
            if(this.input.chainType !== 'WAN'){
                address = ccUtil.hexAdd0x(address);
            }
            this.input.toAddr = address;

            if(this.input.chainType === 'WAN'){
                let data = ccUtil.getDataByFuncInterface(this.config.midSCAbi,
                  this.config.midSCAddr,
                  this.config.lockScFunc,
                  this.input.hashX,
                  ccUtil.tokenToWeiHex(this.input.amount,this.config.tokenDecimals),
                  this.config.srcSCAddr,
                  ccUtil.encodeAccount(this.config.dstChainType, address),
                  this.input.storeman
                );
                this.retResult.result    = data;
                this.retResult.code      = true;
            }else{
                if (this.input.action && this.input.action === this.config.lockScFunc) {
                    let origScAddr = ccUtil.decodeAccount(this.input.chainType, this.config.srcSCAddrKey).split(':')[0];
                    let actions = [{
                      account: origScAddr,
                      name: this.config.transferScFunc,
                      authorization: [{
                        actor: this.input.fromAddr,
                        permission: 'active',
                      }],
                      data: {
                        from: this.input.fromAddr,
                        to:  this.config.midSCAddr,
                        quantity: ccUtil.floatToEos(this.input.amount, this.config.tokenSymbol, this.config.tokenDecimals),
                        memo: this.config.lockScFunc + ':' + ccUtil.hexTrip0x(this.input.hashX) + ':' + ccUtil.hexTrip0x(this.input.toAddr) + ':' + ccUtil.hexTrip0x(this.input.storeman) + ':' + origScAddr
                      }
                    }];
                    logger.debug("LockTxEosDataCreator:: action is ",JSON.stringify(actions, null, 2));
                    let packedTx = await ccUtil.packTransaction(this.input.chainType, {actions:actions});
                    this.retResult.result    = packedTx;
                  }
                this.retResult.code      = true;
            }
        }catch(error){
            logger.error("LockTxEosDataCreator::createContractData: error: ",error);
            this.retResult.result      = error;
            this.retResult.code        = false;
        }
        return this.retResult;
    }
}

module.exports = LockTxEosDataCreator;
