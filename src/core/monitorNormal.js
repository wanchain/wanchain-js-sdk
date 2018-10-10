'use strict'
const   pu              = require('promisefy-util');
const   ccUtil          = require('../api/ccUtil');
let  Logger             = require('../logger/logger');
const BigNumber         = require('bignumber.js');
let  mrLoggerNormal;
const   MonitorRecordNormal   = {
  async init(config){
    this.config             = config;
    this.normalCollection   = config.normalCollection;
    this.name               = "monitorNormal";

    mrLoggerNormal              = new Logger("Monitor",this.config.logfileNameMRN, this.config.errfileNameMRN,this.config.loglevel);
    global.mrLoggerNormal       = mrLoggerNormal;
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
      let receipt = await ccUtil.waitConfirm(record.txHash,this.config.confirmBlocks,record.chainType);
      mrLoggerNormal.debug("%%%%%%%%%%%%%%%%%%%%%%%response from waitNormalConfirm%%%%%%%%%%%%%%%%%%%%%");
      mrLoggerNormal.debug("response from waitNormalConfirm, txHash = %s",record.txHash);

      mrLoggerNormal.debug(receipt);
      if(receipt && receipt.hasOwnProperty('blockNumber') && receipt.status === '0x1'){
        record.status       = 'Success';
        this.updateRecord(record);
      }
      if (this.receiptFailOrNot(receipt) === true){
        record.status       = 'Fail';
        this.updateRecord(record);
      }
    }catch(error){
      mrLoggerNormal.debug("error waitNormalConfirm");
      mrLoggerNormal.debug(error);
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
