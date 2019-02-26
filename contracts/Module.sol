pragma solidity ^0.5.0;


interface Module {
    function canExecute(
        address to,
        uint256 value,
        bytes memory data,
        uint nonce,
        uint gasPrice,
        address gasToken,
        uint gasLimit,
        IERC1077.OperationType operationType,
        bytes memory signatures
    ) public view returns (bool);
}