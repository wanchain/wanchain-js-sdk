'use strict'

let TxDataCreator = require('../common/TxDataCreator');
let ccUtil        = require('../../../api/ccUtil');
let utils         = require('../../../util/util');

let logger = utils.getLogger('RedeemTxEosDataCreator.js');

/**
 * @class
 * @augments  TxDataCreator
 */
class RedeemTxEosDataCreator extends TxDataCreator{
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
        logger.debug("Entering RedeemTxEosDataCreator::createCommonData");

        let record          = global.wanDb.getItem(this.config.crossCollection,{hashX:this.input.hashX});
        this.input.x        = record.x;
        this.retResult.code      = true;

        let  commonData     = {};

        let chain = global.chainManager.getChain(this.input.chainType);
        let address;
        if (record.to && (typeof record.to === 'object')) {
            let addr = await chain.getAddress(record.to.walletID, record.to.path);
            utils.addBIP44Param(this.input, record.to.walletID, record.to.path);

            address = addr.address;
        } else {
            address = this.input.from;
        }
        if(this.input.chainType === 'WAN'){
            address = ccUtil.hexAdd0x(address);
        }

        this.input.fromAddr = address;
        commonData.from     = address;

        commonData.to       = this.config.dstSCAddr;
        commonData.value    = 0;
        // commonData.gasPrice = ccUtil.getGWeiToWei(this.input.gasPrice);
        // commonData.gasLimit = Number(this.input.gasLimit);
        // commonData.gas      = Number(this.input.gasLimit);
        commonData.nonce    = null;

        // try{
        //     if(this.input.hasOwnProperty('testOrNot')){
        //         commonData.nonce  = ccUtil.getNonceTest();
        //     }else{
        //         commonData.nonce  = await ccUtil.getNonceByLocal(commonData.from,this.input.chainType);
        //         logger.info("RedeemTxEosDataCreator::createCommonData getNonceByLocal,%s",commonData.nonce);
        //     }
        //     logger.debug("nonce:is ",commonData.nonce);
        // }catch(error){
        //     logger.error("error:",error);
        //     this.retResult.code      = false;
        //     this.retResult.result    = error;
        // }
        if(this.input.chainType === 'WAN'){
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
        logger.debug("Entering RedeemTxEosDataCreator::createContractData");
        try{
            if(this.input.chainType === 'WAN'){
                let data = ccUtil.getDataByFuncInterface(this.config.midSCAbi,
                    this.config.midSCAddr,
                    this.config.redeemScFunc,
                    this.config.srcSCAddr,              // parameter
                    this.input.x                        // parameter
                );
                this.retResult.result = data;
                this.retResult.code   = true;
            }else{
                // chain = global.chainManager.getChain('WAN');
                // addr = await chain.getAddress(this.input.to.walletID, this.input.to.path);

                if (this.input.action && this.input.action === 'newaccount') {
                    actions = [{
                      account: 'eosio',
                      name: this.input.action,
                      authorization: [{
                        actor: this.input.from,
                        permission: 'active',
                      }],
                      data: {
                        creator: this.input.from,
                        name: this.input.accountName,
                        owner: this.input.ownerPublicKey,
                        active: this.input.activePublicKey
                      }
                    }];
                  }
        
                let packedTx = await ccUtil.packTrans(actions);
                this.retResult.result    = packedTx;
                this.retResult.code      = true;

                // let data = ccUtil.getDataByFuncInterface(this.config.midSCAbi,
                //   this.config.midSCAddr,
                //   this.config.lockScFunc,
                //   this.config.srcSCAddr,
                //   this.input.hashX,
                //   this.input.storeman,
                //   ccUtil.hexAdd0x(addr.address),
                //   ccUtil.tokenToWeiHex(this.input.amount,this.config.tokenDecimals)
                //   );
                // this.retResult.result    = data;
                // this.retResult.code      = true;
            }
        }catch(error){
            logger.error("RedeemTxEosDataCreator::createContractData: error: ",error);
            this.retResult.result = error;
            this.retResult.code   = false;
        }
        return this.retResult;
    }

}

module.exports = RedeemTxEosDataCreator;
