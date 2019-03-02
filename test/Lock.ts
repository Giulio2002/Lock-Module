import chai, {expect} from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {solidity, getWallets, loadFixture} from 'ethereum-waffle';
import basicLock, {transferMessage, callMessage, voidMessage} from './fixtures/basicLock';
import {utils, Wallet} from 'ethers';
import {calculateMessageHash, calculateMessageSignature, concatenateBytes, Message} from '../universal-login-contracts/lib/calculateMessageSignature';
import DEFAULT_PAYMENT_OPTIONS from '../universal-login-contracts/lib/defaultPaymentOptions';
import {getExecutionArgs} from '../universal-login-contracts/test/utils';

chai.use(chaiAsPromised);
chai.use(solidity);

const {parseEther} = utils;
const to = '0x0000000000000000000000000000000000000001';
const {gasPrice} = DEFAULT_PAYMENT_OPTIONS;
const overrideOptions = {gasPrice, gasLimit: 200000};
const time = 1000000;
describe('ERC1077', async  () => {
  let provider: any;
  let identity: any;
  let privateKey: any;
  let keyAsAddress: any;
  let publicKey: any;
  let signature: any;
  let msg: any;
  let mockContract: any;
  let wallet: Wallet;
  let mockToken: any;
  let anotherWallet: any;
  let invalidSignature: any;
  let relayerBalance: any;
  let relayerTokenBalance: any;
  let privateActionKey: any;
  let lock : any;

  const timeTravel = async () =>
    await provider.send('evm_increaseTime', time);

  beforeEach(async () => {
    ({provider, identity, privateKey, privateActionKey, keyAsAddress, lock, publicKey, mockToken, mockContract, wallet} = await loadFixture(basicLock));
    msg = {...transferMessage, from: identity.address};
    signature = calculateMessageSignature(privateKey, msg);
    [anotherWallet] = await getWallets(provider);
    invalidSignature = await calculateMessageSignature(anotherWallet.privateKey, msg);
    relayerBalance = await wallet.getBalance();
    relayerTokenBalance = await mockToken.balanceOf(wallet.address);
  });

  it('should be correctly initialized', async () => {
    msg = {...voidMessage, from: identity.address};
    signature = calculateMessageSignature(privateKey, msg);
    await identity.executeSigned(...getExecutionArgs(msg), signature, overrideOptions);
    const id = await lock.id(identity.address);
    const block = await provider.getBlock(provider.getBlockNumber());
    expect(id[0]).to.be.equal(utils.parseEther('1.0'));
    expect(id[1]).to.be.equal(time);
    expect(id[2]).to.be.equal(1);
    expect(id[3]).to.be.equal(0);
    expect(id[4]).to.be.equal(block.timestamp);
  });
});
