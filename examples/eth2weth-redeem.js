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
lockTxHash = '0x3e9c1f853bfc571be7f56009cbc99ca7c2b5021a7ebc9f7e54591e74f8cc92e5';

async function main(){

    let redeemReceipt;
    walletCore = new WalletCore(config);
    await walletCore.init();
    console.log('Starting init walletCore');
    
    srcChain = global.crossInvoker.getSrcChainNameByContractAddr('ETH', 'ETH');
    dstChain = global.crossInvoker.getSrcChainNameByContractAddr('WAN', 'WAN');
	

    txHashList = global.wanDb.getItem(walletCore.config.crossCollection, {lockTxHash: lockTxHash});
    console.log('checking txHashList for redeem', txHashList);

    
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
    process.exit(0);            

}

main();

