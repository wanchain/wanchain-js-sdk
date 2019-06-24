'use strict'

let TxDataCreator = require('../common/TxDataCreator');
let ccUtil        = require('../../../api/ccUtil');
let hdUtil        = require('../../../api/hdUtil');
const utils     = require('../../../util/util');

let logger = utils.getLogger('LockNoticeDataCreator.js');

// TODO: who call this function???
class LockNoticeDataCreator extends TxDataCreator{
    constructor(input,config) {
        super(input,config);
    }

    async createCommonData(){
        logger.debug("Entering LockNoticeDataCreator::createCommonData");

        // TODO: check storeman and to address
        let input  = this.input;
        let config = this.config;

        if (input.from === undefined) {
            this.retResult.code = false;
            this.retResult.result = "Input missing 'from' address.";
        } else if (input.storeman === undefined || !ccUtil.isWanAddress(input.storeman)) {
            this.retResult.code = false;
            this.retResult.result = "Input missing 'storeman'.";
        } else if (input.userH160 === undefined) {
            this.retResult.code = false;
            this.retResult.result = "Input missing 'userH160'.";
        } else if (input.gasPrice === undefined) {
            this.retResult.code = false;
            this.retResult.result = "Input missing 'gasPrice'.";
        } else if (input.hashX === undefined) {
            this.retResult.code = false;
            this.retResult.result = "Input missing 'hashX'.";
        } else if (input.txHash === undefined) {
            this.retResult.code = false;
            this.retResult.result = "Input missing 'txHash'.";
        } else if (input.lockedTimestamp === undefined) {
            this.retResult.code = false;
            this.retResult.result = "Input missing 'lockedTimestamp'.";
        } else if (input.gas === undefined) {
            this.retResult.code = false;
            this.retResult.result = "Input missing 'gas'.";
        } else {
            let commonData = {};
            let value = 0;

            let sdkConfig = utils.getConfigSetting("sdk:config", undefined);

            commonData.Txtype = "0x01"; // WAN
            let fromAddr = await hdUtil.getAddress(input.from.walletID, 'WAN', input.from.path);
            logger.info("Get address: ", JSON.stringify(fromAddr, null, 4));

            input.fromAddr = fromAddr.address;

            commonData.from = ccUtil.hexAdd0x(fromAddr.address);
            // TODO: in BTC wallet cm.config.wanchainHtlcAddr
            commonData.to   = sdkConfig.wanHtlcAddrBtc; // It's WAN HTLC SC addr
            commonData.value = 0;
            commonData.gasPrice = ccUtil.getGWeiToWei(input.gasPrice);
            commonData.gasLimit = Number(input.gas);
            commonData.gas = Number(input.gas);

            try {
                commonData.nonce = await ccUtil.getNonceByLocal(commonData.from, input.chainType);
                logger.info("LockNoticeDataCreator::createCommonData getNonceByLocal,%s",commonData.nonce);
                logger.debug("nonce:is ", commonData.nonce);

                this.retResult.result = commonData;
                this.retResult.code = true;

            } catch (error) {
                logger.error("error:", error);
                this.retResult.code = false;
                this.retResult.result = error;
            }
        }
        logger.debug("LockNoticeDataCreator::createCommonData is completed.");

        return this.retResult;
    }

    createContractData(){
      logger.debug("Entering LockNoticeDataCreator::createContractData");
      let input = this.input;

      try {
          let lockNoticeFunc = 'btc2wbtcLockNotice';
          if (this.config.hasOwnProperty('lockNoticeScFunc')) {
              lockNoticeFunc = this.config.lockNoticeScFunc;
          }

          logger.debug("createContractData sc function: ", lockNoticeFunc);
          logger.debug("createContractData lockedTimestamp=", input.lockedTimestamp);

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
          logger.error("createContractData: error: ", error);
          this.retResult.result = error;
          this.retResult.code = false;
      }
      this.retResult.code      = true;

      logger.debug("LockNoticeDataCreator::createContractData is completed.");
      return this.retResult;
    }
}

module.exports = LockNoticeDataCreator;
