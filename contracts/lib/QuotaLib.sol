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

import "./SafeMath.sol";

library QuotaLib {
    using SafeMath for uint;

    struct Quota {
        /// storemanGroup's total quota
        uint _quota;
        /// txFeeRatio
        uint _ratio;
        /// amount of original token to be received, equals to amount of WAN token to be minted
        uint _receivable;
        /// amount of WAN token to be burnt
        uint _payable;
        /// amount of original token has been exchanged to the wanchain
        uint _debt;
        /// is active
        bool _active;
    }

    struct Data {
        /// @notice a map from storemanGroup PK to its quota information. token => storeman => quota
        mapping(bytes => mapping(bytes => Quota)) mapQuota;
    }

    /// @notice                                 check if a value provided is meaningless
    /// @dev                                    check if a value provided is meaningless
    /// @param value                            given value to be handled
    modifier onlyMeaningfulValue(uint value) {
        require(value > 0, "Value is null");
        _;
    }

    /// @notice                                 function for get quota
    /// @param tokenOrigAccount                 token account of original chain
    /// @param storemanGroupPK                  storemanGroup PK
    function getQuota(Data storage self, bytes tokenOrigAccount, bytes storemanGroupPK)
        external
        view
        returns (uint, uint, uint, uint, uint, bool)
    {
        Quota storage quota = self.mapQuota[tokenOrigAccount][storemanGroupPK];
        return (quota._quota, quota._ratio, quota._receivable, quota._payable, quota._debt, quota._active);
    }


    /// @notice                                 set storeman group's quota
    /// @param tokenOrigAccount                 token account of original chain
    /// @param storemanGroupPK                  storemanGroup PK
    /// @param quota                            a storemanGroup's quota
    /// @param txFeeRatio                       transaction fee ratio, the denominator is DEFAULT_PRECISE
    function addStoremanGroup(Data storage self, bytes tokenOrigAccount, bytes storemanGroupPK, uint quota, uint txFeeRatio)
        external
        onlyMeaningfulValue(quota)
    {
        require(tokenOrigAccount.length != 0 && storemanGroupPK.length != 0, "Parameter is invalid");
        require(!isExist(self, tokenOrigAccount, storemanGroupPK), "PK already exists");
        self.mapQuota[tokenOrigAccount][storemanGroupPK] = Quota(quota, txFeeRatio, 0, 0, 0, true);
    }

    /// @notice                                 deactivated the storeman group
    /// @param tokenOrigAccount                 token account of original chain
    /// @param storemanGroupPK                  storemanGroup PK
    function deactivateStoremanGroup(Data storage self, bytes tokenOrigAccount, bytes storemanGroupPK)
        external
    {
        require(tokenOrigAccount.length != 0 && storemanGroupPK.length != 0, "Parameter is invalid");
        require(isActive(self, tokenOrigAccount, storemanGroupPK), "Storeman group is active");
        self.mapQuota[tokenOrigAccount][storemanGroupPK]._active = false;
    }

    /// @notice                                 quit the storeman group
    /// @param tokenOrigAccount                 token account of original chain
    /// @param storemanGroupPK                  storemanGroup PK
    function delStoremanGroup(Data storage self, bytes tokenOrigAccount, bytes storemanGroupPK)
        external
    {
        require(notActive(self, tokenOrigAccount, storemanGroupPK), "storeman group is active");
        require(isDebtPaidOff(self, tokenOrigAccount, storemanGroupPK), "Storeman should pay off its debt");

        delete self.mapQuota[tokenOrigAccount][storemanGroupPK];
    }

    /// @notice                                 update the storeman group
    /// @param tokenOrigAccount                 token account of original chain
    /// @param storemanGroupPK                  storemanGroup PK
    /// @param quota                            new quota will overwrite the old one
    function updateStoremanGroup(Data storage self, bytes tokenOrigAccount, bytes storemanGroupPK, uint quota)
        external
        onlyMeaningfulValue(quota)
    {
        require(tokenOrigAccount.length != 0 && storemanGroupPK.length != 0, "Parameter is invalid");
        require(isExist(self, tokenOrigAccount, storemanGroupPK), "PK doesn't exist");
        self.mapQuota[tokenOrigAccount][storemanGroupPK]._quota = quota;
    }

    /// @notice                                 inbound, user lock token, update the detailed quota info. of the storeman group
    /// @param tokenOrigAccount                 account of token supported
    /// @param storemanGroupPK                  handler PK
    /// @param value                            amount of exchange token
    function inLock(Data storage self, bytes tokenOrigAccount, bytes storemanGroupPK, uint value)
        external
        onlyMeaningfulValue(value)
    {
        /// Make sure an active storemanGroup is provided to handle transactions
        require(isActive(self, tokenOrigAccount, storemanGroupPK), "PK is not active");

        /// Make sure enough inbound quota available
        Quota storage quotaInfo = self.mapQuota[tokenOrigAccount][storemanGroupPK];
        require(quotaInfo._quota.sub(quotaInfo._receivable.add(quotaInfo._debt)) >= value, "Quota is not enough");

        /// Increase receivable
        quotaInfo._receivable = quotaInfo._receivable.add(value);
    }

    /// @notice                                 inbound, storeman revoke the transaction,update the detailed quota info. of the storeman group
    /// @param tokenOrigAccount                 account of token supported
    /// @param storemanGroupPK                  handler PK
    /// @param value                            amount of exchange token
    function inRevoke(Data storage self, bytes tokenOrigAccount, bytes storemanGroupPK, uint value)
        external
        onlyMeaningfulValue(value)
    {
        /// Make sure a valid storeman provided
        require(isExist(self, tokenOrigAccount, storemanGroupPK), "PK doesn't exist");

        Quota storage quota = self.mapQuota[tokenOrigAccount][storemanGroupPK];

        /// Credit receivable, double-check receivable is no less than value to be unlocked
        quota._receivable = quota._receivable.sub(value);
    }

    /// @notice                                 inbound, user redeem the transaction,update the detailed quota info. of the storeman group
    /// @param tokenOrigAccount                 account of token supported
    /// @param storemanGroupPK                  handler PK
    /// @param value                            amount of exchange token
    function inRedeem(Data storage self, bytes tokenOrigAccount, bytes storemanGroupPK, uint value)
        external
        onlyMeaningfulValue(value)
    {
        /// Make sure a legal storemanGroup provided
        require(isExist(self, tokenOrigAccount, storemanGroupPK), "PK doesn't exist");

        Quota storage _q = self.mapQuota[tokenOrigAccount][storemanGroupPK];

        /// Adjust quota record
        _q._receivable = _q._receivable.sub(value);
        _q._debt = _q._debt.add(value);
    }

    /// @notice                                 outbound, user lock the transaction,update the detailed quota info. of the storeman group
    /// @param tokenOrigAccount                 account of token supported
    /// @param storemanGroupPK                  handler PK
    /// @param value                            amount of exchange token
    function outLock(Data storage self, uint value, bytes tokenOrigAccount, bytes storemanGroupPK)
        external
        onlyMeaningfulValue(value)
    {
        /// Make sure a valid storemanGroup and a legit initiator provided
        require(isActive(self, tokenOrigAccount, storemanGroupPK), "PK is not active");

        Quota storage quota = self.mapQuota[tokenOrigAccount][storemanGroupPK];

        /// Make sure it has enough outboundQuota
        require(quota._debt.sub(quota._payable) >= value, "Value is invalid");

        /// Adjust quota record
        quota._payable = quota._payable.add(value);
    }

    /// @notice                                 outbound, user revoke the transaction,update the detailed quota info. of the storeman group
    /// @param tokenOrigAccount                 account of token supported
    /// @param storemanGroupPK                  handler PK
    /// @param value                            amount of exchange token
    function outRevoke(Data storage self, bytes tokenOrigAccount, bytes storemanGroupPK, uint value)
        external
        onlyMeaningfulValue(value)
    {
        require(isExist(self, tokenOrigAccount, storemanGroupPK), "PK doesn't exist");

        /// Make sure it has enough quota for a token unlocking
        Quota storage quotaInfo = self.mapQuota[tokenOrigAccount][storemanGroupPK];

        /// Adjust quota record
        quotaInfo._payable = quotaInfo._payable.sub(value);
    }

    /// @notice                                 outbound, storeman redeem the transaction,update the detailed quota info. of the storeman group
    /// @param tokenOrigAccount                 account of token supported
    /// @param storemanGroupPK                  handler PK
    /// @param value                            amount of exchange token
    function outRedeem(Data storage self, bytes tokenOrigAccount, bytes storemanGroupPK, uint value)
        external
        onlyMeaningfulValue(value)
    {
        require(isExist(self, tokenOrigAccount, storemanGroupPK), "PK doesn't exist");
        Quota storage quotaInfo = self.mapQuota[tokenOrigAccount][storemanGroupPK];

        /// Adjust quota record
        quotaInfo._debt = quotaInfo._debt.sub(value);
        quotaInfo._payable = quotaInfo._payable.sub(value);
    }

    /// @notice                                 source storeman group lock the debt transaction,update the detailed quota info. of the storeman group
    /// @param tokenOrigAccount                 account of token supported
    /// @param value                            amount of exchange token
    /// @param srcStoremanGroupPK               PK of source storeman group
    /// @param dstStoremanGroupPK               PK of destination storeman group
    function debtLock(Data storage self, bytes tokenOrigAccount, uint value, bytes srcStoremanGroupPK, bytes dstStoremanGroupPK)
        external
        onlyMeaningfulValue(value)
    {
        /// Make sure an active storemanGroup is provided to handle transactions
        require(notActive(self, tokenOrigAccount, srcStoremanGroupPK), "PK is active");
        require(isActive(self, tokenOrigAccount, dstStoremanGroupPK), "PK is not active");

        /// src: there's no processing tx, and have enough debt!
        Quota storage src = self.mapQuota[tokenOrigAccount][srcStoremanGroupPK];
        require(src._receivable == uint(0) && src._payable == uint(0) && src._debt >= value, "PK is not allowed to repay debt");

        /// dst: has enough quota
        Quota storage dst = self.mapQuota[tokenOrigAccount][dstStoremanGroupPK];
        require(dst._quota.sub(dst._receivable.add(dst._debt)) >= value, "Quota is not enough");

        dst._receivable = dst._receivable.add(value);
        src._payable = src._payable.add(value);
    }

    /// @notice                                 destination storeman group redeem the debt transaction,update the detailed quota info. of the storeman group
    /// @param tokenOrigAccount                 account of token supported
    /// @param value                            amount of exchange token
    /// @param srcStoremanPK                    PK of source storeman group
    /// @param dstStoremanPK                    PK of destination storeman group
    function debtRedeem(Data storage self, bytes tokenOrigAccount, uint value, bytes srcStoremanPK, bytes dstStoremanPK)
        external
        onlyMeaningfulValue(value)
    {
        /// Make sure a legit storemanGroup provided
        require(isExist(self, tokenOrigAccount, dstStoremanPK), "PK doesn't exist");
        require(notActive(self, tokenOrigAccount, srcStoremanPK), "PK is active");

        Quota storage dst = self.mapQuota[tokenOrigAccount][dstStoremanPK];
        Quota storage src = self.mapQuota[tokenOrigAccount][srcStoremanPK];

        /// Adjust quota record
        dst._receivable = dst._receivable.sub(value);
        dst._debt = dst._debt.add(value);

        src._payable = src._payable.sub(value);
        src._debt = src._debt.sub(value);
    }

    /// @notice                                 source storeman group revoke the debt transaction,update the detailed quota info. of the storeman group
    /// @param tokenOrigAccount                 account of token supported
    /// @param value                            amount of exchange token
    /// @param srcStoremanPK                    PK of source storeman group
    /// @param dstStoremanPK                    PK of destination storeman group
    function debtRevoke(Data storage self, bytes tokenOrigAccount, uint value, bytes srcStoremanPK, bytes dstStoremanPK)
        external
        onlyMeaningfulValue(value)
    {
        /// Make sure a valid storeman provided
        require(isExist(self, tokenOrigAccount, dstStoremanPK), "PK doesn't exist");
        require(notActive(self, tokenOrigAccount, srcStoremanPK), "PK is active");

        Quota storage dst = self.mapQuota[tokenOrigAccount][dstStoremanPK];
        Quota storage src = self.mapQuota[tokenOrigAccount][srcStoremanPK];

        /// Credit receivable, double-check receivable is no less than value to be unlocked
        dst._receivable = dst._receivable.sub(value);
        src._payable = src._payable.sub(value);
    }

    /// @notice                                 check the storeman group existing or not
    /// @param tokenOrigAccount                 account of token supported
    /// @param storemanGroupPK                  PK of storeman group
    /// @return bool                           true/false
    function isExist(Data storage self, bytes tokenOrigAccount, bytes storemanGroupPK)
        private
        view
        returns (bool)
    {
        return self.mapQuota[tokenOrigAccount][storemanGroupPK]._quota != uint(0);
    }

    /// @notice                                 check the storeman group active or not
    /// @param tokenOrigAccount                 account of token supported
    /// @param storemanGroupPK                  PK of storeman group
    /// @return bool                           true/false
    function isActive(Data storage self, bytes tokenOrigAccount, bytes storemanGroupPK)
        private
        view
        returns (bool)
    {
        Quota storage q = self.mapQuota[tokenOrigAccount][storemanGroupPK];
        return q._quota != uint(0) && q._active;
    }

    /// @notice                                 check the storeman group active or not
    /// @param tokenOrigAccount                 account of token supported
    /// @param storemanGroupPK                  PK of storeman group
    /// @return bool                           true: not active false: active
    function notActive(Data storage self, bytes tokenOrigAccount, bytes storemanGroupPK)
        private
        view
        returns (bool)
    {
        Quota storage q = self.mapQuota[tokenOrigAccount][storemanGroupPK];
        return q._quota != uint(0) && !q._active;
    }

    /// @notice                                 get the detailed quota info. of this storeman group
    /// @param tokenOrigAccount                 account of original chain token
    /// @param storemanGroupPK                  PK of storemanGroup
    /// @return _quota                         storemanGroup's total quota
    /// @return inboundQuota                   inbound, the amount which storeman group can handle
    /// @return outboundQuota                  outbound, the amount which storeman group can handle
    /// @return _receivable                    amount of original token to be received, equals to amount of WAN token to be minted
    /// @return _payable                       amount of WAN token to be burnt
    /// @return _debt                          amount of original token has been exchanged to the wanchain
    function queryQuotaInfo(Data storage self, bytes tokenOrigAccount, bytes storemanGroupPK)
        external
        view
        returns (uint, uint, uint, uint, uint, uint)
    {
        if (!isExist(self, tokenOrigAccount, storemanGroupPK)) {
            return (0, 0, 0, 0, 0, 0);
        }

        Quota storage quotaInfo = self.mapQuota[tokenOrigAccount][storemanGroupPK];

        uint inboundQuota = quotaInfo._quota.sub(quotaInfo._receivable.add(quotaInfo._debt));
        uint outboundQuota = quotaInfo._debt.sub(quotaInfo._payable);

        return (quotaInfo._quota, inboundQuota, outboundQuota, quotaInfo._receivable, quotaInfo._payable, quotaInfo._debt);
    }

    /// @notice                                 check the storeman group'debt paid off or not
    /// @param tokenOrigAccount                 account of token supported
    /// @param storemanGroupPK                  PK of storeman group
    /// @return bool                           true: debt paid off false: debt NOT paid off
    function isDebtPaidOff(Data storage self, bytes tokenOrigAccount, bytes storemanGroupPK)
        private
        view
        returns(bool)
    {
        Quota storage quotaInfo = self.mapQuota[tokenOrigAccount][storemanGroupPK];
        return quotaInfo._receivable == uint(0) && quotaInfo._payable == uint(0) && quotaInfo._debt == uint(0);
    }

}
