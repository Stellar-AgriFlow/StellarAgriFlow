'use client';

import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { useAccountBalance } from '../hooks/useAccountBalance';
import {
  AgriculturalPaymentPurpose,
  PaymentFormData,
  TransactionLifecycleStatus,
  PaymentReceipt,
} from '@agriflow/types';
import {
  validateStellarAddress,
  validatePaymentAmount,
  validateMemo,
  buildPaymentTransactionXdr,
  submitSignedTransaction,
  parseStellarError,
  STELLAR_TESTNET_CONFIG,
} from '@agriflow/stellar';
import { Card, Button, Input, StatusPill } from '@agriflow/ui';
import {
  Send,
  Wheat,
  Sprout,
  ShoppingBag,
  Truck,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Info,
} from 'lucide-react';
import { TransactionReceiptModal } from './TransactionReceiptModal';

const PURPOSES: { value: AgriculturalPaymentPurpose; label: string; icon: React.FC<{ className?: string }> }[] = [
  { value: 'Farm Input', label: 'Farm Input (Seeds, Fertilizer)', icon: Sprout },
  { value: 'Farmer Payment', label: 'Farmer Direct Payment', icon: Wheat },
  { value: 'Produce Purchase', label: 'Produce Purchase', icon: ShoppingBag },
  { value: 'Logistics', label: 'Agricultural Logistics', icon: Truck },
  { value: 'Other', label: 'Other Settlement', icon: HelpCircle },
];

export const PaymentForm: React.FC = () => {
  const { state: walletState, signTransaction } = useWallet();
  const { balance, refresh: refreshBalance } = useAccountBalance(walletState.account?.address);

  // Form states
  const [recipient, setRecipient] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [purpose, setPurpose] = useState<AgriculturalPaymentPurpose>('Farm Input');
  const [memo, setMemo] = useState<string>('');

  // Validation errors
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [memoError, setMemoError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Lifecycle status
  const [status, setStatus] = useState<TransactionLifecycleStatus>('idle');
  const [completedReceipt, setCompletedReceipt] = useState<PaymentReceipt | null>(null);

  // Quick recipient fill for convenience in testing
  const handleUseDemoRecipient = () => {
    // Known Stellar official public testnet test address
    setRecipient('GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN');
    setRecipientError(null);
  };

  const handleMaxAmount = () => {
    if (balance?.availableXlm) {
      setAmount(balance.availableXlm);
      setAmountError(null);
    }
  };

  const handleValidate = (): boolean => {
    setRecipientError(null);
    setAmountError(null);
    setMemoError(null);
    setGeneralError(null);

    const addrRes = validateStellarAddress(recipient);
    if (!addrRes.isValid) {
      setRecipientError(addrRes.error || 'Invalid Stellar address');
      return false;
    }

    const amtRes = validatePaymentAmount(amount, balance?.availableXlm);
    if (!amtRes.isValid) {
      setAmountError(amtRes.error || 'Invalid amount');
      return false;
    }

    const memoRes = validateMemo(memo);
    if (!memoRes.isValid) {
      setMemoError(memoRes.error || 'Invalid memo');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletState.account?.address) {
      setGeneralError('Please connect your Freighter wallet first.');
      return;
    }

    const isValid = handleValidate();
    if (!isValid) return;

    const paymentData: PaymentFormData = {
      recipientAddress: recipient.trim(),
      amount: amount.trim(),
      purpose,
      memo: memo.trim() || undefined,
    };

    try {
      // Step 1: Building Transaction XDR
      setStatus('preparing');
      const unsignedXdr = await buildPaymentTransactionXdr({
        senderPublicKey: walletState.account.address,
        paymentData,
      });

      // Step 2: Prompting wallet for signature
      setStatus('awaiting_approval');
      const signedXdr = await signTransaction(unsignedXdr, {
        networkPassphrase: STELLAR_TESTNET_CONFIG.networkPassphrase,
      });

      // Step 3: Submitting to Stellar Testnet Horizon
      setStatus('submitting');
      const result = await submitSignedTransaction(
        signedXdr,
        paymentData,
        walletState.account.address
      );

      if (result.successful && result.receipt) {
        setStatus('success');
        setCompletedReceipt(result.receipt);
        // Refresh balance after successful confirmation
        setTimeout(() => {
          refreshBalance();
        }, 1200);
      } else {
        setStatus('failed');
        setGeneralError(result.error || 'Transaction submission failed on Stellar Testnet.');
      }
    } catch (err: any) {
      setStatus('failed');
      const msg = parseStellarError(err);
      setGeneralError(msg);
    }
  };

  const resetForm = () => {
    setRecipient('');
    setAmount('');
    setMemo('');
    setStatus('idle');
    setGeneralError(null);
    setRecipientError(null);
    setAmountError(null);
  };

  const isBusy =
    status === 'validating' ||
    status === 'preparing' ||
    status === 'awaiting_approval' ||
    status === 'submitting' ||
    status === 'pending';

  return (
    <>
      <Card className="p-6 md:p-8 bg-slate-900/90 border-slate-800 shadow-2xl relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Send Agricultural Payment
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Direct non-custodial XLM settlement on Stellar Testnet
            </p>
          </div>

          <StatusPill status={status} />
        </div>

        {/* General Error Banner */}
        {generalError && (
          <div className="mt-6 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-xs">
              <span className="font-semibold text-red-300">Transaction Notice: </span>
              {generalError}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Recipient Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Recipient Stellar Address
              </label>
              <button
                type="button"
                onClick={handleUseDemoRecipient}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-medium"
              >
                Use Demo Testnet Address
              </button>
            </div>
            <Input
              id="recipient-address-input"
              value={recipient}
              onChange={(e) => {
                setRecipient(e.target.value);
                if (recipientError) setRecipientError(null);
              }}
              placeholder="G..."
              disabled={isBusy}
              error={recipientError || undefined}
              className="font-mono text-xs sm:text-sm"
              helperText="Must be a valid 56-character Stellar public key starting with 'G'"
            />
          </div>

          {/* Amount Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Amount in XLM
              </label>
              {balance && (
                <button
                  type="button"
                  onClick={handleMaxAmount}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Max: <span className="font-mono">{balance.availableXlm} XLM</span>
                </button>
              )}
            </div>
            <Input
              id="amount-xlm-input"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (amountError) setAmountError(null);
              }}
              placeholder="0.00"
              disabled={isBusy}
              error={amountError || undefined}
              rightAddon={<span className="text-xs font-bold text-slate-400 pr-2">XLM</span>}
              helperText="Minimum transaction fee is ~0.00001 XLM (100 stroops)"
            />
          </div>

          {/* Payment Purpose Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Agricultural Payment Purpose
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {PURPOSES.map((item) => {
                const Icon = item.icon;
                const isSelected = purpose === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    disabled={isBusy}
                    onClick={() => setPurpose(item.value)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              Purpose is included in the Stellar transaction memo metadata (`AGRI:{purpose}`)
            </p>
          </div>

          {/* Memo / Invoice Reference (Optional) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Custom Reference / Invoice Memo (Optional)
            </label>
            <Input
              id="memo-input"
              value={memo}
              onChange={(e) => {
                setMemo(e.target.value);
                if (memoError) setMemoError(null);
              }}
              placeholder="e.g. INVOICE-4981"
              maxLength={28}
              disabled={isBusy}
              error={memoError || undefined}
              helperText="Max 28 bytes UTF-8 text memo"
            />
          </div>

          {/* Summary / Confirmation Box */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Network:</span>
              <span className="text-slate-200 font-medium">Stellar Testnet</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Network Fee:</span>
              <span className="text-slate-200 font-mono">0.00001 XLM (100 stroops)</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Finality:</span>
              <span className="text-emerald-400 font-medium">~4 Seconds (Immediate)</span>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <Button
              type="submit"
              size="lg"
              variant="primary"
              isLoading={isBusy}
              disabled={isBusy}
              className="w-full text-base font-semibold shadow-xl shadow-emerald-950/50"
            >
              <Send className="w-4 h-4 mr-2" />
              {status === 'preparing' && 'Building Transaction...'}
              {status === 'awaiting_approval' && 'Waiting for Freighter Approval...'}
              {status === 'submitting' && 'Submitting to Testnet...'}
              {status === 'idle' && 'Confirm & Send Payment'}
              {status === 'failed' && 'Retry Payment'}
              {status === 'success' && 'Send Another Payment'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Transaction Receipt Modal */}
      {completedReceipt && (
        <TransactionReceiptModal
          receipt={completedReceipt}
          isOpen={status === 'success'}
          onClose={() => {
            setStatus('idle');
            setCompletedReceipt(null);
            resetForm();
          }}
        />
      )}
    </>
  );
};
