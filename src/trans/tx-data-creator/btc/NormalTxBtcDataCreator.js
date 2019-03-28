'use strict'

const bitcoin   = require('bitcoinjs-lib');
const wanUtil   = require('../../../util/util');

let TxDataCreator = require('../common/TxDataCreator');
let btcUtil       =  require('../../../api/btcUtil');
let ccUtil        =  require('../../../api/ccUtil');

let logger = wanUtil.getLogger('NormalTxBtcDataCreator.js');

class NormalTxBtcDataCreator extends TxDataCreator{
    /**
     * @param: {Object} -
     *     input {
     *         utxos:          - inputs to build vin
     *         to:             - target address
     *         value:          - amount to send
     *         feeRate:        -
     *         changeAddress:  - address to send if there's any change
     *         password:       - to decrypt private key
     *         minConfirm:     - minimum confim blocks of UTXO to be spent
     *         maxConfirm:     - maximum confim blocks of UTXO to be spent
     *     }
     */
    constructor(input,config) {
        super(input,config);
        this.txIn  = [];
        this.txOut = [];
        this.fee   = 0.0;
        this.keyPairArray = []; // May let user passes keypair, they passed otxo already!
    }
  
    /* New implementation */
    async createCommonData(){
        logger.debug("Entering NormalTxBtcDataCreator::createCommonData");

        // build from, to and value
        let commData = {
                "from" : [],
                "to"   : this.input.to,
                "value": this.input.value
            };
  
        //let addrList = [];
        let addrMap = {};
        for (let i = 0; i < this.input.utxos.length; i++) {
            let utxo = this.input.utxos[i];
  
            // must call this in async func
            if (!addrMap.hasOwnProperty(utxo.address)) {
                // NOTICE: we don't save from in DB, so don't save it
                //commData.from.push(utxo.address);
                let kp = await btcUtil.getECPairsbyAddr(this.input.password, utxo.address);
                this.keyPairArray.push(kp);
                addrMap[utxo.address] = true;
            }
        }
  
        this.retResult.code   = true;
        this.retResult.result = commData;

        logger.debug("NormalTxBtcDataCreator::createCommonData is completed");
        return  Promise.resolve(this.retResult);
    }
  
    /**
     * Build contract data
     * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
     */
    createContractData(){
        logger.debug("Entering NormalTxBtcDataCreator::createContractData");
  
        let minConfirms = 0;
        if (this.input.hasOwnProperty('minConfirms')) {
            minConfirms = this.input.minConfirms;
        } else {
            logger.info("Minimum confirmations not specified, use default 0");
        }
  
        try {
            let i;
  
            let balance = ccUtil.getUTXOSBalance(this.input.utxos)
            if (balance <= this.input.value) {
                logger.error("UTXO balance is not enough");
                throw(new Error('utxo balance is not enough'));
            }
  
            let {inputs, change, fee} = ccUtil.btcCoinSelect(this.input.utxos, this.input.value, this.input.feeRate, minConfirms);
  
            if (!inputs) {
                logger.error("Couldn't find input for transaction");
                throw(new Error("Couldn't find input for transition"));
            }

            logger.debug("Transaction fee=%d, change=%d", fee, change);
 
            let sdkConfig = wanUtil.getConfigSetting('sdk:config', undefined); 
            let txb = new bitcoin.TransactionBuilder(sdkConfig.bitcoinNetwork);
  
            for (i = 0; i < inputs.length; i++) {
                let inItem = inputs[i]
                txb.addInput(inItem.txid, inItem.vout)
            }
  
            txb.addOutput(this.input.to, Math.round(this.input.value));
            txb.addOutput(this.input.changeAddress, Math.round(change));
  
            this.retResult.result = { "txb" : txb, 
                                      "inputs" : inputs, 
                                      "keypair" : this.keyPairArray,
                                      "fee" : fee };

            this.retResult.code   = true;
            logger.debug("Contract data create successly");
        }
        catch (error) {
            logger.error("createContractData: error: ", error);
            this.retResult.result = error;
            this.retResult.code = false;
        }
  
        logger.debug("NormalTxBtcDataCreator::createContractData is completed");
        return this.retResult;
    }
}

module.exports = NormalTxBtcDataCreator;
