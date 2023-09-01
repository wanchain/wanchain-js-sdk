'use strict'

let TxDataCreator = require('../common/TxDataCreator');
let ccUtil        = require('../../../api/ccUtil');
let utils         = require('../../../util/util');

let logger = utils.getLogger('ApproveTxEthDataCreator.js');
/**
 * @class
 * @augments  TxDataCreator
 */
class ApproveTxEthDataCreator extends TxDataCreator{
    /**
     * @constructor
     * @param {Object} input  - {@link CrossChain#input input} of final users.(gas, gasPrice, value and so on)
     * @param {Object} config - {@link CrossChain#config config} of cross chain used.
     */
    constructor(input,config) {
        super(input,config);
    }

    /**
     * {@link TxDataCreator#createCommonData}
     * @override
     * @returns {Promise<{code: boolean, result: null}>}
     */
    async createCommonData(){
        logger.debug("Entering ApproveTxEthDataCreator::createCommonData");

        this.retResult.code = true;
        let  commonData     = {};
        let addr;
        if (this.input.from && (typeof this.input.from === 'object')) {
          let chain = global.chainManager.getChain(this.input.chainType);
          addr = await chain.getAddress(this.input.from.walletID, this.input.from.path);
          utils.addBIP44Param(this.input, this.input.from.walletID, this.input.from.path);
        } else {
          addr = {
            address: this.input.from.toLowerCase()
          }
        }

        commonData.from     = ccUtil.hexAdd0x(addr.address);
        commonData.to       = this.config.srcSCAddr;

        // rewrite for FNX testnet
        if (commonData.to === '0xcbf7eab1639c175545a0d8b24ac47ea36a2720ed') {
          console.log('rewrite for FNX testnet');
          commonData.to = '0x0664b5e161a741bcdec503211beeec1e8d0edb37';
        }

        // rewrite for FNX mainnet
        if (commonData.to === '0xdab498c11f19b25611331cebffd840576d1dc86d') {
          console.log('rewrite for FNX mainnet');
          commonData.to = '0xc6f4465a6A521124c8E3096b62575C157999d361';
        }

        // rewrite for CFNX testnet
        if (commonData.to === '0xfdbc6f64407bd15f36fbedf2dfbd9d93ee61309c') {
          console.log('rewrite for CFNX testnet');
          commonData.to = '0x55bdda9679274368e529905b70bf90e48d6c9cbb';
        }
        // if(this.input.chainType === 'WAN'){
        //     commonData.to   = this.config.buddySCAddr;
        // }
        commonData.value    = 0;
        commonData.gasPrice = ccUtil.getGWeiToWei(this.input.gasPrice);
        commonData.gasLimit = Number(this.input.gasLimit);
        commonData.gas      = Number(this.input.gasLimit);
        commonData.nonce    = null; // need todo
        this.retResult.result    = commonData;
        try{
            this.retResult.code    = true;

            commonData.nonce  = await ccUtil.getNonceByLocal(commonData.from,this.input.chainType);
            logger.info("ApproveTxEthDataCreator::createCommonData getNonceByLocal,%s",commonData.nonce);

            logger.debug("nonce:is ",commonData.nonce);
            if(this.input.hasOwnProperty('x')){
              commonData.x = this.input.x;
            }else{
              commonData.x = ccUtil.generatePrivateKey();
            }
            commonData.hashX = ccUtil.getSha256HashKey(commonData.x);
            //logger.debug("x:",commonData.x);
            logger.debug("hash x:",commonData.hashX);
            logger.debug("ApproveTxEthDataCreator::CommonData");
            //logger.debug(commonData);
            logger.debug(ccUtil.hiddenProperties(commonData,['x']));
            if(this.input.chainType === 'WAN'){
              commonData.Txtype = '0x01';
            }
            if (this.input.hasOwnProperty('chainId')) {
              commonData.chainId = this.input.chainId;
            } else {
              switch(this.input.chainType){
                case 'BNB':
                {
                  commonData.chainId = (utils.isOnMainNet()) ? '0x38' : '0x61';
                }
                  break;
                case 'ETH':
                {
                  commonData.chainId = (utils.isOnMainNet()) ? '0x1' : '0x5';
                }
                  break;
                case 'WAN':
                {
                  commonData.chainId = (utils.isOnMainNet()) ? '0x378' : '0x3e7';
                }
                  break;
                default:
                {
                  logger.error("Error chainType! ", this.input.chainType);
                }
              }
            }
            this.retResult.result  = commonData;
        }catch(error){
            logger.error("error:",error);
            this.retResult.code      = false;
            this.retResult.result    = error;
        }
        return Promise.resolve(this.retResult);
    }

    /**
     * @override
     * @returns {{code: boolean, result: null}|transUtil.this.retResult|{code, result}}
     */
    createContractData(){
        logger.debug("Entering ApproveTxEthDataCreator::createContractData");
        try{
          let tokenAddr = this.config.srcSCAddr;
          let scAddr = this.config.midSCAddr;

          // rewrite for FNX testnet
          if (this.config.srcSCAddr === '0xcbf7eab1639c175545a0d8b24ac47ea36a2720ed') {
            console.log('rewrite approve for FNX testnet');
            tokenAddr = '0x0664b5e161a741bcdec503211beeec1e8d0edb37';
            scAddr = '0xcbf7eab1639c175545a0d8b24ac47ea36a2720ed';
          }

          // rewrite for FNX mainnet
          if (this.config.srcSCAddr === '0xdab498c11f19b25611331cebffd840576d1dc86d') {
            console.log('rewrite approve for FNX mainnet');
            tokenAddr = '0xc6f4465a6a521124c8e3096b62575c157999d361';
            scAddr = '0xdab498c11f19b25611331cebffd840576d1dc86d';
          }
          
          if (this.config.srcSCAddr === '0xfdbc6f64407bd15f36fbedf2dfbd9d93ee61309c') {  // rewrite for CFNX testnet
            console.log('rewrite approve for CFNX testnet');
            tokenAddr = '0x55bdda9679274368e529905b70bf90e48d6c9cbb';
            scAddr = '0xfdbc6f64407bd15f36fbedf2dfbd9d93ee61309c';
          }

          let data = ccUtil.getDataByFuncInterface(this.config.srcAbi,
            tokenAddr,
            this.config.approveScFunc,
            scAddr,
            ccUtil.tokenToWeiHex(this.input.amount,this.config.tokenDecimals));
          this.retResult.result    = data;
          this.retResult.code      = true;
        }catch(error){
            logger.error("createContractData: error: ",error);
            this.retResult.result      = error;
            this.retResult.code        = false;
        }
        return this.retResult;
    }
}

module.exports = ApproveTxEthDataCreator;
