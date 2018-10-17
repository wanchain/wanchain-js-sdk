const WANPWD = '123qwe!@#';
const ETHPWD = '123qweasd';

const e20InboundInput = {
    tokenAddr: '0x00f58d6d585f84b2d7267940cede30ce2fe6eae8',
    lockInput: {
        from: '0xbd4ebfb9bab4f59ba653412ff6044dbec6c02af8',
        to: '0xc0004d0af2b8a6a3b2566843cc83b34493f2ef17',
        amount: '0.00112',
        gasPrice: '10',
        gasLimit: '470000',
        password: ETHPWD
    },
    redeemInput: {
        gasPrice: '180',
        gasLimit: '470000',
        password: WANPWD
    },
    revoke: {
        gasPrice: '10',
        gasLimit: '470000',
        password: ETHPWD
    }
}

const e20OutboundInput = {
    tokenAddr: '0x00f58d6d585f84b2d7267940cede30ce2fe6eae8',
    lockInput: {
        from: '0xc0004d0af2b8a6a3b2566843cc83b34493f2ef17',
        to: '0xbd4ebfb9bab4f59ba653412ff6044dbec6c02af8',
        amount: '0.00001',
        gasPrice: '180',
        gasLimit: '470000',
        password: WANPWD
    },
    redeemInput: {
        gasPrice: '10',
        gasLimit: '470000',
        password: ETHPWD
    },
    revokeInput: {
        gasPrice: '180',
        gasLimit: '470000',
        password: WANPWD 
    }
}

module.exports = {
    e20InboundInput,
    e20OutboundInput,
};