pragma solidity ^0.5.0;

import '../VerifierInterface.sol';

contract VerifierHelper {
  function verifyProof(
    uint[2] memory a,
    uint[2][2] memory b,
    uint[2] memory c,
    uint[8] memory input
  ) public view returns (bool) {
    return true;
  }
}