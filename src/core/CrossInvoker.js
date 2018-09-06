'use strict'
let ccUtil = require('../api/ccUtil');
class CrossInvoker {
  constructor(config){
    this.config                 = config;
    this.tokensE20              = [];
    this.chainsNameMap          = new Map();
    this.srcChainsMap           = new Map();
    this.dstChainsMap           = new Map();

  };
  async  init() {
    console.log("CrossInvoker init");
    try{
      this.tokensE20              = await this.getTokensE20();
      this.chainsNameMap          = this.initChainsNameMap();
      await this.initChainsSymbol();
      await this.initChainsStoremenGroup();

      this.srcChainsMap           = this.initSrcChainsMap();
      this.dstChainsMap           = this.initDstChainsMap();

      // console.log("this.chainsNameMap",this.chainsNameMap);
      // console.log("this.srcChainsMap",this.srcChainsMap);
      // console.log("this.dstChainsMap",this.dstChainsMap);

    }catch(error){
      console.log("CrossInvoker init error: ",error);
      process.exit();
    }
  };
  //
  //  "tokens": [{
  //    "token": "0xc5bc855056d99ef4bda0a4ae937065315e2ae11a",
  //    "instance": "0x46e4df4b9c3044f12543adaa8ad0609d553041f9",
  //    "ratio": "200000",
  //    "defaultMinDeposit": "100000000000000000000",
  //    "originalChainHtlc": "0x28edd768b88c7c5ced685d9cee3fc205aa2e225c",
  //    "wanchainHtlc": "0x5d1dd99ebaa6ee3289d9cd3369948e4ce96736c2",
  //    "withdrawDelayTime": "259200"
  //  }]
  //
  async getTokensE20(){
    let tokensE20 = await ccUtil.getRegErc20Tokens();
    return tokensE20;
  };

  // key:
  //     {
  //      tokenAddr: tokenAddr,
  //     }
  // value:
  //     tokenType: 'ETH'|'WAN'|'BTC' // E20 is belong to ETH
  //     tokenSymbol: tokenSymbol,
  //     tokenStand: E20|ETH|BTC
  //     buddy:      the buddy contract address of this tocken.
  // data from API server and configure file
  // build ChainsNameMap;
  initChainsNameMap(){
    let chainsNameMap = new Map();
    // init ETH
    let keyTemp;
    keyTemp               = this.config.ethHtlcAddr;
    let valueTemp         = {};
    valueTemp.tokenSymbol = 'ETH';
    valueTemp.tokenStand  = 'ETH';
    valueTemp.tokenType   = 'ETH';
    valueTemp.buddy       = this.config.wanHtlcAddr;
    valueTemp.storemenGroup = [];
    chainsNameMap.set(keyTemp,valueTemp);

    // init E20
    for(let token of this.tokensE20){
      let keyTemp;
      let valueTemp           = {};

      keyTemp                 = token.token;
      valueTemp.tokenSymbol   = token.token;
      valueTemp.tokenStand    = 'E20';
      valueTemp.tokenType     = 'ETH';
      valueTemp.buddy         = token['instance'];

      chainsNameMap.set(keyTemp, valueTemp);
    }
    // init BTC
    keyTemp                 = this.config.ethHtlcAddrBtc;
    valueTemp               = {};
    valueTemp.tokenSymbol     = 'BTC';
    valueTemp.tokenStand    = 'BTC';
    valueTemp.tokenType     = 'BTC';
    valueTemp.buddy         = this.config.ethHtlcAddrBtc;
    valueTemp.storemenGroup = [];
    chainsNameMap.set(keyTemp,valueTemp);

    // init WAN
    keyTemp                 = this.config.wanHtlcAddr;
    valueTemp               = {};
    valueTemp.tokenSymbol     = 'WAN';
    valueTemp.tokenStand    = 'WAN';
    valueTemp.tokenType     = 'WAN';
    valueTemp.buddy         = this.config.ethHtlcAddr;
    valueTemp.storemenGroup = [];
    chainsNameMap.set(keyTemp,valueTemp);

    return chainsNameMap;
  };
  //
  // 1. if src is not WAN, destination is surely WAN, because we provide cross chain to wanchain.
  // 2. src not include WAN
  // 3. key     tockenaddr_tockename
  // 4. value   data of SRC->WAN
  // 5. value:
  //  srcChain: 'DPY',
  //  dstChain: 'WAN',
  //  srcSCAddr: configCLi.orgChainAddrE20,
  //  midSCAddr: configCLi.originalChainHtlcE20,
  //  dstSCAddr: configCLi.wanchainHtlcAddrE20,
  //  srcAbi:     configCLi.orgAbiE20,
  //  midSCAbi:   configCLi.originalChainHtlcE20,
  //  dstAbi:     configCLi.wanchainHtlcAddrE20,
  //  srcKeystorePath: '/home/jacob/.ethereum/testnet/keystore',
  //  dstKeyStorePath: '/home/jacob/.ethereum/testnet/keystore',
  //  lockClass: 'CrossChainEthLock',
  //  refundClass: 'CrossChainEthRefund',
  //  revokeClass: 'CrossChainEthRevoke',
  //  approveScFunc: 'approve',
  //  lockScFunc: 'eth2wethLock',
  //  refundScFunc: 'eth2wethRefund',
  //  revokeScFunc: 'eth2wethRevoke',
  //  srcChainType: 'ETH',
  //  dstChainType: 'WAN'

  async initChainsSymbol() {
    console.log("Entering initChainsSymbol...");
    for (let chainName of this.chainsNameMap) {
      let keyTemp = chainName[0];
      let valueTemp = chainName[1];
      if (valueTemp.tokenStand === 'E20'){
        let tokenSymbol = await ccUtil.getErc20SymbolInfo(keyTemp);
        // console.log("initChainsSymbol ",tokenSymbol);
        valueTemp.tokenSymbol = tokenSymbol;
      }
    }
  };
  async initChainsStoremenGroup(){
    for(let chainName of this.chainsNameMap.entries()){
      let keyTemp   = chainName[0];
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
  };
  initSrcChainsMap(){
    let srcChainsMap    = new Map();
    for(let chainName of this.chainsNameMap){
      /*
      chainName[0]  :  tockenAddr
      chainName[1]  :
              valueTemp.tokenSymbol   = token.token;
              valueTemp.tokenStand  = 'E20';
              valueTemp.tokenType
       */
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
          srcChainsValue.midSCAddr      = this.config.ethHtlcAddr;
          srcChainsValue.dstSCAddr      = this.config.wanHtlcAddr;
          srcChainsValue.srcAbi         = this.config.HtlcETHAbi;
          srcChainsValue.midSCAbi       = this.config.HtlcETHAbi;
          srcChainsValue.dstAbi         = this.config.HtlcWANAbi;
          srcChainsValue.srcKeystorePath= this.config.ethKeyStorePath ;
          srcChainsValue.dstKeyStorePath= this.config.wanKeyStorePath;
          srcChainsValue.lockClass      = 'CrossChainEthLock';
          srcChainsValue.refundClass    = 'CrossChainEthRefund';
          srcChainsValue.revokeClass    = 'CrossChainEthRevoke';
          srcChainsValue.approveScFunc  = 'approve';
          srcChainsValue.lockScFunc     = 'eth2wethLock';
          srcChainsValue.refundScFunc   = 'eth2wethRefund';
          srcChainsValue.revokeScFunc   = 'eth2wethRevoke';
          srcChainsValue.srcChainType   = 'ETH';
          srcChainsValue.dstChainType   = 'WAN';
        }
          break;
        case 'E20':
        {
          srcChainsValue.srcSCAddr      = tockenAddr;
          srcChainsValue.midSCAddr      = this.config.ethHtlcAddrE20;
          srcChainsValue.dstSCAddr      = this.config.wanHtlcAddrE20;
          srcChainsValue.srcAbi         = this.config.orgEthAbiE20;
          srcChainsValue.midSCAbi       = this.config.ethAbiE20;
          srcChainsValue.dstAbi         = this.config.wanAbiE20;
          srcChainsValue.srcKeystorePath= this.config.ethKeyStorePath ;
          srcChainsValue.dstKeyStorePath= this.config.wanKeyStorePath;
          srcChainsValue.approveClass   = 'CrossChainE20Approve';
          srcChainsValue.lockClass      = 'CrossChainE20Lock';
          srcChainsValue.refundClass    = 'CrossChainE20Refund';
          srcChainsValue.revokeClass    = 'CrossChainE20Revoke';
          srcChainsValue.approveScFunc  = 'approve';
          srcChainsValue.lockScFunc     = 'inboundLock';
          srcChainsValue.refundScFunc   = 'inboundRefund';
          srcChainsValue.revokeScFunc   = 'inboundRevoke';
          srcChainsValue.srcChainType   = 'ETH';
          srcChainsValue.dstChainType   = 'WAN';
        }
          break;
        case 'BTC':
        {
          srcChainsValue.srcSCAddr      = tockenAddr;
          srcChainsValue.midSCAddr      = this.config.ethHtlcAddrBtc;
          srcChainsValue.dstSCAddr      = this.config.wanHtlcAddrBtc;
          srcChainsValue.srcAbi         = this.config.orgEthAbiBtc;
          srcChainsValue.midSCAbi       = this.config.ethAbiBtc;
          srcChainsValue.dstAbi         = this.config.wanAbiBtc;
          srcChainsValue.srcKeystorePath= this.config.btcKeyStorePath ;
          srcChainsValue.dstKeyStorePath= this.config.wanKeyStorePath;
          //srcChainsValue.approveClass   = 'CrossChainE20Approve';
          srcChainsValue.lockClass      = 'CrossChainBtcLock';
          srcChainsValue.refundClass    = 'CrossChainBtcRefund';
          srcChainsValue.revokeClass    = 'CrossChainBtcRevoke';
          //srcChainsValue.approveScFunc  = 'approve';
          srcChainsValue.lockScFunc     = 'inboundLock';
          srcChainsValue.refundScFunc   = 'inboundRefund';
          srcChainsValue.revokeScFunc   = 'inboundRevoke';
          srcChainsValue.srcChainType   = 'BTC';
          srcChainsValue.dstChainType   = 'WAN';
        }
          break;
        default:
          break;
      }
      srcChainsMap.set(srcChainsKey,srcChainsValue);
    }
    return srcChainsMap;
  };
  //
  //  1. if des is not WAN, src is surely WAN, because we provide cross chain to our chain WAN
  //  2. dst not include WAN
  //
  initDstChainsMap(){
    let config        = this.config;
    let dstChainsMap  = new Map();
    for(let chainName of this.chainsNameMap){
      /*
      chainName[0]  :  tockenAddr
      chainName[1]  :
              valueTemp.tokenSymbol   = token.token;
              valueTemp.tokenStand  = 'E20';
              valueTemp.tokenType
       */
      let tockenAddr  = chainName[0];
      let chainNameValue = chainName[1];
      if(chainNameValue.tokenStand === 'WAN'){
        continue;
      }
      let srcChainsKey   = tockenAddr;
      let srcChainsValue = {};
      srcChainsValue.srcChain = chainNameValue.tokenSymbol;
      srcChainsValue.dstChain = 'WAN';
      switch(chainNameValue.tokenStand){
        case 'ETH':
        {
          srcChainsValue.srcSCAddr      = config.wanHtlcAddr;
          srcChainsValue.midSCAddr      = config.wanHtlcAddr;
          srcChainsValue.dstSCAddr      = config.ethHtlcAddr;
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
        }
          break;
        case 'E20':
        {
          srcChainsValue.srcSCAddr      = chainNameValue.buddy;
          srcChainsValue.midSCAddr      = config.wanHtlcAddrE20;
          srcChainsValue.dstSCAddr      = config.ethHtlcAddrE20;
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
        }
          break;
        case 'BTC':
        {
          srcChainsValue.srcSCAddr      = chainNameValue.buddy;
          srcChainsValue.midSCAddr      = config.wanHtlcAddrBtc;
          srcChainsValue.dstSCAddr      = config.ethHtlcAddrBtc;
          srcChainsValue.srcAbi         = config.orgWanAbiBtc;
          srcChainsValue.midSCAbi       = config.wanAbiBtc;
          srcChainsValue.dstAbi         = config.ethAbiBtc;
          srcChainsValue.srcKeystorePath= config.wanKeyStorePath ;
          srcChainsValue.dstKeyStorePath= config.btcKeyStorePath;
          //srcChainsValue.approveClass   = 'CrossChainE20Approve';
          srcChainsValue.lockClass      = 'CrossChainBtcLock';
          srcChainsValue.refundClass    = 'CrossChainBtcRefund';
          srcChainsValue.revokeClass    = 'CrossChainBtcRevoke';
          //srcChainsValue.approveScFunc  = 'approve';
          srcChainsValue.lockScFunc     = 'inboundLock';
          srcChainsValue.refundScFunc   = 'inboundRefund';
          srcChainsValue.revokeScFunc   = 'inboundRevoke';
          srcChainsValue.srcChainType   = 'WAN';
          srcChainsValue.dstChainType   = 'BTC';
        }
          break;
        default:
          break;
      }
      dstChainsMap.set(srcChainsKey,srcChainsValue);
    }
    return dstChainsMap;
  };

  getSrcChainName(){
    return this.chainsNameMap;
  };
  getDstChainName(selectedSrcChainName){
    let keyTemp   = selectedSrcChainName[0];
    let valueTemp = selectedSrcChainName[1];
    if(valueTemp.tokenStand === 'WAN'){
      let keys = [...this.dstChainsMap.keys()];
      return keys;
    }else
    {
      for(let chainsNameItem of this.chainsNameMap){
        if(chainsNameItem[1].tokenStand === 'WAN'){
          return [chainsNameItem];
        }
      }
    }
  };
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
  getStoremanGroupList(srcChainName,dstChainName){
    let keySrcTemp        = srcChainName[0];
    let keyDstTemp        = dstChainName[0];

    let valueSrcTemp      = srcChainName[1];
    let valueDstTemp      = dstChainName[1];

    let storemanGroupList  = [];

    if (this.srcChainsMap.has(keySrcTemp)){
      // destination is WAN
      // build StoremenGroupList src address list
      storemanGroupList = valueSrcTemp.storemenGroup;
      for(let itemOfStoreman of storemanGroupList){
        switch(valueSrcTemp.tokenStand){
          case 'ETH':
          {
            itemOfStoreman.storemenGroupAddr = itemOfStoreman.ethAddress;
            break;
          }
          case 'E20':
          {
            itemOfStoreman.storemenGroupAddr = itemOfStoreman.smgOriginalChainAddress;
            break;
          }
          default:
          {
            itemOfStoreman.storemenGroupAddr = itemOfStoreman.ethAddress;
            break;
          }
        }
        storemanGroupList.push(itemOfStoreman);
      }
    }else{
      if(this.dstChainsMap.has(keyDstTemp)){
        // source is WAN
        // build StoremenGroupList dst address list
        storemanGroupList = valueDstTemp.storemenGroup;
        for(let itemOfStoreman of storemanGroupList){
          switch(valueSrcTemp.tokenStand){
            case 'ETH':
            {
              itemOfStoreman.storemenGroupAddr = itemOfStoreman.wanAddress;
              break;
            }
            case 'E20':
            {
              itemOfStoreman.storemenGroupAddr = itemOfStoreman.storemanGroup;
              break;
            }
            default:
            {
              itemOfStoreman.storemenGroupAddr = itemOfStoreman.wanAddress;
              break;
            }
          }
          storemanGroupList.push(itemOfStoreman);
        }
      }else{
        process.exit();
      }
    }
    return storemanGroupList;
  };
  invoke(srcChainName, dstChainName, action,input){
    let config = {};
    if (this.srcChainsMap.has(srcChainName)){
      // destination is WAN
      config = this.srcChainsMap.get(srcChainName);
    }else{
      if(this.dstChainsMap.has(dstChainName)){
        // source is WAN
        config = this.dstChainsMap.get(dstChainName);
      }else{
        console.log("invoke error!");
        console.log("srcChainName: ", srcChainName);
        console.log("dstChainName: ", dstChainName);
        process.exit();
      }
    }
    let ACTION = action.toString().toUpperCase();
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
        console.log("Error action! ", ACTION);
        process.exit();
      }
    }
    // console.log("Action is : ", ACTION);
    // console.log("invoke class : ", invokeClass);
    // console.log("config is :",config);
    // console.log("input is :",input);
    let invoke = new invokeClass(config,input);
    invoke.run();
  }
}
module.exports = CrossInvoker;