'use strict'

const bitcoin = require('bitcoinjs-lib');
const sdkConfig  = require('../../../conf/config');

let TxDataCreator = require('../common/TxDataCreator');
let btcUtil       =  require('../../../api/btcUtil');
let ccUtil        =  require('../../../api/ccUtil');

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
    this.keyPairArray = [];
  }
  /**
   * Build common data
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  async createCommonData2(){
    global.logger.debug("Entering NormalTxBtcDataCreator::createCommonData");
    // build from, to and value
    let commData = {
            "from" : [],
            "to"   : [],
            "fee"  : 0,
            "value": this.input.value
        };

    let minConfirms = 0;
    //let maxConfirms = 100000;

    let nInputs = 0
    let availableSat = 0
    let fee = 0

    if (this.input.hasOwnProperty('minConfirms')) {
        minConfirms = this.input.minConfirms;
    } else {
        global.logger.info("Minimum confirmations not specified, use default 0");
    }

    let addrList = [];

    for (let i = 0; i < this.input.utxos.length; i++) {
        const utxo = this.input.utxos[i];
        if (utxo.confirmations >= minConfirms) {
            availableSat += Math.round(utxo.value);
            nInputs++;

            this.txIn.push(utxo);
            addrList.push(utxo.address);
            commData.from.push({"address" : utxo.address, "value" : utxo.value});

            fee = ccUtil.btcGetTxSize(nInputs, 2) * this.input.feeRate;
            if (availableSat >= this.input.value + fee) {
                break;
            }
        }
    }

    for (let i = 0; i < addrList.length; i++) {
        let kp = await btcUtil.getECPairsbyAddr(this.input.password, addrList[i]);
        this.keyPairArray.push(kp);
    }

    fee = ccUtil.btcGetTxSize(nInputs, 2) * this.input.feeRate;
    let change = availableSat - this.input.value - fee;
    global.logger.debug("Tx fee=%d, change=%d", fee, change);

    if (change < 0) {
        global.logger.error("Balance can not offord fee and target tranfer value");
        this.retResult.code   = false;
        this.retResult.result = new Error('balance can not offord fee and target tranfer value');
    } else {
        commData.fee = this.fee = fee;
        let target = {
            "address" : this.input.to,
            "value"   : this.input.value
        };
        let changeTarget = {
            "address" : this.input.changeAddress,
            "value"   : change
        };
        commData.to.push(target);
        commData.to.push(changeTarget);
            
        this.txOut.push(target);
        this.txOut.push(changeTarget);

        this.retResult.code   = true;
        this.retResult.result = commData;
    }
    return  Promise.resolve(this.retResult);
  }

  /**
   * Build contract data
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  createContractData2(){
    global.logger.debug("Entering NormalTxBtcDataCreator::createContractData");

    let txb = new bitcoin.TransactionBuilder(sdkConfig.bitcoinNetwork);

    // WARNING: must create common data before call this
    let i;
    for (i = 0; i < this.txIn.length; i++) {
        let inItem = this.txIn[i]
        txb.addInput(inItem.txid, inItem.vout)
    }

    // put out at 0 position
    for (i = 0; i < this.txOut.length; i++) {
        let outItem = this.txOut[i]
        txb.addOutput(outItem.address, Math.round(outItem.value))
    }

    this.retResult.result = { "txb": txb, "inputs" : this.txIn, "keypair" : this.keyPairArray };
    this.retResult.code   = true;
    return this.retResult;
  }

  /* New implementation */
  async createCommonData(){
    global.logger.debug("Entering NormalTxBtcDataCreator::createCommonData");
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
            commData.from.push(utxo.address);
            let kp = await btcUtil.getECPairsbyAddr(this.input.password, utxo.address);
            this.keyPairArray.push(kp);
            addrMap[utxo.address] = true;
        }
    }

    this.retResult.code   = true;
    this.retResult.result = commData;
    return  Promise.resolve(this.retResult);
  }

  /**
   * Build contract data
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  createContractData(){
    global.logger.debug("Entering NormalTxBtcDataCreator::createContractData");

    let minConfirms = 0;
    if (this.input.hasOwnProperty('minConfirms')) {
        minConfirms = this.input.minConfirms;
    } else {
        global.logger.info("Minimum confirmations not specified, use default 0");
    }

    try {
        let i;

        let balance = ccUtil.getUTXOSBalance(this.input.utxos)
        if (balance <= this.input.value) {
            throw(new Error('utxo balance is not enough'));
        }

        let {inputs, change, fee} = ccUtil.btcCoinSelect(this.input.utxos, this.input.value, this.input.feeRate, minConfirms);

        if (!inputs) {
            throw(new Error('utxo balance is not enough'));
        }

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
    }
    catch (error) {
        global.logger.error("createContractData: error: ", error);
        this.retResult.result = error;
        this.retResult.code = false;
    }

    return this.retResult;
  }
}

module.exports = NormalTxBtcDataCreator;
