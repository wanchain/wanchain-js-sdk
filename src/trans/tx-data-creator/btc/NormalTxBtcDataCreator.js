'use strict'

const bitcoin   = require('bitcoinjs-lib');
const bitcoin6 = require('btcjs-lib6')
const ecc = require('tiny-secp256k1');
bitcoin6.initEccLib(ecc);
const split = require("coinselect/split");
const utils   = require('../../../util/util');

let TxDataCreator = require('../common/TxDataCreator');
let btcUtil       =  require('../../../api/btcUtil');
let ccUtil        =  require('../../../api/ccUtil');
let hdUtil        =  require('../../../api/hdUtil');
let error         =  require('../../../api/error');

let logger = utils.getLogger('NormalTxBtcDataCreator.js');

class NormalTxBtcDataCreator extends TxDataCreator{
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
        this.txIn  = [];
        this.txOut = [];
        this.fee   = 0.0;
        this.keyPairArray = []; // May let user passes keypair, they passed otxo already!
    }
  
    /* New implementation */
    async createCommonData(){
        logger.debug("Entering NormalTxBtcDataCreator::createCommonData");

        // build from, to and value
        // from : [
        //     { "walletID" : 1,
        //       "path"     : ""
        //     }
        // ]

        let commData = {
                "from" : this.input.from,
                "to"   : this.input.to,
                "value": this.input.value
            };

        let chain = global.chainManager.getChain('BTC');

        let dec = this.config.tokenDecimals || 8;
        let value = utils.toBigNumber(this.input.value).times('1e'+dec).trunc();

        this.input.value = Number(value);
        logger.info(`Transfer amount [${this.input.value}]`);
        // 1. Get address & ecpair
        let addresses = []; 
        let addrMap = {};
        for (let i = 0; i < this.input.from.length; i++) {
            // 
            let f = this.input.from[i];
            let addr = await chain.getAddress(f.walletID, f.path);
            addresses.push(addr.address);

            let opt = utils.constructWalletOpt(f.walletID, this.input.password);

            let kp = await chain.getECPair(f.walletID, f.path, opt);
            if (!addrMap.hasOwnProperty(addr.address)) {
                this.keyPairArray.push(kp);
                addrMap[addr.address] = true;
            }
        }

        logger.info("Total get %d addresses", addresses.length);
        if (addresses.length < 1) {
            logger.error("Not found address for transfer");
            throw new error.InvalidParameter("Invalid from address");
        }

        if (this.keyPairArray.length < 1) {
            logger.error("Failed to get EC pair for from address");
            throw new error.RuntimeError("Failed to get EC pair for from address");
        }

        let minConfirms = this.input.minConfirms || 0; 
        let maxConfirms = this.input.maxConfirms || utils.getConfigSetting('sdk:config:MAX_CONFIRM_BLKS', 1000000000); 

        // 2. get UTXO
        let utxos =  await ccUtil.getBtcUtxo(minConfirms, maxConfirms, addresses);

        utxos = btcUtil.filterUTXO(utxos, this.input.value);

        let balance = await ccUtil.getUTXOSBalance(utxos);
        logger.info(`Balance ${balance}, value ${this.input.value}`);
        if (balance < this.input.value) {
            logger.error("UTXO balance is not enough, got %d, expected %d!", balance, this.input.value);
            throw new error.RuntimeError('utxo balance is not enough');
        }

        if (balance === this.input.value) {
            this.input.sendAll = true;
        }

        this.input.utxos = utxos;

        logger.info("Get UTXO done, total %d utxos", utxos.length);
  
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
  
            let inputs, change, outputs, fee;
            let coinSelectResult;
            if (!this.input.sendAll) {
                coinSelectResult = ccUtil.btcCoinSelect(this.input.utxos, this.input.value, this.input.feeRate, minConfirms);
                inputs = coinSelectResult.inputs;
                change = coinSelectResult.change;
                fee = coinSelectResult.fee;
            } else {
                let targets = [
                    {
                        address: this.input.to
                    }
                ];

                coinSelectResult = split(this.input.utxos, targets, this.input.feeRate);
                inputs = coinSelectResult.inputs;
                outputs = coinSelectResult.outputs;
                fee = coinSelectResult.fee;
            }

            if (!inputs) {
                logger.error("Couldn't find input for transaction");
                throw(new Error("Couldn't find input for transition"));
            }

            logger.info("Transaction fee=%d, change=%d", fee, change);
 
            let sdkConfig = utils.getConfigSetting('sdk:config', undefined); 
            // let txb = new bitcoin.TransactionBuilder(sdkConfig.bitcoinNetwork);
  
            // for (i = 0; i < inputs.length; i++) {
            //     let inItem = inputs[i]
            //     txb.addInput(inItem.txid, inItem.vout)
            // }

            // if (!this.input.sendAll) {
            //     txb.addOutput(this.input.to, Math.round(this.input.value));
            //     txb.addOutput(this.input.changeAddress, Math.round(change));
            // } else {
            //     outputs.forEach(output => {
            //         txb.addOutput(this.input.to, output.value);
            //         this.input.value = output.value;
            //     })
            // }
  
            // if (this.input.hasOwnProperty('op_return')) {
            //     let op_return_data = Buffer.from(this.input.op_return, "utf8");
            //     let embed = bitcoin.payments.embed({data: [op_return_data]});
            //     txb.addOutput(embed.output, 0);
            // }
            let txb = new bitcoin6.Transaction();
  
            for (i = 0; i < inputs.length; i++) {
                let inItem = inputs[i]
                txb.addInput(Buffer.from(inItem.txid, 'hex').reverse(), inItem.vout)
            }

            const toOutScript = bitcoin6.address.toOutputScript(this.input.to, sdkConfig.bitcoinNetwork)
            if (!this.input.sendAll) {
                txb.addOutput(toOutScript, Math.round(this.input.value));
                const changeOutScript = bitcoin6.address.toOutputScript(this.input.changeAddress, sdkConfig.bitcoinNetwork)
                txb.addOutput(changeOutScript, Math.round(change));
            } else {
                outputs.forEach(output => {
                    txb.addOutput(toOutScript, output.value);
                    this.input.value = output.value;
                })
            }
  
            if (this.input.hasOwnProperty('op_return')) {
                let op_return_data = Buffer.from(this.input.op_return, "utf8");
                let embed = bitcoin.payments.embed({data: [op_return_data]});
                txb.addOutput(embed.output, 0);
            }

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
