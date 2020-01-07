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

import "../../lib/QuotaLib.sol";
import "./HTLCLib.sol";
import "../../interfaces/ITokenManager.sol";

library HTLCTypes {

    /// @notice revoking fee ratio precise
    /// @notice for example: revokeFeeRatio is 3, meaning that the revoking fee ratio is 3/10000
    uint constant RATIO_PRECISE = 10000;

    /// @notice     Since storeman group admin receiver address may be changed, system should make sure the new address
    /// @notice     can be used, and the old address can not be used. The solution is add timestamp.
    /// @notice     unit: second
    uint constant SMG_FEE_RECEIVER_TIMEOUT = uint(10*60);

    /**
     *
     * STRUCTURES
     *
     */

    struct HTLCStorageData {

        /// quota data of storeman group
        QuotaLib.Data quotaData;

        /// map of the transaction info
        HTLCLib.Data htlcData;

        /// token manager instance interface
        ITokenManager tokenManager;

        /// storemanGroup admin instance address
        address storemanGroupAdmin;

        /// @notice the fee ratio of revoking operation
        uint revokeFeeRatio;

        /// @notice transaction fee, hashX => fee
        mapping(bytes32 => uint) mapXHashFee;

        /// @notice transaction fee, storemanGroupPK => fee
        mapping(bytes => uint) mapStoremanFee;
    }

    /// @notice get the const value RATIO_PRECISE
    function getRatioPrecise() internal pure returns(uint) {
      return RATIO_PRECISE;
    }

    /// @notice get the const value RATIO_PRECISE
    function getSMGRcvTimeOut() internal pure returns(uint) {
        return SMG_FEE_RECEIVER_TIMEOUT;
    }
}
