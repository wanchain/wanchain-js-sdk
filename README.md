# wanchain-js-sdk

[![GitHub License][license]][license-url]

### Wanchain SDK for making crosschain transactions on the Wanchain network

Note: Currently only Ethereum and ERC20 can be used on mainnet.

## Install

Use NPM to install the library:

```bash
git clone https://github.com/wanchain/wanchain-js-sdk.git
npm install
```

## Configure

You need a config.js file as the following:

```javascript

const config = {
    port: 8545, //wanchain api port
    useLocalNode: false, // if you like to use your local node, otherwise please set to false
    logPathPrex: '', // your logs directory prefix, if you like your logs file under current directory just leave it blank.
    loglevel: 'info', // log level, we have four levels info,debug,warn and error.
    databasePathPrex: '', // your lowdb dirctory prefix.
    
};

const SLEEPTIME = 10000; //sleep time checking for storeman event when redeem

module.exports = {
    config,
    SLEEPTIME,
};



```

## Basic Usage

### Define the transaction

Start by create a new WalletCore instance with abovementioned config then initialize it.

```javascript
  walletCore = new WalletCore(config);
  walletCore.init();
```
Then define the source chain and destination chain.

```javascript
  srcChain = global.crossInvoker.getSrcChainNameByContractAddr('ETH', 'ETH');
  dstChain = global.crossInvoker.getSrcChainNameByContractAddr('WAN', 'WAN');
```

Then define the details of the crosschain transaction. The wanchain-js-sdk
crosschain methods require you to pass in this transaction object. The required
values depend on chain and direction.

```javascript

//define your wanchain gas parameter and your wallet password
const WAN_PARA = {
    gasPrice: '180',
    gasLimit: '470000',
    password: 'password'
};

//define your ethereum gas parameter and your wallet password
const ETH_PARA = {
    gasPrice: '10',
    gasLimit: '470000',
    password: 'password'
};

// Instance INPUT
const ethInboundInput = {
    lockInput: Object.assign({}, {
        from: ETHADDR,
        to: WANADDR,
        amount: '0.00113',
    }, ETH_PARA),
    redeemInput: WAN_PARA,
    revokeInput: ETH_PARA
};


```

### Invoke the lock transaction

Firstly you need to check storeman groups which serve ETH  coin transaction
then invoke the transaction!

```javascript

  // checking storeman groups which serve ETH  coin transaction
  storemanList = (await ccUtil.getEthSmgList()).sort((a, b) => b.inboundQuota - a.inboundQuota);
  ethInboundInput.lockInput.txFeeRatio = storemanList[0].txFeeRatio;
  ethInboundInput.lockInput.storeman = storemanList[0].ethAddress;

  // Invoke the lock transaction on Ethereum
  retLock = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', ethInboundInput.lockInput);
    

```


There are generally several independent transactions including LOCK, REDEEM, REVOKE etc.

## Documentation

#### Cross-chain Transactions
- [Ethereum Inbound](docs/eth-inbound.md)
- [Ethereum Outbound](docs/eth-outbound.md)
- [ERC20 Inbound](docs/erc20-inbound.md)
- [ERC20 Outbound](docs/erc20-outbound.md)

#### Examples

- [ETH to WETH lock](examples/eth2weth-lock.js)
- [ETH to WETH redeem](examples/eth2weth-redeem.js)
- [ETH to WETH revoke](examples/eth2weth-revoke.js)
- [WETH to ETH lock](examples/weth2eth-lock.js)
- [WETH to ETH redeem](examples/weth2eth-redeem.js)
- [WETH to ETH revoke](examples/weth2eth-revoke.js)
- [ERC20 to WERC20 lock](examples/erc20tk2werc20tk-lock.js)
- [ERC20 to WERC20 redeem](examples/erc20tk2werc20tk-redeem.js)
- [ERC20 to WERC20 revoke](examples/erc20tk2werc20tk-revoke.js)
- [WERC20 to ERC20 lock](examples/werc20tk2erc20tk-lock.js)
- [WERC20 to ERC20 redeem](examples/werc20tk2erc20tk-redeem.js)
- [WERC20 to ERC20 revoke](examples/werc20tk2erc20tk-revoke.js)
## Development

1. `git clone https://github.com/wanchain/wanchain-js-sdk.git`
2. `npm install`
3. `npm test`

## Next Todos
- Add support for more of the contract methods
- Add support for more available tokens

## License

[license]: https://img.shields.io/badge/license-GNUGPL3-blue.svg
[license-url]: https://github.com/wanchain/wanchain-js-sdk/blob/master/LICENSE
