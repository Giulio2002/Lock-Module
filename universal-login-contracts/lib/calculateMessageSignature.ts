import {utils, Wallet} from 'ethers';

export interface Message {
  from: string;
  to: string;
  value: utils.BigNumberish;
  data: string;
  nonce: utils.BigNumberish;
  gasPrice: utils.BigNumberish;
  gasToken: string;
  gasLimit: utils.BigNumberish;
  operationType: utils.BigNumberish;
}

const bufferToHex = (buffer: Uint8Array) => {
    return Array
        .from (new Uint8Array (buffer))
        .map (b => b.toString (16).padStart (2, "0"))
        .join ("");
}

export const calculateMessageHash = (msg: Message) => {
  const dataHash = utils.solidityKeccak256(['bytes'], [msg.data]);
  return utils.solidityKeccak256(
    ['address', 'address', 'uint256', 'bytes32', 'uint256', 'uint', 'address', 'uint', 'uint'],
    [msg.from, msg.to, msg.value, dataHash, msg.nonce, msg.gasPrice, msg.gasToken, msg.gasLimit, msg.operationType]);
};

export const calculateMessageSignature = (privateKey: string, msg: Message) => {
  const wallet = new Wallet(privateKey);
  const massageHash = calculateMessageHash(msg);
  const signed = wallet.signMessage(utils.arrayify(massageHash));
  return signed; 
};

export const concatenateBytes = (bytes1: any, bytes2: any) => {
  const bytes1Array = utils.arrayify(bytes1);
  const bytes2Array = utils.arrayify(bytes2);
  let concatenated = new Uint8Array(bytes1.length + bytes2.length);
  concatenated.set(bytes1);
  concatenated.set(bytes2, bytes1.length);
  return bufferToHex(concatenated);
}
