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

import "../../lib/SchnorrVerifier.sol";

library commonLib {

    /// @notice       convert bytes to bytes32
    /// @param b      bytes array
    /// @param offset offset of array to begin convert
    function bytesToBytes32(bytes b, uint offset) private pure returns (bytes32) {
        bytes32 out;

        for (uint i = 0; i < 32; i++) {
          out |= bytes32(b[offset + i] & 0xFF) >> (i * 8);
        }
        return out;
    }

    /// @notice             verify signature
    /// @param  message     message to be verified
    /// @param  r           Signature info r
    /// @param  s           Signature info s
    /// @return             true/false
    function verifySignature(bytes32 message, bytes PK, bytes r, bytes32 s)
        internal
        pure
    {
        bytes32 PKx = bytesToBytes32(PK, 1);
        bytes32 PKy = bytesToBytes32(PK, 33);

        bytes32 Rx = bytesToBytes32(r, 1);
        bytes32 Ry = bytesToBytes32(r, 33);

        require(SchnorrVerifier.verify(s, PKx, PKy, Rx, Ry, message), "Signature verification failed");
    }
}
