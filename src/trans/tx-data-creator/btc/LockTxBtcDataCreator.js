'use strict'

const bitcoin = require('bitcoinjs-lib');
const sdkConfig  = require('../../../conf/config');

let TxDataCreator = require('../common/TxDataCreator');
let btcUtil       =  require('../../../api/btcUtil');
let ccUtil        =  require('../../../api/ccUtil');

class LockTxBtcDataCreator extends TxDataCreator{
  /**
   * @param: {Object} -
   *     input {
   *         utxos:
   *         value:
   *         feeRate:
   *         changeAddress:
   *         smgBtcAddr:    
   *         keypair:
   *         minConfirm:
   *         maxConfirm:
   *         password:
   *     }
   */
  constructor(input,config) {
    super(input,config);
    this.keyPairArray = [];
  }

  async createCommonData(){
    global.logger.debug("Entering LockTxBtcDataCreator::createCommonData");
    //let minConfirms = 0;

    let commData = {
            "from" : "",
            "to"   : "",
            "value": this.input.value
        };

    //commData.from = bitcoin.crypto.hash160(this.input.keypair[0].publicKey).toString('hex');
    //for (let i = 0; i < this.input.utxos.length; i++) {
    //    const utxo = this.input.utxos[i];
    //    commData.from.push(utxo.address);

    //    //let kp = await btcUtil.getECPairsbyAddr(this.input.password, utxo.address);
    //    //this.keyPairArray.push(kp);
    //}

    this.retResult.code   = true;
    this.retResult.result = commData;
    return  Promise.resolve(this.retResult);
  }

  /**
   * Build contract data
   * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
   */
  createContractData(){
    global.logger.debug("Entering LockTxBtcDataCreator::createContractData");

    try {
        // HTLC contract
        let cur = Math.floor(Date.now() / 1000);
        let redeemLockTimeStamp = cur + Number(global.lockedTimeBTC);
        let x;
        let hashX;
        if (!this.input.hasOwnProperty('hashX')) {
            x = ccUtil.generatePrivateKey().slice(2); // hex string without 0x
            hashX = bitcoin.crypto.sha256(Buffer.from(x, 'hex')).toString('hex');
            redeemLockTimeStamp = cur + 2 * Number(global.lockedTimeBTC);

            this.input.hashX = hashX;
            this.input.x     = x;
        } else {
            hashX = this.input.hashX;
        }

        let senderH160Addr = bitcoin.crypto.hash160(this.input.keypair[0].publicKey).toString('hex');
        let from =  btcUtil.hash160ToAddress(senderH160Addr, 'pubkeyhash', sdkConfig.btcNetwork);
        // TODO: does it need await???
        let contract = btcUtil.hashtimelockcontract(hashX, redeemLockTimeStamp, this.input.smgBtcAddr, senderH160Addr);

        // Build BTC transaction
        let balance = ccUtil.getUTXOSBalance(this.input.utxos)
        if (balance <= this.input.value) {
            throw(new Error('utxo balance is not enough'));
        }

        let minConfirms = 0;
        if (this.input.hasOwnProperty('minConfirms')) {
            minConfirms = this.input.minConfirms;
        } else {
            global.logger.info("Minimum confirmations not specified, use default 0");
        }

        let {inputs, change, fee} = ccUtil.btcCoinSelect(this.input.utxos, this.input.value, this.input.feeRate, minConfirms);

        if (!inputs) {
            throw(new Error('utxo balance is not enough'));
        }

        let txb = new bitcoin.TransactionBuilder(sdkConfig.bitcoinNetwork);

        let i;
        for (i = 0; i < inputs.length; i++) {
            let inItem = inputs[i]
            txb.addInput(inItem.txid, inItem.vout)
        }

        txb.addOutput(contract['p2sh'], Math.round(this.input.value));
        txb.addOutput(this.input.changeAddress, Math.round(change));

        this.retResult.result = { 
                "txb": txb, 
		        "inputs" : inputs, 
				"keypair" : this.input.keypair, 
				"fee" : fee,
				"to" : contract['p2sh'],
				"from" : from,
                "redeemLockTimeStamp" : redeemLockTimeStamp 
        };
        this.retResult.code   = true;
    } catch(error) {
        global.logger.error("createContractData: error: ", error);
        this.retResult.result = error;
        this.retResult.code = false;
    }

    return this.retResult;
  }
}

module.exports = LockTxBtcDataCreator;
