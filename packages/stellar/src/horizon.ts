import { Horizon } from '@stellar/stellar-sdk';
import { AccountBalance } from '@agriflow/types';
import { STELLAR_TESTNET_CONFIG, STELLAR_BASE_RESERVE_XLM } from './config';

let serverInstance: Horizon.Server | null = null;

export function getHorizonServer(horizonUrl: string = STELLAR_TESTNET_CONFIG.horizonUrl): Horizon.Server {
  if (!serverInstance) {
    serverInstance = new Horizon.Server(horizonUrl);
  }
  return serverInstance;
}

export async function fetchAccountBalance(
  publicKey: string,
  horizonUrl: string = STELLAR_TESTNET_CONFIG.horizonUrl
): Promise<AccountBalance> {
  const server = getHorizonServer(horizonUrl);

  try {
    const account = await server.loadAccount(publicKey);
    const nativeBalanceObj = account.balances.find((b) => b.asset_type === 'native');
    const totalXlm = nativeBalanceObj ? parseFloat(nativeBalanceObj.balance) : 0;
    const subentryCount = account.subentry_count || 0;

    // Minimum reserve = (2 + subentries) * baseReserve (0.5 XLM)
    const requiredReserve = (2 + subentryCount) * STELLAR_BASE_RESERVE_XLM;
    const feeBuffer = 0.0001; // 100 stroops fee buffer
    const available = Math.max(0, totalXlm - requiredReserve - feeBuffer);

    return {
      totalXlm: totalXlm.toFixed(4),
      availableXlm: available.toFixed(4),
      baseReserve: requiredReserve.toFixed(2),
      subentryCount,
      isFunded: true,
      lastUpdated: Date.now(),
    };
  } catch (err: any) {
    // 404 indicates an unfunded account on testnet
    if (err?.response?.status === 404 || err?.name === 'NotFoundError') {
      return {
        totalXlm: '0.0000',
        availableXlm: '0.0000',
        baseReserve: '1.00',
        subentryCount: 0,
        isFunded: false,
        lastUpdated: Date.now(),
      };
    }
    throw err;
  }
}

export async function fundWithFriendbot(publicKey: string): Promise<boolean> {
  try {
    const res = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`);
    return res.ok;
  } catch {
    return false;
  }
}
