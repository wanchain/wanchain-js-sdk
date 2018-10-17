'use strict';

const { assert } = require('chai');
const WalletCore = require('../src/core/walletCore');
const { lockState } = require('./support/stateDict');
const {config, SLEEPTIME} = require('./support/config');
const { e20OutboundInput, e20InboundInput } = require('./support/input');
const { checkHash, sleepAndUpdateStatus, sleepAndUpdateReceipt, ccUtil } = require('./support/utils');
const { canRevoke, getWanBalance, getEthBalance, getMultiTokenBalanceByTokenScAddr, revokeTokenBalance } = ccUtil;

describe('Revoke Token', () => {
    let walletCore, srcChain, dstChain, getOrigin, input, chainType;
    let beforeOrigin, beforeToken;
    let afterOrigin, afterToken;
    let ret, txHashList, revokeReceipt;
    let revokeList = [];

    before(async () => {
        walletCore = new WalletCore(config);
        await walletCore.init();
        (global.wanDb.getCollection(config.crossCollection)).forEach((val) => {
            (canRevoke(val)).code && revokeList.push(val); 
        })

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
                getOrigin = getWanBalance;
                chainType = 'WAN';
                input = Object.assign(e20OutboundInput.revokeInput, tmp);
            } else {
                srcChain = global.crossInvoker.getSrcChainNameByContractAddr(txHashList.srcChainAddr, 'ETH');
                dstChain = global.crossInvoker.getSrcChainNameByContractAddr('WAN', 'WAN');
                getOrigin = getEthBalance;
                chainType = 'ETH'
                input = Object.assign(e20InboundInput.revokeInput, tmp);
            }
        }
    });

    it('All Needed Balance Are Not 0', () => {
        try {
            [beforeOrigin, beforeToken] = await Promise.all([
                getOrigin(txHashList.from),
                getMultiTokenBalanceByTokenScAddr([txHashList.to], dstChain[0], dstChain[1].tokenType),
            ]);
            beforeToken = beforeToken[txHashList.to];
        } catch(e) {
            console.log(`Get Account Balance Error: ${e}`);
        }
        assert.notStrictEqual(beforeOrigin, '0');
    });

    it('Send Approve&Lock Transactions', async () => {
        ret = await global.crossInvoker.invoke(srcChain, dstChain, 'REVOKE', input);
        assert.strictEqual(checkHash(ret.result), true, ret.result);
        console.log('ret:',ret);
        txHashList = global.wanDb.getItem(config.crossCollection, {revokeTxHash: ret.result});
        while (!revokeReceipt) {
            revokeReceipt = await sleepAndUpdateReceipt(SLEEPTIME, [chainType, ret.result]);
        }
        assert.strictEqual(revokeReceipt.status, '0x1');
    });

    it('The Balance After Sending Revoke Transaction', async () => {
        calBalances = revokeTokenBalance([beforeOrigin, beforeToken], revokeReceipt, input, chainType);
        try {
            [afterOrigin, afterToken] = await Promise.all([
                getOrigin(txHashList.from),
                getMultiTokenBalanceByTokenScAddr([txHashList.to], dstChain[0], dstChain[1].tokenType)
            ]);
        } catch(e) {
            console.log(`Get After LockTx Account Balance Error: ${e}`);
        }
        assert.strictEqual(afterOrigin.toString(), calBalances[0]);
        assert.strictEqual(afterToken[txHashList.to].toString(), calBalances[1]);
    })
})