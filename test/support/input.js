const e20Input = {
    srcChain: [
        '0x00f58d6d585f84b2d7267940cede30ce2fe6eae8',
        {
            tokenSymbol: 'ZRX',
            tokenStand: 'E20',
            tokenType: 'ETH',
            buddy: '0x8b9efd0f6d5f078520a65ad731d79c0f63675ec0',
            token2WanRatio: '3000',
            tokenDecimals: '18'
        }
    ],
    dstChain: [
        'WAN',
        {
            tokenSymbol: 'WAN',
            tokenStand: 'WAN',
            tokenType: 'WAN',
            buddy: 'WAN',
            token2WanRatio: 0,
            tokenDecimals: 18
        }
    ],
    action: 'LOCK',
    input: {
        from: '0xbd4ebfb9bab4f59ba653412ff6044dbec6c02af8',
        storeman: '0x38b6c9a1575c90ceabbfe31b204b6b3a3ce4b3d9',
        txFeeRatio: '1',
        to: '0xc0004d0af2b8a6a3b2566843cc83b34493f2ef17',
        amount: '0.001',
        gasPrice: '10',
        gasLimit: '470000',
        password: ''
    }
}


exports.e20Input = e20Input;
