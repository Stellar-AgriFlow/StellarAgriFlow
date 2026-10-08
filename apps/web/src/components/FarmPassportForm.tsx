'use client';

import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import {
  ContractInvocationStatus,
  RegisterFarmParams,
  FarmPassport,
} from '@agriflow/types';
import { defaultFarmRegistryClient } from '@agriflow/contracts-client';
import { Card, Button, Input, Badge } from '@agriflow/ui';
import {
  FileBadge2,
  Wheat,
  MapPin,
  Scale,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Info,
} from 'lucide-react';
import { getTxExplorerUrl } from '@agriflow/stellar';

export interface FarmPassportFormProps {
  onFarmRegistered?: (passport: FarmPassport) => void;
}

export const FarmPassportForm: React.FC<FarmPassportFormProps> = ({ onFarmRegistered }) => {
  const { state: walletState, signTransaction } = useWallet();

  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [crop, setCrop] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [expectedYield, setExpectedYield] = useState('');

  // Validation
  const [countryError, setCountryError] = useState<string | null>(null);
  const [regionError, setRegionError] = useState<string | null>(null);
  const [cropError, setCropError] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [yieldError, setYieldError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Lifecycle status
  const [status, setStatus] = useState<ContractInvocationStatus>('idle');
  const [registeredResult, setRegisteredResult] = useState<{
    farmId: string;
    txHash: string;
    explorerUrl: string;
  } | null>(null);

  const handleAutofillExample = () => {
    setCountry('Kenya');
    setRegion('Rift Valley');
    setCrop('Coffee (Arabica)');
    setFarmSize('50');
    setExpectedYield('120');
    setCountryError(null);
    setRegionError(null);
    setCropError(null);
    setSizeError(null);
    setYieldError(null);
    setGeneralError(null);
  };

  const validate = (): boolean => {
    let valid = true;
    setCountryError(null);
    setRegionError(null);
    setCropError(null);
    setSizeError(null);
    setYieldError(null);
    setGeneralError(null);

    if (!country.trim()) {
      setCountryError('Country is required.');
      valid = false;
    }
    if (!region.trim()) {
      setRegionError('Region/Province is required.');
      valid = false;
    }
    if (!crop.trim()) {
      setCropError('Primary crop type is required.');
      valid = false;
    }

    const numSize = Number(farmSize);
    if (!farmSize || isNaN(numSize) || numSize <= 0) {
      setSizeError('Farm size must be a positive number of hectares.');
      valid = false;
    }

    const numYield = Number(expectedYield);
    if (!expectedYield || isNaN(numYield) || numYield <= 0) {
      setYieldError('Expected yield must be a positive number of metric tons.');
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletState.account?.address) {
      setGeneralError('Please connect your wallet first.');
      return;
    }

    if (!validate()) return;

    const params: RegisterFarmParams = {
      owner: walletState.account.address,
      country: country.trim(),
      region: region.trim(),
      crop: crop.trim(),
      farmSizeHectares: Math.round(Number(farmSize)),
      expectedYieldTons: Math.round(Number(expectedYield)),
    };

    try {
      const res = await defaultFarmRegistryClient.registerFarm(
        params,
        signTransaction,
        (currentStatus) => {
          setStatus(currentStatus as ContractInvocationStatus);
        }
      );

      if (res.successful && res.farmId && res.txHash) {
        setStatus('confirmed');
        setRegisteredResult({
          farmId: res.farmId,
          txHash: res.txHash,
          explorerUrl: res.explorerUrl || getTxExplorerUrl(res.txHash),
        });

        const newPassport: FarmPassport = {
          farmId: res.farmId,
          owner: params.owner,
          country: params.country,
          region: params.region,
          crop: params.crop,
          farmSizeHectares: params.farmSizeHectares,
          expectedYieldTons: params.expectedYieldTons,
          registrationTimestamp: Math.floor(Date.now() / 1000),
          status: 'Active',
          txHash: res.txHash,
          explorerUrl: res.explorerUrl,
        };

        onFarmRegistered?.(newPassport);
      } else {
        setStatus('failed');
        setGeneralError(res.error || 'Contract execution failed on Stellar Testnet.');
      }
    } catch (err: any) {
      setStatus('failed');
      setGeneralError(err.message || 'Transaction error occurred.');
    }
  };

  const isBusy =
    status === 'preparing' ||
    status === 'simulating' ||
    status === 'awaiting_signature' ||
    status === 'submitting' ||
    status === 'pending';

  return (
    <Card className="p-6 md:p-8 bg-slate-900/90 border-slate-800 shadow-2xl relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Create Farm Passport
            </h2>
            <Badge variant="emerald" size="sm">
              Soroban On-Chain
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Register verifiable agricultural identity on the FarmRegistry smart contract
          </p>
        </div>

        <button
          type="button"
          onClick={handleAutofillExample}
          disabled={isBusy}
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 underline"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Fill Sample Agricultural Data
        </button>
      </div>

      {/* General Error Banner */}
      {generalError && (
        <div className="mt-6 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 flex items-start gap-3 text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <strong className="text-red-300">Contract Notice: </strong>
            {generalError}
          </div>
        </div>
      )}

      {/* Confirmed Success Card */}
      {registeredResult && (
        <div className="mt-6 p-5 rounded-2xl bg-emerald-950/50 border border-emerald-600/50 space-y-3">
          <div className="flex items-center gap-2 text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h4 className="text-sm font-bold">Farm Passport Registered On-Chain!</h4>
          </div>
          <p className="text-xs text-slate-300">
            Assigned Farm Identifier:{' '}
            <strong className="text-emerald-200 font-mono text-sm px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-700/60 ml-1">
              {registeredResult.farmId}
            </strong>
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <a
              href={registeredResult.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline"
            >
              <span>View Contract Transaction on Stellar.Expert</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="farm-country-input"
            label="Country"
            placeholder="e.g. Kenya, Ghana, Brazil"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            disabled={isBusy}
            error={countryError || undefined}
          />
          <Input
            id="farm-region-input"
            label="Region / State / Province"
            placeholder="e.g. Rift Valley, Ashanti"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            disabled={isBusy}
            error={regionError || undefined}
          />
        </div>

        <Input
          id="farm-crop-input"
          label="Primary Agricultural Crop"
          placeholder="e.g. Coffee (Arabica), Cocoa, Maize, Soybeans"
          value={crop}
          onChange={(e) => setCrop(e.target.value)}
          disabled={isBusy}
          error={cropError || undefined}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="farm-size-input"
            label="Farm Size (Hectares)"
            type="number"
            min="1"
            placeholder="e.g. 50"
            value={farmSize}
            onChange={(e) => setFarmSize(e.target.value)}
            disabled={isBusy}
            error={sizeError || undefined}
            rightAddon={<span className="text-xs text-slate-400 font-bold pr-2">HA</span>}
          />
          <Input
            id="farm-yield-input"
            label="Expected Yield (Metric Tons)"
            type="number"
            min="1"
            placeholder="e.g. 120"
            value={expectedYield}
            onChange={(e) => setExpectedYield(e.target.value)}
            disabled={isBusy}
            error={yieldError || undefined}
            rightAddon={<span className="text-xs text-slate-400 font-bold pr-2">TONS</span>}
          />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5 text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Info className="w-3.5 h-3.5 text-emerald-400" />
            <span>Soroban Smart Contract Verification:</span>
          </div>
          <p>
            The registration invokes the <code className="text-emerald-400 font-mono text-[11px]">FarmRegistry</code> smart contract on Stellar Testnet, storing metrics on-chain and emitting a real <code className="text-amber-400 font-mono text-[11px]">FarmRegistered</code> blockchain event.
          </p>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            size="lg"
            variant="primary"
            isLoading={isBusy}
            disabled={isBusy}
            className="w-full text-base font-semibold shadow-xl shadow-emerald-950/50"
          >
            <FileBadge2 className="w-5 h-5 mr-2" />
            {status === 'preparing' && 'Preparing Contract Call...'}
            {status === 'simulating' && 'Simulating Soroban Footprint...'}
            {status === 'awaiting_signature' && 'Awaiting Wallet Approval...'}
            {status === 'submitting' && 'Submitting to Stellar Testnet...'}
            {status === 'pending' && 'Confirming on Ledger...'}
            {status === 'idle' && 'Register Farm Passport on Soroban'}
            {status === 'failed' && 'Retry Registration'}
            {status === 'confirmed' && 'Register Another Farm'}
          </Button>
        </div>
      </form>
    </Card>
  );
};
