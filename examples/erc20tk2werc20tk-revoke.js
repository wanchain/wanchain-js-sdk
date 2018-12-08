global.wanchain_js_testnet = true;// define testnet or mainnet
let ccUtil      = require("wanchain-js-sdk").ccUtil;
let WalletCore  = require("wanchain-js-sdk").walletCore;
const {config, SLEEPTIME} = require('./conf/config');
const { e20InboundInput } = require('./conf/input');

/**
 * Requirements:
 * - Ethereum account has enough to cover the value defined in `ethInboundInput` plus gas
 */

//define your tokenAddr
tokenAddr = '0x54950025d1854808b09277fe082b54682b11a50b'；

// define lock hash para from the lock
lockTxHash = '0x869a40ac626c0f4720e9de1457c70b7daac711daef175143ea41091bca8accd8';



async function main(){
	walletCore = new WalletCore(config);
	await walletCore.init();
	console.log('Starting init walletCore');

	srcChain = global.crossInvoker.getSrcChainNameByContractAddr(tokenAddr, 'ETH');
	dstChain = global.crossInvoker.getSrcChainNameByContractAddr('WAN', 'WAN');
	

    txHashList = global.wanDb.getItem(walletCore.config.crossCollection, {lockTxHash: lockTxHash});
    console.log('checking txHashList for revoke', txHashList);
    const tmp = {
        x: txHashList.x,
        hashX: txHashList.hashX
    }
	input = Object.assign({}, ETH_PARA, tmp);

	console.log('The Revoke input is', input);


    ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REVOKE', input);
    console.log(`The Revoke Hash is ${ret.result}`);

}

main();