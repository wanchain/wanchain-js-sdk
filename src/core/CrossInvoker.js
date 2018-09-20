'use strict'
let ccUtil = require('../api/ccUtil');

let {
  CrossChainBtcLock,
  CrossChainBtcRefund,
  CrossChainBtcRevoke,
  CrossChainEthLock,
  CrossChainEthRefund,
  CrossChainEthRevoke,
  CrossChainE20Approve,
  CrossChainE20Lock,
  CrossChainE20Revoke,
  CrossChainE20Refund
} = require('../trans/CrossChain');

let {
  NormalChainBtc,
  NormalChainE20,
  NormalChainEth
} = require('../trans/NormalChain');


class CrossInvoker {
  constructor(config){
    this.config                 = config;
    this.tokensE20              = [];
    this.chainsNameMap          = new Map();
    this.srcChainsMap           = new Map();
    this.dstChainsMap           = new Map();
  };
  async  init() {
    global.logger.debug("CrossInvoker init");
    try{
      this.tokensE20              = await this.getTokensE20();
      this.chainsNameMap          = this.initChainsNameMap();

      await this.initChainsSymbol();
      await this.initChainsRatio();
      await this.initChainsStoremenGroup();
      global.logger.debug("this.chainsNameMap");
      global.logger.debug(this.chainsNameMap);

      this.srcChainsMap           = this.initSrcChainsMap();
      global.logger.debug("this.srcChainsMap");
      global.logger.debug(this.srcChainsMap);

      this.dstChainsMap           = this.initDstChainsMap();
      global.logger.debug("this.dstChainsMap");
      global.logger.debug(this.dstChainsMap);


    }catch(error){
      global.logger.debug("CrossInvoker init error: ",error);
      process.exit();
    }
  };

  async getTokensE20(){
    let tokensE20 = await ccUtil.getRegErc20Tokens();
    return tokensE20;
  };

  initChainsNameMap(){
    let chainsNameMap     = new Map();
    let chainsNameMapEth  = new Map();
    let chainsNameMapBtc  = new Map();
    let chainsNameMapWan  = new Map();
    // init ETH
    let keyTemp;
    keyTemp               = this.config.ethTokenAddress;
    let valueTemp         = {};
    valueTemp.tokenSymbol = 'ETH';
    valueTemp.tokenStand  = 'ETH';
    valueTemp.tokenType   = 'ETH';
    valueTemp.buddy       = this.config.ethTokenAddressOnWan;
    valueTemp.storemenGroup = [];
    valueTemp.token2WanRatio = 0;
    chainsNameMapEth.set(keyTemp,valueTemp);

    // init E20
    for(let token of this.tokensE20){
      let keyTemp;
      let valueTemp           = {};

      keyTemp                 = token.tokenOrigAddr;
      valueTemp.tokenSymbol   = '';
      valueTemp.tokenStand    = 'E20';
      valueTemp.tokenType     = 'ETH';
      valueTemp.buddy         = token.tokenWanAddr;
      valueTemp.token2WanRatio = 0;
      chainsNameMapEth.set(keyTemp, valueTemp);
    }
    chainsNameMap.set('ETH',chainsNameMapEth);

    // init BTC
    keyTemp                 = this.config.ethHtlcAddrBtc;
    valueTemp               = {};
    valueTemp.tokenSymbol   = 'BTC';
    valueTemp.tokenStand    = 'BTC';
    valueTemp.tokenType     = 'BTC';
    valueTemp.buddy         = this.config.ethHtlcAddrBtc;
    valueTemp.storemenGroup = [];
    valueTemp.token2WanRatio = 0;
    chainsNameMapBtc.set(keyTemp,valueTemp);

    chainsNameMap.set('BTC',chainsNameMapBtc);

    // init WAN
    keyTemp                 = this.config.wanTokenAddress;
    valueTemp               = {};
    valueTemp.tokenSymbol   = 'WAN';
    valueTemp.tokenStand    = 'WAN';
    valueTemp.tokenType     = 'WAN';
    valueTemp.buddy         = 'WAN';
    valueTemp.storemenGroup = [];
    valueTemp.token2WanRatio = 0;
    chainsNameMap.set(keyTemp,valueTemp);

    chainsNameMapWan.set(keyTemp,valueTemp);
    chainsNameMap.set('WAN',chainsNameMapWan);

    return chainsNameMap;
  };

  async initChainsSymbol() {
    global.logger.debug("Entering initChainsSymbol...");
    for (let item of this.chainsNameMap) {
      let dicValue  = item[1];
      for(let chainName of dicValue){
        let keyTemp = chainName[0];
        let valueTemp = chainName[1];
        if (valueTemp.tokenStand === 'E20'){
          let tokenSymbol = await ccUtil.getErc20SymbolInfo(keyTemp);
          // global.logger.debug("initChainsSymbol ",tokenSymbol);
          valueTemp.tokenSymbol = tokenSymbol;
        }
      }
    }
  };

  async initChainsRatio() {
    global.logger.debug("Entering initChainsRatio...");
    for (let item of this.chainsNameMap) {
      let dicValue  = item[1];
      for(let chainName of dicValue){
        let keyTemp = chainName[0];
        let valueTemp = chainName[1];
        if (valueTemp.tokenStand === 'E20'){
          let tokenRatio = await ccUtil.getToken2WanRatio(keyTemp);
          valueTemp.token2WanRatio = tokenRatio;
        }
      }
    }
  };

  async initChainsStoremenGroup(){
    for (let item of this.chainsNameMap) {
      let dicValue  = item[1];
      for(let chainName of dicValue){
        let keyTemp = chainName[0];
        let valueTemp = chainName[1];

        switch(valueTemp.tokenStand){
          case 'ETH':
          {
            valueTemp.storemenGroup = await ccUtil.getEthSmgList();
          }
            break;
          case 'E20':
          {
            valueTemp.storemenGroup = await ccUtil.syncErc20StoremanGroups(keyTemp);
          }
            break;
          case 'BTC':
          {
            valueTemp.storemenGroup = await ccUtil.getEthSmgList();
          }
            break;
          case 'WAN':
          {
            valueTemp.storemenGroup = await ccUtil.getEthSmgList();
          }
          default:
            break;
        }
      }
    }
  };

  initSrcChainsMap(){
    let srcChainsMap    = new Map();

    let srcChainsMapEth = new Map();
    let srcChainsMapBtc = new Map();

    for (let item of this.chainsNameMap) {
      let dicValue  = item[1];
      for(let chainName of dicValue){

        let tockenAddr      = chainName[0];
        let chainNameValue  = chainName[1];
        if(chainNameValue.tokenStand === 'WAN'){
          continue;
        }
        let srcChainsKey    = tockenAddr;
        let srcChainsValue  = {};
        srcChainsValue.srcChain = chainNameValue.tokenSymbol;
        srcChainsValue.dstChain = 'WAN';
        switch(chainNameValue.tokenStand){
          case 'ETH':
          {
            srcChainsValue.srcSCAddr      = this.config.ethHtlcAddr;
            srcChainsValue.srcSCAddrKey   = tockenAddr;
            srcChainsValue.midSCAddr      = this.config.ethHtlcAddr;
            srcChainsValue.dstSCAddr      = this.config.wanHtlcAddr;
            srcChainsValue.dstSCAddrKey   = this.config.wanTokenAddress;
            srcChainsValue.srcAbi         = this.config.HtlcETHAbi;
            srcChainsValue.midSCAbi       = this.config.HtlcETHAbi;
            srcChainsValue.dstAbi         = this.config.HtlcWANAbi;
            srcChainsValue.srcKeystorePath= this.config.ethKeyStorePath ;
            srcChainsValue.dstKeyStorePath= this.config.wanKeyStorePath;
            srcChainsValue.lockClass      = 'CrossChainEthLock';
            srcChainsValue.refundClass    = 'CrossChainEthRefund';
            srcChainsValue.revokeClass    = 'CrossChainEthRevoke';
            srcChainsValue.normalTransClass    = 'NormalChainEth';
            srcChainsValue.approveScFunc  = 'approve';
            srcChainsValue.lockScFunc     = 'eth2wethLock';
            srcChainsValue.refundScFunc   = 'eth2wethRefund';
            srcChainsValue.revokeScFunc   = 'eth2wethRevoke';
            srcChainsValue.srcChainType   = 'ETH';
            srcChainsValue.dstChainType   = 'WAN';
            srcChainsValue.crossCollection    = this.config.crossCollection;
          }
            break;
          case 'E20':
          {
            srcChainsValue.srcSCAddr      = tockenAddr;
            srcChainsValue.srcSCAddrKey   = tockenAddr;
            srcChainsValue.midSCAddr      = this.config.ethHtlcAddrE20;
            srcChainsValue.dstSCAddr      = this.config.wanHtlcAddrE20;
            srcChainsValue.dstSCAddrKey   = this.config.wanTokenAddress;
            srcChainsValue.srcAbi         = this.config.orgEthAbiE20;
            srcChainsValue.midSCAbi       = this.config.ethAbiE20;
            srcChainsValue.dstAbi         = this.config.wanAbiE20;
            srcChainsValue.srcKeystorePath= this.config.ethKeyStorePath ;
            srcChainsValue.dstKeyStorePath= this.config.wanKeyStorePath;
            srcChainsValue.approveClass   = 'CrossChainE20Approve';
            srcChainsValue.lockClass      = 'CrossChainE20Lock';
            srcChainsValue.refundClass    = 'CrossChainE20Refund';
            srcChainsValue.revokeClass    = 'CrossChainE20Revoke';
            srcChainsValue.normalTransClass    = 'NormalChainE20';
            srcChainsValue.approveScFunc  = 'approve';
            srcChainsValue.lockScFunc     = 'inboundLock';
            srcChainsValue.refundScFunc   = 'inboundRefund';
            srcChainsValue.revokeScFunc   = 'inboundRevoke';
            srcChainsValue.srcChainType   = 'ETH';
            srcChainsValue.dstChainType   = 'WAN';
            srcChainsValue.crossCollection    = this.config.crossCollection;
            srcChainsValue.token2WanRatio     = chainNameValue.token2WanRatio;
          }
            break;
          case 'BTC':
          {
            srcChainsValue.srcSCAddr      = tockenAddr;
            srcChainsValue.srcSCAddrKey   = tockenAddr;
            srcChainsValue.midSCAddr      = this.config.ethHtlcAddrBtc;
            srcChainsValue.dstSCAddr      = this.config.wanHtlcAddrBtc;
            srcChainsValue.dstSCAddrKey   = this.config.wanTokenAddress;
            srcChainsValue.srcAbi         = this.config.orgEthAbiBtc;
            srcChainsValue.midSCAbi       = this.config.ethAbiBtc;
            srcChainsValue.dstAbi         = this.config.wanAbiBtc;
            srcChainsValue.srcKeystorePath= this.config.btcKeyStorePath ;
            srcChainsValue.dstKeyStorePath= this.config.wanKeyStorePath;
            srcChainsValue.approveClass   = 'CrossChainE20Approve';
            srcChainsValue.lockClass      = 'CrossChainBtcLock';
            srcChainsValue.refundClass    = 'CrossChainBtcRefund';
            srcChainsValue.revokeClass    = 'CrossChainBtcRevoke';
            srcChainsValue.normalTransClass    = 'NormalChainBtc';
            srcChainsValue.approveScFunc  = 'approve';
            srcChainsValue.lockScFunc     = 'inboundLock';
            srcChainsValue.refundScFunc   = 'inboundRefund';
            srcChainsValue.revokeScFunc   = 'inboundRevoke';
            srcChainsValue.srcChainType   = 'BTC';
            srcChainsValue.dstChainType   = 'WAN';
            srcChainsValue.crossCollection    = this.config.crossCollectionBtc;
          }
            break;
          default:
            break;
        }
        switch(chainNameValue.tokenType){
          case 'ETH':
          {

            srcChainsMapEth.set(srcChainsKey,srcChainsValue);
            break;
          }
          case 'BTC':
          {
            srcChainsMapBtc.set(srcChainsKey,srcChainsValue);
            break;
          }
          default:
          {
            break;
          }
        }

      }
    }
    srcChainsMap.set('ETH',srcChainsMapEth);
    srcChainsMap.set('BTC',srcChainsMapBtc);

    return srcChainsMap;
  };
  //
  //  1. if des is not WAN, src is surely WAN, because we provide cross chain to our chain WAN
  //  2. dst not include WAN
  //
  initDstChainsMap(){

    let config            = this.config;
    let dstChainsMap      = new Map();

    let dstChainsMapEth   = new Map();
    let dstChainsMapBtc   = new Map();

    for (let item of this.chainsNameMap) {
      let dicValue = item[1];
      for(let chainName of dicValue){
        let tockenAddr      = chainName[0];
        let chainNameValue  = chainName[1];
        if(chainNameValue.tokenStand === 'WAN'){
          continue;
        }
        let srcChainsKey    = tockenAddr;
        let srcChainsValue  = {};
        srcChainsValue.srcChain = 'WAN';
        srcChainsValue.dstChain = chainNameValue.tokenSymbol;
        switch(chainNameValue.tokenStand){
          case 'ETH':
          {
            srcChainsValue.srcSCAddr      = config.wanHtlcAddr;
            srcChainsValue.srcSCAddrKey   = config.wanTokenAddress;
            srcChainsValue.midSCAddr      = config.wanHtlcAddr;
            srcChainsValue.dstSCAddr      = config.ethHtlcAddr;
            srcChainsValue.dstSCAddrKey   = tockenAddr;
            srcChainsValue.srcAbi         = config.HtlcWANAbi;
            srcChainsValue.midSCAbi       = config.HtlcWANAbi;
            srcChainsValue.dstAbi         = config.HtlcETHAbi;
            srcChainsValue.srcKeystorePath= config.wanKeyStorePath ;
            srcChainsValue.dstKeyStorePath= config.ethKeyStorePath;
            srcChainsValue.lockClass      = 'CrossChainEthLock';
            srcChainsValue.refundClass    = 'CrossChainEthRefund';
            srcChainsValue.revokeClass    = 'CrossChainEthRevoke';
            srcChainsValue.approveScFunc  = 'approve';
            srcChainsValue.lockScFunc     = 'weth2ethLock';
            srcChainsValue.refundScFunc   = 'weth2ethRefund';
            srcChainsValue.revokeScFunc   = 'weth2ethRevoke';
            srcChainsValue.srcChainType   = 'WAN';
            srcChainsValue.dstChainType   = 'ETH';
            srcChainsValue.crossCollection    = this.config.crossCollection;
          }
            break;
          case 'E20':
          {
            srcChainsValue.buddySCAddr    = chainNameValue.buddy;  // use for WAN approve
            srcChainsValue.srcSCAddr      = tockenAddr;            // use for contract parameter
            srcChainsValue.srcSCAddrKey   = config.wanTokenAddress;
            srcChainsValue.midSCAddr      = config.wanHtlcAddrE20;
            srcChainsValue.dstSCAddr      = config.ethHtlcAddrE20;
            srcChainsValue.dstSCAddrKey   = tockenAddr;
            srcChainsValue.srcAbi         = config.orgWanAbiE20;    // for approve
            srcChainsValue.midSCAbi       = config.wanAbiE20;       // for lock
            srcChainsValue.dstAbi         = config.ethAbiE20;
            srcChainsValue.srcKeystorePath= config.wanKeyStorePath ;
            srcChainsValue.dstKeyStorePath= config.ethKeyStorePath;
            srcChainsValue.approveClass   = 'CrossChainE20Approve';
            srcChainsValue.lockClass      = 'CrossChainE20Lock';
            srcChainsValue.refundClass    = 'CrossChainE20Refund';
            srcChainsValue.revokeClass    = 'CrossChainE20Revoke';
            srcChainsValue.approveScFunc  = 'approve';
            srcChainsValue.lockScFunc     = 'outboundLock';
            srcChainsValue.refundScFunc   = 'outboundRefund';
            srcChainsValue.revokeScFunc   = 'outboundRevoke';
            srcChainsValue.srcChainType   = 'WAN';
            srcChainsValue.dstChainType   = 'ETH';
            srcChainsValue.crossCollection    = this.config.crossCollection;
            srcChainsValue.token2WanRatio     = chainNameValue.token2WanRatio;
          }
            break;
          case 'BTC':
          {
            srcChainsValue.srcSCAddr      = chainNameValue.buddy;
            srcChainsValue.srcSCAddrKey   = config.wanTokenAddress;
            srcChainsValue.midSCAddr      = config.wanHtlcAddrBtc;
            srcChainsValue.dstSCAddr      = config.ethHtlcAddrBtc;
            srcChainsValue.dstSCAddrKey   = config.ethHtlcAddrBtc;
            srcChainsValue.srcAbi         = config.orgWanAbiBtc;
            srcChainsValue.midSCAbi       = config.wanAbiBtc;
            srcChainsValue.dstAbi         = config.ethAbiBtc;
            srcChainsValue.srcKeystorePath= config.wanKeyStorePath ;
            srcChainsValue.dstKeyStorePath= config.btcKeyStorePath;
            srcChainsValue.approveClass   = 'CrossChainE20Approve';
            srcChainsValue.lockClass      = 'CrossChainBtcLock';
            srcChainsValue.refundClass    = 'CrossChainBtcRefund';
            srcChainsValue.revokeClass    = 'CrossChainBtcRevoke';
            srcChainsValue.approveScFunc  = 'approve';
            srcChainsValue.lockScFunc     = 'inboundLock';
            srcChainsValue.refundScFunc   = 'inboundRefund';
            srcChainsValue.revokeScFunc   = 'inboundRevoke';
            srcChainsValue.srcChainType   = 'WAN';
            srcChainsValue.dstChainType   = 'BTC';
            srcChainsValue.crossCollection    = this.config.crossCollectionBtc;
          }
            break;
          default:
            break;
        }

        switch(chainNameValue.tokenType){
          case 'ETH':
          {
            dstChainsMapEth.set(srcChainsKey,srcChainsValue);
            break;
          }
          case 'BTC':
          {
            dstChainsMapBtc.set(srcChainsKey,srcChainsValue);
            break;
          }
          default:
          {
            break;
          }
        }
      }
    }

    dstChainsMap.set('ETH',dstChainsMapEth);
    dstChainsMap.set('BTC',dstChainsMapBtc);


    return dstChainsMap;
  };

  getSrcChainName(){
    return this.chainsNameMap;
  };

  getDstChainName(selectedSrcChainName){
    let ret = new Map();
    if(selectedSrcChainName[1].tokenType !== 'WAN'){
      ret.set('WAN',this.chainsNameMap.get('WAN'));
    }else{
      for(let item of this.chainsNameMap){
        if(item[0] !== 'WAN'){
          ret.set(item[0],item[1]);
        }
      }
    }
    return ret;
  }

  getKeyStorePaths(srcChainName,dstChainName){
    let valueTemp = srcChainName[1];
    let keyStorePaths = [];
    switch(valueTemp.tokenStand){
      case 'WAN':
      {
        keyStorePaths.push({path:config.wanKeyStorePath,type:valueTemp.tokenStand });
      }
        break;
      case 'E20':
      {
        keyStorePaths.push({path:config.ethKeyStorePath,type:valueTemp.tokenStand });
      }
        break;
      case 'ETH':
      {
        keyStorePaths.push({path:config.ethKeyStorePath,type:valueTemp.tokenStand });
      }
        break;
      case 'BTC':
      {
        keyStorePaths.push({path:config.btcKeyStorePath,type:valueTemp.tokenStand });
      }
        break;
      default:
        break;
    }
    valueTemp = dstChainName[1];
    switch(valueTemp.tokenStand){
      case 'WAN':
      {
        keyStorePaths.push({path:config.wanKeyStorePath,type:valueTemp.tokenStand });
      }
        break;
      case 'E20':
      {
        keyStorePaths.push({path:config.ethKeyStorePath,type:valueTemp.tokenStand });

      }
        break;
      case 'ETH':
      {
        keyStorePaths.push({path:config.ethKeyStorePath,type:valueTemp.tokenStand });
      }
        break;
      case 'BTC':
      {
        keyStorePaths.push({path:config.btcKeyStorePath,type:valueTemp.tokenStand });
      }
        break;
      default:
        break;
    }
    return keyStorePaths;
  };

  getKeyByBuddyContractAddr(contractAddr,chainType){
    let chainNameSubMap =  this.chainsNameMap.get(chainType);
    for(let chainsNameItem of chainNameSubMap){
      if(chainsNameItem[1].buddy === contractAddr){
        return chainsNameItem[0];
      }
    }
    return null;
  }

  isInSrcChainsMap(chainName){
    let keyTemp   = chainName[0];
    let valueTemp = chainName[1];
    let chainType = valueTemp.tokenType;

    if(this.srcChainsMap.has(chainType)){
      let  subMap = this.srcChainsMap.get(chainType);
      if(subMap.has(keyTemp)){
        return true;
      }
    }
    return false;
  }

  isInDstChainsMap(chainName){
    let keyTemp   = chainName[0];
    let valueTemp = chainName[1];
    let chainType = valueTemp.tokenType;

    if(this.dstChainsMap.has(chainType)){
      let  subMap = this.dstChainsMap.get(chainType);
      if(subMap.has(keyTemp)){
        return true;
      }
    }
    return false;
  }
  getStoremanGroupList(srcChainName,dstChainName){

    let valueSrcTemp      = srcChainName[1];
    let valueDstTemp      = dstChainName[1];

    let storemanGroupListResult  = [];

    if (this.isInSrcChainsMap(srcChainName)){
      // destination is WAN
      // build StoremenGroupList src address list
      for(let itemOfStoreman of valueSrcTemp.storemenGroup){
        switch(valueSrcTemp.tokenStand){
          case 'ETH':
          {
            itemOfStoreman.storemenGroupAddr = itemOfStoreman.ethAddress;
            break;
          }
          case 'E20':
          {
            //itemOfStoreman.storemenGroupAddr = itemOfStoreman.smgOriginalChainAddress;
            itemOfStoreman.storemenGroupAddr = itemOfStoreman.smgOrigAddr;
            break;
          }
          default:
          {
            itemOfStoreman.storemenGroupAddr = itemOfStoreman.ethAddress;
            break;
          }
        }
        storemanGroupListResult.push(itemOfStoreman);
      };
    }else{
      if(this.isInDstChainsMap(dstChainName)){
        // source is WAN
        // build StoremenGroupList dst address list
        for(let itemOfStoreman of valueDstTemp.storemenGroup){
          switch(valueDstTemp.tokenStand){
            case 'ETH':
            {
              itemOfStoreman.storemenGroupAddr = itemOfStoreman.wanAddress;
              break;
            }
            case 'E20':
            {
              //itemOfStoreman.storemenGroupAddr = itemOfStoreman.storemanGroup;
              itemOfStoreman.storemenGroupAddr = itemOfStoreman.smgWanAddr;
              break;
            }
            default:
            {
              itemOfStoreman.storemenGroupAddr = itemOfStoreman.wanAddress;
              break;
            }
          }
          storemanGroupListResult.push(itemOfStoreman);
        };
      }else{
        process.exit();
      }
    }
    return storemanGroupListResult;
  };

  getSrcChainNameByContractAddr(contractAddr,chainType){
    // global.logger.debug("contractAddr",contractAddr);
    // global.logger.debug("chainType",chainType);
    if(this.chainsNameMap.has(chainType) === false){
      return null;
    }
    let subMap = this.chainsNameMap.get(chainType);
    for(let chainsNameItem of subMap){
      if(chainsNameItem[0] === contractAddr){
        return chainsNameItem;
      }
    }
    return null;
  }

  getCrossInvokerConfig(srcChainName, dstChainName) {
    let config = {};
    global.logger.debug("this.srcChainsMap:",this.srcChainsMap);    
    if (srcChainName && this.isInSrcChainsMap(srcChainName)){
      // destination is WAN
      let chainType   = srcChainName[1].tokenType;
      let subMap      = this.srcChainsMap.get(chainType);
      config          = subMap.get(srcChainName[0]);
    } else {
      if (dstChainName && this.isInDstChainsMap(dstChainName)) {
        // source is WAN
        let chainType = dstChainName[1].tokenType;
        let subMap    = this.dstChainsMap.get(chainType);
        config        = subMap.get(dstChainName[0]);
      } else {
        global.logger.debug("invoke error!");
        global.logger.debug("srcChainName: ", srcChainName);
        global.logger.debug("dstChainName: ", dstChainName);
        process.exit();
      }
    }
    return config;
  }

  getCrossInvokerClass(crossInvokerConfig, action){
    let ACTION = action.toString().toUpperCase();
    let invokeClass = null;
    switch(ACTION){
      case 'LOCK':
      {
        invokeClass = crossInvokerConfig.lockClass;
      }
        break;

      case 'REFUND':
      {
        invokeClass = crossInvokerConfig.refundClass;
      };
        break;
      case 'REVOKE':
      {
        invokeClass = crossInvokerConfig.revokeClass;
      };
        break;
      case 'APPROVE':
      {
        invokeClass = crossInvokerConfig.approveClass;
      };
        break;
      default:
      {
        global.logger.debug("Error action! ", ACTION);
      }
    }
    return invokeClass;
  }

  getInvoker(crossInvokerClass,crossInvokerInput,crossInvokerConfig){
    let invoke = eval(`new ${crossInvokerClass}(crossInvokerInput,crossInvokerConfig)`);
    return invoke;
  }

  invoke(srcChainName, dstChainName, action,input){

    let config      = this.getCrossInvokerConfig(srcChainName,dstChainName);
    let ACTION      = action.toString().toUpperCase();
    let invokeClass = null;

    switch(ACTION){
      case 'LOCK':
      {
        invokeClass = config.lockClass;
      }
        break;

      case 'REFUND':
      {
        invokeClass = config.refundClass;
      };
        break;
      case 'REVOKE':
      {
        invokeClass = config.revokeClass;
      };
        break;
      case 'APPROVE':
      {
        invokeClass = config.approveClass;
      };
        break;
      default:
      {
        global.logger.debug("Error action! ", ACTION);
        process.exit();
      }
    }
    // global.logger.debug("Action is : ", ACTION);
    // global.logger.debug("invoke class : ", invokeClass);
    // global.logger.debug("config is :",config);
    // global.logger.debug("input is :",input);
    let invoke = eval(`new ${invokeClass}(input,config)`);
    invoke.run();
  }

  invokeNormalTrans(srcChainName,input){
    let config      = this.getCrossInvokerConfig(srcChainName,null);
    let invokeClass = null;
    invokeClass     = config.normalTransClass;
    global.logger.debug("invokeNormalTrans invoke class : ", invokeClass);
    //global.logger.debug("invokeNormalTrans config is :",config);
    let invoke = eval(`new ${invokeClass}(input,config)`);
    invoke.run();
  }
}
module.exports = CrossInvoker;