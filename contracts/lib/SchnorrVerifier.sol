pragma solidity ^0.4.24;

import "./Secp256k1.sol";

// pragma experimental ABIEncoderV2;


library SchnorrVerifier {
    struct Point {
        uint256 x; uint256 y;
    }

    struct Verification {
        Point groupKey;
        Point randomPoint;
        uint256 signature;
        bytes32 message;

        uint256 _hash;
        Point _left;
        Point _right;
    }

    function h(bytes32 m, uint256 a, uint256 b) public pure returns (uint256) {
        return uint256(sha256(abi.encodePacked(m, uint8(0x04), a, b)));
    }

    // function cmul(Point p, uint256 scalar) public pure returns (uint256, uint256) {
    function cmul(uint256 x, uint256 y, uint256 scalar) public pure returns (uint256, uint256) {
        return Secp256k1.ecmul(x, y, scalar);
    }

    function sg(uint256 sig_s) public pure returns (uint256, uint256) {
        return Secp256k1.ecmul(Secp256k1.getGx(), Secp256k1.getGy(), sig_s);
    }

    // function cadd(Point a, Point b) public pure returns (uint256, uint256) {
    function cadd(uint256 ax, uint256 ay, uint256 bx, uint256 by) public pure returns (uint256, uint256) {
        return Secp256k1.ecadd(ax, ay, bx, by);
    }

    function verify(bytes32 signature, bytes32 groupKeyX, bytes32 groupKeyY, bytes32 randomPointX, bytes32 randomPointY, bytes32 message)
        public
        pure
        returns(bool)
    {
        bool flag = false;
        Verification memory state;

        state.signature = uint256(signature);
        state.groupKey.x = uint256(groupKeyX);
        state.groupKey.y = uint256(groupKeyY);
        state.randomPoint.x = uint256(randomPointX);
        state.randomPoint.y = uint256(randomPointY);
        state.message = message;

        state._hash = h(state.message, state.randomPoint.x, state.randomPoint.y);

        (state._left.x, state._left.y) = sg(state.signature);
        Point memory rightPart;
        (rightPart.x, rightPart.y) = cmul(state.groupKey.x, state.groupKey.y, state._hash);
        (state._right.x, state._right.y) = cadd(state.randomPoint.x, state.randomPoint.y, rightPart.x, rightPart.y);

        flag = state._left.x == state._right.x && state._left.y == state._right.y;

        return flag;
    }
}