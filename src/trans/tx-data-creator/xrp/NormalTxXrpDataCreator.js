'use strict'

const bitcoin   = require('bitcoinjs-lib');
const utils   = require('../../../util/util');

let TxDataCreator = require('../common/TxDataCreator');
let btcUtil       =  require('../../../api/btcUtil');
let ccUtil        =  require('../../../api/ccUtil');
let hdUtil        =  require('../../../api/hdUtil');
let error         =  require('../../../api/error');

let logger = utils.getLogger('NormalTxXrpDataCreator.js');

class NormalTxXrpDataCreator extends TxDataCreator{
    /**
     * @param: {Object} -
     *     input {
     *         from:           - array, the from addresses
     *         to:             - target address
     *         value:          - amount to send
     *         feeRate:        -
     *         changeAddress:  - address to send if there's any change
     *         minConfirm:     - minimum confim blocks of UTXO to be spent
     *         maxConfirm:     - maximum confim blocks of UTXO to be spent
     *     }
     */
    constructor(input,config) {
        super(input,config);
    }
  
    /* New implementation */
    async createCommonData(){
        logger.debug("Entering NormalTxXrpDataCreator::createCommonData");
        let commData = {
                "from" : this.input.from,
                "to"   : this.input.to,
                "value": this.input.value
            };

        let chain = global.chainManager.getChain('XRP');

        let value = utils.toBigNumber(this.input.value).times('1e'+6).trunc();

        this.input.value = Number(value);
        logger.info(`Transfer amount [${this.input.value}]`);
        this.input.payment = {
          source: {
            address: this.input.from,
            maxAmount: {
              value: this.input.value.toString(),
              currency: 'drops',
            }
          },
          destination: {
            address: this.input.to,
            amount: {
              value: this.input.value.toString(),
              currency: 'drops',
            }
          }
        }
        if (this.input.tag) {
          this.input.payment.destination.tag = Number(this.input.tag);
        }
        this.retResult.code   = true;
        this.retResult.result = commData;

        logger.debug("NormalTxXrpDataCreator::createCommonData is completed");

        return  Promise.resolve(this.retResult);
    }
  
    /**
     * Build contract data
     * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
     */
    // createContractData(){
    //     logger.debug("Entering NormalTxXrpDataCreator::createContractData");
  
    //     let minConfirms = 0;
    //     if (this.input.hasOwnProperty('minConfirms')) {
    //         minConfirms = this.input.minConfirms;
    //     } else {
    //         logger.info("Minimum confirmations not specified, use default 0");
    //     }
  
    //     try {
    //         let i;
  
    //         let {inputs, change, fee} = ccUtil.btcCoinSelect(this.input.utxos, this.input.value, this.input.feeRate, minConfirms);
  
    //         if (!inputs) {
    //             logger.error("Couldn't find input for transaction");
    //             throw(new Error("Couldn't find input for transition"));
    //         }

    //         logger.info("Transaction fee=%d, change=%d", fee, change);
 
    //         let sdkConfig = utils.getConfigSetting('sdk:config', undefined); 
    //         let txb = new bitcoin.TransactionBuilder(sdkConfig.bitcoinNetwork);
  
    //         for (i = 0; i < inputs.length; i++) {
    //             let inItem = inputs[i]
    //             txb.addInput(inItem.txid, inItem.vout)
    //         }
  
    //         txb.addOutput(this.input.to, Math.round(this.input.value));
    //         txb.addOutput(this.input.changeAddress, Math.round(change));

    //         if (this.input.hasOwnProperty('op_return')) {
    //             let op_return_data = Buffer.from(this.input.op_return, "utf8");
    //             let embed = bitcoin.payments.embed({data: [op_return_data]});
    //             txb.addOutput(embed.output, 0);
    //         }

    //         this.retResult.result = { "txb" : txb, 
    //                                   "inputs" : inputs, 
    //                                   "keypair" : this.keyPairArray,
    //                                   "fee" : fee };

    //         this.retResult.code   = true;
    //         logger.debug("Contract data create successly");
    //     }
    //     catch (error) {
    //         logger.error("createContractData: error: ", error);
    //         this.retResult.result = error;
    //         this.retResult.code = false;
    //     }
  
    //     logger.debug("NormalTxXrpDataCreator::createContractData is completed");
    //     return this.retResult;
    // }
}

module.exports = NormalTxXrpDataCreator;
