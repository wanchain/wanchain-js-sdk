const lockState = [
    'ApproveSending',
    'ApproveSendFail',
    'ApproveSendFailAfterRetries',
    'ApproveSent',
    'Approved',
    'LockSending',
    'LockSendFail',
    'LockSendFailAfterRetries',
    'LockSent',
    'Locked',
    'BuddyLocked',
    'RedeemSending',
    'RedeemSendFail',
    'RedeemSendFailAfterRetries',
    'RedeemSent',
    'Redeemed',
];

const revokeState = [
    'RevokeSending',
    'RevokeSendFail',
    'RevokeSendFailAfterRetries',
    'RevokeSent',
    'Revoked',
];

module.exports = {
    lockState,
    revokeState,
};