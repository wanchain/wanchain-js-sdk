"use strict";

const MessageTemplate = require('./MessageTemplate');
let chainType='';         // some message does not include chainType
module.exports = {
  syncStoremanGroups(chainType,callback) {
    return new MessageTemplate('syncStoremanGroups',{crossChain:chainType},'storemanGroup',chainType,callback);
  },
  getBalance(address,chainType,callback){
    return new MessageTemplate('getBalance',{address:address},'balance',chainType,callback);
  },
  getMultiBalances(address,chainType,callback){
    return new MessageTemplate('getMultiBalances',{address:address},'balance',chainType,callback);
  },
  getMultiTokenBalance(address,chainType,callback){
    return new MessageTemplate('getMultiTokenBalance',{address:address, tokenType:"WETH"},'tokenBalance',chainType,callback);
  },
  getMultiTokenBalanceByTokenScAddr(address,tokenScAddr,chainType,callback){
    return new MessageTemplate('getMultiTokenBalance',{address:address, tokenScAddr:tokenScAddr},'tokenBalance',chainType,callback);
  },
  getGasPrice(chainType, callback){
    return new MessageTemplate('getGasPrice',{}, "gasPrice", chainType, callback);
  },
  getBlockByNumber(blockNumber, chainType, callback){
    return new MessageTemplate('getBlockByNumber',{blockNumber:blockNumber}, "block", chainType, callback);
  },
  getTransactionReceipt(txHash,chainType,callback){
    return new MessageTemplate('getTransactionReceipt',{txHash:txHash},'receipt',chainType,callback);
  },
  getTxInfo(txHash,chainType,callback){
    return new MessageTemplate('getTxInfo',{txHash:txHash},'txInfo',chainType,callback);
  },
  getBtcTransaction(txHash, chainType, callBack){
    return new MessageTemplate('getBtcTransaction',{txHash:txHash},'txInfo',chainType,callBack);
  },
  // getNonce(address,chainType,callback){
  //   // global.logger.debug("Entering getNonce..");
  //   // global.logger.debug(address,chainType,callback);
  //   return new MessageTemplate('getNonceIncludePending',{address:address},'nonce',chainType,callback);
  // },
  getNonce(address,chainType,includePendingOrNot,callback){
    // global.logger.debug("Entering getNonce..");
    // global.logger.debug(address,chainType,callback);
    if(includePendingOrNot === true){
      return new MessageTemplate('getNonceIncludePending',{address:address},'nonce',chainType,callback);
    }else{
      return new MessageTemplate('getNonce',{address:address},'nonce',chainType,callback);
    }
  },
  getBlockNumber(chainType,callback){
    return new MessageTemplate('getBlockNumber',{},'blockNumber',chainType,callback);
  },
  getCrossEthScAddress(chainType,callback){
    return new MessageTemplate('getCrossEthScAddress',{},'groupAddr',chainType,callback);
  },
  sendRawTransaction(signedTx,chainType,callback){
    return new MessageTemplate('sendRawTransaction',{signedTx:signedTx},'txHash',chainType,callback);
  },
  getScEvent(address,topics,chainType,callback){
    return new MessageTemplate('getScEvent',{address:address,topics:topics},'logs',chainType,callback);
  },
  callScFunc(scAddr, name,args,abi,chainType,callback){
    return new MessageTemplate('callScFunc',{scAddr:scAddr,name:name,args:args,abi:abi},'value',chainType,callback);
  },
  getScVar( scAddr, name,abi,chainType,callback){
    return new MessageTemplate('getScVar',{scAddr:scAddr, name:name,abi:abi},'value',chainType,callback);
  },
  getCoin2WanRatio(crossChain, chainType, callback){
    return new MessageTemplate('getCoin2WanRatio',{crossChain:crossChain},'c2wRatio',chainType,callback);
  },
  monitorLog(address,topics,chainType,callback){
    return new MessageTemplate('monitorLog',{address:address,topics:topics},'logs',chainType,callback);
  },
  getTransactionConfirm(txHash,waitBlocks, chainType,callback){
    return new MessageTemplate('getTransactionConfirm',{txHash:txHash, waitBlocks:waitBlocks},'receipt',chainType,callback);
  },
  getRegErc20Tokens(callback){
    return new MessageTemplate('getRegErc20Tokens',{crossChain:'ETH'},'tokens',chainType,callback);
  },
  syncErc20StoremanGroups(tokenScAddr,callback){
    return new MessageTemplate('syncErc20StoremanGroups',{crossChain:'ETH',tokenScAddr:tokenScAddr},'storemanGroup',chainType,callback);
  },
  getErc20Info(tokenScAddr,chainType,callback){
    return new MessageTemplate('getErc20Info',{tokenScAddr:tokenScAddr},['symbol', 'decimals'],chainType,callback);
  },
  getErc20SymbolInfo(tokenScAddr,chainType,callback){
    return new MessageTemplate('getErc20Info',{tokenScAddr:tokenScAddr},'symbol',chainType,callback);
  },
  getToken2WanRatio(tokenOrigAddr,crossChain,callback){
    return new MessageTemplate('getToken2WanRatio',{crossChain:'ETH',tokenOrigAddr:tokenOrigAddr},'ratio',chainType,callback);
  },
  getErc20DecimalsInfo(tokenScAddr,chainType,callback){
    return new MessageTemplate('getErc20Info',{tokenScAddr:tokenScAddr},'decimals',chainType,callback);
  },
  getErc20Allowance(tokenScAddr,ownerAddr,spenderAddr,chainType,callback){
    return new MessageTemplate('getErc20Allowance',{tokenScAddr:tokenScAddr,ownerAddr:ownerAddr,spenderAddr:spenderAddr},'value',chainType,callback);
  },
  btcImportAddress( address, chainType, callBack){
     return new MessageTemplate('btcImportAddress',{address:address},'',chainType,callBack);
  },
  getUTXO(minconf, maxconf, addresses, callBack){
     return new MessageTemplate('getUTXO',{minconf:minconf, maxconf:maxconf, addresses:addresses},'UTXOs',chainType,callBack);
  },
}
