import { describe, it, expect } from 'vitest';
import { shortenAddress, getTxExplorerUrl, getAccountExplorerUrl } from '../packages/stellar/src/explorer';

describe('Stellar Explorer & Address Formatting', () => {
  const testAddress = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
  const testHash = '3389e9f0f1a65f19736cacf544c2e825313e8447f569233bb8db39aa607c8889';

  it('shortens address correctly with prefix and suffix', () => {
    const short = shortenAddress(testAddress, 4);
    expect(short).toBe('GA5ZS...KZVN');
  });

  it('handles empty or short strings gracefully', () => {
    expect(shortenAddress('')).toBe('');
    expect(shortenAddress('ABC')).toBe('ABC');
  });

  it('generates correct Stellar Testnet transaction explorer URL', () => {
    const url = getTxExplorerUrl(testHash);
    expect(url).toBe(`https://stellar.expert/explorer/testnet/tx/${testHash}`);
  });

  it('generates correct Stellar Testnet account explorer URL', () => {
    const url = getAccountExplorerUrl(testAddress);
    expect(url).toBe(`https://stellar.expert/explorer/testnet/account/${testAddress}`);
  });
});
