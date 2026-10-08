'use client';

import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { defaultEscrowClient } from '@agriflow/contracts-client';
import { EscrowRecord, ContractInvocationStatus } from '@agriflow/types';
import { Card, Button, Badge, StatusPill } from '@agriflow/ui';
import {
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  AlertTriangle,
  Lock,
  Unlock,
  Coins,
} from 'lucide-react';
import { getTxExplorerUrl, shortenAddress } from '@agriflow/stellar';

export function EscrowSection() {
  const { state: walletState, signTransaction } = useWallet();
  const isConnected = walletState.status === 'connected' && Boolean(walletState.account);

  const [txStatus, setTxStatus] = useState<ContractInvocationStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [escrows, setEscrows] = useState<EscrowRecord[]>([
    {
      escrowId: 301,
      buyer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
      seller: 'GBPHHDV6RE3XHUUUR2K3RNV2C5WLDNNMZC5VFV4DWAMLU5TH27PF55XU',
      listingId: 203,
      amount: '20000000000',
      amountXlm: 2000,
      asset: 'XLM',
      status: 'Funded',
      createdAt: Date.now() - 86400000 * 2,
      fundedAt: Date.now() - 86400000,
    },
    {
      escrowId: 302,
      buyer: walletState.account?.address || 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
      seller: 'GBPHHDV6RE3XHUUUR2K3RNV2C5WLDNNMZC5VFV4DWAMLU5TH27PF55XU',
      listingId: 201,
      amount: '9000000000',
      amountXlm: 900,
      asset: 'XLM',
      status: 'Funded',
      createdAt: Date.now() - 3600000 * 4,
      fundedAt: Date.now() - 3600000 * 3,
    },
    {
      escrowId: 303,
      buyer: 'GBPHHDV6RE3XHUUUR2K3RNV2C5WLDNNMZC5VFV4DWAMLU5TH27PF55XU',
      seller: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
      listingId: 199,
      amount: '15000000000',
      amountXlm: 1500,
      asset: 'XLM',
      status: 'Released',
      createdAt: Date.now() - 86400000 * 7,
      fundedAt: Date.now() - 86400000 * 6,
      releasedAt: Date.now() - 86400000 * 4,
    },
  ]);

  const handleRelease = async (escrow: EscrowRecord) => {
    if (!walletState.account) return;
    setErrorMessage(null);
    setTxStatus('preparing');

    try {
      const result = await defaultEscrowClient.releaseFunds(
        {
          escrowId: escrow.escrowId,
          buyer: walletState.account.address,
        },
        signTransaction,
        (s) => setTxStatus(s as ContractInvocationStatus)
      );

      if (result.successful && result.txHash) {
        setTxHash(result.txHash);
        setTxStatus('confirmed');
        setEscrows((prev) =>
          prev.map((e) =>
            e.escrowId === escrow.escrowId
              ? { ...e, status: 'Released', releasedAt: Date.now() }
              : e
          )
        );
      } else {
        setErrorMessage(result.error || 'Failed to release escrow');
        setTxStatus('failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Transaction rejected');
      setTxStatus('failed');
    }
  };

  const handleRefund = async (escrow: EscrowRecord) => {
    if (!walletState.account) return;
    setErrorMessage(null);
    setTxStatus('preparing');

    try {
      const result = await defaultEscrowClient.refundEscrow(
        {
          escrowId: escrow.escrowId,
          caller: walletState.account.address,
        },
        signTransaction,
        (s) => setTxStatus(s as ContractInvocationStatus)
      );

      if (result.successful && result.txHash) {
        setTxHash(result.txHash);
        setTxStatus('confirmed');
        setEscrows((prev) =>
          prev.map((e) =>
            e.escrowId === escrow.escrowId
              ? { ...e, status: 'Refunded', refundedAt: Date.now() }
              : e
          )
        );
      } else {
        setErrorMessage(result.error || 'Failed to refund escrow');
        setTxStatus('failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Transaction rejected');
      setTxStatus('failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Agricultural Escrow Terminal
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Non-custodial conditional payment settlement. Funds are locked on Soroban until produce inspection and delivery approval.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="emerald" size="sm">
            Active Escrows: {escrows.filter((e) => e.status === 'Funded').length}
          </Badge>
          <Badge variant="neutral" size="sm">
            Settled: {escrows.filter((e) => e.status === 'Released').length}
          </Badge>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-lg flex items-center gap-2 text-xs text-red-300">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {txStatus !== 'idle' && (
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Escrow Transaction Lifecycle:</span>
          <StatusPill status={txStatus} />
        </div>
      )}

      {txHash && (
        <a
          href={getTxExplorerUrl(txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
        >
          <span>View Escrow Settlement on Stellar.Expert</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}

      <div className="space-y-4">
        {escrows.map((escrow) => {
          const isBuyer = walletState.account?.address === escrow.buyer;
          const isSeller = walletState.account?.address === escrow.seller;

          return (
            <Card
              key={escrow.escrowId}
              className="p-5 bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    Escrow Contract #{escrow.escrowId}
                  </span>
                  <Badge variant="neutral" size="sm">
                    Listing #{escrow.listingId}
                  </Badge>
                </div>

                <Badge
                  variant={
                    escrow.status === 'Released'
                      ? 'emerald'
                      : escrow.status === 'Funded'
                      ? 'warning'
                      : 'neutral'
                  }
                  size="sm"
                >
                  {escrow.status === 'Funded' ? (
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked on Ledger
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Unlock className="w-3 h-3" /> {escrow.status}
                    </span>
                  )}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Amount Locked</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {escrow.amountXlm.toLocaleString()} {escrow.asset}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Buyer</span>
                  <span className="text-slate-300 font-mono text-[11px]">
                    {shortenAddress(escrow.buyer, 4)}
                    {isBuyer && ' (You)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Seller</span>
                  <span className="text-slate-300 font-mono text-[11px]">
                    {shortenAddress(escrow.seller, 4)}
                    {isSeller && ' (You)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Created</span>
                  <span className="text-slate-300 text-[11px]">
                    {new Date(escrow.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/40 flex items-center justify-between">
                <p className="text-[11px] text-slate-400">
                  {escrow.status === 'Funded'
                    ? 'Funds locked in Soroban contract. Buyer must confirm delivery to release funds.'
                    : escrow.status === 'Released'
                    ? 'Payment disbursed to seller. Agricultural reputation awarded on-chain.'
                    : 'Escrow refunded to buyer.'}
                </p>

                <div className="flex items-center gap-2">
                  {escrow.status === 'Funded' && (
                    <>
                      {/* Authorized: only Buyer can release */}
                      {isBuyer ? (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleRelease(escrow)}
                          className="text-xs flex items-center gap-1"
                          isLoading={['preparing', 'simulating', 'awaiting_signature', 'submitting', 'pending'].includes(txStatus)}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Confirm Delivery & Release Funds
                        </Button>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">
                          Awaiting buyer delivery approval
                        </span>
                      )}

                      {/* Authorized: only Seller can voluntarily refund */}
                      {isSeller && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRefund(escrow)}
                          className="text-xs text-red-400 border-red-800"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Issue Refund
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
