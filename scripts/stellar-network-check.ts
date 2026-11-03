/**
 * Stellar & Soroban Testnet Health Diagnostic Script
 */
import { Horizon, rpc } from '@stellar/stellar-sdk';
import { STELLAR_TESTNET_CONFIG } from '../packages/stellar/src/config';

export async function checkStellarNetworkHealth(): Promise<{
  horizonAlive: boolean;
  latestLedger: number;
  rpcAlive: boolean;
  networkPassphrase: string;
}> {
  const horizon = new Horizon.Server(STELLAR_TESTNET_CONFIG.horizonUrl);
  const sorobanRpc = new rpc.Server(STELLAR_TESTNET_CONFIG.rpcUrl);

  let horizonAlive = false;
  let latestLedger = 0;
  let rpcAlive = false;

  try {
    const horizonRoot = await horizon.root();
    horizonAlive = Boolean(horizonRoot.horizon_version);
    latestLedger = horizonRoot.core_latest_ledger || 0;
  } catch (err) {
    console.warn('Horizon ping failed:', err);
  }

  try {
    const health = await sorobanRpc.getHealth();
    rpcAlive = health.status === 'healthy';
  } catch (err) {
    console.warn('Soroban RPC ping failed:', err);
  }

  return {
    horizonAlive,
    latestLedger,
    rpcAlive,
    networkPassphrase: STELLAR_TESTNET_CONFIG.networkPassphrase,
  };
}

if (require.main === module) {
  checkStellarNetworkHealth().then((res) => {
    console.log('Stellar Network Diagnostics:');
    console.log(JSON.stringify(res, null, 2));
  });
}
