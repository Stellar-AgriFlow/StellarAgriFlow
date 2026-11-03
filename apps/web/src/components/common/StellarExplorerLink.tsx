'use client';

import React, { useState } from 'react';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { StellarExpertHelper, StellarNetworkName } from '../../services/stellarExpert';

interface StellarExplorerLinkProps {
  type: 'contract' | 'account' | 'tx' | 'ledger';
  value: string;
  network?: StellarNetworkName;
  showCopy?: boolean;
}

export const StellarExplorerLink: React.FC<StellarExplorerLinkProps> = ({
  type,
  value,
  network = 'testnet',
  showCopy = true,
}) => {
  const [copied, setCopied] = useState(false);
  const helper = new StellarExpertHelper(network);

  const getUrl = () => {
    switch (type) {
      case 'contract':
        return helper.getContractUrl(value);
      case 'account':
        return helper.getAccountUrl(value);
      case 'tx':
        return helper.getTransactionUrl(value);
      case 'ledger':
        return helper.getLedgerUrl(Number(value));
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncated = StellarExpertHelper.formatTruncated(value);

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs">
      <a
        href={getUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="text-emerald-400 hover:text-emerald-300 underline decoration-emerald-500/40 underline-offset-2 flex items-center gap-1 transition-colors"
      >
        <span>{truncated}</span>
        <ExternalLink className="w-3 h-3" />
      </a>

      {showCopy && (
        <button
          onClick={handleCopy}
          className="text-slate-400 hover:text-white transition-colors"
          title="Copy full address"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        </button>
      )}
    </span>
  );
};
