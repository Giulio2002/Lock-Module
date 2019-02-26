pragma solidity ^0.5.0;

import "../universal-login-contracts/contracts/IERC1077.sol";

interface Module {
    function canExecute(
        address to,
        uint256 value,
        bytes calldata data,
        uint nonce,
        uint gasPrice,
        address gasToken,
        uint gasLimit,
        IERC1077.OperationType operationType,
        bytes calldata signatures
    ) external returns (bool);
}