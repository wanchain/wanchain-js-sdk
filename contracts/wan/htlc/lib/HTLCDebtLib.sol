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
pragma experimental ABIEncoderV2;

import "../../lib/QuotaLib.sol";
import "./HTLCLib.sol";
import "./commonLib.sol";
import "./HTLCTypes.sol";

library HTLCDebtLib {
    using SafeMath for uint;
    using QuotaLib for QuotaLib.Data;
    using HTLCLib for HTLCLib.Data;

    /**
     *
     * STRUCTURES
     *
     */
    /// @notice struct of HTLC debt lock parameters
    struct HTLCDebtLockParams {
        bytes tokenOrigAccount;         /// token account on original chain
        bytes32 xHash;                  /// hash of HTLC random number
        uint value;                     /// token value
        bytes srcStoremanPK;            /// PK of source storeman group
        bytes dstStoremanPK;            /// PK of destination storeman group
        bytes r;                        /// R in schnorr signature
        bytes32 s;                      /// s in schnorr signature
    }
    /// @notice struct of HTLC debt redeem parameters
    struct HTLCDebtRedeemParams {
        bytes r;                        /// R in schnorr signature
        bytes32 s;                      /// s in schnorr signature
        bytes32 x;                      /// HTLC random number
    }

    /**
     *
     * EVENTS
     *
     **/

    /// @notice                     event of storeman debt lock
    /// @param xHash                hash of HTLC random number
    /// @param value                exchange value
    /// @param tokenOrigAccount     account of original chain token
    /// @param srcStoremanPK        PK of source storeman group
    /// @param dstStoremanPK        PK of destination storeman group
    event DebtLockLogger(bytes32 indexed xHash, uint value, bytes tokenOrigAccount, bytes srcStoremanPK, bytes dstStoremanPK);

    /// @notice                     event of redeem storeman debt
    /// @param xHash                hash of HTLC random number
    /// @param x                    HTLC random number
    /// @param tokenOrigAccount     account of original chain token
    /// @param srcStoremanPK        PK of source storeman group
    /// @param dstStoremanPK        PK of destination storeman group
    event DebtRedeemLogger(bytes32 indexed xHash, bytes32 x, bytes tokenOrigAccount, bytes srcStoremanPK, bytes dstStoremanPK);

    /// @notice                     event of revoke storeman debt
    /// @param xHash                hash of HTLC random number
    /// @param tokenOrigAccount     account of original chain token
    /// @param srcStoremanPK        PK of source storeman group
    /// @param dstStoremanPK        PK of destination storeman group
    event DebtRevokeLogger(bytes32 indexed xHash, bytes tokenOrigAccount, bytes srcStoremanPK, bytes dstStoremanPK);

    /**
     *
     * MANIPULATIONS
     *
     */

    /// @notice                     lock storeman debt
    /// @param  htlcStorageData     HTLC storage data
    /// @param  params              parameters of storeman debt lock
    function inDebtLock(HTLCTypes.HTLCStorageData storage htlcStorageData, HTLCDebtLockParams memory params)
        public
    {
        bytes32 mHash = sha256(abi.encode(params.tokenOrigAccount, params.xHash, params.srcStoremanPK, params.value));
        commonLib.verifySignature(mHash, params.dstStoremanPK, params.r, params.s);

        htlcStorageData.htlcData.addDebtTx(params.xHash, params.value, params.srcStoremanPK, params.dstStoremanPK, params.tokenOrigAccount);
        htlcStorageData.quotaData.debtLock(params.tokenOrigAccount, params.value, params.srcStoremanPK, params.dstStoremanPK);
        // emit logger...
        emit DebtLockLogger(params.xHash, params.value, params.tokenOrigAccount, params.srcStoremanPK, params.dstStoremanPK);
    }

    /// @notice                     redeem storeman debt
    /// @param  htlcStorageData     HTLC storage data
    /// @param  params              parameters of storeman debt redeem
    function inDebtRedeem(HTLCTypes.HTLCStorageData storage htlcStorageData, HTLCDebtRedeemParams memory params)
        public
    {
        bytes32 xHash = htlcStorageData.htlcData.redeemDebtTx(params.x);

        uint value;
        bytes memory srcStoremanPK;
        bytes memory dstStoremanPK;
        bytes memory tokenOrigAccount;

        (srcStoremanPK, value, dstStoremanPK,tokenOrigAccount) = htlcStorageData.htlcData.getDebtTx(xHash);

        commonLib.verifySignature(sha256(abi.encode(params.x)), srcStoremanPK, params.r, params.s);
        htlcStorageData.quotaData.debtRedeem(tokenOrigAccount, value, srcStoremanPK, dstStoremanPK);

        emit DebtRedeemLogger(xHash, params.x, tokenOrigAccount, srcStoremanPK, dstStoremanPK);
    }

    /// @notice                     revoke storeman debt
    /// @param  htlcStorageData     HTLC storage data
    /// @param  xHash               hash of HTLC random number
    function inDebtRevoke(HTLCTypes.HTLCStorageData storage htlcStorageData, bytes32 xHash)
        public
    {
        htlcStorageData.htlcData.revokeDebtTx(xHash);

        uint value;
        bytes memory srcStoremanPK;
        bytes memory dstStoremanPK;
        bytes memory tokenOrigAccount;
        (srcStoremanPK, value, dstStoremanPK,tokenOrigAccount) = htlcStorageData.htlcData.getDebtTx(xHash);

        htlcStorageData.quotaData.debtRevoke(tokenOrigAccount, value, srcStoremanPK, dstStoremanPK);
        emit DebtRevokeLogger(xHash, tokenOrigAccount, srcStoremanPK, dstStoremanPK);
    }
}
