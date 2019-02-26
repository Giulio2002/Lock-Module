pragma solidity ^0.5.2;

import "./KeyHolder.sol";
import "./IERC1077.sol";
import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./Module.sol";

contract ERC1077 is KeyHolder, IERC1077 {
    using ECDSA for bytes32;
    using SafeMath for uint;

    uint _lastNonce;

    address[] _modules;
    mapping(address => uint256) _moduleIndex;

    constructor(bytes32 _key) KeyHolder(_key) public {
    }

    function lastNonce() public view returns (uint) {
        return _lastNonce;
    }

    function canExecute(
        address to,
        uint256 value,
        bytes memory data,
        uint nonce,
        uint gasPrice,
        address gasToken,
        uint gasLimit,
        OperationType operationType,
        bytes memory signatures) public view returns (bool)
    {
        uint sigNumber = signatures.length / 65;
        for(uint8 i = 0;i < sigNumber; i++) {
            bytes memory sig = new bytes(65);
            for(uint8 j = 0;j < 65; j++) {
                sig[j] = signatures[j];
            }
            if(isValid(to, value, data,nonce, gasPrice, gasToken, gasLimit, operationType, signatures) == false){
                return false;
            }
        }
        bool moduleExecutable = moduleCanExecute(
            to,
            value,
            data,
            nonce,
            gasPrice,
            gasToken,
            gasLimit,
            operationType,
            signatures);
        return moduleExecutable;
    }

        function isValid(
        address to,
        uint256 value,
        bytes memory data,
        uint nonce,
        uint gasPrice,
        address gasToken,
        uint gasLimit,
        OperationType operationType,
        bytes memory signature) private view returns (bool)
    {
        address signer = getSigner(
            address(this),
            to,
            value,
            data,
            nonce,
            gasPrice,
            gasToken,
            gasLimit,
            operationType,
            signature);
        return keyExist(bytes32(uint256(signer)));
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
        OperationType operationType) public pure returns (bytes32)
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
        OperationType operationType,
        bytes memory signature ) public pure returns (address)
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
            operationType).toEthSignedMessageHash().recover(signature);
    }

    function executeSigned(
        address to,
        uint256 value,
        bytes memory data,
        uint nonce,
        uint gasPrice,
        address gasToken,
        uint gasLimit,
        OperationType operationType,
        bytes memory signatures) public returns (bytes32)
    {
        require(signatures.length != 0, "Invalid signatures");
        require(signatures.length % 65 == 0, "Invalid signatures");
        require(nonce == _lastNonce, "Invalid nonce");
        require(canExecute(to, value, data, nonce, gasPrice, gasToken, gasLimit, operationType, signatures), "Invalid signatures");
        uint256 startingGas = gasleft();
        bytes memory _data;
        bool success;
        /* solium-disable-next-line security/no-call-value */
        (success, _data) = to.call.value(value)(data);
        bytes32 messageHash = calculateMessageHash(address(this), to, value, data, nonce, gasPrice, gasToken, gasLimit, operationType);
        emit ExecutedSigned(messageHash, _lastNonce, success);
        _lastNonce++;
        uint256 gasUsed = startingGas.sub(gasleft());
        refund(gasUsed, gasPrice, gasToken);
        return messageHash;
    }

    function refund(uint256 gasUsed, uint gasPrice, address gasToken) private {
        if (gasToken != address(0)) {
            ERC20 token = ERC20(gasToken);
            token.transfer(msg.sender, gasUsed.mul(gasPrice));
        } else {
            msg.sender.transfer(gasUsed.mul(gasPrice));
        }
    }

        function addModule(address module, bytes memory /*data*/) internal {
        uint256 index = _modules.push(module).sub(1);
        _moduleIndex[module] = index;
    }

    function removeModule(address module) internal {
        uint256 index = _moduleIndex[module];
        address keyToMove = _modules[_modules.length.sub(1)];
        _modules[index] = keyToMove;
        _moduleIndex[keyToMove] = index;
        delete _moduleIndex[module];
        _modules.length--;
    }

    function moduleCanExecute(
        address to,
        uint256 value,
        bytes memory data,
        uint nonce,
        uint gasPrice,
        address gasToken,
        uint gasLimit,
        OperationType operationType,
        bytes memory signatures) public view returns(bool executable)
    {
        executable = _modules.length == 0;
        for (uint256 i=0; i<_modules.length; i++) {
            bool moduleExecutable = Module(_modules[i]).canExecute(
                to,
                value,
                data,
                nonce,
                gasPrice,
                gasToken,
                gasLimit,
                operationType,
                signatures);
            executable = executable || moduleExecutable;
        }
        return executable;
    }
}
