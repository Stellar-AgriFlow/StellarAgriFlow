import { describe, it, expect } from 'vitest';
import { StellarExpertHelper } from '../apps/web/src/services/stellarExpert';

describe('Frontend UI Formatting and Helper Logic', () => {
  it('truncates long public keys and hashes cleanly for UI badges', () => {
    const key = 'GDQWAAAHHJJJKKLLMMNNPPOOQQRRSSTTUUVVWWXXYYZZ112233445566';
    const truncated = StellarExpertHelper.formatTruncated(key, 6, 4);

    expect(truncated).toBe('GDQWAA...5566');
    expect(truncated.length).toBe(13);
  });

  it('preserves short strings without truncation', () => {
    expect(StellarExpertHelper.formatTruncated('short')).toBe('short');
  });

  it('builds valid StellarExpert testnet explorer URLs', () => {
    const helper = new StellarExpertHelper('testnet');
    const contractId = 'CBLQUEAJAI6PYQDEWQR2ICR2FPPP6KQN5ZEGPT4FD7MXCGBJZTOO2CDZ';
    const txHash = 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0';

    expect(helper.getContractUrl(contractId)).toBe(
      `https://stellar.expert/explorer/testnet/contract/${contractId}`
    );
    expect(helper.getTransactionUrl(txHash)).toBe(
      `https://stellar.expert/explorer/testnet/tx/${txHash}`
    );
    expect(helper.getLedgerUrl(12345)).toBe(
      'https://stellar.expert/explorer/testnet/ledger/12345'
    );
  });

  it('switches properly between testnet and public network explorer endpoints', () => {
    const publicHelper = new StellarExpertHelper('public');
    expect(publicHelper.getAccountUrl('GBXYZ')).toBe(
      'https://stellar.expert/explorer/public/account/GBXYZ'
    );
  });
});
