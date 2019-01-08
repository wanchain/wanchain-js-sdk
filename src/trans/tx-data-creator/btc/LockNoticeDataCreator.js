'use strict'

let TxDataCreator = require('../common/TxDataCreator');
let ccUtil        = require('../../../api/ccUtil');
const sdkConfig   = require('../../../conf/config');

// TODO: who call this function???
class LockNoticeDataCreator extends TxDataCreator{
    constructor(input,config) {
        super(input,config);
    }
    async createCommonData(){
        global.logger.debug("Entering LockNoticeDataCreator::createCommonData");

        // TODO: check storeman and to address
        let input  = this.input;
        let config = this.config;

        if (input.from === undefined || !ccUtil.isWanAddress(input.from)) {
          this.retResult.code = false;
          this.retResult.result = 'The from address entered is invalid.';
        } else if (input.storeman === undefined || !ccUtil.isWanAddress(input.storeman)) {
          this.retResult.code = false;
          this.retResult.result = 'The storeman entered is invalid.';
        } else if (input.userH160 === undefined) {
          this.retResult.code = false;
          this.retResult.result = 'The userH160 entered is invalid.';
        } else if (input.gasPrice === undefined) {
          this.retResult.code = false;
          this.retResult.result = 'The gasPrice entered is invalid.';
        } else if (input.hashX === undefined) {
          this.retResult.code = false;
          this.retResult.result = 'The hashX entered is invalid.';
        } else if (input.txHash === undefined) {
          this.retResult.code = false;
          this.retResult.result = 'The txHash entered is invalid.';
        } else if (input.lockedTimestamp === undefined) {
          this.retResult.code = false;
          this.retResult.result = 'The lockedTimestamp entered is invalid.';
        } else if (input.gas === undefined) {
          this.retResult.code = false;
          this.retResult.result = 'The gas entered is invalid.';
        } else {
            let commonData = {};
            let value = 0;
            //if (input.chainType === 'WAN') {
            //  commonData.Txtype = "0x01";

            //  let coin2WanRatio = await ccUtil.getEthC2wRatio();
            //  let txFeeRatio = input.txFeeRatio;
            //  value = ccUtil.calculateLocWanFee(input.amount, coin2WanRatio, txFeeRatio);
            //  global.logger.info("amount:coin2WanRatio:txFeeRatio:Fee", input.amount, coin2WanRatio, txFeeRatio, value);

            //} else if (input.chainType == 'ETH') {
            //  value = ccUtil.tokenToWeiHex(input.amount,this.config.tokenDecimals);
            //} else {
            //  this.retResult.code = false;
            //  this.retResult.result = "source chain is ERROR.";
            //  return this.retResult;
            //}

            commonData.Txtype = "0x01"; // WAN
            commonData.from = input.from;
            // TODO: in BTC wallet cm.config.wanchainHtlcAddr
            commonData.to   = sdkConfig.wanHtlcAddrBtc; // It's WAN HTLC SC addr
            commonData.value = 0;
            //commonData.gasPrice = ccUtil.getGWeiToWei(input.gasPrice);
            commonData.gasPrice = Number(input.gasPrice);
            commonData.gasLimit = Number(input.gas);
            commonData.gas = Number(input.gas);

            try {
                commonData.nonce = await ccUtil.getNonceByLocal(commonData.from, input.chainType);
                global.logger.info("LockNoticeDataCreator::createCommonData getNonceByLocal,%s",commonData.nonce);
                global.logger.debug("nonce:is ", commonData.nonce);

                this.retResult.result = commonData;
                this.retResult.code = true;

            } catch (error) {
                global.logger.error("error:", error);
                this.retResult.code = false;
                this.retResult.result = error;
            }
        }

        return this.retResult;
    }

    createContractData(){
      global.logger.debug("Entering LockNoticeDataCreator::createContractData");
      let input = this.input;

      try {
          let lockNoticeFunc = 'btc2wbtcLockNotice';
          if (this.config.hasOwnProperty('lockNoticeScFunc')) {
              lockNoticeFunc = this.config.lockNoticeScFunc;
          }

          let data = ccUtil.getDataByFuncInterface(
            this.config.midSCAbi,  // ABI of wan
            this.config.midSCAddr, // WAN HTLC SC addr
            lockNoticeFunc,
            input.storeman,  // WAN address of storeman group response
            input.userH160,
            input.hashX,
            input.txHash,
            input.lockedTimestamp
          );
          
          this.retResult.code = true;
          this.retResult.result = data;
      } catch (error) {
          global.logger.error("createContractData: error: ", error);
          this.retResult.result = error;
          this.retResult.code = false;
      }
      this.retResult.code      = true;
      return this.retResult;
    }
}

module.exports = LockNoticeDataCreator;
