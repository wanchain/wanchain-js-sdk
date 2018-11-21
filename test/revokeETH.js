delete require.cache[require.resolve('./support/input')];

const { assert } = require('chai');
const WalletCore = require('../src/core/walletCore');
const { revokeState } = require('./support/stateDict');
const {config, SLEEPTIME} = require('./support/config');
const { ethOutboundInput, ethInboundInput } = require('./support/input');
const { checkHash, sleepAndUpdateStatus, revokeETHBalance, sleepAndUpdateReceipt, ccUtil } = require('./support/utils');
const { canRevoke, getWanBalance, getEthBalance, getMultiTokenBalanceByTokenScAddr, getEthC2wRatio, getEthSmgList } = ccUtil;

describe('Revoke ETH', () => {
    let walletCore, srcChain, dstChain, getOrigin, input, chainType;
    let beforeOrigin, beforeToken;
    let afterOrigin, afterToken;
    let ret, txHashList, revokeReceipt, coin2WanRatio, txFeeRatio;
    let calBalances, revokeList = [], storemanList;

    before(async function () {
        walletCore = new WalletCore(config);
        await walletCore.init();
        (global.wanDb.filterContains(walletCore.config.crossCollection, 'tokenSymbol', ['ETH'])).forEach(val => {
            (canRevoke(val)).code && revokeList.push(val); 
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
                dstChain = global.crossInvoker.getSrcChainNameByContractAddr('ETH', 'ETH');
                srcChain[2] = dstChain[1].buddy;
                getOrigin = getWanBalance;
                chainType = 'WAN';
                input = Object.assign({}, ethOutboundInput.revokeInput, tmp);
            } else {
                srcChain = global.crossInvoker.getSrcChainNameByContractAddr('ETH', 'ETH');
                dstChain = global.crossInvoker.getSrcChainNameByContractAddr('WAN', 'WAN');
                srcChain[2] = srcChain[1].buddy;
                getOrigin = getEthBalance;
                chainType = 'ETH'
                input = Object.assign({}, ethInboundInput.revokeInput, tmp);
            }
            storemanList = (await getEthSmgList()).filter(item => item.wanAddress === txHashList.storeman || item.ethAddress === txHashList.storeman);
            coin2WanRatio = await getEthC2wRatio();
            txFeeRatio = storemanList[0].txFeeRatio;
        }
    });

    it('All Needed Balance Are Not 0', async () => {
        try {
            [beforeOrigin, beforeToken] = await Promise.all([
                getOrigin(txHashList.from),
                getMultiTokenBalanceByTokenScAddr([txHashList.from], srcChain[2], srcChain[1].tokenType)
            ]);
        } catch(e) {
            console.log(`Get Account Balance Error: ${e}`);
        }
        beforeToken = beforeToken[txHashList.from];
        assert.notStrictEqual(beforeOrigin, '0');
    });

    it('Send Revoke Transactions', async () => {
        ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REVOKE', input);
        assert.strictEqual(checkHash(ret.result), true, ret.result);
        console.log(`The Revoke Hash is ${ret.result}`);

        txHashList = global.wanDb.getItem(walletCore.config.crossCollection, {revokeTxHash: ret.result});
        while (!revokeReceipt) {
            revokeReceipt = await sleepAndUpdateReceipt(SLEEPTIME, [chainType, ret.result]);
        }
        assert.strictEqual(revokeReceipt.status, '0x1');
        while (revokeState.indexOf(txHashList.status) < revokeState.indexOf('Revoked')) {
            txHashList = await sleepAndUpdateStatus(SLEEPTIME, [walletCore.config.crossCollection, {revokeTxHash: ret.result}]);
        }
        assert.strictEqual(txHashList.status, 'Revoked');
    });

    it('The Balance After Sending Revoke Transaction', async () => {
        if(chainType === 'WAN') {
            calBalances = revokeETHBalance([beforeOrigin, beforeToken], revokeReceipt, ethOutboundInput, {coin2WanRatio, txFeeRatio, chainType});
            try{
                [afterOrigin, afterToken] = await Promise.all([
                    getOrigin(txHashList.from),
                    getMultiTokenBalanceByTokenScAddr([txHashList.from], dstChain[1].buddy, srcChain[0])
                ]);
            } catch(e) {
                console.log(`Get After LockTx Account Balance Error: ${e}`);
            }
            assert.strictEqual(afterOrigin.toString(), calBalances[0]);
            assert.strictEqual(afterToken[txHashList.from].toString(), calBalances[1]);
        } else {
            calBalances = revokeETHBalance([beforeOrigin], revokeReceipt, ethInboundInput, {coin2WanRatio, txFeeRatio, chainType});
            try{
                afterOrigin = await getOrigin(txHashList.from);
            } catch(e) {
                console.log(`Get After LockTx Account Balance Error: ${e}`);
            }
            assert.strictEqual(afterOrigin.toString(), calBalances[0]);
        }
    })
})