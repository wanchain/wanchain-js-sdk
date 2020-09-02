global.wanchain_js_testnet = true;// define testnet or mainnet
let ccUtil      = require("wanchain-js-sdk").ccUtil;
let WalletCore  = require("wanchain-js-sdk").walletCore;
const {config, SLEEPTIME} = require('./conf/config');
const { ethOutboundInput } = require('./conf/input');

/**
 * Requirements:
 * - Ethereum account has enough to cover the value defined in `ethInboundInput` plus gas
 */

async function main(){
	walletCore = new WalletCore(config);
	await walletCore.init();
	console.log('Starting init walletCore');

	srcChain = global.crossInvoker.getSrcChainNameByContractAddr('WAN', 'WAN');
	dstChain = global.crossInvoker.getSrcChainNameByContractAddr('0x0000000000000000000000000000000000000000', 'ETH');
	

    storemanList = (await ccUtil.getSmgList('ETH')).sort((a, b) => b.outboundQuota - a.outboundQuota);
    ethOutboundInput.coin2WanRatio = await ccUtil.getC2WRatio('ETH');
    ethOutboundInput.lockInput.txFeeRatio = storemanList[0].txFeeRatio;
    ethOutboundInput.lockInput.storeman = storemanList[0].wanAddress;

	console.log('Starting eth outbound lock', ethOutboundInput.lockInput);

	// Invoke the lock transaction on Ethereum
	retLock = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', ethOutboundInput.lockInput);
    
    console.log(`The Lock Hash is ${retLock.result}`);
    process.exit(0);
}

main();

