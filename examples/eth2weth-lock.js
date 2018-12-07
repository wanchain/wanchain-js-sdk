global.wanchain_js_testnet = true;// define testnet or mainnet
let ccUtil      = require("wanchain-js-sdk").ccUtil;
let WalletCore  = require("wanchain-js-sdk").walletCore;
const {config, SLEEPTIME} = require('./conf/config');
const { ethInboundInput } = require('./conf/input');


/**
 * Requirements:
 * - Ethereum account has enough to cover the value defined in `ethInboundInput` plus gas
 */

async function main(){
	walletCore = new WalletCore(config);
	await walletCore.init();
	console.log('Starting init walletCore');

	srcChain = global.crossInvoker.getSrcChainNameByContractAddr('ETH', 'ETH');
	dstChain = global.crossInvoker.getSrcChainNameByContractAddr('WAN', 'WAN');
	
	// checking available storeman groups which serve ETH  coin transaction
    storemanList = (await ccUtil.getEthSmgList()).sort((a, b) => b.inboundQuota - a.inboundQuota);
	ethInboundInput.lockInput.txFeeRatio = storemanList[0].txFeeRatio;
	ethInboundInput.lockInput.storeman = storemanList[0].ethAddress;


	console.log('Starting eth inbound lock', ethInboundInput.lockInput);

	// Invoke the lock transaction on Ethereum
	retLock = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', ethInboundInput.lockInput);
    
    console.log(`The Lock Hash is ${retLock.result}`);
}

main();

