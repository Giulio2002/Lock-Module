import chai, {expect} from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {solidity, getWallets, loadFixture} from 'ethereum-waffle';
import basicIdentity, {transferMessage, failedTransferMessage, callMessage, failedCallMessage} from '../fixtures/basicIdentity';
import {utils} from 'ethers';
import {calculateMessageHash, calculateMessageSignature} from '../../lib/calculateMessageSignature';
import DEFAULT_PAYMENT_OPTIONS from '../../lib/defaultPaymentOptions';
import {getExecutionArgs} from '../utils';

chai.use(chaiAsPromised);
chai.use(solidity);

const {parseEther} = utils;
const to = '0x0000000000000000000000000000000000000001';
const {gasPrice} = DEFAULT_PAYMENT_OPTIONS;
const overrideOptions = {gasPrice, gasLimit: 200000};

describe('ERC1077', async  () => {
  let provider;
  let identity;
  let privateKey;
  let keyAsAddress;
  let publicKey;
  let signature;
  let msg;
  let mockContract;
  let wallet;
  let mockToken;
  let anotherWallet;
  let invalidSignature;
  let relayerBalance;
  let relayerTokenBalance;

  beforeEach(async () => {
    ({provider, identity, privateKey, keyAsAddress, publicKey, mockToken, mockContract, wallet} = await loadFixture(basicIdentity));
    msg = {...transferMessage, from: identity.address};
    signature = calculateMessageSignature(privateKey, msg);
    [anotherWallet] = await getWallets(provider);
    invalidSignature = calculateMessageSignature(anotherWallet.privateKey, msg);
    relayerBalance = await wallet.getBalance();
    relayerTokenBalance = await mockToken.balanceOf(wallet.address);
  });

  it('properly construct', async () => {
    expect(await identity.lastNonce()).to.eq(0);
  });

  describe('signing message', () => {
    it('key exist', async () => {
      expect(await identity.keyExist(publicKey)).to.be.true;
    });

    it('key exist', async () => {
      expect(await identity.keyExist(utils.formatBytes32String(0))).to.be.false;
    });

    it('calculates hash', async () => {
      const jsHash = calculateMessageHash(msg);
      const solidityHash = await identity.calculateMessageHash(
        msg.from,
        msg.to,
        msg.value,
        msg.data,
        msg.nonce,
        msg.gasPrice,
        msg.gasToken,
        msg.gasLimit, 0);
      expect(jsHash).to.eq(solidityHash);
    });

    it('recovers signature', async () => {
      const recoveredAddress = await identity.getSigner(
        msg.from,
        msg.to,
        msg.value,
        msg.data,
        msg.nonce,
        msg.gasPrice,
        msg.gasToken,
        msg.gasLimit,
        0,
        signature);
      expect(recoveredAddress).to.eq(keyAsAddress);
    });
  });

  describe('Transfer', async () => {
    describe('successful execution of transfer', () => {
      it('transfers funds', async () => {
        expect(await provider.getBalance(to)).to.eq(0);
        await identity.executeSigned(...getExecutionArgs(msg), signature, overrideOptions);
        expect(await provider.getBalance(to)).to.eq(parseEther('1.0'));
        expect(await identity.lastNonce()).to.eq(1);
      });

      it('emits ExecutedSigned event', async () => {
        const messageHash = calculateMessageHash(msg);
        await expect(identity.executeSigned(...getExecutionArgs(msg), signature, overrideOptions))
          .to.emit(identity, 'ExecutedSigned')
          .withArgs(messageHash, 0, true);
      });

      describe('refund', () => {
        it('should refund in token after execute transfer ethers', async () => {
          msg = {...transferMessage, from: identity.address, gasToken: mockToken.address};
          signature = calculateMessageSignature(privateKey, msg);

          await identity.executeSigned(...getExecutionArgs(msg), signature, overrideOptions);

          expect(await mockToken.balanceOf(wallet.address)).to.be.above(relayerTokenBalance);
        });

        it('should refund after execute transfer ethers', async () => {
          const transaction = await identity.executeSigned(...getExecutionArgs(msg), signature, overrideOptions);

          const {gasUsed} = await provider.getTransactionReceipt(transaction.hash);
          const totalCost = gasUsed.mul(utils.bigNumberify(gasPrice));

          expect(await wallet.getBalance()).to.be.above(relayerBalance.sub(totalCost));
        });
      });
    });

    describe('failed execution of transafer', () => {
      it('nonce too low', async () => {
        await identity.executeSigned(...getExecutionArgs(msg), signature, overrideOptions);
        await expect(identity.executeSigned(...getExecutionArgs(msg), signature, overrideOptions))
          .to.be.revertedWith('Invalid nonce');
      });

      it('nonce too high', async () => {
        msg = {...transferMessage, nonce: 2};
        await expect(identity.executeSigned(...getExecutionArgs(msg), signature, overrideOptions))
          .to.be.revertedWith('Invalid nonce');
      });

      it('emits ExecutedSigned event', async () => {
        msg = {...failedTransferMessage, from: identity.address};
        signature = calculateMessageSignature(privateKey, msg);
        const messageHash = calculateMessageHash(msg);

        await expect(identity.executeSigned(...getExecutionArgs(msg), signature, overrideOptions))
          .to.emit(identity, 'ExecutedSigned')
          .withArgs(messageHash, 0, false);
      });

      it('should increase nonce, even if transfer fails', async () => {
        msg = {...failedTransferMessage, from: identity.address};
        signature = calculateMessageSignature(privateKey, msg);

        await identity.executeSigned(...getExecutionArgs(msg), signature, overrideOptions);
        expect(await provider.getBalance(to)).to.eq(parseEther('0.0'));
        expect(await identity.lastNonce()).to.eq(1);
      });

      describe('Invalid signature', () => {
        it('no signature', async () => {
          await expect(identity.executeSigned(...getExecutionArgs(msg), [], overrideOptions))
            .to.be.revertedWith('Invalid signature');
          expect(await identity.lastNonce()).to.eq(0);
          expect(await provider.getBalance(to)).to.eq(parseEther('0.0'));
        });

        it('should be reverted', async () => {
          await expect(identity.executeSigned(...getExecutionArgs(msg), invalidSignature, overrideOptions))
            .to.be.revertedWith('Invalid signature');
        });

        it('shouldn`t transfer ethers', async () => {
          await expect(identity.executeSigned(...getExecutionArgs(msg), invalidSignature, overrideOptions))
            .to.be.revertedWith('Invalid signature');
          expect(await provider.getBalance(to)).to.eq(parseEther('0.0'));
        });

        it('shouldn`t increase nonce', async () => {
          await expect(identity.executeSigned(...getExecutionArgs(msg), invalidSignature, overrideOptions))
            .to.be.revertedWith('Invalid signature');
          expect(await identity.lastNonce()).to.eq(0);
        });
      });

      describe('refund', () => {
        it('should refund ether', async () => {
          msg = {...failedTransferMessage, from: identity.address};
          signature = calculateMessageSignature(privateKey, msg);

          const transaction = await identity.executeSigned(...getExecutionArgs(msg), signature, overrideOptions);

          const {gasUsed} = await provider.getTransactionReceipt(transaction.hash);
          const totalCost = gasUsed.mul(utils.bigNumberify(gasPrice));

          expect(await wallet.getBalance()).to.be.above(relayerBalance.sub(totalCost));
        });

        it('should refund tokens', async () => {
          msg = {...failedTransferMessage, from: identity.address, gasToken: mockToken.address};
          signature = calculateMessageSignature(privateKey, msg);
          await identity.executeSigned(...getExecutionArgs(msg), signature, overrideOptions);
          expect(await mockToken.balanceOf(wallet.address)).to.be.above(relayerTokenBalance);
        });
      });
    });
  });

  describe('Call', async () => {
    let msgToCall;
    let signatureToCall;

    describe('successful execution of call', () => {
      before(() => {
        msgToCall = {...callMessage, from: identity.address, to: mockContract.address};
        signatureToCall = calculateMessageSignature(privateKey, msgToCall);
      });

      it('called method', async () => {
        expect(await mockContract.wasCalled()).to.be.false;
        await identity.executeSigned(...getExecutionArgs(msgToCall), signatureToCall, overrideOptions);
        expect(await mockContract.wasCalled()).to.be.true;
      });

      it('increase nonce', async () => {
        await identity.executeSigned(...getExecutionArgs(msgToCall), signatureToCall, overrideOptions);
        expect(await identity.lastNonce()).to.eq(1);
      });

      it('should emit ExecutedSigned', async () => {
        const messageHash = calculateMessageHash(msgToCall);
        await expect(identity.executeSigned(...getExecutionArgs(msgToCall), signatureToCall, overrideOptions))
          .to.emit(identity, 'ExecutedSigned')
          .withArgs(messageHash, 0, true);
      });

      describe('refund', () => {
        it('should refund ether', async () => {
          msgToCall = {...callMessage, from: identity.address, to: mockContract.address};
          signatureToCall = calculateMessageSignature(privateKey, msgToCall);

          const transaction = await identity.executeSigned(...getExecutionArgs(msgToCall), signatureToCall, overrideOptions);

          const {gasUsed} = await provider.getTransactionReceipt(transaction.hash);
          const totalCost = gasUsed.mul(utils.bigNumberify(gasPrice));

          expect(await wallet.getBalance()).to.be.above(relayerBalance.sub(totalCost));
        });

        it('should refund tokens', async () => {
          msgToCall = {...callMessage, from: identity.address, to: mockContract.address, gasToken: mockToken.address};
          signatureToCall = calculateMessageSignature(privateKey, msgToCall);
          await identity.executeSigned(...getExecutionArgs(msgToCall), signatureToCall, overrideOptions);
          expect(await mockToken.balanceOf(wallet.address)).to.be.above(relayerTokenBalance);
        });
      });
    });

    describe('failed execution of call', () => {
      before(() => {
        msgToCall = {...failedCallMessage, from: identity.address, to: mockContract.address};
        signatureToCall = calculateMessageSignature(privateKey, msgToCall);
      });

      it('should increase nonce', async () => {
        await identity.executeSigned(...getExecutionArgs(msgToCall), signatureToCall, overrideOptions);
        expect(await identity.lastNonce()).to.eq(1);
      });

      it('should emit ExecutedSigned event', async () => {
        const messageHash = calculateMessageHash(msgToCall);
        await expect(identity.executeSigned(...getExecutionArgs(msgToCall), signatureToCall, overrideOptions))
          .to.emit(identity, 'ExecutedSigned')
          .withArgs(messageHash, 0, false);
      });

      it('invalid nonce', async () => {
        msg = {...msgToCall, nonce: 2};
        signature = calculateMessageSignature(privateKey, msg);

        await expect(identity.executeSigned(...getExecutionArgs(msg), signature, overrideOptions))
          .to.be.revertedWith('Invalid nonce');
      });

      describe('refund', () => {
        it('should refund ether', async () => {
          const transaction = await identity.executeSigned(...getExecutionArgs(msgToCall), signatureToCall, overrideOptions);

          const {gasUsed} = await provider.getTransactionReceipt(transaction.hash);
          const totalCost = gasUsed.mul(utils.bigNumberify(gasPrice));

          expect(await wallet.getBalance()).to.be.above(relayerBalance.sub(totalCost));
        });

        it('should refund tokens', async () => {
          msg = {...msgToCall, gasToken: mockToken.address};
          signature = calculateMessageSignature(privateKey, msg);
          await identity.executeSigned(...getExecutionArgs(msg), signature, overrideOptions);
          expect(await mockToken.balanceOf(wallet.address)).to.be.above(relayerTokenBalance);
        });
      });
    });
  });
});
