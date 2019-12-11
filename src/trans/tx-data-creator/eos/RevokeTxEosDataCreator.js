'use strict'

let     TxDataCreator = require('../common/TxDataCreator');
let     ccUtil        = require('../../../api/ccUtil');
let     hdUtil        = require('../../../api/hdUtil');
let     utils         = require('../../../util/util');

let logger = utils.getLogger('RevokeTxEosDataCreator.js');

/**
 * @class
 * @augments  TxDataCreator
 */
class RevokeTxEosDataCreator extends TxDataCreator{
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
        logger.debug("Entering RevokeTxEosDataCreator::createCommonData");

        let record          = global.wanDb.getItem(this.config.crossCollection,{hashX:this.input.hashX});
        this.input.x        = record.x;
        this.retResult.code      = true;

        let  commonData     = {};

        let addr, address;
        if (record.from && (typeof record.from === 'object')) {
            if(this.input.chainType === 'WAN'){
                let chain = global.chainManager.getChain('WAN');
                addr = await chain.getAddress(record.from.walletID, record.from.path);
                address = addr.address;
            } else {
                // addr = hdUtil.getUserAccount(Number(record.from.walletID), record.from.path);
                // address = addr.account;
                address = record.from.address;
            }
            utils.addBIP44Param(this.input, record.from.walletID, record.from.path);

        } else {
            address = record.fromAddr;
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
                //commonData.nonce  = await ccUtil.getNonce(commonData.from,this.input.chainType);
                if(this.input.hasOwnProperty('testOrNot')){
                  commonData.nonce  = ccUtil.getNonceTest();
                }else{
                  commonData.nonce  = await ccUtil.getNonceByLocal(commonData.from,this.input.chainType);
                  logger.info("RevokeTxEosDataCreator::createCommonData getNonceByLocal,%s",commonData.nonce);
                }
                logger.debug("nonce:is ",commonData.nonce);
            }catch(error){
                logger.error("error:",error);
                this.retResult.code      = false;
                this.retResult.result    = error;
            }
            commonData.Txtype = '0x01';
        }

        this.retResult.result  = commonData;
        return Promise.resolve(this.retResult);
    }

    /**
     * @override
     * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
     */
    async createContractData(){
        logger.debug("Entering RevokeTxEosDataCreator::createContractData");
        try{
            if(this.input.chainType === 'WAN'){
                let data = ccUtil.getDataByFuncInterface(this.config.midSCAbi,
                    this.config.midSCAddr,
                    this.config.revokeScFunc,
                    ccUtil.encodeAccount(this.config.dstChainType, this.config.srcSCAddr),                  // parameter
                    this.input.hashX                        // parameter
                );
                this.retResult.result    = data;
                this.retResult.code      = true;
            }else{
                if (this.input.action && this.input.action === this.config.revokeScFunc) {
                    let actions = [{
                      account: this.config.midSCAddr,
                      name: this.input.action,
                      authorization: [{
                        actor: this.input.fromAddr,
                        permission: 'active',
                      }],
                      data: {
                        user: this.input.fromAddr,
                        xHash: ccUtil.hexTrip0x(this.input.hashX)
                      }
                    }];
                    logger.debug("RevokeTxEosDataCreator:: action is ",JSON.stringify(actions, null, 2));
                    let packedTx = await ccUtil.packTransaction(this.input.chainType, {actions:actions});
                    this.retResult.result    = packedTx;
                  }
        
                this.retResult.code      = true;
            }
        }catch(error){
            logger.error("RevokeTxEosDataCreator::createContractData: error: ",error);
            this.retResult.result      = error;
            this.retResult.code        = false;
        }
        return this.retResult;
    }
}

module.exports = RevokeTxEosDataCreator;
