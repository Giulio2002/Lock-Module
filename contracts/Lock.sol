pragma solidity ^0.5.2;

import "./ERC725KeyHolder.sol";
import "./Module.sol";
import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";

contract Lock is Module {
    using ECDSA for bytes32;
    using SafeMath for uint256;
    using Address for address;

    struct Identity {
        uint256 limit;
        uint256 time;
        uint256 requiredSignatures;
        uint256 value;
        uint256 lastAccess;
    }

    mapping(address => Identity) id;

    constructor() public {
    }

    function setLimit(uint256 _limit) public returns(bool){
        id[msg.sender].limit = _limit;
        return true;
    }

    function setTime(uint256 _time) public returns(bool){
        id[msg.sender].time = _time;
        return true;
    }

    function setRequiredSignatures(uint256 _requiredSignatures) public returns(bool){
        id[msg.sender].requiredSignatures = _requiredSignatures;
        return true;
    }

    function isValid(
        address to,
        uint256 value,
        bytes memory data,
        uint nonce,
        uint gasPrice,
        address gasToken,
        uint gasLimit,
        ERC725KeyHolder.OperationType operationType,
        bytes memory signatures) private view returns (bool)
    {
        address signer = getSigner(
            address(msg.sender),
            to,
            value,
            data,
            nonce,
            gasPrice,
            gasToken,
            gasLimit,
            operationType,
            signatures);
        ERC725KeyHolder keyHolder = ERC725KeyHolder(msg.sender);
        return keyHolder.getKeyPurpose(bytes32(uint256(signer))) == 0 ? true : false;
    }

    function calculateMessageHash(
        address from,
        address to,
        uint256 value,
        bytes memory data,
        uint nonce,
        uint gasPrice,
        address gasToken,
        uint gasLimit,
        ERC725KeyHolder.OperationType operationType) private pure returns (bytes32)
    {
        return keccak256(
            abi.encodePacked(
                from,
                to,
                value,
                keccak256(data),
                nonce,
                gasPrice,
                gasToken,
                gasLimit,
                uint(operationType)
        ));
    }

    function getSigner(
        address from,
        address to,
        uint value,
        bytes memory data,
        uint nonce,
        uint gasPrice,
        address gasToken,
        uint gasLimit,
        ERC725KeyHolder.OperationType operationType,
        bytes memory signatures ) private pure returns (address)
    {
        return calculateMessageHash(
            from,
            to,
            value,
            data,
            nonce,
            gasPrice,
            gasToken,
            gasLimit,
            operationType).toEthSignedMessageHash().recover(signatures);
    }

    function verify(
        address to,
        uint256 value,
        bytes memory data,
        uint nonce,
        uint gasPrice,
        address gasToken,
        uint gasLimit,
        ERC725KeyHolder.OperationType operationType,
        bytes memory signatures
    ) private view {
        for(uint8 i = 0;i < id[msg.sender].requiredSignatures; i++) {
            bytes memory sig = new bytes(65);
            for(uint8 j = 0;j < 65; j++) {
                sig[j] = signatures[j + i * 65];
            }
            require(isValid(to, value, data,nonce, gasPrice, gasToken, gasLimit, operationType, sig));
        }
    }

    function updateIdentity() private {
        if(now - id[msg.sender].lastAccess < id[msg.sender].time) return;
        id[msg.sender].value = 0;
        return;
    }

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
    ) public returns (bool){
        require(signatures.length != 0, "Invalid signatures");
        require(signatures.length % 65 == 0, "Invalid signatures");
        updateIdentity();
        if (id[msg.sender].requiredSignatures == 0){
            require(!to.isContract());
            setLimit(1 ether);
            setTime(1 days);
            setRequiredSignatures(1);
            id[msg.sender].value = value;
            id[msg.sender].lastAccess = now;
            return true;
        } else if (id[msg.sender].value + value > id[msg.sender].limit && !to.isContract()) {
            require(signatures.length ==  65, "Invalid number of signatures");
            require(isValid(to, value, data, nonce, gasPrice, gasToken, gasLimit, operationType, signatures));
            id[msg.sender].lastAccess = now;
            id[msg.sender].value = id[msg.sender].value.add(value);
            return true;
        } 
        require(signatures.length == id[msg.sender].requiredSignatures * 65, "Invalid number of signatures");
        verify(to, value, data,nonce, gasPrice, gasToken, gasLimit, operationType, signatures);
        return true;
    }
}
