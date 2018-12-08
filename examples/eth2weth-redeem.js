global.wanchain_js_testnet = true;// define testnet or mainnet
let ccUtil      = require("wanchain-js-sdk").ccUtil;
let WalletCore  = require("wanchain-js-sdk").walletCore;
const {config, SLEEPTIME} = require('./conf/config');
const { ethInboundInput } = require('./conf/input');


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

// define lock hash para from the lock operation result
lockTxHash = '0x83ffb3c533ac258f16db0b9b8e6f44165d96493ecc7144d1ecd49f4fd0f05f03';

async function main(){

	let redeemReceipt;
	walletCore = new WalletCore(config);
	await walletCore.init();
	console.log('Starting init walletCore');

	srcChain = global.crossInvoker.getSrcChainNameByContractAddr('ETH', 'ETH');
	dstChain = global.crossInvoker.getSrcChainNameByContractAddr('WAN', 'WAN');
	

    txHashList = global.wanDb.getItem(walletCore.config.crossCollection, {lockTxHash: lockTxHash});
    console.log('checking txHashList for redeem', txHashList);
    let time = (txHashList.htlcTimeOut - txHashList.lockedTime) / 2 / 20 * 19000;
    if (new Date().getTime() < (txHashList.lockedTime + time)) {
        console.log(`Need To Wait ${time / 1000}s To Send Redeem Transaction`)
        await sleep(txHashList.lockedTime + time - new Date().getTime());
    }
    
    redeemInputCopy = Object.assign({}, ethInboundInput.redeemInput);
    redeemInputCopy.x = txHashList.x;
    redeemInputCopy.hashX = txHashList.hashX;
    console.log('Starting eth inbound redeem', redeemInputCopy);

    retReddem = await global.crossInvoker.invoke(srcChain, dstChain, 'REDEEM', redeemInputCopy)

    console.log(`The Redeem Hash is ${retReddem.result}`);
    
    txHashList = global.wanDb.getItem(walletCore.config.crossCollection, {redeemTxHash: retReddem.result});
    while (!redeemReceipt) {
        redeemReceipt = await sleepAndUpdateReceipt(SLEEPTIME, ['WAN', retReddem.result]);
    }
            

}

main();

