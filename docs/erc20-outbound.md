# ERC20 - Outbound (WRC20 ⇒  ERC20)

## Basic Steps

- Send lock tx on Wanchain
- Wait for storeman response on Ethereum
- Send redeem tx on Ethereum
- Wait for storeman response on Wanchain


## Required and optional fields

### Lock fields

- `symbol` - the erc20 token symbol (WMKR, WLRC, etc.)
- `tokenAddr` - the erc20 token address

- `to` - the receiving Ethereum account
- `from` - the sending Wanchain account
- `value` - the value to be transferred

### Redeem fields

- `lockTxHash` - the lock tx id for locking process

### Revoke fields

- `lockTxHash` - the lock tx id for locking process

## Using wanchain-js-sdk

__Simple Usage__: if the specified Wanchain and Ethereum accounts are open,
just simply invoke a lock action and then invoke a redeem action.

```javascript
//define the source chain and destination chain
srcChain  = global.crossInvoker.getSrcChainNameByContractAddr('WAN', 'WAN');
dstChain = global.crossInvoker.getSrcChainNameByContractAddr(e20OutboundInput.tokenAddr, 'ETH');

// do lock
global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', e20OutboundInput.lockInput);

...

// later, and even maybe else where, do redeem
txHashList = global.wanDb.getItem(walletCore.config.crossCollection, {lockTxHash: lockTxHash});
...
redeemInputCopy = Object.assign({}, e20OutboundInput.redeemInput);
redeemInputCopy.x = txHashList.x;
redeemInputCopy.hashX = txHashList.hashX;
console.log('Starting eth inbound redeem', redeemInputCopy);

retReddem = await global.crossInvoker.invoke(srcChain, dstChain, 'REDEEM', redeemInputCopy)

```
