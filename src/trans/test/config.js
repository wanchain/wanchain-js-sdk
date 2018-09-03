const config = {};

config.port = 8545;

config.useLocalNode = false;
config.loglevel = 'info';
//config.loglevel = 'debug';

let network;
network = 'test';

let wanchainNet = '';
let ethereumNet = '';
config.chainDic = [
  {
    tokenName: ['ETH'],
    tokenType:'ETH'
  },
  {
    tokenName: [], // get by getRegErc20Token
    tokenType: 'E20'
  },
  {
    tokenName: ['BTC'],
    tokenType: 'BTC'
  },
  {
    tokenName: ['WAN'],
    tokenType: 'WAN'
  },
];

config.crossChain = {
  'ETH2WAN': {
    srcChain: 'ETH',
    dstChain: 'WAN',
    srcSCAddr: '0x358b18d9dfa4cce042f2926d014643d4b3742b31',
    dstSCAddr: '0xfbaffb655906424d501144eefe35e28753dea037',
    srcAbi: [{
      "constant": true,
      "inputs": [{"name": "", "type": "bytes32"}],
      "name": "mapXHashShadow",
      "outputs": [{"name": "", "type": "address"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [],
      "name": "kill",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [{"name": "", "type": "bytes32"}],
      "name": "mapXHashHTLCTxs",
      "outputs": [{"name": "source", "type": "address"}, {"name": "destination", "type": "address"}, {
        "name": "value",
        "type": "uint256"
      }, {"name": "status", "type": "uint8"}, {"name": "lockedTime", "type": "uint256"}, {
        "name": "beginLockedTime",
        "type": "uint256"
      }],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [],
      "name": "acceptOwnership",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "DEF_LOCKED_TIME",
      "outputs": [{"name": "", "type": "uint256"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "owner",
      "outputs": [{"name": "", "type": "address"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [{"name": "xHash", "type": "bytes32"}],
      "name": "xHashExist",
      "outputs": [{"name": "exist", "type": "bool"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "_newOwner", "type": "address"}],
      "name": "changeOwner",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "lockedTime",
      "outputs": [{"name": "", "type": "uint256"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [{"name": "xHash", "type": "bytes32"}],
      "name": "getHTLCLeftLockedTime",
      "outputs": [{"name": "time", "type": "uint256"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "halted",
      "outputs": [{"name": "", "type": "bool"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "DEF_MAX_TIME",
      "outputs": [{"name": "", "type": "uint256"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "newOwner",
      "outputs": [{"name": "", "type": "address"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "time", "type": "uint256"}],
      "name": "setLockedTime",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "halt", "type": "bool"}],
      "name": "setHalt",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {"payable": true, "stateMutability": "payable", "type": "fallback"}, {
      "anonymous": false,
      "inputs": [{"indexed": true, "name": "user", "type": "address"}, {
        "indexed": true,
        "name": "storeman",
        "type": "address"
      }, {"indexed": true, "name": "xHash", "type": "bytes32"}, {
        "indexed": false,
        "name": "value",
        "type": "uint256"
      }, {"indexed": false, "name": "wanAddr", "type": "address"}],
      "name": "ETH2WETHLock",
      "type": "event"
    }, {
      "anonymous": false,
      "inputs": [{"indexed": true, "name": "storeman", "type": "address"}, {
        "indexed": true,
        "name": "user",
        "type": "address"
      }, {"indexed": true, "name": "xHash", "type": "bytes32"}, {"indexed": false, "name": "x", "type": "bytes32"}],
      "name": "ETH2WETHRefund",
      "type": "event"
    }, {
      "anonymous": false,
      "inputs": [{"indexed": true, "name": "user", "type": "address"}, {
        "indexed": true,
        "name": "xHash",
        "type": "bytes32"
      }],
      "name": "ETH2WETHRevoke",
      "type": "event"
    }, {
      "anonymous": false,
      "inputs": [{"indexed": true, "name": "storeman", "type": "address"}, {
        "indexed": true,
        "name": "user",
        "type": "address"
      }, {"indexed": true, "name": "xHash", "type": "bytes32"}, {"indexed": false, "name": "value", "type": "uint256"}],
      "name": "WETH2ETHLock",
      "type": "event"
    }, {
      "anonymous": false,
      "inputs": [{"indexed": true, "name": "user", "type": "address"}, {
        "indexed": true,
        "name": "storeman",
        "type": "address"
      }, {"indexed": true, "name": "xHash", "type": "bytes32"}, {"indexed": false, "name": "x", "type": "bytes32"}],
      "name": "WETH2ETHRefund",
      "type": "event"
    }, {
      "anonymous": false,
      "inputs": [{"indexed": true, "name": "storeman", "type": "address"}, {
        "indexed": true,
        "name": "xHash",
        "type": "bytes32"
      }],
      "name": "WETH2ETHRevoke",
      "type": "event"
    }, {
      "constant": false,
      "inputs": [{"name": "xHash", "type": "bytes32"}, {"name": "storeman", "type": "address"}, {
        "name": "wanAddr",
        "type": "address"
      }],
      "name": "eth2wethLock",
      "outputs": [{"name": "", "type": "bool"}],
      "payable": true,
      "stateMutability": "payable",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "x", "type": "bytes32"}],
      "name": "eth2wethRefund",
      "outputs": [{"name": "", "type": "bool"}],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "xHash", "type": "bytes32"}],
      "name": "eth2wethRevoke",
      "outputs": [{"name": "", "type": "bool"}],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "xHash", "type": "bytes32"}, {"name": "user", "type": "address"}],
      "name": "weth2ethLock",
      "outputs": [{"name": "", "type": "bool"}],
      "payable": true,
      "stateMutability": "payable",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "x", "type": "bytes32"}],
      "name": "weth2ethRefund",
      "outputs": [{"name": "", "type": "bool"}],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "xHash", "type": "bytes32"}],
      "name": "weth2ethRevoke",
      "outputs": [{"name": "", "type": "bool"}],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }],
    dstAbi: [{
      "constant": true,
      "inputs": [{"name": "", "type": "bytes32"}],
      "name": "mapXHashShadow",
      "outputs": [{"name": "", "type": "address"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [],
      "name": "kill",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [{"name": "", "type": "bytes32"}],
      "name": "mapXHashHTLCTxs",
      "outputs": [{"name": "source", "type": "address"}, {"name": "destination", "type": "address"}, {
        "name": "value",
        "type": "uint256"
      }, {"name": "status", "type": "uint8"}, {"name": "lockedTime", "type": "uint256"}, {
        "name": "beginLockedTime",
        "type": "uint256"
      }],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [],
      "name": "acceptOwnership",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "DEF_LOCKED_TIME",
      "outputs": [{"name": "", "type": "uint256"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "ETH_INDEX",
      "outputs": [{"name": "", "type": "uint256"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "storemanGroupAdmin",
      "outputs": [{"name": "", "type": "address"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "owner",
      "outputs": [{"name": "", "type": "address"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [{"name": "", "type": "bytes32"}],
      "name": "mapXHashFee",
      "outputs": [{"name": "", "type": "uint256"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "wethManager",
      "outputs": [{"name": "", "type": "address"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [{"name": "xHash", "type": "bytes32"}],
      "name": "xHashExist",
      "outputs": [{"name": "exist", "type": "bool"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "_newOwner", "type": "address"}],
      "name": "changeOwner",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "lockedTime",
      "outputs": [{"name": "", "type": "uint256"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [{"name": "xHash", "type": "bytes32"}],
      "name": "getHTLCLeftLockedTime",
      "outputs": [{"name": "time", "type": "uint256"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "halted",
      "outputs": [{"name": "", "type": "bool"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "DEF_MAX_TIME",
      "outputs": [{"name": "", "type": "uint256"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "newOwner",
      "outputs": [{"name": "", "type": "address"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "time", "type": "uint256"}],
      "name": "setLockedTime",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "halt", "type": "bool"}],
      "name": "setHalt",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {"payable": true, "stateMutability": "payable", "type": "fallback"}, {
      "anonymous": false,
      "inputs": [{"indexed": true, "name": "storeman", "type": "address"}, {
        "indexed": true,
        "name": "wanAddr",
        "type": "address"
      }, {"indexed": true, "name": "xHash", "type": "bytes32"}, {"indexed": false, "name": "value", "type": "uint256"}],
      "name": "ETH2WETHLock",
      "type": "event"
    }, {
      "anonymous": false,
      "inputs": [{"indexed": true, "name": "wanAddr", "type": "address"}, {
        "indexed": true,
        "name": "storeman",
        "type": "address"
      }, {"indexed": true, "name": "xHash", "type": "bytes32"}, {"indexed": false, "name": "x", "type": "bytes32"}],
      "name": "ETH2WETHRefund",
      "type": "event"
    }, {
      "anonymous": false,
      "inputs": [{"indexed": true, "name": "storeman", "type": "address"}, {
        "indexed": true,
        "name": "xHash",
        "type": "bytes32"
      }],
      "name": "ETH2WETHRevoke",
      "type": "event"
    }, {
      "anonymous": false,
      "inputs": [{"indexed": true, "name": "wanAddr", "type": "address"}, {
        "indexed": true,
        "name": "storeman",
        "type": "address"
      }, {"indexed": true, "name": "xHash", "type": "bytes32"}, {
        "indexed": false,
        "name": "value",
        "type": "uint256"
      }, {"indexed": false, "name": "ethAddr", "type": "address"}, {
        "indexed": false,
        "name": "fee",
        "type": "uint256"
      }],
      "name": "WETH2ETHLock",
      "type": "event"
    }, {
      "anonymous": false,
      "inputs": [{"indexed": true, "name": "storeman", "type": "address"}, {
        "indexed": true,
        "name": "wanAddr",
        "type": "address"
      }, {"indexed": true, "name": "xHash", "type": "bytes32"}, {"indexed": false, "name": "x", "type": "bytes32"}],
      "name": "WETH2ETHRefund",
      "type": "event"
    }, {
      "anonymous": false,
      "inputs": [{"indexed": true, "name": "wanAddr", "type": "address"}, {
        "indexed": true,
        "name": "xHash",
        "type": "bytes32"
      }],
      "name": "WETH2ETHRevoke",
      "type": "event"
    }, {
      "constant": false,
      "inputs": [{"name": "addr", "type": "address"}],
      "name": "setWETHManager",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "addr", "type": "address"}],
      "name": "setStoremanGroupAdmin",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "xHash", "type": "bytes32"}, {"name": "wanAddr", "type": "address"}, {
        "name": "value",
        "type": "uint256"
      }],
      "name": "eth2wethLock",
      "outputs": [{"name": "", "type": "bool"}],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "x", "type": "bytes32"}],
      "name": "eth2wethRefund",
      "outputs": [{"name": "", "type": "bool"}],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "xHash", "type": "bytes32"}],
      "name": "eth2wethRevoke",
      "outputs": [{"name": "", "type": "bool"}],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "xHash", "type": "bytes32"}, {"name": "storeman", "type": "address"}, {
        "name": "ethAddr",
        "type": "address"
      }, {"name": "value", "type": "uint256"}],
      "name": "weth2ethLock",
      "outputs": [{"name": "", "type": "bool"}],
      "payable": true,
      "stateMutability": "payable",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "x", "type": "bytes32"}],
      "name": "weth2ethRefund",
      "outputs": [{"name": "", "type": "bool"}],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "xHash", "type": "bytes32"}],
      "name": "weth2ethRevoke",
      "outputs": [{"name": "", "type": "bool"}],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }],
    srcKeystorePath: '',
    dstKeyStorePath: '',
    lockClass: 'CrossChainEthLock',
    refundClass: 'CrossChainEthRefund',
    revokeClass: 'CrossChainEthRevoke',
    lockScFunc: 'eth2wethLock',
    refundScFunc: 'eth2wethRefund',
    revokeScFunc: 'eth2wethRevoke',
    srcChainType: 'ETH',
    dstChainType: 'WAN'
  },
  'WAN2ETH': {
    srcChain: 'WAN',
    dstChain: 'ETH',
    srcSCAddr: '0xfbaffb655906424d501144eefe35e28753dea037',
    dstSCAddr: '0x358b18d9dfa4cce042f2926d014643d4b3742b31',
    dstAbi: [{
      "constant": true,
      "inputs": [{"name": "", "type": "bytes32"}],
      "name": "mapXHashShadow",
      "outputs": [{"name": "", "type": "address"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [],
      "name": "kill",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [{"name": "", "type": "bytes32"}],
      "name": "mapXHashHTLCTxs",
      "outputs": [{"name": "source", "type": "address"}, {"name": "destination", "type": "address"}, {
        "name": "value",
        "type": "uint256"
      }, {"name": "status", "type": "uint8"}, {"name": "lockedTime", "type": "uint256"}, {
        "name": "beginLockedTime",
        "type": "uint256"
      }],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [],
      "name": "acceptOwnership",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "DEF_LOCKED_TIME",
      "outputs": [{"name": "", "type": "uint256"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "owner",
      "outputs": [{"name": "", "type": "address"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [{"name": "xHash", "type": "bytes32"}],
      "name": "xHashExist",
      "outputs": [{"name": "exist", "type": "bool"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "_newOwner", "type": "address"}],
      "name": "changeOwner",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "lockedTime",
      "outputs": [{"name": "", "type": "uint256"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [{"name": "xHash", "type": "bytes32"}],
      "name": "getHTLCLeftLockedTime",
      "outputs": [{"name": "time", "type": "uint256"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "halted",
      "outputs": [{"name": "", "type": "bool"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "DEF_MAX_TIME",
      "outputs": [{"name": "", "type": "uint256"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "newOwner",
      "outputs": [{"name": "", "type": "address"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "time", "type": "uint256"}],
      "name": "setLockedTime",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "halt", "type": "bool"}],
      "name": "setHalt",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {"payable": true, "stateMutability": "payable", "type": "fallback"}, {
      "anonymous": false,
      "inputs": [{"indexed": true, "name": "user", "type": "address"}, {
        "indexed": true,
        "name": "storeman",
        "type": "address"
      }, {"indexed": true, "name": "xHash", "type": "bytes32"}, {
        "indexed": false,
        "name": "value",
        "type": "uint256"
      }, {"indexed": false, "name": "wanAddr", "type": "address"}],
      "name": "ETH2WETHLock",
      "type": "event"
    }, {
      "anonymous": false,
      "inputs": [{"indexed": true, "name": "storeman", "type": "address"}, {
        "indexed": true,
        "name": "user",
        "type": "address"
      }, {"indexed": true, "name": "xHash", "type": "bytes32"}, {"indexed": false, "name": "x", "type": "bytes32"}],
      "name": "ETH2WETHRefund",
      "type": "event"
    }, {
      "anonymous": false,
      "inputs": [{"indexed": true, "name": "user", "type": "address"}, {
        "indexed": true,
        "name": "xHash",
        "type": "bytes32"
      }],
      "name": "ETH2WETHRevoke",
      "type": "event"
    }, {
      "anonymous": false,
      "inputs": [{"indexed": true, "name": "storeman", "type": "address"}, {
        "indexed": true,
        "name": "user",
        "type": "address"
      }, {"indexed": true, "name": "xHash", "type": "bytes32"}, {"indexed": false, "name": "value", "type": "uint256"}],
      "name": "WETH2ETHLock",
      "type": "event"
    }, {
      "anonymous": false,
      "inputs": [{"indexed": true, "name": "user", "type": "address"}, {
        "indexed": true,
        "name": "storeman",
        "type": "address"
      }, {"indexed": true, "name": "xHash", "type": "bytes32"}, {"indexed": false, "name": "x", "type": "bytes32"}],
      "name": "WETH2ETHRefund",
      "type": "event"
    }, {
      "anonymous": false,
      "inputs": [{"indexed": true, "name": "storeman", "type": "address"}, {
        "indexed": true,
        "name": "xHash",
        "type": "bytes32"
      }],
      "name": "WETH2ETHRevoke",
      "type": "event"
    }, {
      "constant": false,
      "inputs": [{"name": "xHash", "type": "bytes32"}, {"name": "storeman", "type": "address"}, {
        "name": "wanAddr",
        "type": "address"
      }],
      "name": "eth2wethLock",
      "outputs": [{"name": "", "type": "bool"}],
      "payable": true,
      "stateMutability": "payable",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "x", "type": "bytes32"}],
      "name": "eth2wethRefund",
      "outputs": [{"name": "", "type": "bool"}],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "xHash", "type": "bytes32"}],
      "name": "eth2wethRevoke",
      "outputs": [{"name": "", "type": "bool"}],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "xHash", "type": "bytes32"}, {"name": "user", "type": "address"}],
      "name": "weth2ethLock",
      "outputs": [{"name": "", "type": "bool"}],
      "payable": true,
      "stateMutability": "payable",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "x", "type": "bytes32"}],
      "name": "weth2ethRefund",
      "outputs": [{"name": "", "type": "bool"}],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "xHash", "type": "bytes32"}],
      "name": "weth2ethRevoke",
      "outputs": [{"name": "", "type": "bool"}],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }],
    srcAbi: [{
      "constant": true,
      "inputs": [{"name": "", "type": "bytes32"}],
      "name": "mapXHashShadow",
      "outputs": [{"name": "", "type": "address"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [],
      "name": "kill",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [{"name": "", "type": "bytes32"}],
      "name": "mapXHashHTLCTxs",
      "outputs": [{"name": "source", "type": "address"}, {"name": "destination", "type": "address"}, {
        "name": "value",
        "type": "uint256"
      }, {"name": "status", "type": "uint8"}, {"name": "lockedTime", "type": "uint256"}, {
        "name": "beginLockedTime",
        "type": "uint256"
      }],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [],
      "name": "acceptOwnership",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "DEF_LOCKED_TIME",
      "outputs": [{"name": "", "type": "uint256"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "ETH_INDEX",
      "outputs": [{"name": "", "type": "uint256"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "storemanGroupAdmin",
      "outputs": [{"name": "", "type": "address"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "owner",
      "outputs": [{"name": "", "type": "address"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [{"name": "", "type": "bytes32"}],
      "name": "mapXHashFee",
      "outputs": [{"name": "", "type": "uint256"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "wethManager",
      "outputs": [{"name": "", "type": "address"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [{"name": "xHash", "type": "bytes32"}],
      "name": "xHashExist",
      "outputs": [{"name": "exist", "type": "bool"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "_newOwner", "type": "address"}],
      "name": "changeOwner",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "lockedTime",
      "outputs": [{"name": "", "type": "uint256"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [{"name": "xHash", "type": "bytes32"}],
      "name": "getHTLCLeftLockedTime",
      "outputs": [{"name": "time", "type": "uint256"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "halted",
      "outputs": [{"name": "", "type": "bool"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "DEF_MAX_TIME",
      "outputs": [{"name": "", "type": "uint256"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": true,
      "inputs": [],
      "name": "newOwner",
      "outputs": [{"name": "", "type": "address"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "time", "type": "uint256"}],
      "name": "setLockedTime",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "halt", "type": "bool"}],
      "name": "setHalt",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {"payable": true, "stateMutability": "payable", "type": "fallback"}, {
      "anonymous": false,
      "inputs": [{"indexed": true, "name": "storeman", "type": "address"}, {
        "indexed": true,
        "name": "wanAddr",
        "type": "address"
      }, {"indexed": true, "name": "xHash", "type": "bytes32"}, {"indexed": false, "name": "value", "type": "uint256"}],
      "name": "ETH2WETHLock",
      "type": "event"
    }, {
      "anonymous": false,
      "inputs": [{"indexed": true, "name": "wanAddr", "type": "address"}, {
        "indexed": true,
        "name": "storeman",
        "type": "address"
      }, {"indexed": true, "name": "xHash", "type": "bytes32"}, {"indexed": false, "name": "x", "type": "bytes32"}],
      "name": "ETH2WETHRefund",
      "type": "event"
    }, {
      "anonymous": false,
      "inputs": [{"indexed": true, "name": "storeman", "type": "address"}, {
        "indexed": true,
        "name": "xHash",
        "type": "bytes32"
      }],
      "name": "ETH2WETHRevoke",
      "type": "event"
    }, {
      "anonymous": false,
      "inputs": [{"indexed": true, "name": "wanAddr", "type": "address"}, {
        "indexed": true,
        "name": "storeman",
        "type": "address"
      }, {"indexed": true, "name": "xHash", "type": "bytes32"}, {
        "indexed": false,
        "name": "value",
        "type": "uint256"
      }, {"indexed": false, "name": "ethAddr", "type": "address"}, {
        "indexed": false,
        "name": "fee",
        "type": "uint256"
      }],
      "name": "WETH2ETHLock",
      "type": "event"
    }, {
      "anonymous": false,
      "inputs": [{"indexed": true, "name": "storeman", "type": "address"}, {
        "indexed": true,
        "name": "wanAddr",
        "type": "address"
      }, {"indexed": true, "name": "xHash", "type": "bytes32"}, {"indexed": false, "name": "x", "type": "bytes32"}],
      "name": "WETH2ETHRefund",
      "type": "event"
    }, {
      "anonymous": false,
      "inputs": [{"indexed": true, "name": "wanAddr", "type": "address"}, {
        "indexed": true,
        "name": "xHash",
        "type": "bytes32"
      }],
      "name": "WETH2ETHRevoke",
      "type": "event"
    }, {
      "constant": false,
      "inputs": [{"name": "addr", "type": "address"}],
      "name": "setWETHManager",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "addr", "type": "address"}],
      "name": "setStoremanGroupAdmin",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "xHash", "type": "bytes32"}, {"name": "wanAddr", "type": "address"}, {
        "name": "value",
        "type": "uint256"
      }],
      "name": "eth2wethLock",
      "outputs": [{"name": "", "type": "bool"}],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "x", "type": "bytes32"}],
      "name": "eth2wethRefund",
      "outputs": [{"name": "", "type": "bool"}],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "xHash", "type": "bytes32"}],
      "name": "eth2wethRevoke",
      "outputs": [{"name": "", "type": "bool"}],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "xHash", "type": "bytes32"}, {"name": "storeman", "type": "address"}, {
        "name": "ethAddr",
        "type": "address"
      }, {"name": "value", "type": "uint256"}],
      "name": "weth2ethLock",
      "outputs": [{"name": "", "type": "bool"}],
      "payable": true,
      "stateMutability": "payable",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "x", "type": "bytes32"}],
      "name": "weth2ethRefund",
      "outputs": [{"name": "", "type": "bool"}],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }, {
      "constant": false,
      "inputs": [{"name": "xHash", "type": "bytes32"}],
      "name": "weth2ethRevoke",
      "outputs": [{"name": "", "type": "bool"}],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }],
    srcKeystorePath: '',
    dstKeyStorePath: '',
    lockClass: 'CrossChainEthLock',
    refundClass: 'CrossChainEthRefund',
    revokeClass: 'CrossChainEthRevoke',
    lockScFunc: 'weth2ethLock',
    refundScFunc: 'weth2ethRefund',
    revokeScFunc: 'weth2ethRevoke',
    srcChainType: 'WAN',
    dstChainType: 'ETH'
  }
};
if (network === 'test') {
  //config.socketUrl = 'wss://apitest.wanchain.info';
  config.socketUrl = 'wss://18.236.235.133';  // Add by Jacob
  wanchainNet = 'testnet';
  ethereumNet = 'testnet';

  config.originalChainHtlc = "0x358b18d9dfa4cce042f2926d014643d4b3742b31";
  config.wanchainHtlcAddr = "0xfbaffb655906424d501144eefe35e28753dea037";

  config.HTLCETHInstAbi=[{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"mapXHashShadow","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"kill","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"mapXHashHTLCTxs","outputs":[{"name":"source","type":"address"},{"name":"destination","type":"address"},{"name":"value","type":"uint256"},{"name":"status","type":"uint8"},{"name":"lockedTime","type":"uint256"},{"name":"beginLockedTime","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"acceptOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"DEF_LOCKED_TIME","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"xHash","type":"bytes32"}],"name":"xHashExist","outputs":[{"name":"exist","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"changeOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"lockedTime","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"xHash","type":"bytes32"}],"name":"getHTLCLeftLockedTime","outputs":[{"name":"time","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"halted","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"DEF_MAX_TIME","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"newOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"time","type":"uint256"}],"name":"setLockedTime","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"halt","type":"bool"}],"name":"setHalt","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"user","type":"address"},{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"},{"indexed":false,"name":"value","type":"uint256"},{"indexed":false,"name":"wanAddr","type":"address"}],"name":"ETH2WETHLock","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"user","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"},{"indexed":false,"name":"x","type":"bytes32"}],"name":"ETH2WETHRefund","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"user","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"}],"name":"ETH2WETHRevoke","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"user","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"},{"indexed":false,"name":"value","type":"uint256"}],"name":"WETH2ETHLock","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"user","type":"address"},{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"},{"indexed":false,"name":"x","type":"bytes32"}],"name":"WETH2ETHRefund","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"}],"name":"WETH2ETHRevoke","type":"event"},{"constant":false,"inputs":[{"name":"xHash","type":"bytes32"},{"name":"storeman","type":"address"},{"name":"wanAddr","type":"address"}],"name":"eth2wethLock","outputs":[{"name":"","type":"bool"}],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"x","type":"bytes32"}],"name":"eth2wethRefund","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"xHash","type":"bytes32"}],"name":"eth2wethRevoke","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"xHash","type":"bytes32"},{"name":"user","type":"address"}],"name":"weth2ethLock","outputs":[{"name":"","type":"bool"}],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"x","type":"bytes32"}],"name":"weth2ethRefund","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"xHash","type":"bytes32"}],"name":"weth2ethRevoke","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}];
  config.HTLCWETHInstAbi=[{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"mapXHashShadow","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"kill","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"mapXHashHTLCTxs","outputs":[{"name":"source","type":"address"},{"name":"destination","type":"address"},{"name":"value","type":"uint256"},{"name":"status","type":"uint8"},{"name":"lockedTime","type":"uint256"},{"name":"beginLockedTime","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"acceptOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"DEF_LOCKED_TIME","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"ETH_INDEX","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"storemanGroupAdmin","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"mapXHashFee","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"wethManager","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"xHash","type":"bytes32"}],"name":"xHashExist","outputs":[{"name":"exist","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"changeOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"lockedTime","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"xHash","type":"bytes32"}],"name":"getHTLCLeftLockedTime","outputs":[{"name":"time","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"halted","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"DEF_MAX_TIME","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"newOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"time","type":"uint256"}],"name":"setLockedTime","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"halt","type":"bool"}],"name":"setHalt","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"wanAddr","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"},{"indexed":false,"name":"value","type":"uint256"}],"name":"ETH2WETHLock","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"wanAddr","type":"address"},{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"},{"indexed":false,"name":"x","type":"bytes32"}],"name":"ETH2WETHRefund","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"}],"name":"ETH2WETHRevoke","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"wanAddr","type":"address"},{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"},{"indexed":false,"name":"value","type":"uint256"},{"indexed":false,"name":"ethAddr","type":"address"},{"indexed":false,"name":"fee","type":"uint256"}],"name":"WETH2ETHLock","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"wanAddr","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"},{"indexed":false,"name":"x","type":"bytes32"}],"name":"WETH2ETHRefund","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"wanAddr","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"}],"name":"WETH2ETHRevoke","type":"event"},{"constant":false,"inputs":[{"name":"addr","type":"address"}],"name":"setWETHManager","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"addr","type":"address"}],"name":"setStoremanGroupAdmin","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"xHash","type":"bytes32"},{"name":"wanAddr","type":"address"},{"name":"value","type":"uint256"}],"name":"eth2wethLock","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"x","type":"bytes32"}],"name":"eth2wethRefund","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"xHash","type":"bytes32"}],"name":"eth2wethRevoke","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"xHash","type":"bytes32"},{"name":"storeman","type":"address"},{"name":"ethAddr","type":"address"},{"name":"value","type":"uint256"}],"name":"weth2ethLock","outputs":[{"name":"","type":"bool"}],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"x","type":"bytes32"}],"name":"weth2ethRefund","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"xHash","type":"bytes32"}],"name":"weth2ethRevoke","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}];

  config.originalChainHtlcE20     = "0xcdc96fea7e2a6ce584df5dc22d9211e53a5b18b1";
  config.wanchainHtlcAddrE20      = "0x5d1dd99ebaa6ee3289d9cd3369948e4ce96736c2";

  config.orgChainAddrE20          = "0xc5bc855056d99ef4bda0a4ae937065315e2ae11a";    // the Approve contract
  config.wanchainAddrE20          = "0x46e4df4b9c3044f12543adaa8ad0609d553041f9";    //  the Approve wan contract.

  config.qutoE20                  = "0x4f73a4e2a6e11ea30fbca48012660eada20fe598";    // Approve quotaLedger


  config.storemanAddEthE20        = "0xc27ecd85faa4ae80bf5e28daf91b605db7be1ba8";
  config.storemanAddWanE20        = "0x55ccc7a38f900a1e00f0a4c1e466ec36e7592024";

  config.ethAbiE20     = [{"constant":true,"inputs":[],"name":"RATIO_PRECISE","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"token","type":"address"},{"name":"xHash","type":"bytes32"}],"name":"inboundRevoke","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"token","type":"address"},{"name":"value","type":"uint256"},{"name":"xHash","type":"bytes32"},{"name":"user","type":"address"}],"name":"outboundLock","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"kill","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"tokenID","type":"address"},{"name":"xHash","type":"bytes32"}],"name":"getHTLCLeftLockedTime","outputs":[{"name":"time","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"token","type":"address"},{"name":"xHash","type":"bytes32"}],"name":"outboundRevoke","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"bytes32"}],"name":"mapXHashShadow","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"token","type":"address"},{"name":"x","type":"bytes32"}],"name":"inboundRefund","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"acceptOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"DEF_LOCKED_TIME","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"token","type":"address"},{"name":"x","type":"bytes32"}],"name":"outboundRefund","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"token","type":"address"},{"name":"value","type":"uint256"},{"name":"xHash","type":"bytes32"},{"name":"storemanGroup","type":"address"},{"name":"wanAddr","type":"address"}],"name":"inboundLock","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"changeOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"lockedTime","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"revokeFeeRatio","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"bytes32"}],"name":"mapXHashHTLCTxs","outputs":[{"name":"direction","type":"uint8"},{"name":"source","type":"address"},{"name":"destination","type":"address"},{"name":"value","type":"uint256"},{"name":"status","type":"uint8"},{"name":"lockedTime","type":"uint256"},{"name":"beginLockedTime","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"halted","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"mapTokenSupported","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"DEF_MAX_TIME","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"ratio","type":"uint256"}],"name":"setRevokeFeeRatio","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"tokenID","type":"address"}],"name":"addToken","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"newOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"time","type":"uint256"}],"name":"setLockedTime","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"tokenID","type":"address"},{"name":"xHash","type":"bytes32"}],"name":"xHashExist","outputs":[{"name":"exist","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"halt","type":"bool"}],"name":"setHalt","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":false,"name":"token","type":"address"},{"indexed":true,"name":"user","type":"address"},{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"},{"indexed":false,"name":"value","type":"uint256"},{"indexed":false,"name":"wanAddr","type":"address"}],"name":"InboundLockLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"token","type":"address"},{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"user","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"},{"indexed":false,"name":"x","type":"bytes32"}],"name":"InboundRefundLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"token","type":"address"},{"indexed":true,"name":"user","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"}],"name":"InboundRevokeLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"token","type":"address"},{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"user","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"},{"indexed":false,"name":"value","type":"uint256"}],"name":"OutboundLockLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"token","type":"address"},{"indexed":true,"name":"user","type":"address"},{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"},{"indexed":false,"name":"x","type":"bytes32"}],"name":"OutboundRefundLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"token","type":"address"},{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"}],"name":"OutboundRevokeLogger","type":"event"}];
  config.wanAbiE20     = [{"constant":false,"inputs":[{"name":"token","type":"address"},{"name":"xHash","type":"bytes32"},{"name":"wanAddr","type":"address"},{"name":"value","type":"uint256"}],"name":"inboundLock","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"RATIO_PRECISE","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"token","type":"address"},{"name":"storemanGroup","type":"address"},{"name":"value","type":"uint256"}],"name":"getOutboundFee","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"tokenManager","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"token","type":"address"},{"name":"xHash","type":"bytes32"}],"name":"inboundRevoke","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"quotaLedger","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"kill","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"token","type":"address"},{"name":"xHash","type":"bytes32"},{"name":"storeman","type":"address"},{"name":"ethAddr","type":"address"},{"name":"value","type":"uint256"}],"name":"outboundLock","outputs":[{"name":"","type":"bool"}],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"tokenID","type":"address"},{"name":"xHash","type":"bytes32"}],"name":"getHTLCLeftLockedTime","outputs":[{"name":"time","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"token","type":"address"},{"name":"xHash","type":"bytes32"}],"name":"outboundRevoke","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"bytes32"}],"name":"mapXHashShadow","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"token","type":"address"},{"name":"x","type":"bytes32"}],"name":"inboundRefund","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"acceptOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"DEF_LOCKED_TIME","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"addr","type":"address"}],"name":"setTokenManager","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"token","type":"address"},{"name":"x","type":"bytes32"}],"name":"outboundRefund","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"storemanGroupAdmin","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"addr","type":"address"}],"name":"setStoremanGroupAdmin","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"changeOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"lockedTime","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"revokeFeeRatio","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"bytes32"}],"name":"mapXHashHTLCTxs","outputs":[{"name":"direction","type":"uint8"},{"name":"source","type":"address"},{"name":"destination","type":"address"},{"name":"value","type":"uint256"},{"name":"status","type":"uint8"},{"name":"lockedTime","type":"uint256"},{"name":"beginLockedTime","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"halted","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"mapTokenSupported","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"DEF_MAX_TIME","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"ratio","type":"uint256"}],"name":"setRevokeFeeRatio","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"tokenID","type":"address"}],"name":"addToken","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"newOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"time","type":"uint256"}],"name":"setLockedTime","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"bytes32"}],"name":"mapXHashFee","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"addr","type":"address"}],"name":"setQuotaLedger","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"tokenID","type":"address"},{"name":"xHash","type":"bytes32"}],"name":"xHashExist","outputs":[{"name":"exist","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"halt","type":"bool"}],"name":"setHalt","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":false,"name":"token","type":"address"},{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"wanAddr","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"},{"indexed":false,"name":"value","type":"uint256"}],"name":"InboundLockLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"token","type":"address"},{"indexed":true,"name":"wanAddr","type":"address"},{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"},{"indexed":false,"name":"x","type":"bytes32"}],"name":"InboundRefundLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"token","type":"address"},{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"}],"name":"InboundRevokeLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"token","type":"address"},{"indexed":true,"name":"wanAddr","type":"address"},{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"},{"indexed":false,"name":"value","type":"uint256"},{"indexed":false,"name":"ethAddr","type":"address"},{"indexed":false,"name":"fee","type":"uint256"}],"name":"OutboundLockLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"token","type":"address"},{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"wanAddr","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"},{"indexed":false,"name":"x","type":"bytes32"}],"name":"OutboundRefundLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"token","type":"address"},{"indexed":true,"name":"wanAddr","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"}],"name":"OutboundRevokeLogger","type":"event"}];
  config.orgAbiE20     = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"acceptOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"changeOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"newOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"user","type":"address"},{"name":"amount","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_owner","type":"address"},{"indexed":true,"name":"_spender","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Approval","type":"event"}];
  config.orgAbiWanE20  = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"bytes"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"quotaLedger","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"account","type":"address"},{"name":"value","type":"uint256"}],"name":"mint","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"acceptOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"bytes"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"account","type":"address"},{"name":"value","type":"uint256"}],"name":"burn","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"changeOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"newOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"qlAddr","type":"address"},{"name":"tokenName","type":"bytes"},{"name":"tokenSymbol","type":"bytes"},{"name":"tokenDecimal","type":"uint8"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"account","type":"address"},{"indexed":true,"name":"value","type":"uint256"},{"indexed":true,"name":"totalSupply","type":"uint256"}],"name":"TokenMintedLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"account","type":"address"},{"indexed":true,"name":"value","type":"uint256"},{"indexed":true,"name":"totalSupply","type":"uint256"}],"name":"TokenBurntLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":true,"name":"value","type":"uint256"}],"name":"TokenLockedLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"manager","type":"address"},{"indexed":true,"name":"name","type":"bytes"},{"indexed":true,"name":"symbol","type":"bytes"},{"indexed":false,"name":"decimals","type":"uint8"}],"name":"TokenManagerLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_owner","type":"address"},{"indexed":true,"name":"_spender","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Approval","type":"event"}];



} else {
  //config.socketUrl = 'wss://api.wanchain.info';
  config.socketUrl = 'wss://18.236.235.133';  // Add by Jacob

  config.originalChainHtlc = "0x78eb00ec1c005fec86a074060cc1bc7513b1ee88";
  config.wanchainHtlcAddr = "0x7a333ba427fce2e0c6dd6a2d727e5be6beb13ac2";

  config.HTLCETHInstAbi=[{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"mapXHashShadow","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"xHash","type":"bytes32"},{"name":"storeman","type":"address"},{"name":"wanAddr","type":"address"}],"name":"eth2wethLock","outputs":[{"name":"","type":"bool"}],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"RATIO_PRECISE","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"x","type":"bytes32"}],"name":"eth2wethRefund","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"kill","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"x","type":"bytes32"}],"name":"weth2ethRefund","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"mapXHashHTLCTxs","outputs":[{"name":"direction","type":"uint8"},{"name":"source","type":"address"},{"name":"destination","type":"address"},{"name":"value","type":"uint256"},{"name":"status","type":"uint8"},{"name":"lockedTime","type":"uint256"},{"name":"beginLockedTime","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"acceptOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"DEF_LOCKED_TIME","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"xHash","type":"bytes32"}],"name":"weth2ethRevoke","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"xHash","type":"bytes32"}],"name":"xHashExist","outputs":[{"name":"exist","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"changeOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"lockedTime","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"revokeFeeRatio","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"xHash","type":"bytes32"}],"name":"getHTLCLeftLockedTime","outputs":[{"name":"time","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"halted","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"DEF_MAX_TIME","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"ratio","type":"uint256"}],"name":"setRevokeFeeRatio","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"newOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"time","type":"uint256"}],"name":"setLockedTime","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"halt","type":"bool"}],"name":"setHalt","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"xHash","type":"bytes32"},{"name":"user","type":"address"}],"name":"weth2ethLock","outputs":[{"name":"","type":"bool"}],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"xHash","type":"bytes32"}],"name":"eth2wethRevoke","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"user","type":"address"},{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"},{"indexed":false,"name":"value","type":"uint256"},{"indexed":false,"name":"wanAddr","type":"address"}],"name":"ETH2WETHLock","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"user","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"},{"indexed":false,"name":"x","type":"bytes32"}],"name":"ETH2WETHRefund","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"user","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"}],"name":"ETH2WETHRevoke","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"user","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"},{"indexed":false,"name":"value","type":"uint256"}],"name":"WETH2ETHLock","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"user","type":"address"},{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"},{"indexed":false,"name":"x","type":"bytes32"}],"name":"WETH2ETHRefund","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"}],"name":"WETH2ETHRevoke","type":"event"}];
  config.HTLCWETHInstAbi=[{"constant":false,"inputs":[{"name":"xHash","type":"bytes32"},{"name":"storeman","type":"address"},{"name":"ethAddr","type":"address"},{"name":"value","type":"uint256"}],"name":"weth2ethLock","outputs":[{"name":"","type":"bool"}],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"mapXHashShadow","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"RATIO_PRECISE","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"x","type":"bytes32"}],"name":"eth2wethRefund","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"kill","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"x","type":"bytes32"}],"name":"weth2ethRefund","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"mapXHashHTLCTxs","outputs":[{"name":"direction","type":"uint8"},{"name":"source","type":"address"},{"name":"destination","type":"address"},{"name":"value","type":"uint256"},{"name":"status","type":"uint8"},{"name":"lockedTime","type":"uint256"},{"name":"beginLockedTime","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"acceptOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"DEF_LOCKED_TIME","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"ETH_INDEX","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"storemanGroupAdmin","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"addr","type":"address"}],"name":"setStoremanGroupAdmin","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"mapXHashFee","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"xHash","type":"bytes32"},{"name":"wanAddr","type":"address"},{"name":"value","type":"uint256"}],"name":"eth2wethLock","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"xHash","type":"bytes32"}],"name":"weth2ethRevoke","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"wethManager","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"xHash","type":"bytes32"}],"name":"xHashExist","outputs":[{"name":"exist","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"changeOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"lockedTime","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"revokeFeeRatio","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"xHash","type":"bytes32"}],"name":"getHTLCLeftLockedTime","outputs":[{"name":"time","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"halted","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"DEF_MAX_TIME","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"ratio","type":"uint256"}],"name":"setRevokeFeeRatio","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"storeman","type":"address"},{"name":"value","type":"uint256"}],"name":"getWeth2EthFee","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"newOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"time","type":"uint256"}],"name":"setLockedTime","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"addr","type":"address"}],"name":"setWETHManager","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"halt","type":"bool"}],"name":"setHalt","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"xHash","type":"bytes32"}],"name":"eth2wethRevoke","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"wanAddr","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"},{"indexed":false,"name":"value","type":"uint256"}],"name":"ETH2WETHLock","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"wanAddr","type":"address"},{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"},{"indexed":false,"name":"x","type":"bytes32"}],"name":"ETH2WETHRefund","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"}],"name":"ETH2WETHRevoke","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"wanAddr","type":"address"},{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"},{"indexed":false,"name":"value","type":"uint256"},{"indexed":false,"name":"ethAddr","type":"address"},{"indexed":false,"name":"fee","type":"uint256"}],"name":"WETH2ETHLock","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"storeman","type":"address"},{"indexed":true,"name":"wanAddr","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"},{"indexed":false,"name":"x","type":"bytes32"}],"name":"WETH2ETHRefund","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"wanAddr","type":"address"},{"indexed":true,"name":"xHash","type":"bytes32"}],"name":"WETH2ETHRevoke","type":"event"}];
}

const path=require('path');
// const Logger = require('./logger/logger.js');
config.ccLog = path.join('logs', 'crossChainLog.log');
config.ccErr = path.join('logs', 'crossChainErr.log');
// config.logger = new Logger('CrossChain',config.ccLog, config.ccErr,config.loglevel);
// config.getLogger = function(name){
//   return new Logger(name,config.ccLog, config.ccErr,config.loglevel);
// };

config.dataName = wanchainNet;
config.rpcIpcPath = process.env.HOME;
config.keyStorePath = process.env.HOME;
config.ethkeyStorePath = process.env.HOME;
if (process.platform === 'darwin') {
  config.rpcIpcPath += '/Library/Wanchain/'+'gwan.ipc';
  config.keyStorePath = path.join(config.keyStorePath, '/Library/wanchain/', wanchainNet, 'keystore/');
  config.ethkeyStorePath = path.join(config.ethkeyStorePath, '/Library/ethereum/',ethereumNet,'keystore/');
}

if (process.platform === 'freebsd' ||
  process.platform === 'linux' ||
  process.platform === 'sunos') {
  config.rpcIpcPath += '/.wanchain/'+'gwan.ipc';
  config.keyStorePath = path.join(config.keyStorePath, '.wanchain',wanchainNet,'keystore/');
  config.ethkeyStorePath = path.join(config.ethkeyStorePath, '.ethereum',ethereumNet,'keystore/');
}

if (process.platform === 'win32') {
  config.rpcIpcPath = '\\\\.\\pipe\\gwan.ipc';
  config.keyStorePath = path.join(process.env.APPDATA, 'wanchain', wanchainNet,'keystore\\');
  config.ethkeyStorePath = path.join(process.env.APPDATA, 'ethereum', ethereumNet,'keystore\\');
}

config.databasePath = process.env.HOME;
if (process.platform === 'win32') {
  config.databasePath = process.env.APPDATA;
}

config.databasePath =  path.join(config.databasePath, 'LocalDb');

config.wanKeyStorePath = config.keyStorePath;
config.ethKeyStorePath = config.ethkeyStorePath;

config.depositOriginLockEvent = 'ETH2WETHLock(address,address,bytes32,uint256,address)';
config.depositCrossLockEvent = 'ETH2WETHLock(address,address,bytes32,uint256)';

config.withdrawOriginLockEvent = 'WETH2ETHLock(address,address,bytes32,uint256,address,uint256)';
config.withdrawCrossLockEvent = 'WETH2ETHLock(address,address,bytes32,uint256)';


config.depositOriginRefundEvent = 'ETH2WETHRefund(address,address,bytes32,bytes32)';
config.withdrawOriginRefundEvent = 'WETH2ETHRefund(address,address,bytes32,bytes32)';

config.depositOriginRevokeEvent = 'ETH2WETHRevoke(address,bytes32)';
config.withdrawOriginRevokeEvent = 'WETH2ETHRevoke(address,bytes32)';

config.crossDbname        = 'crossTransDb2.1';
config.crossCollection    = 'crossTransaction';
config.crossCollectionE20 = 'crossTransactionE20';
config.crossCollectionBtc = 'crossTransactionBtc';

config.confirmBlocks = 2;

config.consoleColor = {
  'COLOR_FgRed': '\x1b[31m',
  'COLOR_FgYellow': '\x1b[33m',
  'COLOR_FgGreen': "\x1b[32m"
};
module.exports = config;
