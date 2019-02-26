import chai, {expect} from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {solidity, loadFixture} from 'ethereum-waffle';
import basicIdentity, {transferMessage, callMessage} from '../fixtures/basicIdentity';
import {utils} from 'ethers';
import {calculateMessageSignature} from '../../lib/calculateMessageSignature';
import {getExecutionArgs} from '../utils';

chai.use(chaiAsPromised);
chai.use(solidity);

const callCost = 109500;
const transferCost = 225000;

const overrideOptions = {gasLimit: 220000};

describe('ERC1077 - gas cost', async () => {
  let provider;
  let identity;
  let privateKey;
  let signature;
  let msg;
  let mockContract;

  beforeEach(async () => {
    ({provider, identity, privateKey, mockContract} = await loadFixture(basicIdentity));
  });

  describe('gas cost', () => {
    it('mock call costs', async () => {
      msg = {...callMessage, from: identity.address, to: mockContract.address};
      signature = calculateMessageSignature(privateKey, msg);
      const transaction = await identity.executeSigned(...getExecutionArgs(msg), signature, overrideOptions);
      const {gasUsed} = await provider.getTransactionReceipt(transaction.hash);
      console.log(`mock call costs: ${utils.formatEther(gasUsed)}`);
      expect(gasUsed).to.be.below(callCost);
    });

    it('transfer ether costs', async () => {
      msg = {...transferMessage, from: identity.address};
      signature = calculateMessageSignature(privateKey, msg);
      const transaction = await identity.executeSigned(...getExecutionArgs(msg), signature, overrideOptions);

      const {gasUsed} = await provider.getTransactionReceipt(transaction.hash);
      console.log(`transfer ether costs: ${utils.formatEther(gasUsed)}`);
      expect(gasUsed).to.be.below(transferCost);
    });
  });
});
