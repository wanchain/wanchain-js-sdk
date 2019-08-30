'use strict'

let TxDataCreator = require('../common/TxDataCreator');
let ccUtil = require('../../../api/ccUtil');
let utils  = require('../../../util/util');
let wanUtil= require('wanchain-util');

const secp256k1 = require('secp256k1');

let logger = utils.getLogger('PrivateRefundTxWanDataCreator.js');

/**
 * @class
 * @augments TxDataCreator
 */
class PrivateRefundTxWanDataCreator extends TxDataCreator {
    /**
     * @constructor
     * @param {Object} input  - {@link CrossChain#input input} of final users.(gas, gasPrice, value and so on)
     * @param {Object} config - {@link CrossChain#config config} of cross chain used.
     */
    constructor(input, config) {
        super(input, config);
    }

    /**
     * @override
     * @returns {Promise<{code: boolean, result: null}>}
     */
    async createCommonData(){
        logger.debug("Entering PrivateRefundTxWanDataCreator::createCommonData");

        this.retResult.code= true;
        let commonData     = {};

        commonData.Txtype = '0x01';

        // input.chainType must be WAN
        // let chain = global.chainManager.getChain(input.chainType);
        // let addr = await chain.getAddress(input.from.walletID, input.from.path);

        // TODO: use BIP44Path??
        commonData.from = this.input.from;

        commonData.to = wanUtil.contractCoinAddress;
        commonData.value = 0;

        commonData.gasPrice = ccUtil.getGWeiToWei(this.input.gasPrice);
        commonData.gasLimit = Number(this.input.gasLimit);
        commonData.gas      = Number(this.input.gasLimit);
        commonData.nonce    = null; // need todo
        this.retResult.result = commonData;
        try{
            this.retResult.code = true;

            if(this.config.useLocalNode === true){
                commonData.nonce = this.input.nonce || await ccUtil.getNonceByWeb3(commonData.from);
                logger.info("PrivateRefundTxWanDataCreator::createCommonData getNonceByWeb3,%s",commonData.nonce);
            }else{
                commonData.nonce = this.input.nonce || await ccUtil.getNonceByLocal(commonData.from,this.input.chainType);
                logger.info("PrivateRefundTxWanDataCreator::createCommonData getNonceByLocal,%s",commonData.nonce);
            }
            logger.debug("nonce:is ",commonData.nonce);

            if (this.input.hasOwnProperty('chainId')) {
                commonData.chainId = this.input.chainId;
            } else {
                if (utils.isOnMainNet()) {
                    commonData.chainId = '0x01';
                } else {
                    commonData.chainId = '0x03';
                }
            }
            this.retResult.result  = commonData;
        }catch(error){
            logger.error("error:",error);
            this.retResult.code   = false;
            this.retResult.result = error;
        }
        return Promise.resolve(this.retResult);
    }

    /**
     * @override
     * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
     */
    async createContractData(){
      try{
          logger.debug("Entering PrivateRefundTxWanDataCreator::createContractData");
          // 1. get OTA mix set
          let otaSet = await ccUtil.getOTAMixSet(this.input.OTA, utils.getConfigSetting('privateTx:ringSize', 8));

          let otaSetBuf = [];
          for(let i=0; i<otaSet.length; i++){
              let rpkc = new Buffer(otaSet[i].slice(2,68),'hex');
              let rpcu = secp256k1.publicKeyConvert(rpkc, false);
              otaSetBuf.push(rpcu);
          }

          let chain = global.chainManager.getChain(this.input.chainType); // WAN
          let opt = utils.constructWalletOpt(this.input.walletID, this.input.password);
          let selfkey = await chain.getPrivateKey(this.input.walletID, this.input.BIP44Path, opt)

          let otaSk = wanUtil.computeWaddrPrivateKey(this.input.OTA, selfkey[0], selfkey[1]);
          let otaPub = wanUtil.recoverPubkeyFromWaddress(this.input.OTA);
          let otaPubK = otaPub.A;

          let M = new Buffer(ccUtil.hexTrip0x(this.input.from), 'hex');
          let ringArgs = wanUtil.getRingSign(M, otaSk,otaPubK,otaSetBuf);
          let KIWQ = ccUtil.generatePubkeyIWQforRing(ringArgs.PubKeys, ringArgs.I, ringArgs.w, ringArgs.q);

          let data = ccUtil.getDataByFuncInterface(wanUtil.coinSCAbi,
              wanUtil.contractCoinAddress,
              'refundCoin',
              KIWQ,
              ccUtil.tokenToWeiHex(this.input.amount, this.config.tokenDecimals));

          this.retResult.result = data;
          this.retResult.code   = true;
      } catch(error) {
          logger.error("PrivateRefundTxWanDataCreator::createContractData: error: ",error);
          this.retResult.result = error;
          this.retResult.code   = false;
      }
      logger.debug("PrivateRefundTxWanDataCreator::createContractData is completed, result=", this.retResult.code);
      return this.retResult;
    }
}
module.exports = PrivateRefundTxWanDataCreator;
