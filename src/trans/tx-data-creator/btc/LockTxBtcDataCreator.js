'use strict'

const bitcoin = require('bitcoinjs-lib');
const utils = require('../../../util/util');

let TxDataCreator = require('../common/TxDataCreator');
let btcUtil       =  require('../../../api/btcUtil');
let ccUtil        =  require('../../../api/ccUtil');
let error         =  require('../../../api/error');

let logger = utils.getLogger('LockTxBtcDataCreator.js');

class LockTxBtcDataCreator extends TxDataCreator{
    /**
     * @param: {Object} -
     *     input {
     *         from:          - array, from address to lock, [ { path: "", wallet: 1} ]
     *         value:         - amount to lock, unit btc. 
     *         feeRate:
     *         changeAddress: - address to send if there's any change
     *         smgBtcAddr:    - BTC storeman address
     *         minConfirm:    - minimum confim blocks of UTXO to be spent
     *         maxConfirm:    - maximum confim blocks of UTXO to be spent
     *         password:   - optional, provided if using rawkey/keystore wallet
     *         storeman    - WAN address of storeman group
     *         wanAddress  - 
     *             path
     *             walletID
     *         gas         -  
     *         gasPrice    -  
     *     }
     */
    constructor(input,config) {
        super(input,config);
        this.keyPairArray = [];
    }
  
    async createCommonData(){
        logger.debug("Entering LockTxBtcDataCreator::createCommonData");
  
        // Asssume failed firstly
        this.retResult.code = false;
        // 
        if (!this.input.hasOwnProperty('from')) { 
            this.retResult.result = "Input missing attribute 'from'";
            return Promise.resolve(this.retResult);
        }
        if (!Array.isArray(this.input.from) || this.input.from.length < 1) {
            this.retResult.result = "Invalid attribute 'from'";
            return Promise.resolve(this.retResult);
        }
        if (!this.input.hasOwnProperty('smgBtcAddr')) { 
            this.retResult.result = "Input missing attribute 'smgBtcAddr'";
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
        if (!this.input.hasOwnProperty('wanAddress')) { 
            this.retResult.result = "Input missing attribute 'wanAddress'";
            return Promise.resolve(this.retResult);
        }
        if (typeof this.input.wanAddress !== 'object') {
            this.retResult.result = "Invalid attribute 'wanAddress'";
            return Promise.resolve(this.retResult);
        }
        if (!this.input.wanAddress.hasOwnProperty('path')) { 
            this.retResult.result = "Input missing attribute 'wanAddress.path'";
            return Promise.resolve(this.retResult);
        }
        if (!this.input.wanAddress.hasOwnProperty('walletID')) { 
            this.retResult.result = "Input missing attribute 'wanAddress.walletID'";
            return Promise.resolve(this.retResult);
        }
        if (!this.input.hasOwnProperty('gas')) { 
            this.retResult.result = "Input missing attribute 'gas'";
            return Promise.resolve(this.retResult);
        }
        if (!this.input.hasOwnProperty('gasPrice')) { 
            this.retResult.result = "Input missing attribute 'gasPrice'";
            return Promise.resolve(this.retResult);
        }
        if (!this.input.hasOwnProperty('feeRate')) { 
            this.retResult.result = "Input missing attribute 'feeRate'";
            return Promise.resolve(this.retResult);
        }
  
        // Passed parameters OK
        let chain = global.chainManager.getChain('BTC');

        let dec = this.config.tokenDecimals || 8;
        let value = utils.toBigNumber(this.input.value).times('1e'+dec).trunc();

        this.input.value = Number(value);
        logger.info(`Lock amount [${this.input.value}]`);

        let commData = {
                "from" : "",
                "to"   : "",
                "value": this.input.value // In BTC
            };

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
            logger.error("Not found address for locking");
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

        this.input.utxos = utxos;

        logger.info("Get UTXO done, total %d utxos", utxos.length);
  
        this.retResult.code   = true;
        this.retResult.result = commData;

        logger.debug("LockTxBtcDataCreator::createCommonData completed.");
        return  Promise.resolve(this.retResult);
    }
  
    /**
     * Build contract data
     * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
     */
    createContractData(){
        logger.debug("Entering LockTxBtcDataCreator::createContractData");
  
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
 
                // pass back so that we could save it in db 
                this.input.hashX = hashX;
                this.input.x     = x;
            } else {
                hashX = this.input.hashX;
            }
 
            let sdkConfig = utils.getConfigSetting("sdk:config", undefined); 
            let senderH160Addr = bitcoin.crypto.hash160(this.keyPairArray[0].publicKey).toString('hex');
            logger.info("BTC network: ", sdkConfig.btcNetworkName);

            //let from =  btcUtil.hash160ToAddress(senderH160Addr, 'pubkeyhash', sdkConfig.btcNetworkName);
            let contract = btcUtil.hashtimelockcontract(hashX, redeemLockTimeStamp, this.input.smgBtcAddr, senderH160Addr);
  
            // Build BTC transaction
            let minConfirms = 0;
            if (this.input.hasOwnProperty('minConfirms')) {
                minConfirms = this.input.minConfirms;
            } else {
                logger.info("Minimum confirmations not specified, use default 0");
            }
  
            let {inputs, change, fee} = ccUtil.btcCoinSelect(this.input.utxos, this.input.value, this.input.feeRate, minConfirms);
  
            if (!inputs) {
                logger.error("Couldn't find input for transaction");
                throw(new Error('utxo balance is not enough'));
            }

            logger.info("Transaction fee=%d, change=%d", fee, change);
  
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
                    "keypair" : this.keyPairArray,
                    "fee" : fee,
                    "to" : contract['p2sh'],
                    "from" : this.input.from[0],
                    "hashX" : hashX,
                    "redeemLockTimeStamp" : redeemLockTimeStamp 
                };
            this.retResult.code   = true;
        } catch(error) {
            logger.error("createContractData: error: ", error);
            this.retResult.result = error;
            this.retResult.code = false;
        }
  
        return this.retResult;
    }
}

module.exports = LockTxBtcDataCreator;
