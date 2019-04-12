'use strict'
const   ccUtil          = require('../api/ccUtil');
const BigNumber         = require('bignumber.js');
const utils      = require('../util/util');
let  mrLoggerNormal;
/**
 * Used to monitor the normal transaction status.
 *
 */
const   MonitorRecordNormal   = {
  async init(config){
    this.config             = config;
    this.normalCollection   = config.normalCollection;
    this.name               = "monitorNormal";

    //mrLoggerNormal              = new Logger("Monitor",this.config.logfileNameMRN, this.config.errfileNameMRN,this.config.loglevel);
    mrLoggerNormal              = utils.getLogger("monitorNormal.js");
    //global.mrLoggerNormal       = mrLoggerNormal;
  },
  receiptFailOrNot(receipt){
    if(receipt && receipt.status !== '0x1'){
      return true;
    }
    return false;
  },
  async waitNormalConfirm(record){
    try{
      mrLoggerNormal.debug("record = %s",record);
      mrLoggerNormal.debug("Entering waitNormalConfirm, txHash = %s",record.txHash);
      let receipt = await ccUtil.waitConfirm(record.txHash, this.config.confirmBlocks, record.chainType);
      mrLoggerNormal.debug("%%%%%%%%%%%%%%%%%%%%%%%response from waitNormalConfirm%%%%%%%%%%%%%%%%%%%%%");
      mrLoggerNormal.debug("response from waitNormalConfirm, txHash = %s",record.txHash);

      mrLoggerNormal.debug(receipt);
      if(receipt && receipt.hasOwnProperty('blockNumber') && receipt.status === '0x1'){
        record.status       = 'Success';
        let blockNumber     = receipt.blockNumber;
        let chainType       = record.chainType;
        let block           = await ccUtil.getBlockByNumber(blockNumber,chainType);
        let newTime         = Number(block.timestamp); // unit s
        record.successTime  = newTime.toString();
        mrLoggerNormal.info("waitNormalConfirm update record %s, status %s :", record.txHash, record.status);
        this.updateRecord(record);
      }
      if (this.receiptFailOrNot(receipt) === true){
        record.status       = 'Fail';
        mrLoggerNormal.info("waitNormalConfirm update record %s, status %s :", record.txHash,record.status);
        this.updateRecord(record);
      }
    }catch(error){
      mrLoggerNormal.error("error waitNormalConfirm, txHash=%s",record.txHash);
      mrLoggerNormal.error(error);
    }
  },
  updateRecord(record){
    global.wanDb.updateItem(this.normalCollection,{'txHash':record.txHash},record);
  },
  async monitorTaskNormal(){
    mrLoggerNormal.debug("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    mrLoggerNormal.debug("Entering monitor task [Normal Trans.]");
    mrLoggerNormal.debug("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    let records = global.wanDb.filterNotContains(this.config.normalCollection,'status',['Success']);
    for(let i=0; i<records.length; i++){
      let record = records[i];
      await this.monitorRecord(record);
    }
  },
  async monitorRecord(record){
    //mrLoggerNormal.debug(this.name);
    switch(record.status) {
      /// approve begin
      case 'Sent':
      {
        this.waitNormalConfirm(record);
        break;
      }
      case 'Sending':
      {
        this.waitNormalConfirm(record);
        break;
      }
      /// revoke   end
      /// default  begin
      default:
        break;
    }
  },
}
exports.MonitorRecordNormal = MonitorRecordNormal;
