global.wanchain_js_testnet = true;// define testnet or mainnet
let ccUtil      = require("wanchain-js-sdk").ccUtil;
let WalletCore  = require("wanchain-js-sdk").walletCore;
const {config, SLEEPTIME} = require('./conf/config');
const { e20OutboundInput } = require('./conf/input');

/**
 * Requirements:
 * - Ethereum account has enough to cover the value defined in `ethInboundInput` plus gas
 */

async function main(){
	walletCore = new WalletCore(config);
	await walletCore.init();
	console.log('Starting init walletCore');

    srcChain  = global.crossInvoker.getSrcChainNameByContractAddr('WAN', 'WAN');
    dstChain = global.crossInvoker.getSrcChainNameByContractAddr(e20OutboundInput.tokenAddr, 'ETH');
    e20OutboundInput.coin2WanRatio = await ccUtil.getToken2WanRatio(e20OutboundInput.tokenAddr);
    e20OutboundInput.lockInput.txFeeRatio = (await global.crossInvoker.getStoremanGroupList(srcChain, dstChain))[0].txFeeRatio;
    e20OutboundInput.lockInput.storeman = (await ccUtil.syncErc20StoremanGroups(e20OutboundInput.tokenAddr))[0].smgWanAddr;
    e20OutboundInput.lockInput.decimals = (await ccUtil.getErc20Info(e20OutboundInput.tokenAddr)).decimals;



	console.log('Starting eth outbound lock', e20OutboundInput.lockInput);

	// Invoke the lock transaction on wanchain
	retLock = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', e20OutboundInput.lockInput);
    
    console.log(`The Lock Hash is ${retLock.result}`);
}

main();

