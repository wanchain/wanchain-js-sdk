delete require.cache[require.resolve('./support/input')];

const { assert } = require('chai');
const WalletCore = require('../src/core/walletCore');
const { revokeState } = require('./support/stateDict');
const {config, SLEEPTIME} = require('./support/config');
const { e20OutboundInput, e20InboundInput } = require('./support/input');
const { checkHash, sleepAndUpdateStatus, revokeTokenBalance, sleepAndUpdateReceipt, ccUtil } = require('./support/utils');
const { canRevoke, getBalance, getMultiTokenBalanceByTokenScAddr, getToken2WanRatio, getE20RevokeFeeRatio, getTokenInfo } = ccUtil;

describe('Revoke Token', () => {
    let walletCore, srcChain, dstChain, getOrigin, input, chainType, amount, decimals;
    let beforeOrigin, beforeToken;
    let afterOrigin, afterToken;
    let ret, txHashList, revokeReceipt, coin2WanRatio, txFeeRatio, revokeFeeRatio;
    let calBalances, revokeList = [], storemanList;
    before(async function () {
        walletCore = new WalletCore(config);
        await walletCore.init();
        (global.wanDb.filterNotContains(walletCore.config.crossCollection, 'tokenSymbol', ['ETH', 'BTC'])).forEach(val => {
            (canRevoke(val)).code && revokeList.push(val); 
            // (canRevoke(val)).code && ['WAN'].includes(val.srcChainType) && revokeList.push(val); 
        });
        if(revokeList.length === 0) {
            this.skip();
        } else {
            txHashList = revokeList[0];
            const tmp = {
                x: txHashList.x,
                hashX: txHashList.hashX
            }
            if(txHashList.srcChainAddr === 'WAN') {
                srcChain = global.crossInvoker.getSrcChainNameByContractAddr('WAN', 'WAN');
                dstChain = global.crossInvoker.getSrcChainNameByContractAddr(txHashList.dstChainAddr, 'ETH');
                srcChain[2] = dstChain[1].buddy;
                getOrigin = getBalance;
                chainType = 'WAN';
                input = Object.assign({}, e20OutboundInput.revokeInput, tmp);
                decimals = (await getTokenInfo(txHashList.dstChainAddr, 'ETH')).decimals;
                coin2WanRatio = await getToken2WanRatio(txHashList.dstChainAddr);
                revokeFeeRatio = await getE20RevokeFeeRatio('WAN')
            } else {
                srcChain = global.crossInvoker.getSrcChainNameByContractAddr(txHashList.srcChainAddr, 'ETH');
                dstChain = global.crossInvoker.getSrcChainNameByContractAddr('WAN', 'WAN');
                srcChain[2] = srcChain[0];
                getOrigin = getBalance;
                chainType = 'ETH'
                input = Object.assign({}, e20InboundInput.revokeInput, tmp);
                decimals = (await getTokenInfo(txHashList.srcChainAddr, 'ETH')).decimals;
                coin2WanRatio = await getToken2WanRatio(txHashList.srcChainAddr);
                revokeFeeRatio = await getE20RevokeFeeRatio();
            }
            amount = parseInt(txHashList.contractValue.toString(), 16) / Math.pow(10, decimals);
            [storemanList] = (await global.crossInvoker.getStoremanGroupList(srcChain, dstChain)).filter(item => item.smgWanAddr === txHashList.storeman || item.smgOrigAddr === txHashList.storeman);
            txFeeRatio = storemanList.txFeeRatio;
        }
    });

    it('All Needed Balance Are Not 0', async () => {
        try {
            [beforeOrigin, beforeToken] = await Promise.all([
                getOrigin(txHashList.from, chainType),
                getMultiTokenBalanceByTokenScAddr([txHashList.from], srcChain[2], srcChain[1].tokenType)
            ]);
            beforeToken = beforeToken[txHashList.from];
        } catch(e) {
            console.log(`Get Account Balance Error: ${e}`);
        }
        assert.notStrictEqual(beforeOrigin, '0');
    });

    it('Send Revoke Transactions', async () => {
        ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REVOKE', input);
        console.log(`The Revoke Hash is ${ret.result}`);
        assert.strictEqual(checkHash(ret.result), true, ret.result);

        txHashList = global.wanDb.getItem(walletCore.config.crossCollection, {revokeTxHash: ret.result});
        while (!revokeReceipt) {
            revokeReceipt = await sleepAndUpdateReceipt(SLEEPTIME, [chainType, ret.result]);
        }
        console.log(revokeReceipt.status)
        assert.strictEqual(revokeReceipt.status, '0x1');
        while (revokeState.indexOf(txHashList.status) < revokeState.indexOf('Revoked')) {
            txHashList = await sleepAndUpdateStatus(SLEEPTIME, [walletCore.config.crossCollection, {revokeTxHash: ret.result}]);
        }
        assert.strictEqual(txHashList.status, 'Revoked');
    });

    it('The Balance After Sending Revoke Transaction', async () => {
        calBalances = revokeTokenBalance([beforeOrigin, beforeToken], revokeReceipt, input, {amount, coin2WanRatio, txFeeRatio, chainType, revokeFeeRatio, decimals});
        try {
            [afterOrigin, afterToken] = await Promise.all([
                getOrigin(txHashList.from),
                getMultiTokenBalanceByTokenScAddr([txHashList.from], srcChain[2], srcChain[1].tokenType)
            ]);
        } catch(e) {
            console.log(`Get After LockTx Account Balance Error: ${e}`);
        }
        assert.strictEqual(afterOrigin.toString(), calBalances[0]);
        assert.strictEqual(afterToken[txHashList.from].toString(), calBalances[1]);
    })
})