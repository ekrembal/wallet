import {
  NetworkName,
  ProofType,
  RailgunNFTAmountRecipient,
  RailgunERC20Amount,
  RailgunERC20AmountRecipient,
  RailgunNFTAmount,
  TransactionGasDetails,
  isDefined,
  RailgunERC20Recipient,
} from '@railgun-community/shared-models';
import { shouldSetOverallBatchMinGasPriceForNetwork } from '../../utils/gas-price';
import { compareContractTransactionArrays } from '../../utils/utils';
import { setGasDetailsForTransaction } from './tx-gas-details';
import {
  compareERC20AmountRecipients,
  compareERC20AmountRecipientArrays,
  compareERC20AmountArrays,
  compareNFTAmountRecipientArrays,
  compareNFTAmountArrays,
  compareERC20RecipientArrays,
} from './tx-notes';
import { ContractTransaction } from 'ethers';

export type ProvedTransaction = {
  proofType: ProofType;
  transaction: ContractTransaction;
  railgunWalletID: string;
  showSenderAddressToRecipient: boolean;
  memoText: Optional<string>;
  erc20AmountRecipients: RailgunERC20AmountRecipient[];
  nftAmountRecipients: RailgunNFTAmountRecipient[];
  relayAdaptUnshieldERC20Amounts: Optional<RailgunERC20Amount[]>;
  relayAdaptUnshieldNFTAmounts: Optional<RailgunNFTAmount[]>;
  relayAdaptShieldERC20Recipients: Optional<RailgunERC20Recipient[]>;
  relayAdaptShieldNFTRecipients: Optional<RailgunNFTAmount[]>;
  crossContractCalls: Optional<ContractTransaction[]>;
  relayerFeeERC20AmountRecipient: Optional<RailgunERC20AmountRecipient>;
  sendWithPublicWallet: boolean;
  overallBatchMinGasPrice: Optional<bigint>;
  nullifiers: string[];
};

let cachedProvedTransaction: Optional<ProvedTransaction>;

export const populateProvedTransaction = async (
  networkName: NetworkName,
  proofType: ProofType,
  railgunWalletID: string,
  showSenderAddressToRecipient: boolean,
  memoText: Optional<string>,
  erc20AmountRecipients: RailgunERC20AmountRecipient[],
  nftAmountRecipients: RailgunNFTAmountRecipient[],
  relayAdaptUnshieldERC20Amounts: Optional<RailgunERC20Amount[]>,
  relayAdaptUnshieldNFTAmounts: Optional<RailgunNFTAmount[]>,
  relayAdaptShieldERC20Recipients: Optional<RailgunERC20Recipient[]>,
  relayAdaptShieldNFTRecipients: Optional<RailgunNFTAmount[]>,
  crossContractCalls: Optional<ContractTransaction[]>,
  relayerFeeERC20AmountRecipient: Optional<RailgunERC20AmountRecipient>,
  sendWithPublicWallet: boolean,
  overallBatchMinGasPrice: Optional<bigint>,
  gasDetails: TransactionGasDetails,
): Promise<{
  transaction: ContractTransaction;
  nullifiers: string[];
}> => {
  try {
    validateCachedProvedTransaction(
      networkName,
      proofType,
      railgunWalletID,
      showSenderAddressToRecipient,
      memoText,
      erc20AmountRecipients,
      nftAmountRecipients,
      relayAdaptUnshieldERC20Amounts,
      relayAdaptUnshieldNFTAmounts,
      relayAdaptShieldERC20Recipients,
      relayAdaptShieldNFTRecipients,
      crossContractCalls,
      relayerFeeERC20AmountRecipient,
      sendWithPublicWallet,
      overallBatchMinGasPrice,
    );
  } catch (err) {
    if (!(err instanceof Error)) {
      throw err;
    }
    throw new Error(`Invalid proof for this transaction. ${err.message}`);
  }

  const { transaction, nullifiers } = getCachedProvedTransaction();

  setGasDetailsForTransaction(
    networkName,
    transaction,
    gasDetails,
    sendWithPublicWallet,
  );

  return { transaction, nullifiers };
};

export const setCachedProvedTransaction = (tx?: ProvedTransaction) => {
  if (isDefined(tx?.transaction?.from)) {
    throw new Error(`Cannot cache a transaction with a 'from' address.`);
  }
  cachedProvedTransaction = tx;
};

export const getCachedProvedTransaction = (): ProvedTransaction => {
  return cachedProvedTransaction as ProvedTransaction;
};

const shouldValidateERC20AmountRecipients = (proofType: ProofType) => {
  switch (proofType) {
    case ProofType.CrossContractCalls:
      // Skip validation for erc20AmountRecipients, which is not used
      // in this transaction type.
      return false;
    case ProofType.Transfer:
    case ProofType.Unshield:
    case ProofType.UnshieldBaseToken:
      return true;
  }
};

const shouldValidateRelayAdaptAmounts = (proofType: ProofType) => {
  switch (proofType) {
    case ProofType.CrossContractCalls:
    case ProofType.UnshieldBaseToken:
      // Only validate for Cross Contract and Unshield Base Token proofs.
      return true;
    case ProofType.Transfer:
    case ProofType.Unshield:
      return false;
  }
};

const shouldValidateCrossContractCalls = (proofType: ProofType) => {
  switch (proofType) {
    case ProofType.CrossContractCalls:
      // Only validate for Cross Contract proofs.
      return true;
    case ProofType.Transfer:
    case ProofType.Unshield:
    case ProofType.UnshieldBaseToken:
      return false;
  }
};

export const validateCachedProvedTransaction = (
  networkName: NetworkName,
  proofType: ProofType,
  railgunWalletID: string,
  showSenderAddressToRecipient: boolean,
  memoText: Optional<string>,
  erc20AmountRecipients: RailgunERC20AmountRecipient[],
  nftAmountRecipients: RailgunNFTAmountRecipient[],
  relayAdaptUnshieldERC20Amounts: Optional<RailgunERC20Amount[]>,
  relayAdaptUnshieldNFTAmounts: Optional<RailgunNFTAmount[]>,
  relayAdaptShieldERC20Recipients: Optional<RailgunERC20Recipient[]>,
  relayAdaptShieldNFTRecipients: Optional<RailgunNFTAmount[]>,
  crossContractCalls: Optional<ContractTransaction[]>,
  relayerFeeERC20AmountRecipient: Optional<RailgunERC20AmountRecipient>,
  sendWithPublicWallet: boolean,
  overallBatchMinGasPrice: Optional<bigint>,
): void => {
  if (!cachedProvedTransaction) {
    throw new Error('No proof found.');
  } else if (cachedProvedTransaction.proofType !== proofType) {
    throw new Error('Mismatch: proofType.');
  } else if (cachedProvedTransaction.railgunWalletID !== railgunWalletID) {
    throw new Error('Mismatch: railgunWalletID.');
  } else if (
    proofType === ProofType.Transfer &&
    cachedProvedTransaction.showSenderAddressToRecipient !==
      showSenderAddressToRecipient
  ) {
    throw new Error('Mismatch: showSenderAddressToRecipient.');
  } else if (
    proofType === ProofType.Transfer &&
    cachedProvedTransaction.memoText !== memoText
  ) {
    throw new Error('Mismatch: memoText.');
  } else if (
    shouldValidateERC20AmountRecipients(proofType) &&
    !compareERC20AmountRecipientArrays(
      erc20AmountRecipients,
      cachedProvedTransaction.erc20AmountRecipients,
    )
  ) {
    throw new Error('Mismatch: erc20AmountRecipients.');
  } else if (
    !compareNFTAmountRecipientArrays(
      nftAmountRecipients,
      cachedProvedTransaction.nftAmountRecipients,
    )
  ) {
    throw new Error('Mismatch: nftAmountRecipients.');
  } else if (
    shouldValidateRelayAdaptAmounts(proofType) &&
    !compareERC20AmountArrays(
      relayAdaptUnshieldERC20Amounts,
      cachedProvedTransaction.relayAdaptUnshieldERC20Amounts,
    )
  ) {
    throw new Error('Mismatch: relayAdaptUnshieldERC20Amounts.');
  } else if (
    shouldValidateRelayAdaptAmounts(proofType) &&
    !compareNFTAmountArrays(
      relayAdaptUnshieldNFTAmounts,
      cachedProvedTransaction.relayAdaptUnshieldNFTAmounts,
    )
  ) {
    throw new Error('Mismatch: relayAdaptUnshieldNFTAmounts.');
  } else if (
    shouldValidateRelayAdaptAmounts(proofType) &&
    !compareERC20RecipientArrays(
      relayAdaptShieldERC20Recipients,
      cachedProvedTransaction.relayAdaptShieldERC20Recipients,
    )
  ) {
    throw new Error('Mismatch: relayAdaptShieldERC20Recipients.');
  } else if (
    shouldValidateRelayAdaptAmounts(proofType) &&
    !compareNFTAmountArrays(
      relayAdaptShieldNFTRecipients,
      cachedProvedTransaction.relayAdaptShieldNFTRecipients,
    )
  ) {
    throw new Error('Mismatch: relayAdaptShieldNFTRecipients.');
  } else if (
    shouldValidateCrossContractCalls(proofType) &&
    !compareContractTransactionArrays(
      crossContractCalls,
      cachedProvedTransaction.crossContractCalls,
    )
  ) {
    throw new Error('Mismatch: crossContractCalls.');
  } else if (
    !compareERC20AmountRecipients(
      cachedProvedTransaction.relayerFeeERC20AmountRecipient,
      relayerFeeERC20AmountRecipient,
    )
  ) {
    throw new Error('Mismatch: relayerFeeERC20AmountRecipient.');
  } else if (
    sendWithPublicWallet !== cachedProvedTransaction.sendWithPublicWallet
  ) {
    throw new Error('Mismatch: sendWithPublicWallet.');
  } else if (
    shouldSetOverallBatchMinGasPriceForNetwork(networkName) &&
    overallBatchMinGasPrice !== cachedProvedTransaction.overallBatchMinGasPrice
  ) {
    throw new Error('Mismatch: overallBatchMinGasPrice.');
  }
};
