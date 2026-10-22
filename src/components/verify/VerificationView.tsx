import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  IdCard,
  Calendar,
  Building,
  User,
  ArrowLeft,
  QrCode,
  Lock,
  Camera,
  Check,
} from 'lucide-react';
import { CardData } from '../../types/card';
import { storageService } from '../../services/storage';
import { CARD_TYPES } from '../../data/cardTypes';

interface VerificationViewProps {
  initialCardId?: string;
  onBack: () => void;
}

export const VerificationView: React.FC<VerificationViewProps> = ({
  initialCardId = 'IDM-2026-0001',
  onBack,
}) => {
  const [searchId, setSearchId] = useState<string>(initialCardId);
  const [verifiedCard, setVerifiedCard] = useState<CardData | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(true);
  const [isSimulatingCamera, setIsSimulatingCamera] = useState<boolean>(false);

  const [isSearching, setIsSearching] = useState<boolean>(false);
  const allCards = storageService.getCards();

  const performLookup = async (id: string) => {
    const trimmed = id.trim();
    if (!trimmed) {
      setVerifiedCard(null);
      return;
    }
    setIsSearching(true);
    try {
      const card = await storageService.getCardById(trimmed);
      setVerifiedCard(card || null);
    } catch (err) {
      setVerifiedCard(null);
    } finally {
      setIsSearching(false);
      setHasSearched(true);
      setIsSimulatingCamera(false);
    }
  };

  useEffect(() => {
    if (initialCardId) {
      performLookup(initialCardId);
    }
  }, [initialCardId]);

  const cardType = verifiedCard
    ? CARD_TYPES.find((t) => t.id === verifiedCard.cardTypeId)
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workspace</span>
        </button>

        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-700">
            ID Maker Public Verification Gateway
          </span>
        </div>
      </div>

      {/* Verification Lookup Search */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
            Verify Identification Credential
          </label>

          <button
            type="button"
            onClick={() => setIsSimulatingCamera(!isSimulatingCamera)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isSimulatingCamera ? 'Close Scanner' : 'Simulate Camera QR Scanner'}</span>
          </button>
        </div>

        {/* Camera simulation box */}
        {isSimulatingCamera && (
          <div className="p-6 bg-slate-950 rounded-2xl text-center text-white space-y-4 relative overflow-hidden border border-slate-800">
            <div className="w-48 h-48 border-2 border-emerald-400 rounded-2xl mx-auto relative flex items-center justify-center bg-slate-900/60 shadow-inner">
              <div className="absolute inset-0 border-t-2 border-emerald-400 animate-pulse" />
              <QrCode className="w-20 h-20 text-emerald-400/60" />
            </div>
            <p className="text-xs text-slate-300">
              Align physical or digital ID QR code inside the viewfinder box.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="text-[11px] text-slate-400">Quick Test Scans:</span>
              {allCards.slice(0, 3).map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSearchId(c.id);
                    performLookup(c.id);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-blue-300 border border-slate-700 cursor-pointer"
                >
                  Scan {c.id}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter Card ID (e.g. IDM-2026-0001, IDM-2026-0002)..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && performLookup(searchId)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
            />
          </div>
          <button
            onClick={() => performLookup(searchId)}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            Verify Card
          </button>
        </div>

        {/* Quick Sample IDs Chips */}
        <div className="flex items-center gap-2 pt-1 text-xs text-slate-500 overflow-x-auto">
          <span className="shrink-0 text-[11px]">Quick verify:</span>
          {allCards.slice(0, 4).map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSearchId(c.id);
                performLookup(c.id);
              }}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] whitespace-nowrap cursor-pointer"
            >
              {c.id} ({c.personName.split(' ')[0]})
            </button>
          ))}
        </div>
      </div>

      {/* Result Certificate Box */}
      {hasSearched && verifiedCard ? (
        <div className="bg-white rounded-2xl border border-emerald-300 shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Verified Ribbon */}
          <div className="bg-emerald-600 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white shrink-0">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-wider mb-1">
                  <span>✓ Authenticated ID</span>
                </div>
                <h2 className="text-2xl font-extrabold font-heading tracking-tight">
                  Card Verified
                </h2>
                <p className="text-xs text-emerald-100 mt-0.5">
                  This identification credential is officially registered in ID Maker.
                </p>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-emerald-500/50 sm:pl-6">
              <span className="text-[11px] text-emerald-200 uppercase tracking-widest block font-bold">
                Unique Card ID
              </span>
              <span className="text-lg font-extrabold font-mono text-white tracking-wide">
                {verifiedCard.id}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
              {/* Photo */}
              <div className="w-24 h-30 rounded-xl bg-slate-100 border-2 border-slate-200 overflow-hidden shrink-0 shadow-sm">
                {verifiedCard.photoUrl ? (
                  <img
                    src={verifiedCard.photoUrl}
                    alt={verifiedCard.personName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <User className="w-8 h-8" />
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-center sm:text-left min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 inline-block">
                  {cardType?.name || 'Identity Card'}
                </span>
                <h3 className="text-xl font-bold text-slate-900 font-heading">
                  {verifiedCard.personName}
                </h3>
                <p className="text-xs text-slate-600 font-semibold">
                  {verifiedCard.organizationName || verifiedCard.fieldValues['institutionName']}
                </p>
                {verifiedCard.fieldValues['department'] && (
                  <p className="text-xs text-slate-500">
                    Department: {verifiedCard.fieldValues['department']}
                  </p>
                )}
              </div>
            </div>

            {/* Credential Data Table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-semibold uppercase text-slate-400">
                  Card Type
                </span>
                <p className="font-bold text-slate-800">{cardType?.name || 'Standard ID'}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-semibold uppercase text-slate-400">
                  Credential Status
                </span>
                <p className="font-bold text-emerald-700 flex items-center gap-1.5 uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {verifiedCard.status}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-semibold uppercase text-slate-400">
                  Issue Date
                </span>
                <p className="font-bold text-slate-800 font-mono">
                  {verifiedCard.issueDate || '2026-10-06'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-semibold uppercase text-slate-400">
                  Expiry Date
                </span>
                <p className="font-bold text-slate-800 font-mono">
                  {verifiedCard.expiryDate || '2027-10-06'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-semibold uppercase text-slate-400">
                  Issuing Authority
                </span>
                <p className="font-bold text-slate-800">
                  {verifiedCard.issuedBy ||
                    verifiedCard.fieldValues['issuedBy'] ||
                    'Authorized Office'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-semibold uppercase text-slate-400">
                  Digital Verification
                </span>
                <p className="font-bold text-blue-700 font-mono flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>256-Bit SHA Certified</span>
                </p>
              </div>
            </div>

            {/* Privacy notice */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span>
                Personal contact details (Phone, Address) are protected under privacy policy.
              </span>
              <span className="font-mono text-slate-400">ID Maker Security Gateway</span>
            </div>
          </div>
        </div>
      ) : hasSearched && !verifiedCard ? (
        <div className="bg-white p-10 rounded-2xl border border-rose-200 shadow-sm text-center space-y-3">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="font-bold text-base text-slate-900 font-heading">
            Card Record Not Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No active identification card found with ID "{searchId}". Please check the ID number or contact the issuing organization.
          </p>
        </div>
      ) : null}
    </div>
  );
};
