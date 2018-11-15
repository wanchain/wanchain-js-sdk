const { assert } = require('chai');
const WalletCore = require('../src/core/walletCore');
const { lockState } = require('./support/stateDict');
const { config, SLEEPTIME } = require('./support/config');
const { e20InboundInput } = require('./support/input');
const { checkHash, sleepAndUpdateStatus, sleepAndUpdateReceipt, lockTokenBalance, ccUtil } = require('./support/utils');
const { getEthBalance, getMultiTokenBalanceByTokenScAddr, syncErc20StoremanGroups, getErc20Info } = ccUtil;


describe('ERC20-TO-WAN Inbound Lock Crosschain Transaction', () => {
    let walletCore, srcChain, dstChain;
    let calBalances;
    let beforeETH, beforeToken ;
    let afterLockETH, afterLockToken;
    let ret, txHashList, approveReceipt, lockReceipt;

    before(async () => {
        walletCore = new WalletCore(config);
        await walletCore.init();
        srcChain = global.crossInvoker.getSrcChainNameByContractAddr(e20InboundInput.tokenAddr, 'ETH')
        dstChain = global.crossInvoker.getSrcChainNameByContractAddr('WAN', 'WAN');
        e20InboundInput.lockInput.txFeeRatio = (await global.crossInvoker.getStoremanGroupList(srcChain, dstChain))[0].txFeeRatio;
        e20InboundInput.lockInput.storeman = (await syncErc20StoremanGroups(e20InboundInput.tokenAddr))[0].smgOrigAddr;
        e20InboundInput.lockInput.decimals = (await getErc20Info(e20InboundInput.tokenAddr)).decimals;
    });

    describe('Approve And Lock Transaction', () => {
        it('All Needed Balance Are Not 0', async () => {
            try {
                [beforeETH, beforeToken] = await Promise.all([
                    getEthBalance(e20InboundInput.lockInput.from),
                    getMultiTokenBalanceByTokenScAddr([e20InboundInput.lockInput.from], srcChain[0], srcChain[1].tokenType)
                ]);
                beforeToken = beforeToken[e20InboundInput.lockInput.from];
            } catch(e) {
                console.log(`Get Account Balance Error: ${e}`);
            }
            assert.notStrictEqual(beforeETH, '0');
            assert.notStrictEqual(beforeToken, '0');
        })
        it('Send Approve&Lock Transactions', async () => {
            ret = await global.crossInvoker.invoke(srcChain, dstChain, 'LOCK', e20InboundInput.lockInput);
            assert.strictEqual(checkHash(ret.result), true);
            console.log(`The Lock Hash is ${ret.result}`);

            txHashList = global.wanDb.getItem(walletCore.config.crossCollection, {lockTxHash: ret.result});
            while (!approveReceipt || !lockReceipt) {
                [approveReceipt, lockReceipt] = await Promise.all([
                    sleepAndUpdateReceipt(SLEEPTIME, ['ETH', txHashList.approveTxHash]),
                    sleepAndUpdateReceipt(SLEEPTIME, ['ETH', ret.result])
                ])
            }
            assert.strictEqual(approveReceipt.status, '0x1');
            assert.strictEqual(lockReceipt.status, '0x1');
            while (lockState.indexOf(txHashList.status) < lockState.indexOf('BuddyLocked')) {
                txHashList = await sleepAndUpdateStatus(SLEEPTIME, [walletCore.config.crossCollection, {lockTxHash: ret.result}]);
            }
        })
        it('The Balance After Sending Approve&Lock Transactions', async () => {
            calBalances = lockTokenBalance([beforeETH, beforeToken], [approveReceipt, lockReceipt], e20InboundInput);
            try {
                [afterLockETH, afterLockToken] = await Promise.all([
                    getEthBalance(e20InboundInput.lockInput.from),
                    getMultiTokenBalanceByTokenScAddr([e20InboundInput.lockInput.from], srcChain[0], srcChain[1].tokenType)
                ]);
            } catch(e) {
                console.log(`Get After LockTx Account Balance Error: ${e}`);
            }
            assert.strictEqual(afterLockETH.toString(), calBalances[0]);
            assert.strictEqual(afterLockToken[e20InboundInput.lockInput.from].toString(), calBalances[1]);
        })
    })
});
