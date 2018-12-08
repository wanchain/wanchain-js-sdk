global.wanchain_js_testnet = true;// define testnet or mainnet
let ccUtil      = require("wanchain-js-sdk").ccUtil;
let WalletCore  = require("wanchain-js-sdk").walletCore;
const {config, SLEEPTIME} = require('./conf/config');
const { e20InboundInput } = require('./conf/input');

/**
 * Requirements:
 * - Ethereum account has enough to cover the value defined in `ethInboundInput` plus gas
 */


async function main(){
	walletCore = new WalletCore(config);
	await walletCore.init();
	console.log('Starting init walletCore');

	srcChain = global.crossInvoker.getSrcChainNameByContractAddr(e20InboundInput.tokenAddr, 'ETH');
	dstChain = global.crossInvoker.getSrcChainNameByContractAddr('WAN', 'WAN');
	
    storemanList = (await ccUtil.getEthSmgList()).sort((a, b) => b.inboundQuota - a.inboundQuota);
    e20InboundInput.lockInput.txFeeRatio = (await global.crossInvoker.getStoremanGroupList(srcChain, dstChain))[0].txFeeRatio;
    e20InboundInput.lockInput.storeman = (await syncErc20StoremanGroups(e20InboundInput.tokenAddr))[0].smgOrigAddr;
    e20InboundInput.lockInput.decimals = (await getErc20Info(e20InboundInput.tokenAddr)).decimals;


	console.log('Starting ERC20 inbound lock', e20InboundInput.lockInput);

	// Invoke the lock transaction on Ethereum
	retLock = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', e20InboundInput);
    
    console.log(`The ERC20 Lock Hash is ${retLock.result}`);
}

main();

