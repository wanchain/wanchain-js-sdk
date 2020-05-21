pragma solidity 0.4.26;

import "./lib/Proxy.sol";
import "./JacksPotStorage.sol";
import "./lib/LibOwnable.sol";
import "./lib/ReentrancyGuard.sol";

contract JacksPotProxy is JacksPotStorage, ReentrancyGuard, Proxy {
    /**
    *
    * MANIPULATIONS
    *
    */

    /// @notice                           function for setting or upgrading JacksPotDelegate address by owner
    /// @param impl                       JacksPotDelegate contract address
    function upgradeTo(address impl) external onlyOwner {
        require(impl != address(0), "Cannot upgrade to invalid address");
        require(impl != _implementation, "Cannot upgrade to the same implementation");
        _implementation = impl;
        emit Upgraded(impl);
    }
}
