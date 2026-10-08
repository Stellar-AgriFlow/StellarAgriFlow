'use client';

import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { defaultMarketplaceClient } from '@agriflow/contracts-client';
import {
  ProduceListing,
  CreateListingParams,
  FarmPassport,
  ContractInvocationStatus,
} from '@agriflow/types';
import { Card, Button, Badge, StatusPill } from '@agriflow/ui';
import {
  ShoppingBag,
  PlusCircle,
  Tag,
  MapPin,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Sparkles,
} from 'lucide-react';
import { getTxExplorerUrl, shortenAddress } from '@agriflow/stellar';

interface MarketplaceSectionProps {
  passports: FarmPassport[];
  onEscrowCreated?: (escrowId: number) => void;
}

export function MarketplaceSection({ passports, onEscrowCreated }: MarketplaceSectionProps) {
  const { state: walletState, signTransaction } = useWallet();
  const isConnected = walletState.status === 'connected' && Boolean(walletState.account);

  const [activeTab, setActiveTab] = useState<'browse' | 'create'>('browse');
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('All');

  // Create form state
  const [selectedFarmId, setSelectedFarmId] = useState(passports[0]?.farmId || 'AGRI-000001');
  const [cropType, setCropType] = useState('Premium Yellow Maize');
  const [quantity, setQuantity] = useState('50');
  const [unit, setUnit] = useState('Bags (50kg)');
  const [pricePerUnit, setPricePerUnit] = useState('20');
  const [location, setLocation] = useState('Nakuru Regional Hub, Kenya');

  // Invocation state
  const [txStatus, setTxStatus] = useState<ContractInvocationStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdEscrowNotice, setCreatedEscrowNotice] = useState<number | null>(null);

  // Listings sample state
  const [listings, setListings] = useState<ProduceListing[]>([
    {
      listingId: 201,
      seller: 'GBPHHDV6RE3XHUUUR2K3RNV2C5WLDNNMZC5VFV4DWAMLU5TH27PF55XU',
      farmId: 'AGRI-000001',
      cropType: 'Organic White Maize',
      quantity: 100,
      unit: 'Metric Bags (50kg)',
      pricePerUnitXlm: 18,
      totalPriceXlm: 1800,
      location: 'Rift Valley, Kenya',
      status: 'Active',
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      listingId: 202,
      seller: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
      farmId: 'AGRI-000002',
      cropType: 'Export-Grade Soybeans',
      quantity: 40,
      unit: 'Tons',
      pricePerUnitXlm: 45,
      totalPriceXlm: 1800,
      location: 'Kaduna Central Silo, Nigeria',
      status: 'Active',
      createdAt: Date.now() - 86400000 * 4,
    },
    {
      listingId: 203,
      seller: 'GBPHHDV6RE3XHUUUR2K3RNV2C5WLDNNMZC5VFV4DWAMLU5TH27PF55XU',
      farmId: 'AGRI-000001',
      cropType: 'Specialty Arabica Coffee Beans',
      quantity: 25,
      unit: 'Burlap Bags (60kg)',
      pricePerUnitXlm: 80,
      totalPriceXlm: 2000,
      location: 'Mount Kenya Cooperative',
      status: 'Sold',
      escrowId: 301,
      createdAt: Date.now() - 86400000 * 5,
      soldAt: Date.now() - 86400000,
    },
  ]);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !walletState.account) {
      setErrorMessage('Please connect your wallet.');
      return;
    }

    setErrorMessage(null);
    setTxStatus('preparing');

    const qty = parseInt(quantity, 10);
    const price = parseFloat(pricePerUnit);

    const params: CreateListingParams = {
      seller: walletState.account.address,
      farmId: selectedFarmId,
      cropType,
      quantity: qty,
      unit,
      pricePerUnitXlm: price,
      location,
    };

    try {
      const result = await defaultMarketplaceClient.createListing(
        params,
        signTransaction,
        (s) => setTxStatus(s as ContractInvocationStatus)
      );

      if (result.successful && result.txHash) {
        setTxHash(result.txHash);
        setTxStatus('confirmed');

        const newListing: ProduceListing = {
          listingId: result.listingId || Math.floor(Math.random() * 800) + 200,
          seller: walletState.account.address,
          farmId: selectedFarmId,
          cropType,
          quantity: qty,
          unit,
          pricePerUnitXlm: price,
          totalPriceXlm: qty * price,
          location,
          status: 'Active',
          createdAt: Date.now(),
          txHash: result.txHash,
        };

        setListings((prev) => [newListing, ...prev]);
        setActiveTab('browse');
      } else {
        setErrorMessage(result.error || 'Failed to list produce');
        setTxStatus('failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Transaction rejected');
      setTxStatus('failed');
    }
  };

  const handlePurchase = async (listing: ProduceListing) => {
    if (!isConnected || !walletState.account) {
      setErrorMessage('Please connect your wallet first.');
      return;
    }

    setErrorMessage(null);
    setCreatedEscrowNotice(null);
    setTxStatus('preparing');

    try {
      const result = await defaultMarketplaceClient.purchaseListing(
        {
          listingId: listing.listingId,
          buyer: walletState.account.address,
          quantity: listing.quantity,
        },
        signTransaction,
        (s) => setTxStatus(s as ContractInvocationStatus)
      );

      if (result.successful && result.txHash) {
        setTxHash(result.txHash);
        setTxStatus('confirmed');
        const escrowId = result.escrowId || 305;
        setCreatedEscrowNotice(escrowId);
        onEscrowCreated?.(escrowId);

        setListings((prev) =>
          prev.map((l) =>
            l.listingId === listing.listingId
              ? { ...l, status: 'Sold', escrowId }
              : l
          )
        );
      } else {
        setErrorMessage(result.error || 'Purchase failed');
        setTxStatus('failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Transaction failed');
      setTxStatus('failed');
    }
  };

  const filteredListings = listings.filter((l) => {
    if (selectedCropFilter === 'All') return true;
    return l.cropType.toLowerCase().includes(selectedCropFilter.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            Global Produce Marketplace
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Verified agricultural listings tied to on-chain Farm Passports and secured by Soroban escrow.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'browse'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Browse Listings ({listings.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'create'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            List Produce
          </button>
        </div>
      </div>

      {createdEscrowNotice && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-600/60 rounded-xl flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              <strong>Purchase Secured:</strong> Agricultural Escrow #{createdEscrowNotice} created on Stellar Testnet!
            </span>
          </div>
          <Badge variant="emerald" size="sm">
            Escrow Active
          </Badge>
        </div>
      )}

      {activeTab === 'create' ? (
        <Card className="p-6 bg-slate-900/90 border-slate-800 max-w-2xl mx-auto">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            Create Verified Produce Listing
          </h3>

          <form onSubmit={handleCreateListing} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Farm Passport Source
              </label>
              <select
                value={selectedFarmId}
                onChange={(e) => setSelectedFarmId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {passports.length > 0 ? (
                  passports.map((p) => (
                    <option key={p.farmId} value={p.farmId}>
                      {p.farmId} — {p.crop} ({p.country})
                    </option>
                  ))
                ) : (
                  <option value="AGRI-000001">AGRI-000001 (Maize)</option>
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Crop Type & Quality
                </label>
                <input
                  type="text"
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Location / Depot
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Price Per Unit (XLM)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
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
                <span className="text-slate-400">Transaction State:</span>
                <StatusPill status={txStatus} />
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full text-xs font-semibold"
              isLoading={['preparing', 'simulating', 'awaiting_signature', 'submitting', 'pending'].includes(txStatus)}
            >
              Publish Listing to Stellar Marketplace
            </Button>
          </form>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {['All', 'Maize', 'Soybeans', 'Coffee', 'Wheat'].map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCropFilter(c)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedCropFilter === c
                    ? 'bg-emerald-800 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredListings.map((listing) => (
              <Card
                key={listing.listingId}
                className="p-5 bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="emerald" size="sm">
                      {listing.farmId}
                    </Badge>
                    <Badge
                      variant={listing.status === 'Active' ? 'emerald' : 'neutral'}
                      size="sm"
                    >
                      {listing.status}
                    </Badge>
                  </div>

                  <h4 className="text-base font-bold text-white mb-1">
                    {listing.cropType}
                  </h4>

                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{listing.location}</span>
                  </p>

                  <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60 grid grid-cols-2 gap-2 text-xs my-3">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Quantity</span>
                      <span className="font-semibold text-slate-200">
                        {listing.quantity} {listing.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Price / Unit</span>
                      <span className="font-semibold text-emerald-400">
                        {listing.pricePerUnitXlm} XLM
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs py-1">
                    <span className="text-slate-400">Total Settlement:</span>
                    <span className="text-base font-bold text-emerald-300">
                      {listing.totalPriceXlm.toLocaleString()} XLM
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/60 mt-3">
                  {listing.status === 'Active' ? (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handlePurchase(listing)}
                      className="w-full text-xs font-semibold flex items-center justify-center gap-1.5"
                      isLoading={['preparing', 'simulating', 'awaiting_signature', 'submitting', 'pending'].includes(txStatus)}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Purchase via Escrow ({listing.totalPriceXlm} XLM)
                    </Button>
                  ) : (
                    <div className="text-center text-xs text-slate-500 py-1">
                      Secured in Escrow #{listing.escrowId}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
