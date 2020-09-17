let ccUtil = require('../api/ccUtil');
let wanUtil= require('../util/util');
let error  = require('../api/error');

let {
  CrossChainBtcLock,
  CrossChainBtcRedeem,
  CrossChainBtcRevoke,
  CrossChainEthApprove,
  CrossChainEthLock,
  CrossChainEthRedeem,
  CrossChainEthRevoke,
  CrossChainE20Approve,
  CrossChainE20Lock,
  CrossChainE20Revoke,
  CrossChainE20Redeem,
  CrossChainEosApprove,
  CrossChainEosLock,
  CrossChainEosRevoke,
  CrossChainEosRedeem
} = require('../trans/cross-chain');

let {
  NormalChainBtc,
  NormalChainE20,
  NormalChainEth,
  NormalChainEos
} = require('../trans/normal-chain');

let {
    PrivateChainWanSend,
    PrivateChainWanRefund,
    POSDelegateIn,
    POSDelegateOut,
    POSStakeIn,
    POSStakeUpdate,
    POSStakeAppend,
    POSStakeUpdateFeeRate,
    POSStakeRegister
} = require('../trans/wan-special');

let {
  StoremanDelegateIn,
  StoremanDelegateOut,
  StoremanDelegateClaim,
  StoremanStakeIn,
  StoremanStakeAppend,
  StoremanStakeOut,
  StoremanStakeClaim
} = require('../trans/open-storeman');

let crossClassDict = {
  'BTC': ['CrossChainBtcLock', 'CrossChainBtcRedeem', 'CrossChainBtcRevoke'],
  'EOS': ['CrossChainEosApprove', 'CrossChainEosLock', 'CrossChainEosRedeem', 'CrossChainEosRevoke'],
  'ETH': ['CrossChainEthApprove', 'CrossChainEthLock', 'CrossChainEthRedeem', 'CrossChainEthRevoke'],
  'ETC': ['CrossChainE20Approve', 'CrossChainE20Lock', 'CrossChainE20Redeem', 'CrossChainE20Revoke'],
  // 'WAN': []
} 

const logger = wanUtil.getLogger("CrossInvoker.js");

/**
 * @class
 * @classdesc Class representing a class to handle cross chain.
 * SDK users can finish transfer coin or token from source chain to destination chain using this class.
 * SDK users only provide source chain info., destination chain info., action (approve,lock,redeem,revoke)
 * and the input(such as  gas, gas limit, from address, to address, amount...),SDK can draw all the configuration used
 * by system automatically
 */
class CrossInvoker {
  /**
   * @constructs
   * @param {Object} config   - The merged config from user's configuration and sdk configuration.Users' configuration
   * will override the configuration of SDK.
   *
   */
  constructor(config){
    /**
     * The merged config from user's configuration and sdk configuration.</br>
     <pre>
     {
       port: 8545,
       useLocalNode: false,
       logPathPrex: '',
       databasePathPrex: '',
       loglevel: 'info',
       network: 'testnet',
       socketUrl: 'wss://apitest.wanchain.info',
       ethTokenAddressOnWan: '0x46397994a7e1e926ea0de95557a4806d38f10b0d',
       wanTokenAddress: 'WAN',
       ethTokenAddress: 'ETH',
       ethHtlcAddr: '0x358b18d9dfa4cce042f2926d014643d4b3742b31',
       wanHtlcAddr: '0xfbaffb655906424d501144eefe35e28753dea037',
       HtlcETHAbi:
       ethHtlcAddrE20: '0x4a8f5dd531e4cd1993b79b23dbda21faacb9c731',
       wanHtlcAddrE20: '0xfc0eba261b49763decb6c911146e3cf524fa7ebc',
       ethAbiE20:
       wanAbiE20:
       orgEthAbiE20:
       orgWanAbiE20:
       ethHtlcAddrBtc: '0xcdc96fea7e2a6ce584df5dc22d9211e53a5b18b2',
       wanHtlcAddrBtc: '0x5d1dd99ebaa6ee3289d9cd3369948e4ce96736c3',
       wanAbiBtc:
       inStgLockEvent: 'ETH2WETHLock(address,address,bytes32,uint256)',
       outStgLockEvent: 'WETH2ETHLock(address,address,bytes32,uint256)',
       inStgLockEventE20: 'InboundLockLogger(address,address,bytes32,uint256,address)',
       outStgLockEventE20: 'OutboundLockLogger(address,address,bytes32,uint256,address)',
       dataName: 'testnet',
       rpcIpcPath: '/home/jacob/.wanchain/gwan.ipc',
       keyStorePath: '/home/jacob/.wanchain/testnet/keystore/',
       ethkeyStorePath: '/home/jacob/.ethereum/testnet/keystore/',
       databasePath: '/home/jacob/LocalDb',
       crossDbname: 'wanchainDb',
       crossCollection: 'crossTrans',
       crossCollectionBtc: 'crossTransBtc',
       normalCollection: 'normalTrans',
       wanKeyStorePath: '/home/jacob/.wanchain/testnet/keystore/',
       ethKeyStorePath: '/home/jacob/.ethereum/testnet/keystore/',
       btcKeyStorePath: '',
       confirmBlocks: 2,
       tryTimes: 3,
       consoleColor:
        { COLOR_FgRed: '\u001b[31m',
          COLOR_FgYellow: '\u001b[33m',
          COLOR_FgGreen: '\u001b[32m' },
       ccLog: 'logs/crossChainLog.log',
       ccErr: 'logs/crossChainErr.log',
       mrLog: 'logs/ccMonitorLog.log',
       mrErr: 'logs/ccMonitorErr.log',
       mrLogNormal: 'logs/ccMonitorLogN.log',
       mrErrNormal: 'logs/ccMonitorErrN.log',
       logfileName: 'logs/crossChainLog.log',
       errfileName: 'logs/crossChainErr.log',
       logfileNameMR: 'logs/ccMonitorLog.log',
       errfileNameMR: 'logs/ccMonitorErr.log',
       logfileNameMRN: 'logs/ccMonitorLogN.log',
       errfileNameMRN: 'logs/ccMonitorErrN.log'
     }
     </pre>
     * @type {Object}
     */
    this.config                 = config;
    this.tokens              = {};
    /**
     * All coin and token's info. including wan coin on WAN chain.
     * <pre>
     {
       'ETH' => Map {
                     'ETH' =>

                     {
                       tokenSymbol: 'ETH',
                       tokenStand: 'ETH',
                       tokenType: 'ETH',
                       buddy: '0x46397994a7e1e926ea0de95557a4806d38f10b0d',
                       storemenGroup: [Array],
                       token2WanRatio: 0,
                       tokenDecimals: 18
                     },

                     '0x54950025d1854808b09277fe082b54682b11a50b' =>
                     {
                       tokenSymbol: 'MKR',
                       tokenStand: 'TOKEN',
                       tokenType: 'ETH',
                       buddy: '0x29204554d51b6d8e7b477fe0fa4769b47f2a00ef',
                       storemenGroup: [Array],
                       token2WanRatio: '6000000',
                       tokenDecimals: '18'

                     },

                     '0xdbf193627ee704d38495c2f5eb3afc3512eafa4c' =>
                     {
                       tokenSymbol: 'DAI',
                       tokenStand: 'TOKEN',
                       tokenType: 'ETH',
                       buddy: '0xcc0ac621653faae13dae742ebb34f6e459218ff6',
                       storemenGroup: [Array],
                       token2WanRatio: '5000',
                       tokenDecimals: '18'
                     },

                     '0x00f58d6d585f84b2d7267940cede30ce2fe6eae8' =>
                     {
                       tokenSymbol: 'ZRX',
                       tokenStand: 'TOKEN',
                       tokenType: 'ETH',
                       buddy: '0xe7d648256543d2467ca722b7560a92c1dcb654bb',
                       storemenGroup: [Array],
                       token2WanRatio: '3000',
                       tokenDecimals: '18'
                     },

                     '0x87271f3df675f13e8ceffa6e426d18a787267e9e' =>
                     {
                       tokenSymbol: 'WCT',
                       tokenStand: 'TOKEN',
                       tokenType: 'ETH',
                       buddy: '0xe9585620239e4eca4f906cb0382ae9eb57d3ba3b',
                       storemenGroup: [Array],
                       token2WanRatio: '10000',
                       tokenDecimals: '13'
                     }
                    },

       'BTC' => Map {
                    '0xcdc96fea7e2a6ce584df5dc22d9211e53a5b18b2' =>
                   {
                       tokenSymbol: 'BTC',
                       tokenStand: 'BTC',
                       tokenType: 'BTC',
                       buddy: '0xcdc96fea7e2a6ce584df5dc22d9211e53a5b18b2',
                       storemenGroup: [],
                       token2WanRatio: 0,
                       tokenDecimals: 18
                   }
                    },

       'WAN' => Map {
                   'WAN' =>
                   {
                       tokenSymbol: 'WAN',
                       tokenStand: 'WAN',
                       tokenType: 'WAN',
                       buddy: 'WAN',
                       storemenGroup: [Array],
                       token2WanRatio: 0,
                       tokenDecimals: 18
                   }
                    }

     }
     </pre>
     * @type {Map<string, Map<string,Object>>}
     */
    this.tokenInfoMap          = new Map();
    /**
     * Source chain's information  including both coin info. and configuration of cross chain.</br>
     * <pre>
     Map {
  'ETH' =>
	  Map {
				  'ETH' =>
				  {
				  tokenSymbol: 'ETH',
				  tokenStand: 'ETH',
				  useLocalNode: false,
				  tokenDecimals: 18,
				  srcSCAddr: '0x358b18d9dfa4cce042f2926d014643d4b3742b31',
				  srcSCAddrKey: 'ETH',
				  midSCAddr: '0x358b18d9dfa4cce042f2926d014643d4b3742b31',
				  dstSCAddr: '0xfbaffb655906424d501144eefe35e28753dea037',
				  dstSCAddrKey: 'WAN',
				  srcAbi: [Array],
				  midSCAbi: [Array],
				  dstAbi: [Array],
				  srcKeystorePath: '/home/jacob/.ethereum/testnet/keystore/',
				  dstKeyStorePath: '/home/jacob/.wanchain/testnet/keystore/',
				  lockClass: 'CrossChainEthLock',
				  redeemClass: 'CrossChainEthRedeem',
				  revokeClass: 'CrossChainEthRevoke',
				  normalTransClass: 'NormalChainEth',
				  approveScFunc: 'approve',
				  lockScFunc: 'eth2wethLock',
				  redeemScFunc: 'eth2wethRefund',
				  revokeScFunc: 'eth2wethRevoke',
				  srcChainType: 'ETH',
				  dstChainType: 'WAN',
				  crossCollection: 'crossTrans',
				  normalCollection: 'normalTrans'
				  },
				  '0x54950025d1854808b09277fe082b54682b11a50b' =>
					{
				  tokenSymbol: 'MKR',
				  tokenStand: 'TOKEN',
				  useLocalNode: false,
				  tokenDecimals: '18',
				  srcSCAddr: '0x54950025d1854808b09277fe082b54682b11a50b',
				  srcSCAddrKey: '0x54950025d1854808b09277fe082b54682b11a50b',
				  midSCAddr: '0x4a8f5dd531e4cd1993b79b23dbda21faacb9c731',
				  dstSCAddr: '0xfc0eba261b49763decb6c911146e3cf524fa7ebc',
				  dstSCAddrKey: 'WAN',
				  srcAbi: [Array],								// token abi
				  midSCAbi: [Array],							// HTLCETH abi
				  dstAbi: [Array],								// HTLCWAN abi
				  srcKeystorePath: '/home/jacob/.ethereum/testnet/keystore/',
				  dstKeyStorePath: '/home/jacob/.wanchain/testnet/keystore/',
				  approveClass: 'CrossChainE20Approve',
				  lockClass: 'CrossChainE20Lock',
				  redeemClass: 'CrossChainE20Redeem',
				  revokeClass: 'CrossChainE20Revoke',
				  normalTransClass: 'NormalChainE20',
				  approveScFunc: 'approve',
				  transferScFunc: 'transfer',
				  lockScFunc: 'inboundLock',
				  redeemScFunc: 'inboundRedeem',
				  revokeScFunc: 'inboundRevoke',
				  srcChainType: 'ETH',
				  dstChainType: 'WAN',
				  crossCollection: 'crossTrans',
				  normalCollection: 'normalTrans',
				  token2WanRatio: '6000000'
					},

				  '0x87271f3df675f13e8ceffa6e426d18a787267e9e' =>
				  {
				  tokenSymbol: 'WCT',
				  tokenStand: 'TOKEN',
				  useLocalNode: false,
				  tokenDecimals: '13',
				  srcSCAddr: '0x87271f3df675f13e8ceffa6e426d18a787267e9e',
				  srcSCAddrKey: '0x87271f3df675f13e8ceffa6e426d18a787267e9e',
				  midSCAddr: '0x4a8f5dd531e4cd1993b79b23dbda21faacb9c731',
				  dstSCAddr: '0xfc0eba261b49763decb6c911146e3cf524fa7ebc',
				  dstSCAddrKey: 'WAN',
				  srcAbi: [Array],
				  midSCAbi: [Array],
				  dstAbi: [Array],
				  srcKeystorePath: '/home/jacob/.ethereum/testnet/keystore/',
				  dstKeyStorePath: '/home/jacob/.wanchain/testnet/keystore/',
				  approveClass: 'CrossChainE20Approve',
				  lockClass: 'CrossChainE20Lock',
				  redeemClass: 'CrossChainE20Redeem',
				  revokeClass: 'CrossChainE20Revoke',
				  normalTransClass: 'NormalChainE20',
				  approveScFunc: 'approve',
				  transferScFunc: 'transfer',
				  lockScFunc: 'inboundLock',
				  redeemScFunc: 'inboundRedeem',
				  revokeScFunc: 'inboundRevoke',
				  srcChainType: 'ETH',
				  dstChainType: 'WAN',
				  crossCollection: 'crossTrans',
				  normalCollection: 'normalTrans',
				  token2WanRatio: '10000'
				  }

				},

	'BTC' =>
				Map
				{
				  '0xcdc96fea7e2a6ce584df5dc22d9211e53a5b18b2' =>
				  {
				  tokenSymbol: 'BTC',
				  tokenStand: 'BTC',
				  useLocalNode: false,
				  tokenDecimals: 18,
				  srcSCAddr: '0xcdc96fea7e2a6ce584df5dc22d9211e53a5b18b2',
				  srcSCAddrKey: '0xcdc96fea7e2a6ce584df5dc22d9211e53a5b18b2',
				  midSCAddr: '0xcdc96fea7e2a6ce584df5dc22d9211e53a5b18b2',
				  dstSCAddr: '0x5d1dd99ebaa6ee3289d9cd3369948e4ce96736c3',
				  dstSCAddrKey: 'WAN',
				  srcAbi: [Array],
				  midSCAbi: [Array],
				  dstAbi: [Array],
				  srcKeystorePath: '',
				  dstKeyStorePath: '/home/jacob/.wanchain/testnet/keystore/',
				  approveClass: 'CrossChainE20Approve',
				  lockClass: 'CrossChainBtcLock',
				  redeemClass: 'CrossChainBtcRedeem',
				  revokeClass: 'CrossChainBtcRevoke',
				  normalTransClass: 'NormalChainBtc',
				  approveScFunc: 'approve',
				  lockScFunc: 'inboundLock',
				  redeemScFunc: 'inboundRedeem',
				  revokeScFunc: 'inboundRevoke',
				  srcChainType: 'BTC',
				  dstChainType: 'WAN',
				  crossCollection: 'crossTransBtc',
				  normalCollection: 'normalTrans'
				  }
				}

  }
     </pre>
     * @type {Map<string, Map<string,Object>>}
     */
    this.inboundInfoMap           = new Map();
    /**
     * Destination chain's information  including both coin info. and configuration of cross chain.</br>
     * It is similar to {@link CrossInvoker#inboundInfoMap  [Destination chains info.]}
     * @type {Map<string, Map<string,Object>>}
     */
    this.outboundInfoMap           = new Map();
  };

  /**
   * Init all the configuration used for cross chain.</br>
   * step1: get tokens info. from api server.</br>
   * step2: init all chains info.</br>
   * step3: update token or coin symbol info. and the storemengroup related to this token or coin.</br>
   * step4: init all the token or coin info. in source chains Map</br>
   * step5: init all the token or coin info. in destination chains Map</br>
   * @returns {Promise<void>}
   */
  async  init() {
    logger.info("Initializing CrossInvoker ...");
    let timeout = wanUtil.getConfigSetting("network:timeout", 300000);

    try{
      logger.debug("tokenPairs start>>>>>>>>>>");
      this.tokenPairs = await ccUtil.getTokenPairs();
      logger.debug("tokenPairs done<<<<<<<<<<");
    }catch(error){
      logger.error("CrossInvoker init tokenPairs: ",error);
    }

    let crossChain = 'ETH';
    // try{
    //   logger.debug("getTokensE20 start>>>>>>>>>>");
    //   this.tokens[crossChain] = await ccUtil.getRegTokensFromRPC(crossChain);
    //   logger.debug("getTokensE20 done<<<<<<<<<<");
    // }catch(error){
    //   logger.error("CrossInvoker init getTokensE20: ",error);
    //   //process.exit();
    // }

    crossChain = 'EOS';
    try{
      logger.debug("getTokensEos start>>>>>>>>>>");
      this.tokens[crossChain] = await ccUtil.getRegTokensFromRPC(crossChain);
      for(let token of this.tokens[crossChain]){
        token.tokenOrigAddr = ccUtil.decodeAccount(crossChain, token.tokenOrigAccount);
      }
      logger.debug("getTokensEos done<<<<<<<<<<");
    }catch(error){
      logger.error("CrossInvoker init getTokensEos: ",error);
      //process.exit();
    }
    logger.debug("initChainsNameMap start>>>>>>>>>>");
    try {
      this.tokenInfoMap = await this.initChainsNameMap();
    } catch (error) {
      logger.error("initChainsNameMap: ",error)
    }
    logger.debug("initChainsNameMap done<<<<<<<<<<");

    logger.debug("initSrcChainsMap start>>>>>>>>>>");
    this.inboundInfoMap           = this.initSrcChainsMap();
    logger.debug("initSrcChainsMap done<<<<<<<<<<");

    logger.debug("initDstChainsMap start>>>>>>>>>>");
    this.outboundInfoMap           = this.initDstChainsMap();
    logger.debug("initDstChainsMap done<<<<<<<<<<");

    logger.debug("tokenInfoMap: ", this.tokenInfoMap);
    logger.debug("inboundInfoMap: ", this.inboundInfoMap);
    logger.debug("outboundInfoMap: ", this.outboundInfoMap);

    logger.info("CrossInvoker initialization is completed.");
  };

  /**
   * Build all the coins and tokens information, this information is two-layer map structure.</br>
   * first layer: key is chains name(such as 'ETH', 'WAN','BTC'), value is all the tokens and coins info. on this chain.
   * second layer: key is the token unique address(currently, system use contract address of the tokens.</br>
   * second layer: value is the info. about the token or coin.</br>
   * Below is an example.
   * {@link CrossInvoker#tokenInfoMap [example for chainsName]}
   * @returns {Map<string, MAP<string,Object>>} - Two layers Map including all the tokens and coins chain information.
   */
  async initChainsNameMap(){
    let chainsNameMap     = new Map();
    let chainsNameMapEth  = new Map();
    let chainsNameMapBtc  = new Map();
    let chainsNameMapEos  = new Map();
    let chainsNameMapWan  = new Map();
    // init ETH
    let keyTemp;
    let valueTemp = {};

    // keyTemp                     = this.config.ethTokenAddress;

    // valueTemp.tokenSymbol       = 'ETH';
    // valueTemp.tokenStand        = 'ETH';
    // valueTemp.tokenType         = 'ETH';
    // valueTemp.tokenOrigAddr     = keyTemp;
    // valueTemp.buddy             = this.config.ethTokenAddressOnWan;
    // valueTemp.storemenGroup     = [];
    // valueTemp.token2WanRatio    = 0;
    // valueTemp.tokenDecimals     = 18;
    // chainsNameMapEth.set(keyTemp,valueTemp);

    // // init TOKEN
    // if (this.tokens['ETH']) {
    //   for(let token of this.tokens['ETH']){
    //     /**
    //      * key of coin or token's chain info., contract address of coin or token.
    //      * @member {string}  - key of the token or coin's chain info., contract address
    //      */
    //     let keyTemp;
    //     /**
    //      * value of coin or token's chain info.
    //      * @type {Object}
    //      */
    //     let valueTemp             = {};

    //     keyTemp                   = token.tokenOrigAddr;
    //     valueTemp.tokenSymbol     = token.symbol;
    //     valueTemp.tokenStand      = 'TOKEN';
    //     valueTemp.tokenType       = 'ETH';
    //     valueTemp.tokenOrigAddr   = keyTemp;
    //     valueTemp.buddy           = token.tokenWanAddr;
    //     valueTemp.storemenGroup   = [];
    //     valueTemp.token2WanRatio  = token.ratio;
    //     valueTemp.tokenDecimals   = token.decimals;
    //     chainsNameMapEth.set(keyTemp, valueTemp);
    //   }
    //   chainsNameMap.set('ETH',chainsNameMapEth);
    // }

    // init BTC
    //keyTemp                   = this.config.ethHtlcAddrBtc;
    keyTemp                   = this.config.coinAddress;
    valueTemp                 = {};
    valueTemp.tokenSymbol     = 'BTC';
    valueTemp.tokenStand      = 'BTC';
    valueTemp.tokenType       = 'BTC';
    valueTemp.tokenOrigAddr   = keyTemp;
    valueTemp.buddy           = this.config.wbtcTokenAddress;
    valueTemp.storemenGroup   = [];
    valueTemp.token2WanRatio  = 0;
    valueTemp.tokenDecimals   = 8;
    chainsNameMapBtc.set(keyTemp,valueTemp);

    chainsNameMap.set('BTC',chainsNameMapBtc);

    // init EOS token
    if (this.tokens['EOS']) {
      for(let token of this.tokens['EOS']) {
        /**
         * key of coin or token's chain info., contract address of coin or token.
         * @member {string}  - key of the token or coin's chain info., contract address
         */
        // let keyTemp;
        /**
         * value of coin or token's chain info.
         * @type {Object}
         */
        valueTemp             = {};

        keyTemp                   = token.tokenOrigAccount;
        valueTemp.tokenSymbol     = token.symbol;
        valueTemp.tokenStand      = 'EOS';
        valueTemp.tokenType       = 'EOS';
        valueTemp.tokenOrigAddr   = token.tokenOrigAddr.split(':')[0];
        valueTemp.buddy           = token.tokenWanAddr;
        valueTemp.storemenGroup   = [];
        valueTemp.token2WanRatio  = token.ratio;
        valueTemp.tokenDecimals   = token.decimals;
        chainsNameMapEos.set(keyTemp, valueTemp);
      }

      chainsNameMap.set('EOS',chainsNameMapEos);
    }

    // init WAN
    // keyTemp                   = this.config.wanTokenAddress;
    // valueTemp                 = {};
    // valueTemp.tokenSymbol     = 'WAN';
    // valueTemp.tokenStand      = 'WAN';
    // valueTemp.tokenType       = 'WAN';
    // valueTemp.tokenOrigAddr   = keyTemp;
    // valueTemp.buddy           = 'WAN';
    // valueTemp.storemenGroup   = [];
    // valueTemp.token2WanRatio  = 0;
    // valueTemp.tokenDecimals   = 18;

    // chainsNameMap.set(keyTemp,valueTemp);

    // chainsNameMapWan.set(keyTemp,valueTemp);
    // chainsNameMap.set('WAN',chainsNameMapWan);

    for (let tokenPair of this.tokenPairs) {
      let chainType = tokenPair.fromChainSymbol;
      let toChainType = tokenPair.toChainSymbol;

      if (['BTC', 'EOS', 'ETC'].includes(chainType) || ['BTC', 'EOS', 'ETC'].includes(toChainType)) {
        continue;
      }

      if (!chainsNameMap.has(chainType)) {
        chainsNameMap.set(chainType, new Map());
      }
      
      let tokenMap = chainsNameMap.get(chainType);

      keyTemp = tokenPair.fromAccount.toLowerCase();
      if (!tokenMap.has(keyTemp)) {
        tokenMap.set(keyTemp, {});
      }

      let valueTemp = tokenMap.get(keyTemp);
      valueTemp.tokenName = tokenPair.fromTokenName;
      valueTemp.tokenSymbol = tokenPair.fromTokenSymbol;
      valueTemp.tokenAncestorSymbol = tokenPair.ancestorSymbol;
      valueTemp.tokenStand = (tokenPair.fromAccount === this.config.coinAddress) ? chainType : 'TOKEN';
      valueTemp.tokenType = chainType;
      valueTemp.tokenOrigAddr = keyTemp;
      valueTemp.tokenPairID = (valueTemp.tokenPairID) ? valueTemp.tokenPairID.concat(tokenPair.id): [tokenPair.id];
      if (!valueTemp.buddy) {
        valueTemp.buddy = {};
      }
      valueTemp.buddy[tokenPair.id] = tokenPair.toAccount;
      if (!valueTemp.buddyChain) {
        valueTemp.buddyChain = {};
      }
      valueTemp.buddyChain[tokenPair.id] = toChainType;
      if (!valueTemp.buddySymbol) {
        valueTemp.buddySymbol = {};
      }
      valueTemp.buddySymbol[tokenPair.id] = tokenPair.toTokenSymbol;
      if (!valueTemp.buddyName) {
        valueTemp.buddyName = {};
      }
      valueTemp.buddyName[tokenPair.id] = tokenPair.toTokenName;
      
      valueTemp.storemenGroup = [];
      valueTemp.token2WanRatio = 0;
      valueTemp.tokenDecimals = tokenPair.ancestorDecimals;

      if (!valueTemp.fee) {
        valueTemp.fee = {};
      }

      let mintFees = await ccUtil.getFees(chainType, tokenPair.fromChainID, tokenPair.toChainID);
      let burnFees = await ccUtil.getFees(valueTemp.buddyChain[tokenPair.id], tokenPair.fromChainID, tokenPair.toChainID);
      valueTemp.fee[tokenPair.id] = {
        mintLockFee: mintFees[0],
        mintRevokeFee: mintFees[1],
        burnLockFee: burnFees[0],
        burnRevokeFee: burnFees[1]
      };

      if (tokenPair.fromAccount === this.config.coinAddress) {
        tokenMap.set(chainType, valueTemp);
      }
    }

    return chainsNameMap;
  };

  /**
   * Build promise array which is used to get the tokens' symbol and tokens' decimal
   * @returns {Array} - promise array about getting symbol
   */
  initChainsSymbol() {
    logger.debug("Entering initChainsSymbol...");
    let promiseArray = [];
    for (let dicValue of this.tokenInfoMap.values()) {
      for(let [keyTemp, valueTemp] of dicValue){
        if (valueTemp.tokenStand === 'TOKEN' || valueTemp.tokenStand === 'EOS'){
          promiseArray.push(ccUtil.getTokenInfo(valueTemp.buddy, 'WAN').then(ret => {
              logger.debug("tokenSymbol: tokenDecimals:", ret.symbol,ret.decimals);
              valueTemp.tokenSymbol = ret.symbol;
              valueTemp.tokenDecimals = ret.decimals;
            },
            err=>{
              logger.debug("initChainsSymbol err:", err);
              logger.debug("Symbol key deleted:", keyTemp);

              let subMap = this.tokenInfoMap.get('ETH');
              subMap.delete(keyTemp);
            }));
        }
      }
    }
    logger.debug("initChainsSymbol returned");
    return promiseArray;
  };

  /**
   * Init source chains map, this map is also a two layer map data structure.</br>
   * first layer: key is chains name(such as 'ETH', 'WAN','BTC'), value is all the tokens and coins info. on this chain.</br>
   * second layer: key is the token unique address(currently, system use contract address of the tokens.</br>
   * second layer: value is the info. which used to finish cross token or coin from source chain to destination chain.</br>
   * In this map, there is no WAN info., If the source chain in this map, it surely cross source chain to 'WAN'</br>
   * If the destination chain in destination map (outboundInfoMap), it surely the source chain is 'WAN'</br>
   * Using this machine , system can decide the inbound (to 'WAN' chain)or outbound (from 'WAN')direction easily, </br>
   * and in the next cross chain step</br>
   * system gets rid of inbound or outbound decision, this sharply make service logic more easier.</br>
   * Attention : in inboundInfoMap and in outboundInfoMap ,there is no info. of 'WAN', because after system know</br>
   * one side non 'WAN' chain, the other side chain is surely 'WAN'.
   * Below is an example.</br>
   {@link CrossInvoker#inboundInfoMap [example for source chains map]}
   * @returns {Map<string, MAP<string,Object>>}
   */
  initSrcChainsMap(){

    let srcChainsMap    = new Map();
    let srcChainsMapEth = new Map();
    let srcChainsMapBtc = new Map();
    let srcChainsMapEos = new Map();

    for (let item of this.tokenInfoMap) {
      let dicValue  = item[1];
      for(let chainName of dicValue){
        let tockenAddr      = chainName[0];
        let chainNameValue  = chainName[1];
        if(chainNameValue.tokenStand === 'WAN'){
          continue;
        }
        let srcChainsKey    = tockenAddr;
        let srcChainsValue  = {};

        srcChainsValue.tokenSymbol  = chainNameValue.tokenSymbol;
        srcChainsValue.tokenStand   = chainNameValue.tokenStand;
        srcChainsValue.useLocalNode = this.config.useLocalNode;
        srcChainsValue.tokenDecimals = chainNameValue.tokenDecimals;

        switch(chainNameValue.tokenStand){
          // case 'ETH':
          // {
          //   srcChainsValue.srcSCAddr      = this.config.ethHtlcAddr;
          //   srcChainsValue.srcSCAddrKey   = tockenAddr;
          //   srcChainsValue.midSCAddr      = this.config.ethHtlcAddr;
          //   srcChainsValue.dstSCAddr      = this.config.wanHtlcAddr;
          //   srcChainsValue.dstSCAddrKey   = this.config.wanTokenAddress;
          //   srcChainsValue.srcAbi         = this.config.HtlcETHAbi;
          //   srcChainsValue.midSCAbi       = this.config.HtlcETHAbi;
          //   srcChainsValue.dstAbi         = this.config.HtlcWANAbi;
          //   srcChainsValue.srcKeystorePath= this.config.ethKeyStorePath ;
          //   srcChainsValue.dstKeyStorePath= this.config.wanKeyStorePath;
          //   srcChainsValue.lockClass      = 'CrossChainEthLock';
          //   srcChainsValue.redeemClass    = 'CrossChainEthRedeem';
          //   srcChainsValue.revokeClass    = 'CrossChainEthRevoke';
          //   srcChainsValue.normalTransClass    = 'NormalChainEth';
          //   srcChainsValue.approveScFunc  = 'approve';
          //   srcChainsValue.lockScFunc     = 'eth2wethLock';
          //   srcChainsValue.redeemScFunc   = 'eth2wethRefund';
          //   srcChainsValue.revokeScFunc   = 'eth2wethRevoke';
          //   srcChainsValue.srcChainType   = 'ETH';
          //   srcChainsValue.dstChainType   = 'WAN';
          //   srcChainsValue.crossCollection    = this.config.crossCollection;
          //   srcChainsValue.normalCollection    = this.config.normalCollection;
          // }
          //   break;
          // case 'TOKEN':
          // {
          //   srcChainsValue.srcSCAddr      = tockenAddr;
          //   srcChainsValue.srcSCAddrKey   = tockenAddr;
          //   srcChainsValue.midSCAddr      = this.config.ethHtlcAddrE20;
          //   srcChainsValue.dstSCAddr      = this.config.wanHtlcAddrE20;
          //   srcChainsValue.dstSCAddrKey   = this.config.wanTokenAddress;
          //   srcChainsValue.srcAbi         = this.config.orgEthAbiE20;
          //   srcChainsValue.midSCAbi       = this.config.ethAbiE20;
          //   srcChainsValue.dstAbi         = this.config.wanAbiE20;
          //   srcChainsValue.srcKeystorePath= this.config.ethKeyStorePath ;
          //   srcChainsValue.dstKeyStorePath= this.config.wanKeyStorePath;
          //   srcChainsValue.approveClass   = 'CrossChainE20Approve';
          //   srcChainsValue.lockClass      = 'CrossChainE20Lock';
          //   srcChainsValue.redeemClass    = 'CrossChainE20Redeem';
          //   srcChainsValue.revokeClass    = 'CrossChainE20Revoke';
          //   srcChainsValue.normalTransClass    = 'NormalChainE20';
          //   srcChainsValue.approveScFunc  = 'approve';
          //   srcChainsValue.transferScFunc = 'transfer';
          //   srcChainsValue.lockScFunc     = 'inboundLock';
          //   srcChainsValue.redeemScFunc   = 'inboundRedeem';
          //   srcChainsValue.revokeScFunc   = 'inboundRevoke';
          //   srcChainsValue.srcChainType   = 'ETH';
          //   srcChainsValue.dstChainType   = 'WAN';
          //   srcChainsValue.crossCollection    = this.config.crossCollection;
          //   srcChainsValue.normalCollection    = this.config.normalCollection;
          //   srcChainsValue.token2WanRatio     = chainNameValue.token2WanRatio;
          // }
          //   break;
          case 'BTC':
          {
            srcChainsValue.srcSCAddr      = tockenAddr;   // BTC->WBTC, no source contract
            srcChainsValue.srcSCAddrKey   = tockenAddr;
            srcChainsValue.midSCAddr      = this.config.wanHtlcAddrBtc;
            srcChainsValue.dstSCAddr      = this.config.wanHtlcAddrBtc;
            srcChainsValue.dstSCAddrKey   = this.config.wbtcTokenAddress;
            srcChainsValue.buddySCAddr    = this.config.wbtcTokenAddress;
            srcChainsValue.srcAbi         = this.config.wanAbiBtc;
            srcChainsValue.midSCAbi       = this.config.wanAbiBtc;
            srcChainsValue.dstAbi         = this.config.wanAbiBtc;
            srcChainsValue.srcKeystorePath= this.config.btcKeyStorePath;
            srcChainsValue.dstKeyStorePath= this.config.wanKeyStorePath;
            srcChainsValue.approveClass   = '';
            srcChainsValue.lockClass      = 'CrossChainBtcLock';
            srcChainsValue.redeemClass    = 'CrossChainBtcRedeem';
            srcChainsValue.revokeClass    = 'CrossChainBtcRevoke';
            srcChainsValue.normalTransClass    = 'NormalChainBtc';
            srcChainsValue.approveScFunc  = 'approve';
            srcChainsValue.lockNoticeScFunc= 'btc2wbtcLockNotice';
            srcChainsValue.lockScFunc     = '';
            srcChainsValue.redeemScFunc   = 'btc2wbtcRedeem';
            srcChainsValue.revokeScFunc   = '';
            srcChainsValue.srcChainType   = 'BTC';
            srcChainsValue.dstChainType   = 'WAN';
            srcChainsValue.crossCollection  = this.config.crossCollectionBtc;
            // TODO: BTC may only use crossCollection!!!
            //srcChainsValue.normalCollection = this.config.normalCollection;
            srcChainsValue.normalCollection = this.config.crossCollectionBtc;
          }
            break;
            case 'EOS':
            {
              srcChainsValue.srcSCAddr      = tockenAddr;
              srcChainsValue.srcSCAddrKey   = tockenAddr;
              srcChainsValue.midSCAddr      = this.config.eosHtlcAddr;
              srcChainsValue.dstSCAddr      = this.config.wanHtlcAddrEos;
              srcChainsValue.dstSCAddrKey   = chainNameValue.buddy;
              srcChainsValue.buddySCAddr    = this.config.wanTokenAddress;
              srcChainsValue.srcAbi         = this.config.orgEosAbi;
              srcChainsValue.midSCAbi       = this.config.eosHtlcAbi;
              srcChainsValue.dstAbi         = this.config.wanHtlcAbiEos;
              srcChainsValue.srcKeystorePath= this.config.eosKeyStorePath;
              srcChainsValue.dstKeyStorePath= this.config.wanKeyStorePath;
              srcChainsValue.approveClass   = 'CrossChainEosApprove';
              srcChainsValue.lockClass      = 'CrossChainEosLock';
              srcChainsValue.redeemClass    = 'CrossChainEosRedeem';
              srcChainsValue.revokeClass    = 'CrossChainEosRevoke';
              srcChainsValue.normalTransClass = 'NormalChainEos';
              srcChainsValue.approveScFunc  = '';
              srcChainsValue.transferScFunc = 'transfer';
              srcChainsValue.lockScFunc     = 'inlock';
              srcChainsValue.redeemScFunc   = 'inUserRedeem';
              srcChainsValue.revokeScFunc   = 'inrevoke';
              srcChainsValue.srcChainType   = 'EOS';
              srcChainsValue.dstChainType   = 'WAN';
              srcChainsValue.crossCollection  = this.config.crossCollection;
              srcChainsValue.normalCollection = this.config.normalCollection;
              srcChainsValue.token2WanRatio   = chainNameValue.token2WanRatio;
            }
              break;
          default:
            break;
        }
        switch(chainNameValue.tokenType){
          // case 'ETH':
          // {
          //   srcChainsMapEth.set(srcChainsKey,srcChainsValue);
          //   break;
          // }
          case 'BTC':
          {
            srcChainsMapBtc.set(srcChainsKey,srcChainsValue);
            break;
          }
          case 'EOS':
          {
            srcChainsMapEos.set(srcChainsKey,srcChainsValue);
            break;
          }
          default:
          {
            break;
          }
        }

      }
    }
    // srcChainsMap.set('ETH',srcChainsMapEth);
    srcChainsMap.set('BTC',srcChainsMapBtc);
    srcChainsMap.set('EOS',srcChainsMapEos);

    // two-way bridge cross
    for (let chainType of this.tokenInfoMap.keys()) {
      if (['BTC', 'EOS'].includes(chainType)) {
        continue;
      }

      if (!srcChainsMap.has(chainType)) {
        srcChainsMap.set(chainType, new Map());
      }

      let srcChain = srcChainsMap.get(chainType);
      let tokens = this.tokenInfoMap.get(chainType);
      
      for (let tokenAddr of tokens.keys()) {
        let tokenInfo = tokens.get(tokenAddr);

        if (!srcChain.has(tokenAddr)) {
          srcChain.set(tokenAddr, {});
        }
        let tokenPairInfo = srcChain.get(tokenAddr);
        let tokenValue;

        if (tokenAddr === chainType) {
          // used for normal trans
          tokenPairInfo.srcSCAddr      = tokenAddr;
          tokenPairInfo.srcSCAddrKey   = tokenAddr;
          tokenPairInfo.srcAbi         = this.config.crossChainScDict[chainType].CONTRACT.tokenAbi;
          tokenPairInfo.srcKeystorePath= this.config.ethKeyStorePath ;
          tokenPairInfo.normalTransClass    = (tokenAddr === this.config.coinAddress || tokenAddr === chainType) ? 'NormalChainEth' : 'NormalChainE20';
          tokenPairInfo.transferScFunc = 'transfer';
          tokenPairInfo.srcChainType   = chainType;
          tokenPairInfo.normalCollection    = this.config.normalCollection;
  
          tokenPairInfo.tokenSymbol  = tokenInfo.tokenSymbol;
          tokenPairInfo.tokenStand   = tokenInfo.tokenStand;
          tokenPairInfo.useLocalNode = this.config.useLocalNode;
          tokenPairInfo.tokenDecimals = tokenInfo.tokenDecimals;
        } else {
          for(let id of tokenInfo.tokenPairID.values()) {
            tokenValue = {};
  
            tokenValue.tokenPairID    = id;
            tokenValue.srcSCAddr      = tokenAddr;
            tokenValue.srcSCAddrKey   = tokenAddr;
            tokenValue.midSCAddr      = this.config.crossChainScDict[chainType].CONTRACT.crossScAddr;
            tokenValue.dstSCAddr      = this.config.crossChainScDict[tokenInfo.buddyChain[id]].CONTRACT.crossScAddr;
            tokenValue.dstSCAddrKey   = tokenInfo.buddy[id];
            tokenValue.buddySCAddr    = tokenInfo.buddy[id];
            tokenValue.srcAbi         = this.config.crossChainScDict[chainType].CONTRACT.tokenAbi;
            tokenValue.midSCAbi       = this.config.crossChainScDict[chainType].CONTRACT.crossScAbi;
            tokenValue.dstAbi         = this.config.crossChainScDict[tokenInfo.buddyChain[id]].CONTRACT.crossScAbi;
            tokenValue.srcKeystorePath= this.config.ethKeyStorePath ;
            tokenValue.dstKeyStorePath= this.config.wanKeyStorePath;
            tokenValue.approveClass   = (chainType === 'WAN') ? crossClassDict[tokenInfo.buddyChain[id]][0] : crossClassDict[chainType][0];
            tokenValue.lockClass      = (chainType === 'WAN') ? crossClassDict[tokenInfo.buddyChain[id]][1] : crossClassDict[chainType][1];
            tokenValue.redeemClass    = (chainType === 'WAN') ? crossClassDict[tokenInfo.buddyChain[id]][2] : crossClassDict[chainType][2];
            tokenValue.revokeClass    = (chainType === 'WAN') ? crossClassDict[tokenInfo.buddyChain[id]][3] : crossClassDict[chainType][3];
            // tokenValue.normalTransClass    = (tokenAddr === this.config.coinAddress || tokenAddr === chainType) ? 'NormalChainEth' : 'NormalChainE20';
            tokenValue.normalTransClass    = 'NormalChainEth';
            tokenValue.approveScFunc  = 'approve';
            tokenValue.transferScFunc = 'transfer';
            tokenValue.crossMode      = 'Mint';
            tokenValue.lockScFunc     = this.config.crossChainScDict[chainType].FUNCTION.Mint.walletHtlc[0];
            tokenValue.redeemScFunc   = this.config.crossChainScDict[chainType].FUNCTION.Mint.walletHtlc[1];
            tokenValue.revokeScFunc   = this.config.crossChainScDict[chainType].FUNCTION.Mint.walletHtlc[2];
            tokenValue.fastLockScFunc = this.config.crossChainScDict[chainType].FUNCTION.Mint.walletRapid[0];
            tokenValue.srcChainType   = chainType;
            tokenValue.dstChainType   = tokenInfo.buddyChain[id];
            tokenValue.crossCollection    = this.config.crossCollection;
            tokenValue.normalCollection    = this.config.normalCollection;
            tokenValue.lockFee        = tokenInfo.fee[id].mintLockFee;
            tokenValue.revokeFee      = tokenInfo.fee[id].mintRevokeFee;
    
            tokenValue.tokenSymbol  = tokenInfo.tokenSymbol;
            tokenValue.tokenStand   = tokenInfo.tokenStand;
            tokenValue.useLocalNode = this.config.useLocalNode;
            tokenValue.tokenDecimals = tokenInfo.tokenDecimals;
  
            tokenPairInfo[id] = tokenValue;
          }
        }
      }
    }

    return srcChainsMap;
  };

  /**
   * Build destination chains info. It is similar to source chains info.
   * {@link CrossInvoker#inboundInfoMap [example for destination chains map]}
   * @returns {Map<string, MAP<string,Object>>}
   */
  initDstChainsMap(){

    let config            = this.config;
    let dstChainsMap      = new Map();

    // let dstChainsMapEth   = new Map();
    let dstChainsMapBtc   = new Map();
    let dstChainsMapEos   = new Map();

    for (let item of this.tokenInfoMap) {
      let dicValue = item[1];
      for(let chainName of dicValue){
        let tockenAddr      = chainName[0];
        let chainNameValue  = chainName[1];
        if(chainNameValue.tokenStand === 'WAN'){
          continue;
        }
        let srcChainsKey            = tockenAddr;
        let srcChainsValue          = {};

        srcChainsValue.tokenSymbol  = chainNameValue.tokenSymbol;
        srcChainsValue.tokenStand   = chainNameValue.tokenStand;
        srcChainsValue.useLocalNode = config.useLocalNode;
        srcChainsValue.tokenDecimals = chainNameValue.tokenDecimals;

        switch(chainNameValue.tokenStand){
          // case 'ETH':
          // {
          //   srcChainsValue.srcSCAddr      = config.wanHtlcAddr;
          //   srcChainsValue.srcSCAddrKey   = config.wanTokenAddress;
          //   srcChainsValue.midSCAddr      = config.wanHtlcAddr;
          //   srcChainsValue.dstSCAddr      = config.ethHtlcAddr;
          //   srcChainsValue.dstSCAddrKey   = tockenAddr;
          //   srcChainsValue.srcAbi         = config.HtlcWANAbi;
          //   srcChainsValue.midSCAbi       = config.HtlcWANAbi;
          //   srcChainsValue.dstAbi         = config.HtlcETHAbi;
          //   srcChainsValue.srcKeystorePath= config.wanKeyStorePath ;
          //   srcChainsValue.dstKeyStorePath= config.ethKeyStorePath;
          //   srcChainsValue.approveClass   = 'CrossChainEthApprove';
          //   srcChainsValue.lockClass      = 'CrossChainEthLock';
          //   srcChainsValue.redeemClass    = 'CrossChainEthRedeem';
          //   srcChainsValue.revokeClass    = 'CrossChainEthRevoke';
          //   srcChainsValue.normalTransClass = 'NormalChainEth';
          //   srcChainsValue.approveScFunc  = 'approve';

          //   srcChainsValue.transferScFunc = 'transfer';
          //   srcChainsValue.transferCoin   = false;         // true:WAN->WAN , false:WETH->WETH.
          //   srcChainsValue.tokenScAbi     = config.tokenScAbi;
          //   srcChainsValue.tokenScAddr    = config.tokenScAddr;

          //   srcChainsValue.lockScFunc     = 'weth2ethLock';
          //   srcChainsValue.redeemScFunc   = 'weth2ethRefund';
          //   srcChainsValue.revokeScFunc   = 'weth2ethRevoke';
          //   srcChainsValue.srcChainType   = 'WAN';
          //   srcChainsValue.dstChainType   = 'ETH';
          //   srcChainsValue.crossCollection    = this.config.crossCollection;
          //   srcChainsValue.normalCollection    = this.config.normalCollection;
          // }
          //   break;
          // case 'TOKEN':
          // {
          //   srcChainsValue.buddySCAddr    = chainNameValue.buddy;  // use for WAN approve
          //   srcChainsValue.srcSCAddr      = tockenAddr;            // use for contract parameter
          //   srcChainsValue.srcSCAddrKey   = config.wanTokenAddress;
          //   srcChainsValue.midSCAddr      = config.wanHtlcAddrE20;
          //   srcChainsValue.dstSCAddr      = config.ethHtlcAddrE20;
          //   srcChainsValue.dstSCAddrKey   = tockenAddr;
          //   srcChainsValue.srcAbi         = config.orgWanAbiE20;    // for approve
          //   srcChainsValue.midSCAbi       = config.wanAbiE20;       // for lock
          //   srcChainsValue.dstAbi         = config.ethAbiE20;
          //   srcChainsValue.srcKeystorePath= config.wanKeyStorePath ;
          //   srcChainsValue.dstKeyStorePath= config.ethKeyStorePath;
          //   srcChainsValue.approveClass   = 'CrossChainE20Approve';
          //   srcChainsValue.lockClass      = 'CrossChainE20Lock';
          //   srcChainsValue.redeemClass    = 'CrossChainE20Redeem';
          //   srcChainsValue.revokeClass    = 'CrossChainE20Revoke';
          //   srcChainsValue.normalTransClass    = 'NormalChainE20';
          //   srcChainsValue.approveScFunc  = 'approve';
          //   srcChainsValue.transferScFunc = 'transfer';
          //   srcChainsValue.lockScFunc     = 'outboundLock';
          //   srcChainsValue.redeemScFunc   = 'outboundRedeem';
          //   srcChainsValue.revokeScFunc   = 'outboundRevoke';
          //   srcChainsValue.srcChainType   = 'WAN';
          //   srcChainsValue.dstChainType   = 'ETH';
          //   srcChainsValue.crossCollection    = this.config.crossCollection;
          //   srcChainsValue.token2WanRatio     = chainNameValue.token2WanRatio;
          //   srcChainsValue.normalCollection    = this.config.normalCollection;
          // }
          //   break;
          case 'BTC':
          {
            //srcChainsValue.srcSCAddr      = chainNameValue.buddy;
            srcChainsValue.srcSCAddr      = config.wanHtlcAddrBtc;
            srcChainsValue.srcSCAddrKey   = chainNameValue.buddy;
            srcChainsValue.midSCAddr      = config.wanHtlcAddrBtc;  // WBTC->BTC, no dst contract
            srcChainsValue.dstSCAddr      = config.wanHtlcAddrBtc;
            srcChainsValue.dstSCAddrKey   = tockenAddr;
            srcChainsValue.srcAbi         = config.wanAbiBtc;
            srcChainsValue.midSCAbi       = config.wanAbiBtc;
            srcChainsValue.dstAbi         = config.wanAbiBtc;
            srcChainsValue.srcKeystorePath= config.wanKeyStorePath ;
            srcChainsValue.dstKeyStorePath= config.btcKeyStorePath;
            srcChainsValue.approveClass   = '';
            srcChainsValue.lockClass      = 'CrossChainBtcLock';
            srcChainsValue.redeemClass    = 'CrossChainBtcRedeem';
            srcChainsValue.revokeClass    = 'CrossChainBtcRevoke';
            srcChainsValue.normalTransClass    = 'NormalChainBtc';
            srcChainsValue.approveScFunc  = 'approve';
            srcChainsValue.lockScFunc     = 'wbtc2btcLock';
            srcChainsValue.redeemScFunc   = '';
            srcChainsValue.revokeScFunc   = 'wbtc2btcRevoke';
            srcChainsValue.srcChainType   = 'WAN';
            srcChainsValue.dstChainType   = 'BTC';
            srcChainsValue.crossCollection    = this.config.crossCollectionBtc;
            // TODO: BTC may only use crossCollection!!!
            srcChainsValue.normalCollection    = this.config.normalCollection;
          }
            break;
          case 'EOS':
            {
              srcChainsValue.buddySCAddr    = chainNameValue.buddy;  // use for WAN approve
              srcChainsValue.srcSCAddr      = tockenAddr;            // use for contract parameter
              srcChainsValue.srcSCAddrKey   = chainNameValue.buddy;
              srcChainsValue.midSCAddr      = config.wanHtlcAddrEos;
              srcChainsValue.dstSCAddr      = config.eosHtlcAddr;
              srcChainsValue.dstSCAddrKey   = tockenAddr;
              srcChainsValue.srcAbi         = config.weosAbi;    // for approve
              srcChainsValue.midSCAbi       = config.wanHtlcAbiEos;       // for lock
              srcChainsValue.dstAbi         = config.eosHtlcAbi;
              srcChainsValue.srcKeystorePath= config.wanKeyStorePath ;
              srcChainsValue.dstKeyStorePath= config.eosKeyStorePath;
              srcChainsValue.approveClass   = 'CrossChainEosApprove';
              srcChainsValue.lockClass      = 'CrossChainEosLock';
              srcChainsValue.redeemClass    = 'CrossChainEosRedeem';
              srcChainsValue.revokeClass    = 'CrossChainEosRevoke';
              srcChainsValue.normalTransClass = 'NormalChainEos';
              srcChainsValue.approveScFunc  = 'approve';
              srcChainsValue.transferScFunc = 'transfer';
              srcChainsValue.lockScFunc     = 'outUserLock';
              srcChainsValue.redeemScFunc   = 'outredeem';
              srcChainsValue.revokeScFunc   = 'outUserRevoke';
              srcChainsValue.srcChainType   = 'WAN';
              srcChainsValue.dstChainType   = 'EOS';
              srcChainsValue.crossCollection  = this.config.crossCollection;
              srcChainsValue.token2WanRatio   = chainNameValue.token2WanRatio;
              srcChainsValue.normalCollection = this.config.normalCollection;
            }
              break;
  
          default:
            break;
        }

        switch(chainNameValue.tokenType){
          // case 'ETH':
          // {
          //   dstChainsMapEth.set(srcChainsKey,srcChainsValue);
          //   break;
          // }
          case 'BTC':
          {
            dstChainsMapBtc.set(srcChainsKey,srcChainsValue);
            break;
          }
          case 'EOS':
          {
            dstChainsMapEos.set(srcChainsKey,srcChainsValue);
            break;
          }
          default:
          {
            break;
          }
        }
      }
    }

    // dstChainsMap.set('ETH',dstChainsMapEth);
    dstChainsMap.set('BTC',dstChainsMapBtc);
    dstChainsMap.set('EOS',dstChainsMapEos);

    // two-way bridge cross
    for (let chainType of this.tokenInfoMap.keys()) {
      if (['BTC', 'EOS'].includes(chainType)) {
        continue;
      }

      if (!dstChainsMap.has(chainType)) {
        dstChainsMap.set(chainType, new Map());
      }

      let dstChain = dstChainsMap.get(chainType);
      let tokens = this.tokenInfoMap.get(chainType);
      
      for (let tokenAddr of tokens.keys()) {
        if (tokenAddr !== chainType) {
          let tokenInfo = tokens.get(tokenAddr);
          if (!dstChain.has(tokenAddr)) {
            dstChain.set(tokenAddr, {});
          }
          let tokenPairInfo = dstChain.get(tokenAddr);
          let tokenValue;

          for(let id of tokenInfo.tokenPairID.values()) {
            tokenValue = {};
  
            tokenValue.tokenPairID    = tokenInfo.tokenPairID;
            tokenValue.srcSCAddr      = tokenInfo.buddy[id];
            tokenValue.srcSCAddrKey   = tokenInfo.buddy[id];
            tokenValue.midSCAddr      = this.config.crossChainScDict[tokenInfo.buddyChain[id]].CONTRACT.crossScAddr;
            tokenValue.dstSCAddr      = this.config.crossChainScDict[chainType].CONTRACT.crossScAddr;
            tokenValue.dstSCAddrKey   = tokenAddr;
            tokenValue.srcAbi         = this.config.crossChainScDict[tokenInfo.buddyChain[id]].CONTRACT.tokenAbi;
            tokenValue.midSCAbi       = this.config.crossChainScDict[tokenInfo.buddyChain[id]].CONTRACT.crossScAbi;
            tokenValue.dstAbi         = this.config.crossChainScDict[chainType].CONTRACT.crossScAbi;
            tokenValue.srcKeystorePath= this.config.wanKeyStorePath ;
            tokenValue.dstKeyStorePath= this.config.ethKeyStorePath;
            tokenValue.approveClass   = (chainType === 'WAN') ? crossClassDict[tokenInfo.buddyChain[id]][0] : crossClassDict[chainType][0];
            tokenValue.lockClass      = (chainType === 'WAN') ? crossClassDict[tokenInfo.buddyChain[id]][1] : crossClassDict[chainType][1];
            tokenValue.redeemClass    = (chainType === 'WAN') ? crossClassDict[tokenInfo.buddyChain[id]][2] : crossClassDict[chainType][2];
            tokenValue.revokeClass    = (chainType === 'WAN') ? crossClassDict[tokenInfo.buddyChain[id]][3] : crossClassDict[chainType][3];
            // tokenValue.normalTransClass    = (tokenAddr === this.config.coinAddress || tokenAddr === chainType) ? 'NormalChainEth' : 'NormalChainE20';
            tokenValue.normalTransClass    = 'NormalChainEth';
            tokenValue.approveScFunc  = 'approve';
            tokenValue.transferScFunc = 'transfer';
            tokenValue.crossMode      = 'Burn';
            tokenValue.lockScFunc     = this.config.crossChainScDict[tokenInfo.buddyChain[id]].FUNCTION.Burn.walletHtlc[0];
            tokenValue.redeemScFunc   = this.config.crossChainScDict[tokenInfo.buddyChain[id]].FUNCTION.Burn.walletHtlc[1];
            tokenValue.revokeScFunc   = this.config.crossChainScDict[tokenInfo.buddyChain[id]].FUNCTION.Burn.walletHtlc[2];
            tokenValue.fastLockScFunc = this.config.crossChainScDict[tokenInfo.buddyChain[id]].FUNCTION.Burn.walletRapid[0];
            tokenValue.srcChainType   = tokenInfo.buddyChain[id];
            tokenValue.dstChainType   = chainType;
            tokenValue.crossCollection    = this.config.crossCollection;
            tokenValue.normalCollection    = this.config.normalCollection;
            tokenValue.lockFee        = tokenInfo.fee[id].burnLockFee;
            tokenValue.revokeFee      = tokenInfo.fee[id].burnRevokeFee;
    
            tokenValue.tokenSymbol  = tokenInfo.tokenSymbol;
            tokenValue.tokenStand   = tokenInfo.tokenStand;
            tokenValue.useLocalNode = this.config.useLocalNode;
            tokenValue.tokenDecimals = tokenInfo.tokenDecimals;
  
            tokenPairInfo[id] = tokenValue;
          }
        }
      }
    }

    return dstChainsMap;
  };

  /**
   * Check the chainName whether in source chain Map or not , if yes, the cross chain is chainName->'WAN'</br>
   * @param {Object} chainName   - {@link CrossInvoker#tokenInfoMap chainName} ,chainName[0] the contract address of
   * coin or token; chainName[1] the value of toke or coin chain's info.
   * @returns {boolean}
   * true: In source chains map, the destination chain is 'WAN'</br>
   * false: Not in source chains map.
   */
  isInSrcChainsMap(chainName, tokenPairID){
    let keyTemp   = chainName[0];
    let valueTemp = chainName[1];
    let chainType = valueTemp.tokenType;

    if(this.inboundInfoMap.has(chainType)){
      let  subMap = this.inboundInfoMap.get(chainType);
      if(subMap.has(keyTemp)){
        if((!tokenPairID && !valueTemp.hasOwnProperty('tokenPairID'))
        || (tokenPairID && subMap.get(keyTemp).hasOwnProperty(tokenPairID))) {
          return true;
        } else {
          return false;
        }
      }
    }
    return false;
  }
  /**
   * Check the chainName whether in destination chain Map or not , if yes, the cross chain is 'WAN'>chainName</br>
   * @param {Object} chainName   - {@link CrossInvoker#tokenInfoMap chainName} ,chainName[0] the contract address of
   * coin or token; chainName[1] the value of toke or coin chain's info.
   * @returns {boolean}
   * true: In destination chains map, the source chain is 'WAN'</br>
   * false: Not in destination chains map.
   */
  isInDstChainsMap(chainName){
    let keyTemp   = chainName[0];
    let valueTemp = chainName[1];
    let chainType = valueTemp.tokenType;

    if(this.outboundInfoMap.has(chainType)){
      let  subMap = this.outboundInfoMap.get(chainType);
      if(subMap.has(keyTemp)){
        return true;
      }
    }
    return false;
  }

  getRegTokens(crossChain) {
    return this.tokens[crossChain];
  };

  /**
   * Get the source chains info. supported by system.
   * @returns {Promise<Map|*>} similar to {@link CrossInvoker#tokenInfoMap this}
   */
  async getSrcChainName(){
    try{
      // await this.freshErc20Symbols();
      // await this.freshEosSymbols();
      return this.tokenInfoMap;
    }catch(err){
      logger.debug("getSrcChainName error:",err);
      //process.exit();
    }
  };

  /**
   * Get the destination chains info. after SDK users have selected the source chain.</br>
   * @param {Object}selectedSrcChainName  - {@link CrossInvoker#tokenInfoMap selectedSrcChainName} ,selectedSrcChainName[0] the contract address of
   * coin or token; selectedSrcChainName[1] the value of toke or coin chain's info.
   * @returns {Map<string, Map<string,Object>>} similar to {@link CrossInvoker#tokenInfoMap this}
   */
  getDstChainName(selectedSrcChainName){
    try{
      let ret = new Map();
      if(selectedSrcChainName[1].tokenType !== 'WAN'){
        ret.set('WAN',this.tokenInfoMap.get('WAN'));
      }else{
        // get new TOKEN symbols
        // update delete or insert TOKEN symbols in the old chainsName
        // update delete or insert TOKEN symbols in srcChainName and  dstChainName
        //await this.freshErc20Symbols();
        for(let item of this.tokenInfoMap){
          if(item[0] !== 'WAN'){
            ret.set(item[0],item[1]);
          }
        }
      }
      return ret;
    }catch(err){
      logger.error("getDstChainName error:",err);
      //process.exit();
    }
  };

  /**
   * Because during the system running, there is no Erc20 symbols added or deleted. </br>
   * system can process this scenario automatically.
   * @returns {Promise<void>}
   */
  async freshErc20Symbols(){
    let crossChain = 'ETH';
    logger.debug("Entering freshErc20Symbols");
    try{
      let tokensE20New      = await ccUtil.getRegTokensFromRPC(crossChain);
      logger.debug("freshErc20Symbols new tokens: \n",tokensE20New);
      logger.debug("freshErc20Symbols old tokens: \n",this.tokens['ETH']);

      let tokenAdded     = ccUtil.differenceABTokens(tokensE20New,this.tokens['ETH']);
      let tokenDeleted   = ccUtil.differenceABTokens(this.tokens['ETH'],tokensE20New);
      logger.info("tokenAdded size: freshErc20Symbols:", tokenAdded.length,tokenAdded);
      logger.info("tokenDeleted size: freshErc20Symbols:",tokenDeleted.length,tokenDeleted);
      let chainsNameMapEth = this.tokenInfoMap.get('ETH');
      if(tokenAdded.length !== 0){
        for(let token of tokenAdded.values()){
          // Add token
          let keyTemp;
          let valueTemp             = {};
          keyTemp                   = token.tokenOrigAddr;
          valueTemp.tokenSymbol     = token.symbol;
          valueTemp.tokenStand      = 'TOKEN';
          valueTemp.tokenType       = 'ETH';
          valueTemp.buddy           = token.tokenWanAddr;
          valueTemp.storemenGroup   = [];
          valueTemp.token2WanRatio  = token.ratio;
          valueTemp.tokenDecimals   = token.decimals;

          chainsNameMapEth.set(keyTemp, valueTemp);
        }
      } else {
        logger.info("freshErc20Symbols no new symbols added");
      }
      if(tokenDeleted.length !== 0){
        for(let token of tokenAdded.values()){
          // delete token
          let keyTemp;
          keyTemp                 = token.tokenOrigAddr;
          chainsNameMapEth.delete(keyTemp);
        }
      }else{
        logger.info("freshErc20Symbols no new symbols deleted!");
      }
      // reinitialize the inboundInfoMap and outboundInfoMap
      if(tokenDeleted.length !== 0 || tokenAdded.length !== 0){
        this.inboundInfoMap         = this.initSrcChainsMap();
        this.outboundInfoMap         = this.initDstChainsMap();
      }
    }catch(err){
      logger.error("freshErc20Symbols error:",err);
      //process.exit();
    }
  };

  /**
   * Because during the system running, there is no Eos symbols added or deleted. </br>
   * system can process this scenario automatically.
   * @returns {Promise<void>}
   */
  async freshEosSymbols(){
    let crossChain = 'EOS';
    logger.debug("Entering freshEosSymbols");
    try{
      let tokensEosNew      = await ccUtil.getRegTokensFromRPC(crossChain);
      for(let token of tokensEosNew){
        token.tokenOrigAddr = ccUtil.decodeAccount(crossChain, token.tokenOrigAccount);
      }
      logger.debug("freshEosSymbols new tokens: \n",tokensEosNew);
      logger.debug("freshEosSymbols old tokens: \n",this.tokens['EOS']);

      let tokenAdded     = ccUtil.differenceABTokens(tokensEosNew,this.tokens['EOS']);
      let tokenDeleted   = ccUtil.differenceABTokens(this.tokens['EOS'],tokensEosNew);
      logger.info("tokenAdded size: freshEosSymbols:", tokenAdded.length,tokenAdded);
      logger.info("tokenDeleted size: freshEosSymbols:",tokenDeleted.length,tokenDeleted);
      let chainsNameMapEos = this.tokenInfoMap.get('EOS');
      if(tokenAdded.length !== 0){
        for(let token of tokenAdded.values()){
          // Add token
          let keyTemp;
          let valueTemp             = {};
          keyTemp                   = token.tokenOrigAccount;
          valueTemp.tokenSymbol     = token.symbol;
          valueTemp.tokenStand      = 'EOS';
          valueTemp.tokenType       = 'EOS';
          valueTemp.tokenOrigAddr   = token.tokenOrigAddr.split(':')[0];
          valueTemp.buddy           = token.tokenWanAddr;
          valueTemp.storemenGroup   = [];
          valueTemp.token2WanRatio  = token.ratio;
          valueTemp.tokenDecimals   = token.decimals;

          chainsNameMapEos.set(keyTemp, valueTemp);
        }
      } else {
        logger.info("freshEosSymbols no new symbols added");
      }
      if(tokenDeleted.length !== 0){
        for(let token of tokenAdded.values()){
          // delete token
          let keyTemp;
          keyTemp                 = token.tokenOrigAddr.split(':')[1];
          chainsNameMapEos.delete(keyTemp);
        }
      }else{
        logger.info("freshEosSymbols no new symbols deleted!");
      }
      // reinitialize the inboundInfoMap and outboundInfoMap
      if(tokenDeleted.length !== 0 || tokenAdded.length !== 0){
        this.inboundInfoMap         = this.initSrcChainsMap();
        this.outboundInfoMap         = this.initDstChainsMap();
      }
    }catch(err){
      logger.error("freshEosSymbols error:",err);
      //process.exit();
    }
  };

  /**
   * When users provide source chain, and destination chain. System can get the right keystore path </br>
   * for future use in cross chain process.
   * @param {Object}  srcChainName  - {@link CrossInvoker#tokenInfoMap srcChainName} ,srcChainName[0] the contract address of
   * coin or token; srcChainName[1] the value of toke or coin chain's info.
   * @param {Object}  dstChainName - {@link CrossInvoker#tokenInfoMap dstChainName} ,dstChainName[0] the contract address of
   * coin or token; dstChainName[1] the value of toke or coin chain's info.
   * @returns {Array}
   */
  getKeyStorePaths(srcChainName,dstChainName){
    let valueTemp = srcChainName[1];
    let keyStorePaths = [];
    switch(valueTemp.tokenStand){
      case 'WAN':
      {
        keyStorePaths.push({path:config.wanKeyStorePath,type:valueTemp.tokenStand });
      }
        break;
      case 'TOKEN':
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
      case 'TOKEN':
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

  /**
   * Get the buddy contract address, in chain info., there is two contract address. One is contract address</br>
   * on the chain, for example ZRX is ERC20 token,ZRX token has a contract address on ETH chain; The other </br>
   * contract address for token ZRX is  the contract address on WAN chain.Here the buddy contract address is the</br>
   * second contract address. System does not support get contract address on ETH by contract address on WAN</br>
   * @param {sting} contractAddr  - The coin or token's contract address,unique representing a coin or token.
   * @param {string} chainType    - enum {'ETH','WAN','BTC'}
   * @returns {string}            - The buddy address of coin or token's contract address.
   */
  getKeyByBuddyContractAddr(contractAddr,chainType){
    let chainNameSubMap =  this.tokenInfoMap.get(chainType);
    for(let chainsNameItem of chainNameSubMap){
      if(chainsNameItem[1].buddy === contractAddr){
        return chainsNameItem[0];
      }
    }
    return null;
  };

  /**
   * Build the right storeman group list by srcChainName and dstChainName.</br>
   * Since each storeman group has two address, one is the address on ETH chain, the other address is on WAN.</br>
   * System can get the right address by below two parameters.
   * @param {Object}  srcChainName  - {@link CrossInvoker#tokenInfoMap srcChainName} ,srcChainName[0] the contract address of
   * coin or token; srcChainName[1] the value of toke or coin chain's info.
   * @param {Object}  dstChainName - {@link CrossInvoker#tokenInfoMap dstChainName} ,dstChainName[0] the contract address of
   * coin or token; dstChainName[1] the value of toke or coin chain's info.
   * @returns {Promise<Array>}
   */
  async getStoremanGroupList(srcChainName,dstChainName){

    try{
      let valueSrcTemp      = srcChainName[1];
      let valueDstTemp      = dstChainName[1];

      let keySrcTemp        = srcChainName[0];
      let keyDstTemp        = dstChainName[0];

      let storemanGroupListResult  = [];

      if (this.isInSrcChainsMap(srcChainName)){
        // destination is WAN
        // build StoremenGroupList src address list
        // get latest storemengroup

        switch(valueSrcTemp.tokenStand){
          case 'ETH':
          {
            valueSrcTemp.storemenGroup = await ccUtil.getSmgList('ETH');
            break;
          }
          case 'TOKEN':
          {
            valueSrcTemp.storemenGroup = await ccUtil.syncTokenStoremanGroups('ETH', keySrcTemp);
            break;
          }
          case 'BTC':
          {
            valueSrcTemp.storemenGroup = await ccUtil.getSmgList('BTC');
            break;
          }
          case 'EOS':
          {
            valueSrcTemp.storemenGroup = await ccUtil.syncTokenStoremanGroups('EOS', keySrcTemp);
            break;
          }
          default:
          {
            break;
          }
        }

        for(let itemOfStoreman of valueSrcTemp.storemenGroup){
          switch(valueSrcTemp.tokenStand){
            case 'ETH':
            {
              itemOfStoreman.storemenGroupAddr = itemOfStoreman.ethAddress;
              break;
            }
            case 'TOKEN':
            {
              //itemOfStoreman.storemenGroupAddr = itemOfStoreman.smgOriginalChainAddress;
              itemOfStoreman.storemenGroupAddr = itemOfStoreman.smgOrigAddr;
              break;
            }
            case 'BTC':
            {
              itemOfStoreman.storemenGroupAddr = itemOfStoreman.btcAddress;
              break;
            }
            case 'EOS':
            {
              itemOfStoreman.storemenGroupAddr = itemOfStoreman.storemanGroup;
              itemOfStoreman.pk = itemOfStoreman.storemanGroup;
              break;
            }
            default:
            {
              itemOfStoreman.storemenGroupAddr = itemOfStoreman.ethAddress;
              break;
            }
          }
          storemanGroupListResult.push(itemOfStoreman);
        }
      }else{
        if(this.isInDstChainsMap(dstChainName)){
          // source is WAN
          // build StoremenGroupList dst address list
          // get latest storemengroup

          switch(valueDstTemp.tokenStand){
            case 'ETH':
            {
              valueDstTemp.storemenGroup = await ccUtil.getSmgList('ETH');
              break;
            }
            case 'TOKEN':
            {
              valueDstTemp.storemenGroup = await ccUtil.syncTokenStoremanGroups('ETH', keyDstTemp);
              break;
            }
            case 'BTC':
            {
              valueDstTemp.storemenGroup = await ccUtil.getSmgList('BTC');
              break;
            }
            case 'EOS':
            {
              valueDstTemp.storemenGroup = await ccUtil.syncTokenStoremanGroups('EOS', keyDstTemp);
              break;
            }
            default:
            {
              break;
            }
          }

          for(let itemOfStoreman of valueDstTemp.storemenGroup){
            switch(valueDstTemp.tokenStand){
              case 'ETH':
              {
                itemOfStoreman.storemenGroupAddr = itemOfStoreman.wanAddress;
                break;
              }
              case 'TOKEN':
              {
                //itemOfStoreman.storemenGroupAddr = itemOfStoreman.storemanGroup;
                itemOfStoreman.storemenGroupAddr = itemOfStoreman.smgWanAddr;
                break;
              }
              case 'BTC':
              {
                itemOfStoreman.storemenGroupAddr = itemOfStoreman.btcAddress;
                break;
              }
              case 'EOS':
              {
                itemOfStoreman.storemenGroupAddr = itemOfStoreman.storemanGroup;
                itemOfStoreman.pk = itemOfStoreman.storemanGroup;
                break;
              }
              default:
              {
                itemOfStoreman.storemenGroupAddr = itemOfStoreman.wanAddress;
                break;
              }
            }
            storemanGroupListResult.push(itemOfStoreman);
          }
        }else{
          logger.error("getStoremanGroupList error: not in inboundMap and not in outboundMap");
          //process.exit();
        }
      }
      return storemanGroupListResult;
    }catch(err){
      logger.error("getStoremanGroupList error:",err);
      //process.exit();
    }
  };

    /**
   * Only for normal transaction, Get the chain info by contract address, and the chainType.</br>
   * First, system search  value in two layer MAP by chainType. </br>
   * Second, system search value in the second layer, and get the right info. of chain</br>
   * @param {string} contractAddr -  The contract address
   * @param {string} chainType    -  enum {'ETH','WAN','BTC'}
   * @returns {Object}            -  Item of {CrossInvoke#tokenInfoMap}TokenInfoMap
   */
  async getChainInfoByContractAddr(contractAddr,chainType, tokenPairID = null){
    try {
      if(this.tokenInfoMap.has(chainType) === false){
        return null;
      }
      let subMap = this.tokenInfoMap.get(chainType);
      let tokenAddr = (contractAddr === chainType) ? contractAddr : contractAddr.toLowerCase();
      if (subMap.has(tokenAddr)) {
        let chainsNameItem = subMap.get(tokenAddr);
        if (tokenPairID) {
          if (chainsNameItem.tokenPairID.includes(tokenPairID)) {
            return [tokenAddr, chainsNameItem];
          }
        } else {
          return [tokenAddr, chainsNameItem];
        }
      } else {
        //when do normal token transfer , tokenPairID is null 
        if (!tokenPairID) {
          let tokenInfo = await ccUtil.getTokenInfo(contractAddr, chainType);
          let chainName = {};
          chainName.tokenName = tokenInfo.name;
          chainName.tokenSymbol = tokenInfo.symbol;
          chainName.tokenStand = 'TOKEN';
          chainName.tokenType = chainType;
          chainName.tokenOrigAddr = contractAddr;
          chainName.tokenDecimals = tokenInfo.decimals;
  
          subMap.set(tokenAddr, chainName);
          return [tokenAddr, chainName];
        }
      }
      return null;
    } catch(err) {
      return null;
    }
  };

  /**
   * Get the chain info by contract address, and the chainType.</br>
   * First, system search  value in two layer MAP by chainType. </br>
   * Second, system search value in the second layer, and get the right info. of chain</br>
   * @param {string} contractAddr -  The contract address
   * @param {string} chainType    -  enum {'ETH','WAN','BTC'}
   * @returns {Object}            -  Item of {CrossInvoke#tokenInfoMap}TokenInfoMap
   */
  getSrcChainNameByContractAddr(contractAddr,chainType, tokenPairID = null){
    // logger.debug("contractAddr",contractAddr);
    // logger.debug("chainType",chainType);
    if(this.tokenInfoMap.has(chainType) === false){
      return null;
    }
    let subMap = this.tokenInfoMap.get(chainType);
    let tokenAddr = (contractAddr === chainType) ? contractAddr : contractAddr.toLowerCase();
    if (subMap.has(tokenAddr)) {
      let chainsNameItem = subMap.get(tokenAddr);
      if (tokenPairID) {
        if (chainsNameItem.hasOwnProperty('tokenPairID') && chainsNameItem.tokenPairID.includes(tokenPairID)) {
          return [tokenAddr, chainsNameItem];
        } else {
          return null;
        }
      } else {
        return [tokenAddr, chainsNameItem];
      }
    }
    // for(let chainsNameItem of subMap){
    //   if(chainsNameItem[0].toLowerCase() === contractAddr.toLowerCase()){
    //     if (tokenPairID) {
    //       if (chainsNameItem[1].tokenPairID.includes(tokenPairID)) {
    //         return chainsNameItem;
    //       }
    //     } else {
    //       return chainsNameItem;
    //     }
    //   }
    // }
    return null;
  };

    /**
   * Get the configuration used during normal trans.</br>
   * @param {Object}  srcChainName  - {@link CrossInvoker#tokenInfoMap srcChainName} ,srcChainName[0] the contract address of
   * coin or token; srcChainName[1] the value of toke or coin chain's info.
   * @param {Object}  dstChainName - {@link CrossInvoker#tokenInfoMap dstChainName} ,dstChainName[0] the contract address of
   * coin or token; dstChainName[1] the value of toke or coin chain's info.
   */
  getInvokerConfig(srcChainName, dstChainName = null) {
    let config = {};
    //logger.debug("this.inboundInfoMap:",this.inboundInfoMap);
    if (srcChainName){
      let keyTemp   = srcChainName[0];
      let chainType   = srcChainName[1].tokenType;

      if(this.inboundInfoMap.has(chainType)){
        let subMap = this.inboundInfoMap.get(chainType);
        if(subMap.has(keyTemp)){
          if (['BTC', 'EOS'].includes(chainType) || chainType === srcChainName[0]) {
            config = subMap.get(srcChainName[0]);
          } else {
            config = Object.values(subMap.get(srcChainName[0]))[0];
          }
        } else {
          config = subMap.get(chainType);
          Object.assign(config, srcChainName[1]);
          config.srcSCAddr = srcChainName[0];
          config.srcSCAddrKey = srcChainName[0];
        }
      }
    }
    return config;
  };

  /**
   * Get the configuration used during cross chain.</br>
   * @param {Object}  srcChainName  - {@link CrossInvoker#tokenInfoMap srcChainName} ,srcChainName[0] the contract address of
   * coin or token; srcChainName[1] the value of toke or coin chain's info.
   * @param {Object}  dstChainName - {@link CrossInvoker#tokenInfoMap dstChainName} ,dstChainName[0] the contract address of
   * coin or token; dstChainName[1] the value of toke or coin chain's info.
   */
  getCrossInvokerConfig(srcChainName, dstChainName, tokenPairID = null) {
    let config = {};
    //logger.debug("this.inboundInfoMap:",this.inboundInfoMap);
    if (srcChainName && this.isInSrcChainsMap(srcChainName, tokenPairID)){
      // destination is WAN
      let chainType   = srcChainName[1].tokenType;
      let subMap      = this.inboundInfoMap.get(chainType);

      if (tokenPairID) {
        let tokenPairs = subMap.get(srcChainName[0]);
        if (tokenPairs.hasOwnProperty(tokenPairID)) {
          config = tokenPairs[tokenPairID];
        } else {
          logger.error("invoke error! Not in inboundMap and not in outboundMap!");
          logger.error("srcChainName: ", srcChainName);
          logger.error("dstChainName: ", dstChainName);
          //process.exit();
        }
      } else {
        if (['BTC', 'EOS'].includes(chainType) || chainType === srcChainName[0]) {
          config = subMap.get(srcChainName[0]);
        } else {
          config = Object.values(subMap.get(srcChainName[0]))[0];
        }
      }
    } else {
      if (dstChainName && this.isInDstChainsMap(dstChainName)) {
        // source is WAN
        let chainType = dstChainName[1].tokenType;
        let subMap    = this.outboundInfoMap.get(chainType);

        if (tokenPairID) {
          let tokenPairs = subMap.get(dstChainName[0]);
          if (tokenPairs.hasOwnProperty(tokenPairID)) {
            config = tokenPairs[tokenPairID];
          } else {
            logger.error("invoke error! Not in inboundMap and not in outboundMap!");
            logger.error("srcChainName: ", srcChainName);
            logger.error("dstChainName: ", dstChainName);
            //process.exit();
          }
        } else {
          if (['BTC', 'EOS'].includes(chainType) || chainType === dstChainName[0]) {
            config = subMap.get(dstChainName[0]);
          } else {
            config = Object.values(subMap.get(dstChainName[0]))[0];
          }   
        }
      } else {
        logger.error("invoke error! Not in inboundMap and not in outboundMap!");
        logger.error("srcChainName: ", srcChainName);
        logger.error("dstChainName: ", dstChainName);
        //process.exit();
      }
    }
    return config;
  };

  /**
   * Get the class, invoke this class's function run, users can finish cross chain.
   * @param {Object}  crossInvokerConfig  - The config used for cross chain.{@link CrossChain#config config example}
   * @param {string} action               - enum {'APPROVE','LOCK','REDEEM','REVOKE'}
   * @returns {CrossChain}                - Class name used for cross chain.
   */
  getCrossInvokerClass(crossInvokerConfig, action){
    /**
     * enum {'APPROVE','LOCK','REDEEM','REVOKE'}
     * @type {string}
     */
    let ACTION = action.toString().toUpperCase();
    let invokeClass = null;
    switch(ACTION){
      case 'LOCK':
      {
        invokeClass = crossInvokerConfig.lockClass;
      }
        break;

      case 'REDEEM':
      {
        invokeClass = crossInvokerConfig.redeemClass;
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
        logger.debug("Error action! ", ACTION);
      }
    }
    return invokeClass;
  };

  /**
   * Get invoker which includes class, input, config ,this invoker used to finish cross chain.
   * @param {string} crossInvokerClass     - Class name used for cross chain.
   * @param {Object} crossInvokerInput     - Input of final users.(gas, gasPrice, value and so on) {@link CrossChain#input input example}
   * @param crossInvokerConfig             - The config used for cross chain.{@link CrossChain#config config example}
   * @returns {CrossChain}                 - Object used to finish cross chain.
   */
  getInvoker(crossInvokerClass, crossInvokerInput, crossInvokerConfig){
    let invoke = eval(`new ${crossInvokerClass}(crossInvokerInput,crossInvokerConfig)`);
    return invoke;
  }

  /**
   * Users provide source chain info., destination chain info., and the action,input(amount, gas,gas limit..)</br>
   * 1) SDK build the configuration</br>
   * 2) SDK get the invoke class</br>
   * 3) SDK generate invoker</br>
   * 4) SDK call run function of invoker to finish cross chain.</br>
   * @param {Object}  srcChainName  - {@link CrossInvoker#tokenInfoMap srcChainName} ,srcChainName[0] the contract address of
   * coin or token; srcChainName[1] the value of toke or coin chain's info.
   * @param {Object}  dstChainName - {@link CrossInvoker#tokenInfoMap dstChainName} ,dstChainName[0] the contract address of
   * coin or token; dstChainName[1] the value of toke or coin chain's info.
   * @param {string} action         -  enum {'APPROVE','LOCK','REDEEM','REVOKE'}
   * @param {Object}input           -  Input of final users.(gas, gasPrice, value and so on) {@link CrossChain#input input example}
   * @returns {Promise<*>}
   */
  async invoke(srcChainName, dstChainName, action, input, isSend = true){
    let config      = this.getCrossInvokerConfig(srcChainName,dstChainName, input.tokenPairID);
    let ACTION      = action.toString().toUpperCase();
    let invokeClass = null;

    if (!global.crossChainReady) {
      // throw new Error("Cross-chain functionality isn't ready");
    }

    switch(ACTION){
      case 'LOCK':
      {
        invokeClass = config.lockClass;
      }
        break;

      case 'REDEEM':
      {
        invokeClass = config.redeemClass;
      }
        break;
      case 'REVOKE':
      {
        invokeClass = config.revokeClass;
      }
        break;
      case 'APPROVE':
      {
        invokeClass = config.approveClass;
      }
        break;
      default:
      {
        logger.debug("Error action! ", ACTION);
        //process.exit();
      }
    }
    logger.info("ACTION is : ", ACTION);
    logger.info("invoke class : ", invokeClass);
    let invoke = eval(`new ${invokeClass}(input,config)`);
    let ret = await invoke.run(isSend);
    return ret;
  }

  /**
   * This function is used to transfer coin or token on the same chain.</br>
   * Source chain name and destination chain name is same.</br>
   * For example:</br>
   * ETH->ETH, ETH(ZRX)->ETH(ZRX),WAN->WAN</br>
   * @param {Object}  srcChainName  - {@link CrossInvoker#tokenInfoMap srcChainName} ,srcChainName[0] the contract address of
   * coin or token; srcChainName[1] the value of toke or coin chain's info.
   * @param  {Object} input   -  Input of final users.(gas, gasPrice, value and so on) {@link CrossChain#input input example}
   * @returns {Promise<*>}
   */
  async  invokeNormalTrans(srcChainName, input, isSend = true){
    let config;
    let dstChainName  = null;
    // if(srcChainName[1].tokenType === 'WAN'){
    //   // on wan chain: coin WAN->WAN
    //   dstChainName    = ccUtil.getSrcChainNameByContractAddr(this.config.ethTokenAddress,'ETH');
    // }
    // config            = this.getCrossInvokerConfig(srcChainName,dstChainName);

    config = this.getInvokerConfig(srcChainName, null);

    // if(srcChainName[1].tokenType === 'WAN'){
    //   // on wan chain: coin WAN->WAN
    //   config.transferCoin = true;
    // }
    logger.debug("invokeNormalTrans config is :", ccUtil.hiddenProperties(config, ['srcAbi', 'midSCAbi', 'dstAbi']));
    let invokeClass;
    invokeClass       = config.normalTransClass;
    logger.debug("invokeNormalTrans invoke class : ", invokeClass);
    let invoke        = eval(`new ${invokeClass}(input,config)`);
    let ret           = await invoke.run(isSend);
    return ret;
  }

  /**
   * This function is used to send private transactin on WAN.</br>
   * @param {string} action   -  enum {'SEND', 'REFUND'}
   * @param {Object}input     -  Input of final users.(gas, gasPrice, value and so on) {@link CrossChain#input input example}
   * @returns {Promise<*>}
   */
  async  invokePrivateTrans(action, input){
    // To get config
    // let dstChainName = ccUtil.getSrcChainNameByContractAddr(this.config.ethTokenAddress, 'ETH');
    // let config = this.getCrossInvokerConfig(null, dstChainName);

    let srcChainName = ccUtil.getSrcChainNameByContractAddr(this.config.coinAddress, 'WAN');
    let config = this.getCrossInvokerConfig(srcChainName, null);

    logger.debug("invokePrivateTrans config is :", ccUtil.hiddenProperties(config, ['srcAbi', 'midSCAbi', 'dstAbi']));

    let ACTION      = action.toString().toUpperCase();
    let invokeClass = null;

    switch(ACTION){
    case 'SEND':
        invokeClass = 'PrivateChainWanSend'
        break;
    case 'REFUND' :
        invokeClass = 'PrivateChainWanRefund'
        break;
    default :
        logger.error(`Invoke private transactin got unknown action: ${action}`);
        throw new error.InvalidParameter(`Invalid action: ${action}`)
    }

    logger.debug("Private transactin invoke class :", invokeClass);
    let invoke = eval(`new ${invokeClass}(input, config)`);
    let ret    = await invoke.run();
    return ret;
  }

  /**
   * This function is used to send POS delegate in on WAN.</br>
   * @param {Object}input     -  Input of final users.(gas, gasPrice, value and so on)
   * @returns {Promise<*>}
   */
  async  PosDelegateIn(input){
    // To get config
    // let dstChainName = ccUtil.getSrcChainNameByContractAddr(this.config.ethTokenAddress, 'ETH');
    // let config = this.getCrossInvokerConfig(null, dstChainName);

    let srcChainName = ccUtil.getSrcChainNameByContractAddr(this.config.coinAddress, 'WAN');
    let config = this.getCrossInvokerConfig(srcChainName, null);

    logger.debug("invokePrivateTrans config is :", ccUtil.hiddenProperties(config, ['srcAbi', 'midSCAbi', 'dstAbi']));

    let invokeClass = 'POSDelegateIn'
    let invoke = eval(`new ${invokeClass}(input, config)`);
    let ret    = await invoke.run();
    return ret;
  }

  /**
   * This function is used to send POS delegate out on WAN.</br>
   * @param {Object}input     -  Input of final users.(gas, gasPrice, value and so on)
   * @returns {Promise<*>}
   */
  async  PosDelegateOut(input){
    // To get config
    // let dstChainName = ccUtil.getSrcChainNameByContractAddr(this.config.ethTokenAddress, 'ETH');
    // let config = this.getCrossInvokerConfig(null, dstChainName);

    let srcChainName = ccUtil.getSrcChainNameByContractAddr(this.config.coinAddress, 'WAN');
    let config = this.getCrossInvokerConfig(srcChainName, null);

    logger.debug("invokePrivateTrans config is :", ccUtil.hiddenProperties(config, ['srcAbi', 'midSCAbi', 'dstAbi']));

    let invokeClass = 'POSDelegateOut'
    let invoke = eval(`new ${invokeClass}(input, config)`);
    let ret    = await invoke.run();
    return ret;
  }

  /**
   * This function is used to send POS stake in on WAN.</br>
   * @param {Object}input     -  Input of final users.(gas, gasPrice, value and so on)
   * @returns {Promise<*>}
   */
  async  PosMinerRegister(input){
    // To get config
    // let dstChainName = ccUtil.getSrcChainNameByContractAddr(this.config.ethTokenAddress, 'ETH');
    // let config = this.getCrossInvokerConfig(null, dstChainName);

    let srcChainName = ccUtil.getSrcChainNameByContractAddr(this.config.coinAddress, 'WAN');
    let config = this.getCrossInvokerConfig(srcChainName, null);

    logger.debug("invokePrivateTrans config is :", ccUtil.hiddenProperties(config, ['srcAbi', 'midSCAbi', 'dstAbi']));

    let invokeClass = 'POSStakeIn'
    let invoke = eval(`new ${invokeClass}(input, config)`);
    let ret    = await invoke.run();
    return ret;
  }

  /**
   * This function is used to send POS stake update on WAN.</br>
   * @param {Object}input     -  Input of final users.(gas, gasPrice, value and so on)
   * @returns {Promise<*>}
   */
  async  PosStakeUpdate(input){
    // To get config
    // let dstChainName = ccUtil.getSrcChainNameByContractAddr(this.config.ethTokenAddress, 'ETH');
    // let config = this.getCrossInvokerConfig(null, dstChainName);

    let srcChainName = ccUtil.getSrcChainNameByContractAddr(this.config.coinAddress, 'WAN');
    let config = this.getCrossInvokerConfig(srcChainName, null);

    logger.debug("invokePrivateTrans config is :", ccUtil.hiddenProperties(config, ['srcAbi', 'midSCAbi', 'dstAbi']));

    let invokeClass = 'POSStakeUpdate'
    let invoke = eval(`new ${invokeClass}(input, config)`);
    let ret    = await invoke.run();
    return ret;
  }

  /**
   * This function is used to send POS stake update fee rate on WAN.</br>
   * @param {Object}input     -  Input of final users.(gas, gasPrice, value and so on)
   * @returns {Promise<*>}
   */
  async  PosStakeUpdateFeeRate(input){
    // To get config
    // let dstChainName = ccUtil.getSrcChainNameByContractAddr(this.config.ethTokenAddress, 'ETH');
    // let config = this.getCrossInvokerConfig(null, dstChainName);

    let srcChainName = ccUtil.getSrcChainNameByContractAddr(this.config.coinAddress, 'WAN');
    let config = this.getCrossInvokerConfig(srcChainName, null);

    logger.debug("invokePrivateTrans config is :", ccUtil.hiddenProperties(config, ['srcAbi', 'midSCAbi', 'dstAbi']));

    let invokeClass = 'POSStakeUpdateFeeRate'
    let invoke = eval(`new ${invokeClass}(input, config)`);
    let ret    = await invoke.run();
    return ret;
  }

  /**
   * This function is used to send POS stake Append on WAN.</br>
   * @param {Object}input     -  Input of final users.(gas, gasPrice, value and so on)
   * @returns {Promise<*>}
   */
  async  PosStakeAppend(input){
    // To get config
    // let dstChainName = ccUtil.getSrcChainNameByContractAddr(this.config.ethTokenAddress, 'ETH');
    // let config = this.getCrossInvokerConfig(null, dstChainName);

    let srcChainName = ccUtil.getSrcChainNameByContractAddr(this.config.coinAddress, 'WAN');
    let config = this.getCrossInvokerConfig(srcChainName, null);

    logger.debug("invokePrivateTrans config is :", ccUtil.hiddenProperties(config, ['srcAbi', 'midSCAbi', 'dstAbi']));

    let invokeClass = 'POSStakeAppend'
    let invoke = eval(`new ${invokeClass}(input, config)`);
    let ret    = await invoke.run();
    return ret;
  }

  async  PosStakeRegister(input){
    // To get config
    // let dstChainName = ccUtil.getSrcChainNameByContractAddr(this.config.ethTokenAddress, 'ETH');
    // let config = this.getCrossInvokerConfig(null, dstChainName);

    let srcChainName = ccUtil.getSrcChainNameByContractAddr(this.config.coinAddress, 'WAN');
    let config = this.getCrossInvokerConfig(srcChainName, null);

    logger.debug("invokePrivateTrans config is :", ccUtil.hiddenProperties(config, ['srcAbi', 'midSCAbi', 'dstAbi']));

    let invokeClass = 'POSStakeRegister'
    let invoke = eval(`new ${invokeClass}(input, config)`);
    let ret    = await invoke.run();
    return ret;
  }

  /**

   * This function is used to transfer coin or token on the same chain.</br>
   * Source chain name and destination chain name is same.</br>
   * For example:</br>
   * ETH->ETH, ETH(ZRX)->ETH(ZRX),WAN->WAN;</br>
   * WAN(WETH)->WAN(WETH), WAN(WZRX)->WANWZRX),WAN(WBTC)->WAN(WBTC)</br>
   * @param {Object}  srcChainName  - {@link CrossInvoker#tokenInfoMap srcChainName} ,srcChainName[0] the contract address of
   * coin or token; srcChainName[1] the value of toke or coin chain's info.
   * @param {Object}  dstChainName - {@link CrossInvoker#tokenInfoMap dstChainName} ,dstChainName[0] the contract address of
   * coin or token; dstChainName[1] the value of toke or coin chain's info.
   * @param {Object}input           -  Input of final users.(gas, gasPrice, value and so on) {@link CrossChain#input input example}
   * @returns {Promise<*>}
   */
  async  invokeNormal(srcChainName,dstChainName,input, isSend = true){
    let config;
    // on wan chain: support  WZRX->WZRX, WETH->WETH
    config            = this.getInvokerConfig(srcChainName,dstChainName);
    logger.debug("invokeNormal config is :",ccUtil.hiddenProperties(config, ['srcAbi', 'midSCAbi', 'dstAbi']));

    let invokeClass;
    invokeClass       = config.normalTransClass;
    logger.debug("invokeNormal invoke class : ", invokeClass);
    let invoke        = eval(`new ${invokeClass}(input,config)`);
    let ret           = await invoke.run(isSend);
    return ret;
  }

    /**
   * This function is used to send openstoreman related trans on WAN.</br>
   * @param {string} action   -  enum {'delegateIn', 'delegateOut', 'delegateClaim','stakeIn', 'stakeOut', 'stakeClaim'}
   * @param {Object}input     -  Input of final users.(gas, gasPrice, value and so on) {@link CrossChain#input input example}
   * @returns {Promise<*>}
   */
  async  invokeOpenStoremanTrans(action, input, isSend = true){
    // To get config
    let srcChainName = ccUtil.getSrcChainNameByContractAddr(this.config.coinAddress, 'WAN');
    let config = this.getCrossInvokerConfig(srcChainName, null);

    logger.debug("invokeOpenStoremanTrans config is :", ccUtil.hiddenProperties(config, ['srcAbi', 'midSCAbi', 'dstAbi']));

    let ACTION      = action.toString();
    let invokeClass = '';

    input.func = ACTION;
    let canStakeClaim;

    switch(ACTION){
    case 'partIn':
        invokeClass = 'StoremanDelegateIn'
        input.func = 'partIn';
        break;
    case 'delegateIn':
        invokeClass = 'StoremanDelegateIn'
        break;
    case 'delegateOut' :
        invokeClass = 'StoremanDelegateOut'
        break;
    case 'delegateClaim':
        invokeClass = 'StoremanDelegateClaim';
        canStakeClaim = await ccUtil.checkCanStakeClaim(config.srcChainType, input.wkAddr);
        if (!canStakeClaim) {
          input.func = 'delegateIncentiveClaim';
        }
        break;
    case 'stakeIn' :
        invokeClass = 'StoremanStakeIn'
        break;
    case 'stakeAppend' :
          invokeClass = 'StoremanStakeAppend'
          break;
    case 'stakeOut':
        invokeClass = 'StoremanStakeOut'
        break;
    case 'stakeClaim' :
        invokeClass = 'StoremanStakeClaim';
        canStakeClaim = await ccUtil.checkCanStakeClaim(config.srcChainType, input.wkAddr);
        if (!canStakeClaim) {
          input.func = 'stakeIncentiveClaim';
        }
        break;
    default :
        logger.error(`Invoke open-storeman related transactin got unknown action: ${action}`);
        throw new error.InvalidParameter(`Invalid action: ${action}`)
    }

    logger.debug("Open-storeman related transactin invoke class :", invokeClass);
    let invoke = eval(`new ${invokeClass}(input, config)`);
    let ret    = await invoke.run(isSend);
    return ret;
  }
}
module.exports = CrossInvoker;
