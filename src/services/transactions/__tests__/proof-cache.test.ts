import { PopulatedTransaction } from '@ethersproject/contracts';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {
  ProofType,
  RailgunNFTAmountRecipient,
  RailgunERC20Amount,
  RailgunERC20AmountRecipient,
  NetworkName,
  RailgunNFTAmount,
} from '@railgun-community/shared-models';
import {
  MOCK_NFT_AMOUNTS,
  MOCK_NFT_AMOUNT_RECIPIENTS,
  MOCK_RAILGUN_WALLET_ADDRESS,
  MOCK_TOKEN_AMOUNTS,
  MOCK_TOKEN_FEE,
} from '../../../tests/mocks.test';
import {
  setCachedProvedTransaction,
  validateCachedProvedTransaction,
} from '../proof-cache';

chai.use(chaiAsPromised);
const { expect } = chai;

const networkName = NetworkName.BNBChain;
const railgunWalletID = '123';
const showSenderAddressToRecipient = true;
const memoText = 'Some memo';
const recipientAddress = '0x12345';
const erc20AmountRecipients: RailgunERC20AmountRecipient[] =
  MOCK_TOKEN_AMOUNTS.map(erc20Amount => ({
    ...erc20Amount,
    recipientAddress,
  }));
const nftAmountRecipients: RailgunNFTAmountRecipient[] =
  MOCK_NFT_AMOUNT_RECIPIENTS;
const relayerFeeERC20AmountRecipient: RailgunERC20AmountRecipient = {
  ...MOCK_TOKEN_FEE,
  recipientAddress: MOCK_RAILGUN_WALLET_ADDRESS,
};
const crossContractCallsSerialized = ['0x4567'];
const relayAdaptShieldERC20Addresses = ['0x123'];
const relayAdaptUnshieldERC20Amounts: RailgunERC20Amount[] = [MOCK_TOKEN_FEE];
const relayAdaptUnshieldNFTAmounts: RailgunNFTAmount[] = MOCK_NFT_AMOUNTS;
const relayAdaptShieldNFTs: RailgunNFTAmount[] = MOCK_NFT_AMOUNTS;

const nullifiers = ['0x1234'];

const sendWithPublicWallet = false;
const overallBatchMinGasPrice = '0x1000';

const setCached = (proofType: ProofType) => {
  setCachedProvedTransaction({
    populatedTransaction: {} as PopulatedTransaction,
    proofType,
    showSenderAddressToRecipient,
    memoText,
    railgunWalletID,
    erc20AmountRecipients,
    nftAmountRecipients,
    relayAdaptUnshieldERC20Amounts,
    relayAdaptUnshieldNFTAmounts,
    relayAdaptShieldERC20Addresses,
    relayAdaptShieldNFTs,
    crossContractCallsSerialized,
    relayerFeeERC20AmountRecipient,
    sendWithPublicWallet: false,
    overallBatchMinGasPrice,
    nullifiers,
  });
};

describe('proof-cache', () => {
  it('Should validate cached transaction correctly', () => {
    setCachedProvedTransaction(undefined);
    expect(() =>
      validateCachedProvedTransaction(
        networkName,
        ProofType.CrossContractCalls,
        railgunWalletID,
        showSenderAddressToRecipient,
        memoText,
        erc20AmountRecipients,
        nftAmountRecipients,
        relayAdaptUnshieldERC20Amounts,
        relayAdaptUnshieldNFTAmounts,
        relayAdaptShieldERC20Addresses,
        relayAdaptShieldNFTs,
        crossContractCallsSerialized,
        relayerFeeERC20AmountRecipient,
        sendWithPublicWallet,
        overallBatchMinGasPrice,
      ),
    ).to.throw('No proof found.');

    setCached(ProofType.CrossContractCalls);

    // Same same
    expect(() =>
      validateCachedProvedTransaction(
        networkName,
        ProofType.CrossContractCalls,
        railgunWalletID,
        showSenderAddressToRecipient,
        memoText,
        erc20AmountRecipients,
        nftAmountRecipients,
        relayAdaptUnshieldERC20Amounts,
        relayAdaptUnshieldNFTAmounts,
        relayAdaptShieldERC20Addresses,
        relayAdaptShieldNFTs,
        crossContractCallsSerialized,
        relayerFeeERC20AmountRecipient,
        sendWithPublicWallet,
        overallBatchMinGasPrice,
      ),
    ).to.not.throw();

    expect(() =>
      validateCachedProvedTransaction(
        networkName,
        ProofType.Unshield,
        railgunWalletID,
        showSenderAddressToRecipient,
        memoText,
        erc20AmountRecipients,
        nftAmountRecipients,
        relayAdaptUnshieldERC20Amounts,
        relayAdaptUnshieldNFTAmounts,
        relayAdaptShieldERC20Addresses,
        relayAdaptShieldNFTs,
        crossContractCallsSerialized,
        relayerFeeERC20AmountRecipient,
        sendWithPublicWallet,
        overallBatchMinGasPrice,
      ),
    ).to.throw('Mismatch: proofType.');

    expect(() =>
      validateCachedProvedTransaction(
        networkName,
        ProofType.Transfer,
        railgunWalletID,
        showSenderAddressToRecipient,
        memoText,
        erc20AmountRecipients,
        nftAmountRecipients,
        relayAdaptUnshieldERC20Amounts,
        relayAdaptUnshieldNFTAmounts,
        relayAdaptShieldERC20Addresses,
        relayAdaptShieldNFTs,
        crossContractCallsSerialized,
        relayerFeeERC20AmountRecipient,
        sendWithPublicWallet,
        overallBatchMinGasPrice,
      ),
    ).to.throw('Mismatch: proofType.');

    expect(() =>
      validateCachedProvedTransaction(
        networkName,
        ProofType.CrossContractCalls,
        '987',
        showSenderAddressToRecipient,
        memoText,
        erc20AmountRecipients,
        nftAmountRecipients,
        relayAdaptUnshieldERC20Amounts,
        relayAdaptUnshieldNFTAmounts,
        relayAdaptShieldERC20Addresses,
        relayAdaptShieldNFTs,
        crossContractCallsSerialized,
        relayerFeeERC20AmountRecipient,
        sendWithPublicWallet,
        overallBatchMinGasPrice,
      ),
    ).to.throw('Mismatch: railgunWalletID.');

    // Set new for Transfer proof type
    setCached(ProofType.Transfer);

    // Requires ProofType.Transfer
    expect(() =>
      validateCachedProvedTransaction(
        networkName,
        ProofType.Transfer,
        railgunWalletID,
        false, // showSenderAddressToRecipient
        memoText,
        erc20AmountRecipients,
        nftAmountRecipients,
        relayAdaptUnshieldERC20Amounts,
        relayAdaptUnshieldNFTAmounts,
        relayAdaptShieldERC20Addresses,
        relayAdaptShieldNFTs,
        crossContractCallsSerialized,
        relayerFeeERC20AmountRecipient,
        sendWithPublicWallet,
        overallBatchMinGasPrice,
      ),
    ).to.throw('Mismatch: showSenderAddressToRecipient.');

    // Requires ProofType.Transfer
    expect(() =>
      validateCachedProvedTransaction(
        networkName,
        ProofType.Transfer,
        railgunWalletID,
        showSenderAddressToRecipient,
        'different memo',
        erc20AmountRecipients,
        nftAmountRecipients,
        relayAdaptUnshieldERC20Amounts,
        relayAdaptUnshieldNFTAmounts,
        relayAdaptShieldERC20Addresses,
        relayAdaptShieldNFTs,
        crossContractCallsSerialized,
        relayerFeeERC20AmountRecipient,
        sendWithPublicWallet,
        overallBatchMinGasPrice,
      ),
    ).to.throw('Mismatch: memoText.');

    // Requires ProofType.Transfer
    expect(() =>
      validateCachedProvedTransaction(
        networkName,
        ProofType.Transfer,
        railgunWalletID,
        showSenderAddressToRecipient,
        memoText,
        [
          {
            tokenAddress: '0x765',
            amountString: '100',
            recipientAddress: '0x123',
          },
        ],
        nftAmountRecipients,
        relayAdaptUnshieldERC20Amounts,
        relayAdaptUnshieldNFTAmounts,
        relayAdaptShieldERC20Addresses,
        relayAdaptShieldNFTs,
        crossContractCallsSerialized,
        relayerFeeERC20AmountRecipient,
        sendWithPublicWallet,
        overallBatchMinGasPrice,
      ),
    ).to.throw('Mismatch: erc20AmountRecipients.');

    setCached(ProofType.CrossContractCalls);

    expect(() =>
      validateCachedProvedTransaction(
        networkName,
        ProofType.CrossContractCalls,
        railgunWalletID,
        showSenderAddressToRecipient,
        memoText,
        erc20AmountRecipients,
        [MOCK_NFT_AMOUNT_RECIPIENTS[0]],
        relayAdaptUnshieldERC20Amounts,
        relayAdaptUnshieldNFTAmounts,
        relayAdaptShieldERC20Addresses,
        relayAdaptShieldNFTs,
        crossContractCallsSerialized,
        relayerFeeERC20AmountRecipient,
        sendWithPublicWallet,
        overallBatchMinGasPrice,
      ),
    ).to.throw('Mismatch: nftAmountRecipients.');

    // Note: requires ProofType.CrossContractCalls
    expect(() =>
      validateCachedProvedTransaction(
        networkName,
        ProofType.CrossContractCalls,
        railgunWalletID,
        showSenderAddressToRecipient,
        memoText,
        erc20AmountRecipients,
        nftAmountRecipients,
        [
          {
            tokenAddress: '0x765',
            amountString: '100',
          },
        ],
        relayAdaptUnshieldNFTAmounts,
        relayAdaptShieldERC20Addresses,
        relayAdaptShieldNFTs,
        crossContractCallsSerialized,
        relayerFeeERC20AmountRecipient,
        sendWithPublicWallet,
        overallBatchMinGasPrice,
      ),
    ).to.throw('Mismatch: relayAdaptUnshieldERC20Amounts.');

    // Note: requires ProofType.CrossContractCalls
    expect(() =>
      validateCachedProvedTransaction(
        networkName,
        ProofType.CrossContractCalls,
        railgunWalletID,
        showSenderAddressToRecipient,
        memoText,
        erc20AmountRecipients,
        nftAmountRecipients,
        relayAdaptUnshieldERC20Amounts,
        [MOCK_NFT_AMOUNTS[0]],
        relayAdaptShieldERC20Addresses,
        relayAdaptShieldNFTs,
        crossContractCallsSerialized,
        relayerFeeERC20AmountRecipient,
        sendWithPublicWallet,
        overallBatchMinGasPrice,
      ),
    ).to.throw('Mismatch: relayAdaptUnshieldNFTAmounts.');

    expect(() =>
      validateCachedProvedTransaction(
        networkName,
        // proofType (ProofType.Transfer) will not validate relayAdaptUnshieldERC20Amounts.. requires ProofType.CrossContractCalls
        ProofType.CrossContractCalls,
        railgunWalletID,
        showSenderAddressToRecipient,
        memoText,
        erc20AmountRecipients,
        nftAmountRecipients,
        relayAdaptUnshieldERC20Amounts,
        relayAdaptUnshieldNFTAmounts,
        ['test'],
        relayAdaptShieldNFTs,
        crossContractCallsSerialized,
        relayerFeeERC20AmountRecipient,
        sendWithPublicWallet,
        overallBatchMinGasPrice,
      ),
    ).to.throw('Mismatch: relayAdaptShieldERC20Addresses.');

    expect(() =>
      validateCachedProvedTransaction(
        networkName,
        // proofType (ProofType.Transfer) will not validate relayAdaptUnshieldERC20Amounts.. requires ProofType.CrossContractCalls
        ProofType.CrossContractCalls,
        railgunWalletID,
        showSenderAddressToRecipient,
        memoText,
        erc20AmountRecipients,
        nftAmountRecipients,
        relayAdaptUnshieldERC20Amounts,
        relayAdaptUnshieldNFTAmounts,
        [],
        relayAdaptShieldNFTs,
        crossContractCallsSerialized,
        relayerFeeERC20AmountRecipient,
        sendWithPublicWallet,
        overallBatchMinGasPrice,
      ),
    ).to.throw('Mismatch: relayAdaptShieldERC20Addresses.');

    expect(() =>
      validateCachedProvedTransaction(
        networkName,
        // proofType (ProofType.Transfer) will not validate relayAdaptUnshieldERC20Amounts.. requires ProofType.CrossContractCalls
        ProofType.CrossContractCalls,
        railgunWalletID,
        showSenderAddressToRecipient,
        memoText,
        erc20AmountRecipients,
        nftAmountRecipients,
        relayAdaptUnshieldERC20Amounts,
        relayAdaptUnshieldNFTAmounts,
        relayAdaptShieldERC20Addresses,
        [MOCK_NFT_AMOUNTS[0]],
        crossContractCallsSerialized,
        relayerFeeERC20AmountRecipient,
        sendWithPublicWallet,
        overallBatchMinGasPrice,
      ),
    ).to.throw('Mismatch: relayAdaptShieldNFTs.');

    expect(() =>
      validateCachedProvedTransaction(
        networkName,
        // proofType (ProofType.Transfer) will not validate relayAdaptUnshieldERC20Amounts.. requires ProofType.CrossContractCalls
        ProofType.CrossContractCalls,
        railgunWalletID,
        showSenderAddressToRecipient,
        memoText,
        erc20AmountRecipients,
        nftAmountRecipients,
        relayAdaptUnshieldERC20Amounts,
        relayAdaptUnshieldNFTAmounts,
        relayAdaptShieldERC20Addresses,
        relayAdaptShieldNFTs,
        ['test'],
        relayerFeeERC20AmountRecipient,
        sendWithPublicWallet,
        overallBatchMinGasPrice,
      ),
    ).to.throw('Mismatch: crossContractCallsSerialized.');

    expect(() =>
      validateCachedProvedTransaction(
        networkName,
        ProofType.CrossContractCalls,
        railgunWalletID,
        showSenderAddressToRecipient,
        memoText,
        erc20AmountRecipients,
        nftAmountRecipients,
        relayAdaptUnshieldERC20Amounts,
        relayAdaptUnshieldNFTAmounts,
        relayAdaptShieldERC20Addresses,
        relayAdaptShieldNFTs,
        crossContractCallsSerialized,
        {
          tokenAddress: '0x765',
          amountString: '100',
          recipientAddress: '0x1233',
        },
        sendWithPublicWallet,
        overallBatchMinGasPrice,
      ),
    ).to.throw('Mismatch: relayerFeeERC20AmountRecipient.');

    expect(() =>
      validateCachedProvedTransaction(
        networkName,
        ProofType.CrossContractCalls,
        railgunWalletID,
        showSenderAddressToRecipient,
        memoText,
        erc20AmountRecipients,
        nftAmountRecipients,
        relayAdaptUnshieldERC20Amounts,
        relayAdaptUnshieldNFTAmounts,
        relayAdaptShieldERC20Addresses,
        relayAdaptShieldNFTs,
        crossContractCallsSerialized,
        relayerFeeERC20AmountRecipient,
        true, // sendWithPublicWallet
        overallBatchMinGasPrice,
      ),
    ).to.throw('Mismatch: sendWithPublicWallet.');

    expect(() =>
      validateCachedProvedTransaction(
        networkName,
        ProofType.CrossContractCalls,
        railgunWalletID,
        showSenderAddressToRecipient,
        memoText,
        erc20AmountRecipients,
        nftAmountRecipients,
        relayAdaptUnshieldERC20Amounts,
        relayAdaptUnshieldNFTAmounts,
        relayAdaptShieldERC20Addresses,
        relayAdaptShieldNFTs,
        crossContractCallsSerialized,
        relayerFeeERC20AmountRecipient,
        sendWithPublicWallet,
        '0x2000',
      ),
    ).to.throw('Mismatch: overallBatchMinGasPrice.');
  });
});
