'use strict'

const bitcoin = require('bitcoinjs-lib');

let TxDataCreator = require('../common/TxDataCreator');
let btcUtil       =  require('../../../api/btcUtil');
let ccUtil        =  require('../../../api/ccUtil');
let error         =  require('../../../api/error');
let utils         =  require('../../../util/util');

let logger = utils.getLogger('RevokeTxWbtcDataCreator.js');

class RevokeTxWbtcDataCreator extends TxDataCreator{
    /**
     * @param: {Object} -
     *     input {
     *         hashX:    -- Do NOT start with '0x'
     *         gas:
     *         gasPrice:
     *         nonce:    -- optional
     *     }
     */
    constructor(input,config) {
        super(input,config);
        this.record = null;
    }

    async createCommonData(){
      logger.debug("Entering RevokeTxWbtcDataCreator::createCommonData");

      let input  = this.input;
      let config = this.config;

      if (input.hashX === undefined) {
          this.retResult.code = false;
          this.retResult.result = new error.InvalidParameter("Input missing 'hashX'.");
      } else if (input.gas === undefined) {
          this.retResult.code = false;
          this.retResult.result = new error.InvalidParameter("Input missing 'gas'.");
      } else if (input.gasPrice === undefined) {
          this.retResult.code = false;
          this.retResult.result = new error.InvalidParameter("Input missing 'gasPrice'.");
      } else {
          let commData = {};
          // Notice: hashX should NOT prefix with '0x' !!!
          let record = global.wanDb.getItem(this.config.crossCollection, {hashX:input.hashX});
          if (record) {
              this.record = record;

              let chain = global.chainManager.getChain('WAN');
              let addr = await chain.getAddress(record.from.walletID, record.from.path);

              utils.addBIP44Param(input, record.from.walletID, record.from.path);

              commData.Txtype = "0x01"; // WAN
              commData.from  = ccUtil.hexAdd0x(addr.address);
              //commData.to    = config.dstSCAddr;   // wanHtlcAddrBtc
              commData.to    = config.midSCAddr;   // wanHtlcAddrBtc
              commData.value = 0;
              commData.gasPrice = ccUtil.getGWeiToWei(input.gasPrice);
              commData.gasLimit = Number(input.gas);
              commData.gas = Number(input.gas);

              try {
                  commData.nonce = await ccUtil.getNonceByLocal(commData.from, 'WAN'); // TODO:
                  logger.info("RevokeTxWbtcDataCreator::createCommonData getNonceByLocal,%s",commData.nonce);
                  logger.debug("nonce is ", commData.nonce);

                  this.retResult.result = commData;
                  this.retResult.code   = true;
              } catch (error) {
                  logger.error("error:", error);
                  this.retResult.code = false;
                  this.retResult.result = error;
              }
          } else {
              this.retResult.code   = false;
              this.retResult.result = "Record not found";
          }
      }
      logger.debug("RevokeTxWbtcDataCreator::createCommonData is completed.");
      return this.retResult;
    }

    createContractData(){
      logger.debug("Entering RevokeTxWbtcDataCreator::createContractData");

      let input  = this.input;
      let config = this.config;
      let hashX = ccUtil.hexAdd0x(input.hashX);
      try {
          logger.debug("Revoke WBTC contract function:", config.revokeScFunc);
          let data = ccUtil.getDataByFuncInterface(
                  config.midSCAbi,     // ABI of wan
                  config.midSCAddr,    // WAN HTLC SC addr
                  config.revokeScFunc, // wbtc2btcRevoke
                  hashX
              );
          this.retResult.code   = true;
          this.retResult.result = data;
      } catch (error) {
          logger.error("Caught error when building contract data", error);
          this.retResult.code   = false;
          this.retResult.result = error
      }
      logger.debug("RevokeTxWbtcDataCreator::createContractData is completed.");
      return this.retResult;
    }
}

module.exports = RevokeTxWbtcDataCreator;
