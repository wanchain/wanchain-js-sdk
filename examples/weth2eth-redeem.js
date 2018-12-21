global.wanchain_js_testnet = true;// define testnet or mainnet
let ccUtil      = require("wanchain-js-sdk").ccUtil;
let WalletCore  = require("wanchain-js-sdk").walletCore;
const {config, SLEEPTIME} = require('./conf/config');
const { ethOutboundInput } = require('./conf/input');

/**
 * Requirements:
 * - Ethereum account has enough gas to cover the value defined in `WAN_PARA`
 */

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sleepAndUpdateReceipt(time, option) {
    let tmp;
    await sleep(time);
    try {
        tmp = await ccUtil.getTxReceipt(...option)
    } catch(e) {}
    return Promise.resolve(tmp);
};

// define lock hash para from the lock
lockTxHash = '0x8b0431043d5475bb08bcfa68ecb541f9cb29ccad341bb01437ee50c338321a34';

async function main(){

	let redeemReceipt;
	walletCore = new WalletCore(config);
	await walletCore.init();
	console.log('Starting init walletCore');

	srcChain = global.crossInvoker.getSrcChainNameByContractAddr('WAN', 'WAN');
	dstChain = global.crossInvoker.getSrcChainNameByContractAddr('ETH', 'ETH');
	

    txHashList = global.wanDb.getItem(walletCore.config.crossCollection, {lockTxHash: lockTxHash});
    console.log('checking txHashList for redeem', txHashList);

    
    redeemInputCopy = Object.assign({}, ethOutboundInput.redeemInput);
    redeemInputCopy.x = txHashList.x;
    redeemInputCopy.hashX = txHashList.hashX;
    console.log('Starting eth outbound redeem', redeemInputCopy);

    retReddem = await global.crossInvoker.invoke(srcChain, dstChain, 'REDEEM', redeemInputCopy)

    console.log(`The Redeem Hash is ${retReddem.result}`);
    
    txHashList = global.wanDb.getItem(walletCore.config.crossCollection, {redeemTxHash: retReddem.result});
    while (!redeemReceipt) {
        redeemReceipt = await sleepAndUpdateReceipt(SLEEPTIME, ['ETH', retReddem.result]);
    }
            
    process.exit(0);
}

main();

