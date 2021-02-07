'use strict'

const bitcoin   = require('bitcoinjs-lib');
const utils   = require('../../../util/util');

let TxDataCreator = require('../common/TxDataCreator');
let btcUtil       =  require('../../../api/btcUtil');
let ccUtil        =  require('../../../api/ccUtil');
let error         =  require('../../../api/error');

let logger = utils.getLogger('BridgeTxBtcDataCreator.js');

class BridgeTxBtcDataCreator extends TxDataCreator{
    /**
     * @param: {Object} -
     *     input {
     *         from:           - array, the from addresses
     *         tokenPairID:    - tokenPairID
     *         value:          - amount to lock, unit btc.
     *         feeRate:        -
     *         changeAddress:  - address to send if there's any change
     *         storeman:       - BTC storeman address
     *         minConfirm:     - minimum confim blocks of UTXO to be spent
     *         maxConfirm:     - maximum confim blocks of UTXO to be spent
     *         to  -  
     *             path
     *             walletID
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
        logger.debug("Entering BridgeTxBtcDataCreator::createCommonData");

        // build from, to and value
        // from : [
        //     { "walletID" : 1,
        //       "path"     : ""
        //     }
        // ]

        // Asssume failed firstly
        this.retResult.code = false;

        if (!this.input.hasOwnProperty('from')) { 
            this.retResult.result = "Input missing attribute 'from'";
            return Promise.resolve(this.retResult);
        }
        if (!Array.isArray(this.input.from) || this.input.from.length < 1) {
            this.retResult.result = "Invalid attribute 'from'";
            return Promise.resolve(this.retResult);
        }
        if (!this.input.hasOwnProperty('storeman')) { 
            this.retResult.result = "Input missing attribute 'storeman'";
            return Promise.resolve(this.retResult);
        }
        if (!this.input.hasOwnProperty('tokenPairID')) { 
            this.retResult.result = "Input missing attribute 'tokenPairID'";
            return Promise.resolve(this.retResult);
        }
        if (!this.input.hasOwnProperty('value')) { 
            this.retResult.result = "Input missing attribute 'value'";
            return Promise.resolve(this.retResult);
        }
        if (!this.input.hasOwnProperty('changeAddress')) { 
            this.retResult.result = "Input missing attribute 'changeAddress'";
            return Promise.resolve(this.retResult);
        }
        // Storeman for WAN
        if (!this.input.hasOwnProperty('storeman')) { 
            this.retResult.result = "Input missing attribute 'storeman'";
            return Promise.resolve(this.retResult);
        }
        if (!this.input.hasOwnProperty('to')) { 
            this.retResult.result = "Input missing attribute 'to'";
            return Promise.resolve(this.retResult);
        }
        // if (typeof this.input.wanAddress !== 'object' || !this.input.to.hasOwnProperty('walletID') || !this.input.to.hasOwnProperty('path')) {
        //     this.retResult.result = "Invalid attribute 'wanAddress'";
        //     return Promise.resolve(this.retResult);
        // }
        if (!this.input.hasOwnProperty('feeRate')) { 
            this.retResult.result = "Input missing attribute 'feeRate'";
            return Promise.resolve(this.retResult);
        }

        let commData = {
                "from" : this.input.from,
                "to"   : this.input.to,
                "value": this.input.value
            };

        let chain = global.chainManager.getChain('BTC');

        let dec = this.config.tokenDecimals || 8;
        let value = utils.toBigNumber(this.input.value).times('1e'+dec).trunc();

        this.input.value = Number(value);
        logger.info(`Lock amount [${this.input.value}]`);
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

        this.input.fromAddr = addresses[0];
        logger.info("Total get %d addresses", addresses.length);
        if (addresses.length < 1) {
            logger.error("Not found address for lock");
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

        let feeRate = (this.input.feeRate) ? this.input.feeRate : 0;
        this.input.feeRate = feeRate;
        let networkFee = 0;
        networkFee = await ccUtil.estimateNetworkFee('BTC', this.config.crossMode, {'feeRate': this.input.feeRate});
        if (networkFee > this.input.value) {
            logger.error("user cross balance is not enough for networkFee, got %d, expected %d!", this.input.value, networkFee);
            throw new error.RuntimeError('user cross balance is not enough for networkFee');
        }

        commData.networkFee = networkFee;
        this.input.networkFee = networkFee;

        let crossValue;
        crossValue = this.input.value - networkFee;
        commData.crossValue = crossValue;
        this.input.crossValue = crossValue;

        this.input.utxos = utxos;

        logger.info("Get UTXO done, total %d utxos", utxos.length);
  
        this.retResult.code   = true;
        this.retResult.result = commData;

        logger.debug("BridgeTxBtcDataCreator::createCommonData is completed");

        return  Promise.resolve(this.retResult);
    }
  
    /**
     * Build contract data
     * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
     */
    async createContractData(){
        logger.debug("Entering BridgeTxBtcDataCreator::createContractData");
  
        let minConfirms = 0;
        if (this.input.hasOwnProperty('minConfirms')) {
            minConfirms = this.input.minConfirms;
        } else {
            logger.info("Minimum confirmations not specified, use default 0");
        }
  
        try {
            let x = ccUtil.generatePrivateKey();
            let hashX = ccUtil.getSha256HashKey(x);

            this.input.x = x;
            this.input.hashX = hashX;

            logger.debug("Key:", x);
            logger.debug("hashKey:", hashX);

            let chain = global.chainManager.getChain(this.config.dstChainType);
            let addr;
            if (this.input.to && (typeof this.input.to === 'object')) {
                addr = await chain.getAddress(this.input.to.walletID, this.input.to.path);
            } else {
                addr = {
                    address: this.input.to.toLowerCase()
                }
            }
            this.input.toAddr = ccUtil.hexAdd0x(addr.address);
            let i;
  
            let {inputs, change, fee} = ccUtil.btcCoinSelect(this.input.utxos, this.input.value, this.input.feeRate, minConfirms);
  
            if (!inputs) {
                logger.error("Couldn't find input for transaction");
                throw(new Error("Couldn't find input for transition"));
            }

            logger.info("Transaction fee=%d, change=%d", fee, change);
 
            let sdkConfig = utils.getConfigSetting('sdk:config', undefined); 
            let txb = new bitcoin.TransactionBuilder(sdkConfig.bitcoinNetwork);
  
            for (i = 0; i < inputs.length; i++) {
                let inItem = inputs[i]
                txb.addInput(inItem.txid, inItem.vout)
            }
  
            this.input.smgBtcAddr = await ccUtil.getBtcLockAccount(this.input.storeman);
            txb.addOutput(this.input.smgBtcAddr, Math.round(this.input.value));
            txb.addOutput(this.input.changeAddress, Math.round(change));

            let networkFee = (this.input.networkFee) ? this.input.networkFee : 0;
            if (!this.input.hasOwnProperty('op_return')) {
                let op_return_cross_type = '01';
                let hex_tokenPairID = parseInt(this.input.tokenPairID).toString(16);
                hex_tokenPairID = ('000' + hex_tokenPairID).slice(-4);
 
                let hex_networkFee = parseInt(networkFee).toString(16);
                hex_networkFee = ('0000000' + hex_networkFee).slice(-8);
                this.input.op_return = op_return_cross_type + hex_tokenPairID + ccUtil.hexTrip0x(addr.address) + hex_networkFee;
            }

            let op_return_data = Buffer.from(this.input.op_return, "hex");
            let embed = bitcoin.payments.embed({data: [op_return_data]});
            txb.addOutput(embed.output, 0);

            this.retResult.result = { "txb" : txb, 
                                      "inputs" : inputs, 
                                      "keypair" : this.keyPairArray,
                                      "fee" : fee,
                                      "networkFee": networkFee,
                                      "from" : this.input.from[0],
                                      "to" : this.input.smgBtcAddr,
                                      "hashX" : hashX};

            this.retResult.code   = true;
            logger.debug("Contract data create successly");
        }
        catch (error) {
            logger.error("createContractData: error: ", error);
            this.retResult.result = error;
            this.retResult.code = false;
        }
  
        logger.debug("BridgeTxBtcDataCreator::createContractData is completed");
        return this.retResult;
    }
}

module.exports = BridgeTxBtcDataCreator;
