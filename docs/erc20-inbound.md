# ERC20 - Inbound (ERC20 ⇒  WERC20)

## Basic Steps

- Send lock tx on Ethereum
- Wait for storeman response on Wanchain
- Send redeem tx on Wanchain
- Wait for storeman response on Ethereum

## Required and optional fields

### Lock fields (- [check the e20InboundInput field in the input.js](examples/conf/input.js) )

- `symbol` - the erc20 token symbol (MKR, LRC, etc.)
- `tokenAddr` - the erc20 token address

- `to` - the receiving Wanchain account
- `from` - the sending Ethereum account
- `value` - the value to be transferred

- `lockTxHash` - the lock tx id for locking process

### Revoke fields

- `lockTxHash` - the lock tx id for locking process

## Using wanchain-js-sdk

__Simple Usage__: if the specified Wanchain and Ethereum accounts are open,
just simply invoke a lock action and then invoke a redeem action.

```javascript
//define the source chain and destination chain
srcChain = global.crossInvoker.getSrcChainNameByContractAddr(e20InboundInput.tokenAddr, 'ETH'); //note this tokenAddr
dstChain = global.crossInvoker.getSrcChainNameByContractAddr('WAN', 'WAN');

// do lock
global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', e20InboundInput.lockInput);

...

// later, and even maybe elsewhere, do redeem
txHashList = global.wanDb.getItem(walletCore.config.crossCollection, {lockTxHash: lockTxHash});
...
redeemInputCopy = Object.assign({}, e20InboundInput.redeemInput);
redeemInputCopy.x = txHashList.x;
redeemInputCopy.hashX = txHashList.hashX;
console.log('Starting eth inbound redeem', redeemInputCopy);

retReddem = await global.crossInvoker.invoke(srcChain, dstChain, 'REDEEM', redeemInputCopy)

```
