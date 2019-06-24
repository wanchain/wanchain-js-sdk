'use strict'

const bitcoin = require('bitcoinjs-lib');
const utils = require('../../../util/util');
const error   = require('../../../api/error');

let ccUtil        = require('../../../api/ccUtil');
let btcUtil       = require('../../../api/btcUtil');
let TxDataCreator = require('../common/TxDataCreator');

let logger = utils.getLogger('LockTxWbtcDataCreator.js');

class LockTxWbtcDataCreator extends TxDataCreator{
      /**
       * @param: {Object} - input
       *    {
       *        from        -- wan address, BIP44 path
       *            path
       *            walletID
       *        password    -- password of wan account, optional, for rawkey/keystore wallet
       *        amount      --
       *        value       -- wan fee
       *        storeman    -- wanAddress of syncStoremanGroups
       *        crossAddr   -- BTC BIP44 path, to compute H160 address prefixed with 0x!
       *            path
       *            walletID
       *        gas         --
       *        gasPrice    --
       *        x           -- optional, key
       *    }
       */
    constructor(input,config) {
        super(input,config);
    }

    async createCommonData(){
        logger.debug("Entering LockTxWbtcDataCreator::createCommonData");
        this.retResult.code = false;
        if (!this.input.hasOwnProperty('from')){
            this.retResult.result = new error.InvalidParameter("Input missing attribute 'from'");
        } else if (!this.input.from.hasOwnProperty('path') || !this.input.from.hasOwnProperty('walletID')){
            this.retResult.result = new error.InvalidParameter("Invalid 'from', missing 'path' and/or 'walletID'");
        //else if (!this.input.hasOwnProperty('password')){
        //    this.retResult.result = "Input missing attribute 'password'";
        //}
        } else if (!this.input.hasOwnProperty('amount')){
            this.retResult.result = new error.InvalidParameter("Input missing attribute 'amount'");
        } else if (!this.input.hasOwnProperty('value')){
            this.retResult.result = new error.InvalidParameter("Input missing attribute 'value'");
        } else if (!this.input.hasOwnProperty('storeman')){
            this.retResult.result = new error.InvalidParameter("Input missing attribute 'storeman'");
        } else if (!this.input.hasOwnProperty('crossAddr')){
            this.retResult.result = new error.InvalidParameter("Input missing attribute 'crossAddr'");
        } else if (!this.input.crossAddr.hasOwnProperty('path') || !this.input.crossAddr.hasOwnProperty('walletID')){
            this.retResult.result = new error.InvalidParameter("Invalid 'crossAddr', missing 'path' and/or 'walletID'");
        } else if (!this.input.hasOwnProperty('gas')){
            this.retResult.result = new error.InvalidParameter("Input missing attribute 'gas'");
        } else if (!this.input.hasOwnProperty('gasPrice')){
            this.retResult.result = new error.InvalidParameter("Input missing attribute 'gasPrice'");
        } else {
            let input = this.input;

            let sdkConfig = utils.getConfigSetting("sdk:config", undefined);
            let chain = global.chainManager.getChain('WAN');
            let addr = await chain.getAddress(input.from.walletID, input.from.path);

            // asset this.config.tokenDecimals == 8
            let dec = this.config.tokenDecimals || 8;
            let amount = utils.toBigNumber(this.input.amount).times('1e'+dec).trunc();

            input.amount = Number(amount);
            logger.info(`Lock amount [${input.amount}]`);

            if (!this.input.hasOwnProperty('BIP44Path')) {
                // TODO: to use HD sign
                this.input.BIP44Path = input.from.path;
                this.input.walletID = input.from.walletID;
            }

            let commonData = {};

            commonData.Txtype = "0x01"; // WAN
            commonData.from   = '0x' + addr.address;
            // TODO: in BTC wallet cm.config.wanchainHtlcAddr
            commonData.to    = sdkConfig.wanHtlcAddrBtc; // It's WAN HTLC SC addr
            commonData.value = input.value;
            commonData.gasPrice = ccUtil.getGWeiToWei(input.gasPrice);
            commonData.gasLimit = Number(input.gas);
            commonData.gas = Number(input.gas);

            try {
                if (input.nonce) {
                    commonData.nonce = input.nonce;
                } else {
                    commonData.nonce = await ccUtil.getNonceByLocal(commonData.from, input.chainType);
                    logger.info("LockNoticeDataCreator::createCommonData getNonceByLocal,%s",commonData.nonce);
                    logger.debug("nonce:is ", commonData.nonce);
                }

                this.retResult.result = commonData;
                this.retResult.code = true;
            } catch (error) {
                logger.error("error:", error);
                this.retResult.code = false;
                this.retResult.result = error;
            }

            this.retResult.code      = true;
        }
        logger.debug("LockTxWbtcDataCreator::createCommonData completed.");
        return Promise.resolve(this.retResult);
    }

    async createContractData(){
        logger.debug("Entering LockTxWbtcDataCreator::createContractData");
        let input = this.input;

        try {
            let key;
            if (input.x) {
                //
                key = input.x;
            } else {
                //
                logger.debug("Generating X for lock WBTC");
                key = ccUtil.generatePrivateKey().slice(2); // triped 0x prefix
                this.input.x = key;  // pass the key back to input, so that it can be save in db
            }

            let tripedKey = ccUtil.hexTrip0x(key);
            let hashKey = '0x' + bitcoin.crypto.sha256(Buffer.from(tripedKey, 'hex')).toString('hex');
            // TODO: pass x & hashX back
            this.input.hashX = hashKey;

            let chain = global.chainManager.getChain('BTC');
            let addr = await chain.getAddress(input.crossAddr.walletID, input.crossAddr.path);
            logger.info("Cross address: ", addr.address)

            let btcnetwork = utils.getConfigSetting("sdk:config:btcNetworkName", 'mainnet');
            let crossH160 = '0x'+ btcUtil.addressToHash160(addr.address, 'pubkeyhash', btcnetwork);

            this.input.h160CrossAddr = crossH160;

            logger.debug("Lock sc function:", this.config.lockScFunc);
            let data = ccUtil.getDataByFuncInterface(
              this.config.midSCAbi,  // ABI of wan
              this.config.midSCAddr, // WAN HTLC SC addr
              this.config.lockScFunc,
              hashKey,
              input.storeman,
              crossH160,
              input.amount
            );

            this.retResult.code = true;
            this.retResult.result = data;
        } catch (error) {
            logger.error("createContractData: error: ", error);
            this.retResult.result = error;
            this.retResult.code = false;
        }

        logger.debug("LockTxWbtcDataCreator::createContractData completed.");
        return this.retResult;
    }
}

module.exports = LockTxWbtcDataCreator;
