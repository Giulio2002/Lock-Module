pragma solidity ^0.5.2;

import "../universal-login-contracts/contracts/IERC1077.sol";
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

    mapping(address => Identity) public id;

    constructor() public {}

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

    function updateIdentity() private {
        if(now.sub(id[msg.sender].lastAccess) < id[msg.sender].time) return;
        id[msg.sender].value = 0;
        return;
    }

    function initialize(uint256 _limit, uint256 _time, uint256 _requiredSignatures) public {
      require(id[msg.sender].requiredSignatures == 0, "identity already initialised");
      setLimit(_limit);
      setTime(_time);
      setRequiredSignatures(_requiredSignatures);
      id[msg.sender].value = 0;
      id[msg.sender].lastAccess = now;
    }

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
    ) public returns (bool){
        require(id[msg.sender].requiredSignatures != 0, "identity not initizialised");
        updateIdentity();
        if (id[msg.sender].value.add(value) > id[msg.sender].limit || to.isContract()) {
            require(signatures.length == id[msg.sender].requiredSignatures.mul(65), "Invalid number of signatures");
        } else {
            require(signatures.length == 65, "Invalid number of signatures");
            if (id[msg.sender].value == 0) {
              id[msg.sender].lastAccess = now;
            }
            id[msg.sender].value = id[msg.sender].value.add(value);
        }
        return true;
    }
}
