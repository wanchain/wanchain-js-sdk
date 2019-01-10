'use strict'

const bitcoin     = require('bitcoinjs-lib');
const sdkConfig   = require('../../../conf/config');

let ccUtil        = require('../../../api/ccUtil');
let TxDataCreator = require('../common/TxDataCreator');

class LockTxWbtcDataCreator extends TxDataCreator{
      /**
       * @param: {Object} - input
       *    {
       *        from        -- wan address
       *        password    -- password of wan account
       *        amount      --  
       *        value       -- wan fee 
       *        storeman    -- wanAddress of syncStoremanGroups
       *        crossAddr   -- BTC H160 address with 0x
       *        gas         --  
       *        gasPrice    --  
       *        x           -- optional, key 
       *    }
       */
    constructor(input,config) {
        super(input,config);
    }

    async createCommonData(){
        global.logger.debug("Entering LockTxWbtcDataCreator::createCommonData");
        this.retResult.code = false;
        if (!this.input.hasOwnProperty('from')){ 
            this.retResult.result = "Input missing attribute 'from'";
        }
        else if (!this.input.hasOwnProperty('password')){ 
            this.retResult.result = "Input missing attribute 'password'";
        }
        else if (!this.input.hasOwnProperty('amount')){ 
            this.retResult.result = "Input missing attribute 'amount'";
        }
        else if (!this.input.hasOwnProperty('value')){ 
            this.retResult.result = "Input missing attribute 'value'";
        }
        else if (!this.input.hasOwnProperty('storeman')){ 
            this.retResult.result = "Input missing attribute 'storeman'";
        }
        else if (!this.input.hasOwnProperty('crossAddr')){ 
            this.retResult.result = "Input missing attribute 'crossAddr'";
        }
        else if (!this.input.hasOwnProperty('gas')){ 
            this.retResult.result = "Input missing attribute 'gas'";
        }
        else if (!this.input.hasOwnProperty('gasPrice')){ 
            this.retResult.result = "Input missing attribute 'gasPrice'";
        } else {
            let input = this.input;

            let commonData = {};
            commonData.Txtype = "0x01"; // WAN
            commonData.from   = input.from;
            // TODO: in BTC wallet cm.config.wanchainHtlcAddr
            commonData.to    = sdkConfig.wanHtlcAddrBtc; // It's WAN HTLC SC addr
            commonData.value = input.value;
            //commonData.gasPrice = ccUtil.getGWeiToWei(input.gasPrice);
            commonData.gasPrice = Number(input.gasPrice);
            commonData.gasLimit = Number(input.gas);
            commonData.gas = Number(input.gas);

            try {
                if (input.nonce) {
                    commonData.nonce = input.nonce;
                } else {
                    commonData.nonce = await ccUtil.getNonceByLocal(commonData.from, input.chainType);
                    global.logger.info("LockNoticeDataCreator::createCommonData getNonceByLocal,%s",commonData.nonce);
                    global.logger.debug("nonce:is ", commonData.nonce);
                } 

                this.retResult.result = commonData;
                this.retResult.code = true;
            } catch (error) {
                global.logger.error("error:", error);
                this.retResult.code = false;
                this.retResult.result = error;
            }

            this.retResult.code      = true;
        }
        return Promise.resolve(this.retResult);
    }

    createContractData(){
        global.logger.debug("Entering LockTxWbtcDataCreator::createContractData");
        let input = this.input;

        try {
            let key;
            if (input.x) {
                //
                key = input.x;
            } else {
                //
                key = ccUtil.generatePrivateKey();
                this.input.x = key;  // pass the key back to input, so that it can be save in db
            }

            let tripedKey = ccUtil.hexTrip0x(key);
            let hashKey = '0x' + bitcoin.crypto.sha256(Buffer.from(tripedKey, 'hex')).toString('hex');
            this.input.hashX = hashKey;

            global.logger.debug("Lock sc function:", this.config.lockScFunc);
            let data = ccUtil.getDataByFuncInterface(
              this.config.midSCAbi,  // ABI of wan
              this.config.midSCAddr, // WAN HTLC SC addr
              this.config.lockScFunc,
              hashKey,
              input.storeman, 
              input.crossAddr, 
              input.amount 
            );
            
            this.retResult.code = true;
            this.retResult.result = data;
        } catch (error) {
            global.logger.error("createContractData: error: ", error);
            this.retResult.result = error;
            this.retResult.code = false;
        }
        return this.retResult;
    }
}

module.exports = LockTxWbtcDataCreator;
