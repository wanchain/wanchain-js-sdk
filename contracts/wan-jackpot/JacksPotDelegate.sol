pragma solidity 0.4.26;

import "./lib/SafeMath.sol";
import "./lib/LibOwnable.sol";
import "./lib/PosHelper.sol";
import "./JacksPotStorage.sol";
import "./lib/ReentrancyGuard.sol";


/// @title Jack's Pot Smart Contract
/// @dev Jack’s Pot is a no-loss lottery game built on Wanchain
contract JacksPotDelegate is JacksPotStorage, ReentrancyGuard, PosHelper {
    modifier notClosed() {
        require(!closed, "GAME_ROUND_CLOSE");
        _;
    }

    modifier onlyOperator() {
        require(msg.sender == operator, "NOT_OPERATOR");
        _;
    }

    /// --------------Public Method--------------------------

    /// @dev The operating contract accepts general transfer, and the transferred funds directly enter the prize pool.
    function() public payable {}

    /// @dev This function will set default value.
    function init() external onlyOwner {
        poolInfo.delegatePercent = 700; // 70%
        maxDigital = 10000; // 0000~9999
        closed = false;
        feeRate = 0;
        posPrecompileAddress = address(0xda);
        randomPrecompileAddress = address(0x262);
        maxCount = 50;
        minAmount = 10 ether;
        minGasLeft = 100000;
        firstDelegateMinValue = 100 ether;
    }

    /// @dev config some default value
    function config(uint256 _maxCount, uint256 _minAmount, uint256 _minGasLeft, uint256 _firstDelegateMinValue) external onlyOwner {
        maxCount = _maxCount;
        minAmount = _minAmount;
        minGasLeft = _minGasLeft;
        firstDelegateMinValue = _firstDelegateMinValue;
    }

    /// @dev User betting function. We do not support smart contract call for security.(DoS with revert)
    /// @param codes An array that can contain Numbers selected by the user.
    /// @param amounts An array that can contain the user's bet amount on each number, with a minimum of 10 wan.
    function buy(uint256[] codes, uint256[] amounts)
        external
        payable
        notClosed
        nonReentrant
    {
        checkBuyValue(codes, amounts);
        uint256 totalAmount = 0;

        for (uint256 i = 0; i < codes.length; i++) {
            require(amounts[i] >= minAmount, "AMOUNT_TOO_SMALL");
            require(amounts[i] % minAmount == 0, "AMOUNT_MUST_TIMES_10");
            require(codes[i] < maxDigital, "OUT_OF_MAX_DIGITAL");
            require(pendingRedeemSearchMap[msg.sender][codes[i]] == 0, "BUYING_CODE_IS_EXITING");

            totalAmount = totalAmount.add(amounts[i]);

            //Save stake info
            if (userInfoMap[msg.sender].codeIndexMap[codes[i]] == 0) {
                userInfoMap[msg.sender].indexCodeMap[userInfoMap[msg.sender]
                    .codeCount] = codes[i];
                userInfoMap[msg.sender].codeCount = userInfoMap[msg.sender].codeCount.add(1);
                userInfoMap[msg.sender]
                    .codeIndexMap[codes[i]] = userInfoMap[msg.sender]
                    .codeCount;
            }

            userInfoMap[msg.sender].codeAmountMap[codes[i]] = userInfoMap[msg
                .sender]
                .codeAmountMap[codes[i]]
                .add(amounts[i]);

            //Save code info
            if (indexCodeMap[codes[i]].addressIndexMap[msg.sender] == 0) {
                indexCodeMap[codes[i]].indexAddressMap[indexCodeMap[codes[i]]
                    .addrCount] = msg.sender;
                indexCodeMap[codes[i]].addrCount = indexCodeMap[codes[i]].addrCount.add(1);

                indexCodeMap[codes[i]].addressIndexMap[msg
                    .sender] = indexCodeMap[codes[i]].addrCount;
            }
        }

        require(
            userInfoMap[msg.sender].codeCount <= maxCount,
            "OUT_OF_MAX_COUNT"
        );

        require(totalAmount == msg.value, "VALUE_NOT_EQUAL_AMOUNT");

        poolInfo.demandDepositPool = poolInfo.demandDepositPool.add(msg.value);

        emit Buy(msg.sender, msg.value, codes, amounts);
    }

    /// @dev This is the user refund function, where users can apply to withdraw funds invested on certain Numbers.
    /// @param codes The array contains the number the user wants a refund from.
    function redeem(uint256[] codes)
        external
        notClosed
        nonReentrant
        returns (bool)
    {
        checkRedeemValue(codes);

        if (redeemAddress(codes, msg.sender)) {
            return true;
        } else {
            for (uint256 n = 0; n < codes.length; n++) {
                pendingRedeemMap[pendingRedeemCount].user = msg.sender;
                pendingRedeemMap[pendingRedeemCount].code = codes[n];
                pendingRedeemCount = pendingRedeemCount.add(1);
                pendingRedeemSearchMap[msg.sender][codes[n]] = 1;
            }

            emit Redeem(msg.sender, false, codes, 0);
            return false;
        }
    }

    /// @dev This is the user refund function, where users can apply to withdraw prize.
    function prizeWithdraw() external notClosed nonReentrant returns (bool) {
        require(userInfoMap[msg.sender].prize > 0, "NO_PRIZE_TO_WITHDRAW");
        if (prizeWithdrawAddress(msg.sender)) {
            return true;
        } else {
            pendingPrizeWithdrawMap[pendingPrizeWithdrawCount] = msg.sender;
            pendingPrizeWithdrawCount = pendingPrizeWithdrawCount.add(1);
            emit PrizeWithdraw(msg.sender, false, 0);
            return false;
        }
    }

    /// @dev The settlement robot calls this function daily to update the capital pool and settle the pending refund.
    function update() external onlyOperator nonReentrant {
        require(
            poolInfo.demandDepositPool <= address(this).balance,
            "SC_BALANCE_ERROR"
        );

        updateBalance();

        if (subsidyRefund()) {
            if (prizeWithdrawPendingRefund()) {
                if (redeemPendingRefund()) {
                    emit UpdateSuccess();
                }
            }
        }
    }

    /// @dev After the settlement is completed, the settlement robot will call this function to conduct POS delegation to the funds in the capital pool that meet the proportion of the commission.
    function runDelegateIn() external onlyOperator nonReentrant returns (bool) {
        require(
            validatorsInfo.currentValidator != address(0),
            "NO_DEFAULT_VALIDATOR"
        );

        if (poolInfo.demandDepositPool <= subsidyInfo.total) {
            return true;
        }

        require(poolInfo.delegatePool.add(poolInfo.demandDepositPool) >= subsidyInfo.total, "AMOUNT_ERROR");

        address currentValidator = validatorsInfo.currentValidator;

        uint256 total = poolInfo
            .delegatePool
            .add(poolInfo.demandDepositPool)
            .sub(subsidyInfo.total);
        uint256 demandDepositAmount = total
            .mul(DIVISOR - poolInfo.delegatePercent)
            .div(DIVISOR);
        if (
            demandDepositAmount <
            poolInfo.demandDepositPool.sub(subsidyInfo.total)
        ) {
            uint256 delegateAmount = poolInfo
                .demandDepositPool
                .sub(subsidyInfo.total)
                .sub(demandDepositAmount);

            if (
                (validatorIndexMap[currentValidator] == 0) &&
                (delegateAmount < firstDelegateMinValue)
            ) {
                emit DelegateIn(validatorsInfo.currentValidator, 0);
                return false;
            }

            require(
                delegateIn(
                    currentValidator,
                    delegateAmount,
                    posPrecompileAddress
                ),
                "DELEGATE_IN_FAILED"
            );

            validatorsAmountMap[currentValidator] = validatorsAmountMap[currentValidator]
                .add(delegateAmount);
            if (validatorIndexMap[currentValidator] == 0) {
                validatorsMap[validatorsInfo
                    .validatorsCount] = currentValidator;
                validatorsInfo.validatorsCount = validatorsInfo.validatorsCount.add(1);
                validatorIndexMap[currentValidator] = validatorsInfo
                    .validatorsCount;
            }

            poolInfo.delegatePool = poolInfo.delegatePool.add(delegateAmount);
            poolInfo.demandDepositPool = poolInfo.demandDepositPool.sub(
                delegateAmount
            );
            emit DelegateIn(validatorsInfo.currentValidator, delegateAmount);
            return true;
        }
        return true;
    }

    /// @dev This function is called regularly by the robot every 6 morning to open betting.
    function open() external onlyOperator nonReentrant {
        closed = false;
    }

    /// @dev This function is called regularly by the robot on 4 nights a week to close bets.
    function close() external onlyOperator nonReentrant {
        closed = true;
    }

    /// @dev Lottery settlement function. On the Friday night, the robot calls this function to get random Numbers and complete the lucky draw process.
    function lotterySettlement() external onlyOperator nonReentrant {
        require(closed, "MUST_CLOSE_BEFORE_SETTLEMENT");

        uint256 epochId = getEpochId(now, randomPrecompileAddress);

        // should use the random number latest
        currentRandom = getRandomByEpochId(
            epochId + 1,
            randomPrecompileAddress
        );

        require(currentRandom != 0, "RANDOM_NUMBER_NOT_READY");

        uint256 winnerCode = uint256(currentRandom.mod(maxDigital));

        uint256 feeAmount = poolInfo.prizePool.mul(feeRate).div(DIVISOR);

        uint256 prizePool = poolInfo.prizePool.sub(feeAmount);

        address[] memory winners;

        uint256[] memory amounts;

        if (indexCodeMap[winnerCode].addrCount > 0) {
            winners = new address[](indexCodeMap[winnerCode].addrCount);
            amounts = new uint256[](indexCodeMap[winnerCode].addrCount);

            uint256 winnerStakeAmountTotal = 0;
            for (uint256 i = 0; i < indexCodeMap[winnerCode].addrCount; i++) {
                winners[i] = indexCodeMap[winnerCode].indexAddressMap[i];
                winnerStakeAmountTotal = winnerStakeAmountTotal.add(
                    userInfoMap[winners[i]].codeAmountMap[winnerCode]
                );
            }

            for (uint256 j = 0; j < indexCodeMap[winnerCode].addrCount; j++) {
                amounts[j] = prizePool
                    .mul(userInfoMap[winners[j]].codeAmountMap[winnerCode])
                    .div(winnerStakeAmountTotal);
                userInfoMap[winners[j]].prize = userInfoMap[winners[j]]
                    .prize
                    .add(amounts[j]);
            }

            poolInfo.demandDepositPool = poolInfo.demandDepositPool.add(
                prizePool
            );

            poolInfo.prizePool = 0;

            if (feeAmount > 0) {
                owner().transfer(feeAmount);
                emit FeeSend(owner(), feeAmount);
            }
        } else {
            winners = new address[](1);
            winners[0] = address(0);
            amounts = new uint256[](1);
            amounts[0] = 0;
        }

        emit RandomGenerate(epochId, currentRandom);
        emit LotteryResult(epochId, winnerCode, prizePool, winners, amounts);
    }

    /// @dev The owner calls this function to set the operator address.
    /// @param op This is operator address.
    function setOperator(address op) external onlyOwner nonReentrant {
        require(op != address(0), "INVALID_ADDRESS");
        operator = op;
    }

    /// @dev The owner calls this function to set the default POS validator node address for delegation.
    /// @param validator The validator address.
    function setValidator(address validator)
        external
        onlyOperator
        nonReentrant
    {
        require(validator != address(0), "INVALID_ADDRESS");
        require(
            validator != validatorsInfo.currentValidator,
            "VALIDATOR_SAME_WITH_CURRENT"
        );
        require(
            validator != validatorsInfo.withdrawFromValidator,
            "VALIDATOR_IS_WITHDRAWING"
        );

        validatorsInfo.currentValidator = validator;
    }

    /// @dev The owner calls this function to drive the contract to issue a POS delegate refund to the specified validator address.
    /// @param validator The validator address.
    function runDelegateOut(address validator)
        external
        onlyOperator
        nonReentrant
    {
        require(validator != address(0), "INVALID_ADDRESS");
        require(validatorsAmountMap[validator] > 0, "NO_SUCH_VALIDATOR");
        require(
            validatorsInfo.withdrawFromValidator == address(0),
            "THERE_IS_EXITING_VALIDATOR"
        );
        require(delegateOutAmount == 0, "DELEGATE_OUT_AMOUNT_NOT_ZERO");
        validatorsInfo.withdrawFromValidator = validator;
        delegateOutAmount = validatorsAmountMap[validator];
        require(
            delegateOut(validator, posPrecompileAddress),
            "DELEGATE_OUT_FAILED"
        );

        emit DelegateOut(validator, delegateOutAmount);
    }

    /// @dev The owner calls this function to modify The handling fee Shared from The prize pool.
    /// @param fee Any parts per thousand.
    function setFeeRate(uint256 fee) external onlyOwner nonReentrant {
        require(fee < 1000, "FEE_RATE_TOO_LAREGE");
        feeRate = fee;
    }

    /// @dev Owner calls this function to modify the default POS delegate ratio for the pool.
    /// @param percent Any parts per thousand.
    function setDelegatePercent(uint256 percent)
        external
        onlyOwner
        nonReentrant
    {
        require(percent <= 1000, "DELEGATE_PERCENT_TOO_LAREGE");

        poolInfo.delegatePercent = percent;
    }

    /// @dev Owner calls this function to modify the number of lucky draw digits, and the random number takes the modulus of this number.
    /// @param max New value.
    function setMaxDigital(uint256 max) external onlyOwner nonReentrant {
        require(max > 0, "MUST_GREATER_THAN_ZERO");
        maxDigital = max;
    }

    /// @dev Anyone can call this function to inject a subsidy into the current pool, which is used for the user's refund. It can be returned at any time.
    /// We do not support smart contract call for security.(DoS with revert)
    function subsidyIn() external payable nonReentrant {
        require(msg.value >= 10 ether, "SUBSIDY_TOO_SMALL");
        require(tx.origin == msg.sender, "NOT_ALLOW_SMART_CONTRACT");
        subsidyAmountMap[msg.sender] = subsidyAmountMap[msg.sender].add(
            msg.value
        );
        subsidyInfo.total = subsidyInfo.total.add(msg.value);
        poolInfo.demandDepositPool = poolInfo.demandDepositPool.add(msg.value);
        emit SubsidyIn(msg.sender, msg.value);
    }

    /// @dev Apply for subsidy refund function. If the current pool is sufficient for application of subsidy, the refund will be made on the daily settlement.
    function subsidyOut(uint256 amount) external nonReentrant {
        require(
            subsidyAmountMap[msg.sender] >= amount,
            "SUBSIDY_AMOUNT_NOT_ENOUGH"
        );

        require(amount > 0, "ZERO_AMOUNT_NOT_ALLOW");

        for (
            uint256 i = subsidyInfo.startIndex;
            i < subsidyInfo.startIndex + subsidyInfo.refundingCount;
            i++
        ) {
            require(
                subsidyInfo.refundingAddressMap[i] != msg.sender,
                "ALREADY_SUBMIT_SUBSIDY_OUT"
            );
        }

        subsidyInfo.refundingAddressMap[subsidyInfo.startIndex +
            subsidyInfo.refundingCount] = msg.sender;
        subsidyInfo.refundingCount = subsidyInfo.refundingCount.add(1);

        subsidyInfo.refundingSubsidyAmountMap[msg.sender] = amount;
    }

    /// @dev Get a user's codes and amounts;
    function getUserCodeList(address user)
        external
        view
        returns (uint256[] codes, uint256[] amounts, uint256[] exits)
    {
        uint256 cnt = userInfoMap[user].codeCount;
        codes = new uint256[](cnt);
        amounts = new uint256[](cnt);
        exits = new uint256[](cnt);
        for (uint256 i = 0; i < cnt; i++) {
            codes[i] = userInfoMap[user].indexCodeMap[i];
            amounts[i] = userInfoMap[user].codeAmountMap[codes[i]];
            exits[i] = pendingRedeemSearchMap[user][codes[i]];
        }
    }

    /// @dev get all the pending out amount
    function getPendingAmount() external view returns (uint256 total) {
        address user;
        uint256 i;
        total = 0;
        // Total pending subsidy
        for (
            i = subsidyInfo.startIndex;
            i < subsidyInfo.startIndex + subsidyInfo.refundingCount;
            i++
        ) {
            address refundingAddress = subsidyInfo.refundingAddressMap[i];
            total = total.add(
                subsidyInfo.refundingSubsidyAmountMap[refundingAddress]
            );
        }

        // Total pending prize
        for (
            i = pendingPrizeWithdrawStartIndex;
            i < pendingPrizeWithdrawStartIndex + pendingPrizeWithdrawCount;
            i++
        ) {
            user = pendingPrizeWithdrawMap[i];
            total = total.add(userInfoMap[user].prize);
        }

        // Total pending redeem
        for (
            i = pendingRedeemStartIndex;
            i < pendingRedeemStartIndex + pendingRedeemCount;
            i++
        ) {
            user = pendingRedeemMap[i].user;
            uint256 code = pendingRedeemMap[i].code;
            total = total.add(userInfoMap[user].codeAmountMap[code]);
        }
    }

    /// @dev set address for POS delegateIn delegateOut
    function setPosPrecompileAddress(address addr) external onlyOwner {
        require(addr != address(0), "POS_ADDRESS_NOT_ZERO");
        posPrecompileAddress = addr;
    }

    /// @dev set address for random number get
    function setRandomPrecompileAddress(address addr) external onlyOwner {
        require(addr != address(0), "RANDOM_ADDRESS_NOT_ZERO");
        randomPrecompileAddress = addr;
    }

    /// --------------Private Method--------------------------

    function checkBuyValue(uint256[] memory codes, uint256[] memory amounts)
        private
        view
    {
        require(tx.origin == msg.sender, "NOT_ALLOW_SMART_CONTRACT");
        require(
            codes.length == amounts.length,
            "CODES_AND_AMOUNTS_LENGTH_NOT_EUQAL"
        );
        require(codes.length > 0, "INVALID_CODES_LENGTH");
        require(codes.length <= maxCount, "CODES_LENGTH_TOO_LONG");
    }

    function checkRedeemValue(uint256[] memory codes) private view {
        require(codes.length > 0, "INVALID_CODES_LENGTH");
        require(codes.length <= maxCount, "CODES_LENGTH_TOO_LONG");

        uint256 length = codes.length;

        //check codes
        for (uint256 i = 0; i < length; i++) {
            require(userInfoMap[msg.sender].codeIndexMap[codes[i]] > 0, "CODE_NOT_EXIST");
            require(codes[i] < maxDigital, "OUT_OF_MAX_DIGITAL");
            for (uint256 m = 0; m < length; m++) {
                if (i != m) {
                    require(codes[i] != codes[m], "CODES_MUST_NOT_SAME");
                }
            }

            require(pendingRedeemSearchMap[msg.sender][codes[i]] == 0, "STAKER_CODE_IS_EXITING");
        }
    }

    /// @dev Remove user info map.
    function removeUserCodesMap(uint256 codeToRemove, address user) private {
        require(userInfoMap[user].codeIndexMap[codeToRemove] > 0, "CODE_NOT_EXIST");
        require(userInfoMap[user].codeCount != 0, "CODE_COUNT_IS_ZERO");

        if (userInfoMap[user].codeCount > 1) {
            // get code index in map
            uint256 i = userInfoMap[user].codeIndexMap[codeToRemove] - 1;
            // save last element to index position
            userInfoMap[user].indexCodeMap[i] = userInfoMap[user].indexCodeMap[userInfoMap[user].codeCount - 1];
            // update index of swap element
            userInfoMap[user].codeIndexMap[userInfoMap[user].indexCodeMap[i]] = i + 1;
        }

        // remove the index of record
        userInfoMap[user].codeIndexMap[codeToRemove] = 0;

        // remove last element
        userInfoMap[user].indexCodeMap[userInfoMap[user].codeCount - 1] = 0;
        userInfoMap[user].codeCount = userInfoMap[user].codeCount.sub(1);
    }

    function removeCodeInfoMap(uint256 code, address user) private {
        require(indexCodeMap[code].addressIndexMap[user] > 0, "CODE_NOT_EXIST_2");
        require(indexCodeMap[code].addrCount != 0, "ADDRESS_COUNT_IS_ZERO");

        if (indexCodeMap[code].addrCount > 1) {
            uint256 i = indexCodeMap[code].addressIndexMap[user] - 1;
            indexCodeMap[code].indexAddressMap[i] = indexCodeMap[code].indexAddressMap[indexCodeMap[code].addrCount - 1];
            indexCodeMap[code].addressIndexMap[indexCodeMap[code].indexAddressMap[i]] = i + 1;
        }

        indexCodeMap[code].addressIndexMap[user] = 0;
        indexCodeMap[code].indexAddressMap[indexCodeMap[code].addrCount - 1] = address(0);
        indexCodeMap[code].addrCount = indexCodeMap[code].addrCount.sub(1);
    }

    function removeValidatorMap() private {
        require(validatorIndexMap[validatorsInfo.withdrawFromValidator] > 0, "VALIDATOR_NOT_EXIST");
        require(validatorsInfo.validatorsCount != 0, "VALIDATOR_COUNT_IS_ZERO");

        if (validatorsInfo.validatorsCount > 1) {
            uint256 i = validatorIndexMap[validatorsInfo.withdrawFromValidator] - 1;
            validatorsMap[i] = validatorsMap[validatorsInfo.validatorsCount - 1];
            validatorIndexMap[validatorsMap[i]] = i + 1;
        }

        validatorIndexMap[validatorsInfo.withdrawFromValidator] = 0;
        validatorsMap[validatorsInfo.validatorsCount - 1] = address(0);
        validatorsInfo.validatorsCount = validatorsInfo.validatorsCount.sub(1);
    }

    function updateBalance() private returns (bool) {
        if (
            address(this).balance >
            poolInfo.demandDepositPool.add(poolInfo.prizePool)
        ) {
            uint256 extra = address(this).balance.sub(
                poolInfo.demandDepositPool.add(poolInfo.prizePool)
            );
            if ((delegateOutAmount > 0) && (delegateOutAmount <= extra)) {
                poolInfo.prizePool = poolInfo.prizePool.add(
                    extra.sub(delegateOutAmount)
                );
                poolInfo.demandDepositPool = poolInfo.demandDepositPool.add(
                    delegateOutAmount
                );
                poolInfo.delegatePool = poolInfo.delegatePool.sub(
                    delegateOutAmount
                );
                validatorsAmountMap[validatorsInfo.withdrawFromValidator] = 0;
                delegateOutAmount = 0;
                removeValidatorMap();
                validatorsInfo.withdrawFromValidator = address(0);
            } else {
                poolInfo.prizePool = address(this).balance.sub(
                    poolInfo.demandDepositPool
                );
            }
            return true;
        }
        return false;
    }

    function subsidyRefund() private returns (bool) {
        for (; subsidyInfo.refundingCount > 0; ) {
            uint256 i = subsidyInfo.startIndex;
            address refundingAddress = subsidyInfo.refundingAddressMap[i];
            require(
                refundingAddress != address(0),
                "SUBSIDY_REFUND_ADDRESS_ERROR"
            );
            uint256 singleAmount = subsidyInfo
                .refundingSubsidyAmountMap[refundingAddress];

            if (gasleft() < minGasLeft) {
                emit GasNotEnough();
                return false;
            }

            if (poolInfo.demandDepositPool >= singleAmount) {
                subsidyAmountMap[refundingAddress] = subsidyAmountMap[refundingAddress]
                    .sub(singleAmount);
                subsidyInfo.refundingAddressMap[i] = address(0);
                subsidyInfo.refundingCount = subsidyInfo.refundingCount.sub(1);
                subsidyInfo.startIndex = subsidyInfo.startIndex.add(1);
                subsidyInfo.total = subsidyInfo.total.sub(singleAmount);
                poolInfo.demandDepositPool = poolInfo.demandDepositPool.sub(
                    singleAmount
                );
                subsidyInfo.refundingSubsidyAmountMap[refundingAddress] = 0;
                refundingAddress.transfer(singleAmount);
                emit SubsidyRefund(refundingAddress, singleAmount);
            } else {
                return false;
            }
        }
        return true;
    }

    function redeemPendingRefund() private returns (bool) {
        for (; pendingRedeemCount > 0; ) {
            uint256 i = pendingRedeemStartIndex;
            require(
                pendingRedeemMap[i].user != address(0),
                "STAKE_OUT_ADDRESS_ERROR"
            );
            uint256[] memory codes = new uint256[](1);
            codes[0] = pendingRedeemMap[i].code;

            if (gasleft() < minGasLeft) {
                emit GasNotEnough();
                return false;
            }

            if (redeemAddress(codes, pendingRedeemMap[i].user)) {
                pendingRedeemStartIndex = pendingRedeemStartIndex.add(1);
                pendingRedeemCount = pendingRedeemCount.sub(1);
                pendingRedeemSearchMap[pendingRedeemMap[i]
                    .user][pendingRedeemMap[i].code] = 0;
            } else {
                return false;
            }
        }
        return true;
    }

    function prizeWithdrawPendingRefund() private returns (bool) {
        for (; pendingPrizeWithdrawCount > 0; ) {
            uint256 i = pendingPrizeWithdrawStartIndex;
            require(
                pendingPrizeWithdrawMap[i] != address(0),
                "PRIZE_WITHDRAW_ADDRESS_ERROR"
            );

            if (gasleft() < minGasLeft) {
                emit GasNotEnough();
                return false;
            }

            if (prizeWithdrawAddress(pendingPrizeWithdrawMap[i])) {
                pendingPrizeWithdrawStartIndex = pendingPrizeWithdrawStartIndex.add(1);
                pendingPrizeWithdrawCount = pendingPrizeWithdrawCount.sub(1);
            } else {
                return false;
            }
        }
        return true;
    }

    function redeemAddress(uint256[] memory codes, address user)
        private
        returns (bool)
    {
        uint256 totalAmount = 0;

        for (uint256 i = 0; i < codes.length; i++) {
            totalAmount = totalAmount.add(
                userInfoMap[user].codeAmountMap[codes[i]]
            );
        }

        require(totalAmount > 0, "REDEEM_TOTAL_AMOUNT_SHOULD_NOT_ZERO");

        if (totalAmount <= poolInfo.demandDepositPool) {
            require(
                poolInfo.demandDepositPool <= address(this).balance,
                "SC_BALANCE_ERROR"
            );

            poolInfo.demandDepositPool = poolInfo.demandDepositPool.sub(
                totalAmount
            );

            for (uint256 m = 0; m < codes.length; m++) {
                userInfoMap[user].codeAmountMap[codes[m]] = 0;
                removeUserCodesMap(codes[m], user);
                removeCodeInfoMap(codes[m], user);
            }

            user.transfer(totalAmount);
            emit Redeem(user, true, codes, totalAmount);
            return true;
        }
        return false;
    }

    function prizeWithdrawAddress(address user) private returns (bool) {
        uint256 totalAmount = userInfoMap[user].prize;
        if (totalAmount <= poolInfo.demandDepositPool) {
            require(
                poolInfo.demandDepositPool <= address(this).balance,
                "SC_BALANCE_ERROR"
            );

            poolInfo.demandDepositPool = poolInfo.demandDepositPool.sub(
                totalAmount
            );

            userInfoMap[user].prize = 0;

            user.transfer(totalAmount);
            emit PrizeWithdraw(msg.sender, true, totalAmount);
            return true;
        }
        return false;
    }
}
