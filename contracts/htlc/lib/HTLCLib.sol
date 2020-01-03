/*

  Copyright 2019 Wanchain Foundation.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/

//                            _           _           _
//  __      ____ _ _ __   ___| |__   __ _(_)_ __   __| | _____   __
//  \ \ /\ / / _` | '_ \ / __| '_ \ / _` | | '_ \@/ _` |/ _ \ \ / /
//   \ V  V / (_| | | | | (__| | | | (_| | | | | | (_| |  __/\ V /
//    \_/\_/ \__,_|_| |_|\___|_| |_|\__,_|_|_| |_|\__,_|\___| \_/
//
//

pragma solidity ^0.4.24;

import "../../lib/SafeMath.sol";

library HTLCLib {
    using SafeMath for uint;

    /**
     *
     * ENUMS
     *
     */

    /// @notice tx info status
    /// @notice uninitialized,locked,refunded,revoked
    enum TxStatus {None, Locked, Redeemed, Revoked}

    /// @notice default locked time(in seconds)
    uint constant DEF_LOCKED_TIME = uint(3600*36);

    /**
     *
     * STRUCTURES
     *
     */

    /// @notice HTLC(Hashed TimeLock Contract) tx info
    struct BaseTx {
        uint value;                 // HTLC transfer value of token
        bytes storemanPK;           // HTLC transaction storeman PK
        TxStatus status;            // HTLC transaction status
        uint lockedTime;            // HTLC transaction locked time
        uint beginLockedTime;       // HTLC transaction begin locked time
        bytes tokenOrigAccount;     // token account of original chain
    }

    /// @notice user  tx info
    struct UserTx {
        BaseTx baseTx;
        address sender;             // HTLC transaction sender address for the security check while user's revoke
        bytes shadow;               // Shadow address or account on mirror chain
    }
    /// @notice storeman  tx info
    struct SmgTx {
        BaseTx baseTx;
        address  userAddr;          // HTLC transaction user address for the security check while user's redeem
    }
    /// @notice storeman  debt tx info
    struct DebtTx {
        BaseTx baseTx;
        bytes srcStoremanPK;        // HTLC transaction sender PK
    }

    struct Data {
        /// @notice mapping of hash(x) to UserTx -- xHash->htlcData
        mapping(bytes32 => UserTx) mapHashXUserTxs;

        /// @notice mapping of hash(x) to UserTx -- xHash->htlcData
        mapping(bytes32 => SmgTx) mapHashXSmgTxs;

        /// @notice mapping of hash(x) to UserTx -- xHash->htlcData
        mapping(bytes32 => DebtTx) mapHashXDebtTxs;
    }

    /**
     *
     * MANIPULATIONS
     *
     */

    /// @notice                     function for get user info
    /// @param xHash                hash of HTLC random number
    /// @return sender             HTLC transaction sender address for the security check while user's revoke
    /// @return shadow             Shadow address or account on mirror chain
    /// @return value              exchange value
    /// @return storemanPK         PK of storeman which user has selected
    /// @return tokenOrigAccount   token account of original chain
    function getUserTx(Data storage self, bytes32 xHash)
        external
        view
        returns (address, bytes, uint, bytes, bytes)
    {
        UserTx storage t = self.mapHashXUserTxs[xHash];
        return (t.sender, t.shadow, t.baseTx.value, t.baseTx.storemanPK, t.baseTx.tokenOrigAccount);
    }

    /// @notice                     function for get smg info
    /// @param xHash                hash of HTLC random number
    /// @return userAddr           user account address for redeem
    /// @return value              exchange value
    /// @return storemanPK         PK of storeman which user has selected
    /// @return tokenOrigAccount   token account of original chain
    function getSmgTx(Data storage self, bytes32 xHash)
        external
        view
        returns (address, uint, bytes, bytes)
    {
        SmgTx storage t = self.mapHashXSmgTxs[xHash];
        return (t.userAddr, t.baseTx.value, t.baseTx.storemanPK, t.baseTx.tokenOrigAccount);
    }

    /// @notice                     function for get debt info
    /// @param xHash                hash of HTLC random number
    /// @return srcStoremanPK       PK of source storeman
    /// @return value               debt value
    /// @return storemanPK          PK of destination storeman which takes over the debt of source storeman
    /// @return  tokenOrigAccount   token account of original chain
    function getDebtTx(Data storage self, bytes32 xHash)
        external
        view
        returns (bytes, uint, bytes,bytes)
    {
        DebtTx storage t = self.mapHashXDebtTxs[xHash];
        return (t.srcStoremanPK, t.baseTx.value, t.baseTx.storemanPK,t.baseTx.tokenOrigAccount);
    }

    /// @notice                     add user transaction info
    /// @param  xHash               hash of HTLC random number
    /// @param  value               HTLC transfer value of token
    /// @param  shadow              shadow address. used for receipt coins on opposite block chain
    /// @param  storemanPK          PK of the storeman which user has selected
    /// @param  tokenOrigAccount    token account of original chain
    function addUserTx(Data storage self, bytes32 xHash, uint value, bytes shadow, bytes storemanPK, bytes tokenOrigAccount)
        external
    {
        UserTx storage userTx = self.mapHashXUserTxs[xHash];
        require(value != 0, "Value is invalid");
        require(userTx.baseTx.status == TxStatus.None, "User tx exists");

        userTx.baseTx.value = value;
        userTx.baseTx.status = TxStatus.Locked;
        userTx.baseTx.lockedTime = DEF_LOCKED_TIME.mul(2);
        userTx.baseTx.beginLockedTime = now;
        userTx.baseTx.storemanPK = storemanPK;
        userTx.baseTx.tokenOrigAccount = tokenOrigAccount;
        userTx.sender = msg.sender;
        userTx.shadow = shadow;
    }
    /// @notice                     add storeman transaction info
    /// @param  xHash               hash of HTLC random number
    /// @param  value               HTLC transfer value of token
    /// @param  userAddr            user account address on the destination chain, which is used to redeem token
    /// @param  storemanPK          PK of the storeman which user has selected
    /// @param  tokenOrigAccount    token account of original chain
    function addSmgTx(Data storage self, bytes32 xHash, uint value, address userAddr, bytes storemanPK, bytes tokenOrigAccount)
        external
    {
        SmgTx storage smgTx = self.mapHashXSmgTxs[xHash];
        require(value != 0, "Value is invalid");
        require(smgTx.baseTx.status == TxStatus.None, "Smg tx exists");

        smgTx.baseTx.value = value;
        smgTx.baseTx.storemanPK = storemanPK;
        smgTx.baseTx.status = TxStatus.Locked;
        smgTx.baseTx.lockedTime = DEF_LOCKED_TIME;
        smgTx.baseTx.beginLockedTime = now;
        smgTx.baseTx.tokenOrigAccount = tokenOrigAccount;
        smgTx.userAddr = userAddr;
    }
    /// @notice                     add storeman transaction info
    /// @param  xHash               hash of HTLC random number
    /// @param  value               HTLC transfer value of token
    /// @param  srcStoremanPK       PK of source storeman group
    /// @param  storemanPK          PK of the storeman which will take over of the debt of source storeman group
    /// @param  tokenOrigAccount    token account of original chain
    function addDebtTx(Data storage self, bytes32 xHash, uint value, bytes srcStoremanPK, bytes storemanPK, bytes tokenOrigAccount)
        external
    {
        DebtTx storage debtTx = self.mapHashXDebtTxs[xHash];
        require(value != 0, "Value is invalid");
        require(debtTx.baseTx.status == TxStatus.None, "Debt tx exists");

        debtTx.baseTx.value = value;
        debtTx.baseTx.storemanPK = storemanPK;
        debtTx.baseTx.status = TxStatus.Locked;
        debtTx.baseTx.lockedTime = DEF_LOCKED_TIME;
        debtTx.baseTx.beginLockedTime = now;
        debtTx.baseTx.tokenOrigAccount = tokenOrigAccount;
        debtTx.srcStoremanPK = srcStoremanPK;
    }

    /// @notice                     refund coins from HTLC transaction, which is used for storeman redeem(outbound)
    /// @param  x                   random number of HTLC
    /// @return xHash               return hash of HTLC random number
    function redeemUserTx(Data storage self, bytes32 x)
        external
        returns(bytes32 xHash)
    {
        xHash = sha256(abi.encodePacked(x));

        UserTx storage info = self.mapHashXUserTxs[xHash];
        require(info.baseTx.status == TxStatus.Locked, "Status is not locked");
        require(now < info.baseTx.beginLockedTime.add(info.baseTx.lockedTime), "Redeem timeout");

        info.baseTx.status = TxStatus.Redeemed;
        return (xHash);
    }

    /// @notice                     refund coins from HTLC transaction, which is used for users redeem(inbound)
    /// @param  x                   random number of HTLC
    /// @return xHash               return hash of HTLC random number
    function redeemSmgTx(Data storage self, bytes32 x)
        external
        returns(bytes32 xHash)
    {
        xHash = sha256(abi.encodePacked(x));

        SmgTx storage info = self.mapHashXSmgTxs[xHash];
        require(info.baseTx.status == TxStatus.Locked, "Status is not locked");
        require(now < info.baseTx.beginLockedTime.add(info.baseTx.lockedTime), "Redeem timeout");
        require(info.userAddr == msg.sender, "Msg sender is incorrect");

        info.baseTx.status = TxStatus.Redeemed;
        return (xHash);
    }

    /// @notice                     refund coins from HTLC transaction
    /// @param  x                   random number of HTLC
    /// @return xHash               return hash of HTLC random number
    function redeemDebtTx(Data storage self, bytes32 x)
        external
        returns(bytes32 xHash)
    {
        xHash = sha256(abi.encodePacked(x));

        DebtTx storage info = self.mapHashXDebtTxs[xHash];
        require(info.baseTx.status == TxStatus.Locked, "Status is not locked");
        require(now < info.baseTx.beginLockedTime.add(info.baseTx.lockedTime), "Redeem timeout");

        info.baseTx.status = TxStatus.Redeemed;
        return (xHash);
    }

    /// @notice                     revoke user transaction
    /// @param  xHash               hash of HTLC random number
    function revokeUserTx(Data storage self, bytes32 xHash)
        external
    {
        UserTx storage info = self.mapHashXUserTxs[xHash];
        require(info.baseTx.status == TxStatus.Locked, "Status is not locked");
        require(now >= info.baseTx.beginLockedTime.add(info.baseTx.lockedTime), "Revoke is not permitted");
        // require(info.sender == msg.sender, "Msg sender is incorrect");

        info.baseTx.status = TxStatus.Revoked;
    }

    /// @notice                     revoke storeman transaction
    /// @param  xHash               hash of HTLC random number
    function revokeSmgTx(Data storage self, bytes32 xHash)
        external
    {
        SmgTx storage info = self.mapHashXSmgTxs[xHash];
        require(info.baseTx.status == TxStatus.Locked, "Status is not locked");
        require(now >= info.baseTx.beginLockedTime.add(info.baseTx.lockedTime), "Revoke is not permitted");

        info.baseTx.status = TxStatus.Revoked;
    }

    /// @notice                     revoke debt transaction, which is used for source storeman group
    /// @param  xHash               hash of HTLC random number
    function revokeDebtTx(Data storage self, bytes32 xHash)
        external
    {
        DebtTx storage info = self.mapHashXDebtTxs[xHash];
        require(info.baseTx.status == TxStatus.Locked, "Status is not locked");
        require(now >= info.baseTx.beginLockedTime.add(info.baseTx.lockedTime), "Revoke is not permitted");

        info.baseTx.status = TxStatus.Revoked;
    }

    function getLockedTime() internal pure returns(uint) {
        return DEF_LOCKED_TIME;
    }
}
