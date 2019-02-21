pragma solidity ^0.5.2;

import "./ERC725KeyHolder.sol";

contract Module {

    struct Identity {
        uint256 limit;
        uint256 time;
        uint256 requiredApprovals;
    }

    mapping(address => Identity) id;
    
    function canExecute(
        address to,
        uint256 value,
        bytes memory data,
        uint nonce,
        uint gasPrice,
        address gasToken,
        uint gasLimit,
        ERC725KeyHolder.OperationType operationType,
        bytes memory signatures
    ) public view returns (bool){
        require(signatures.length % 65 == 0, "Invalid signatures");

    }
}
