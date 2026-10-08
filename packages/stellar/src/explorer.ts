import { STELLAR_TESTNET_CONFIG } from './config';

export function getTxExplorerUrl(hash: string, baseUrl: string = STELLAR_TESTNET_CONFIG.explorerUrl): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return `${cleanBase}/tx/${encodeURIComponent(hash)}`;
}

export function getAccountExplorerUrl(address: string, baseUrl: string = STELLAR_TESTNET_CONFIG.explorerUrl): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return `${cleanBase}/account/${encodeURIComponent(address)}`;
}

export function getContractExplorerUrl(contractId: string, baseUrl: string = STELLAR_TESTNET_CONFIG.explorerUrl): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return `${cleanBase}/contract/${encodeURIComponent(contractId)}`;
}

export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars + 1)}...${address.slice(-chars)}`;
}
