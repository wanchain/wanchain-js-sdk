const e20InboundInput = {
    tokenAddr: '0x00f58d6d585f84b2d7267940cede30ce2fe6eae8',
    lockInput: {
        from: '0xbd4ebfb9bab4f59ba653412ff6044dbec6c02af8',
        storeman: '0x38b6c9a1575c90ceabbfe31b204b6b3a3ce4b3d9',
        to: '0xc0004d0af2b8a6a3b2566843cc83b34493f2ef17',
        amount: '0.001',
        gasPrice: '10',
        gasLimit: '470000',
        password: '123qweasd'
    },
    redeemInput: {
        gasPrice: '180',
        gasLimit: '470000',
        password: '123qwe!@#'
    }
}

const e20OutboundInput = {
    tokenAddr: '0x00f58d6d585f84b2d7267940cede30ce2fe6eae8',
    lockInput: {
        from: '0xc0004d0af2b8a6a3b2566843cc83b34493f2ef17',
        storeman: '0x765854f97f7a3b6762240c329331a870b65edd96',
        to: '0xbd4ebfb9bab4f59ba653412ff6044dbec6c02af8',
        amount: '0.00001',
        gasPrice: '180',
        gasLimit: '470000',
        password: '123qwe!@#'
    },
    redeemInput: {
        gasPrice: '10',
        gasLimit: '470000',
        password: '123qweasd'
    }
}

module.exports = {
    e20InboundInput,
    e20OutboundInput,
};