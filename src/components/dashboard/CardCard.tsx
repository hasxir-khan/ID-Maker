import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Edit3,
  Eye,
  Copy,
  Download,
  Trash2,
  Calendar,
  QrCode,
} from 'lucide-react';
import { CardData } from '../../types/card';
import { CARD_TYPES } from '../../data/cardTypes';

interface CardCardProps {
  card: CardData;
  onView: (card: CardData) => void;
  onEdit: (card: CardData) => void;
  onDuplicate: (card: CardData) => void;
  onDownload: (card: CardData) => void;
  onDelete: (card: CardData) => void;
}

export const CardCard: React.FC<CardCardProps> = ({
  card,
  onView,
  onEdit,
  onDuplicate,
  onDownload,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const cardType = CARD_TYPES.find((t) => t.id === card?.cardTypeId);

  const statusBadges = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    draft: 'bg-amber-50 text-amber-700 border-amber-200',
    expired: 'bg-rose-50 text-rose-700 border-rose-200',
    archived: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  const rawStatus = (card?.status ?? '').toString().toLowerCase();
  const safeStatus = (rawStatus in statusBadges ? rawStatus : 'draft') as keyof typeof statusBadges;
  const statusBadge = statusBadges[safeStatus] || statusBadges.draft;

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [menuOpen]);

  const handleAction = (action: () => void) => {
    setMenuOpen(false);
    action();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden group">
      {/* Card Preview Header Thumbnail */}
      <div
        onClick={() => onView(card)}
        className="relative bg-gradient-to-br from-slate-900 to-slate-800 p-4 aspect-[1.586/1] flex flex-col justify-between cursor-pointer overflow-hidden border-b border-slate-100 select-none"
      >
        {/* Subtle decorative grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:12px_12px] opacity-40" />

        {/* Top bar inside thumbnail */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-1.5 max-w-[70%]">
            {card.logoUrl ? (
              <img
                src={card.logoUrl}
                alt="Logo"
                className="w-5 h-5 rounded object-contain bg-white/10 p-0.5"
              />
            ) : (
              <div className="w-5 h-5 rounded bg-blue-600/80 text-white flex items-center justify-center text-[9px] font-bold">
                ID
              </div>
            )}
            <span className="text-[11px] font-bold text-white tracking-wide truncate">
              {card?.organizationName || (card as any)?.organization || card?.fieldValues?.['institutionName'] || 'ORGANIZATION'}
            </span>
          </div>

          <span
            className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${statusBadge}`}
          >
            {safeStatus}
          </span>
        </div>

        {/* Middle content: Photo + Name */}
        <div className="relative z-10 flex items-center gap-3 my-auto">
          <div className="w-11 h-14 rounded bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
            {card.photoUrl ? (
              <img
                src={card.photoUrl}
                alt={card.personName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 text-[10px]">
                Photo
              </div>
            )}
          </div>
          <div className="min-w-0 space-y-0.5">
            <h4 className="text-xs font-bold text-white truncate">{card.personName}</h4>
            <p className="text-[10px] text-blue-300 font-mono font-medium truncate">
              {card.id}
            </p>
            <p className="text-[10px] text-slate-300 truncate">
              {card.fieldValues?.['jobTitle'] || card.fieldValues?.['department'] || cardType?.name || 'ID Credential'}
            </p>
          </div>
        </div>

        {/* Bottom micro bar */}
        <div className="relative z-10 flex items-center justify-between text-[9px] text-slate-400 font-mono pt-1 border-t border-slate-700/50">
          <span>EXP: {card.expiryDate || 'No date'}</span>
          <span className="flex items-center gap-1">
            <QrCode className="w-3 h-3 text-slate-400" />
            <span>CR80</span>
          </span>
        </div>
      </div>

      {/* Card Info & Actions Footer */}
      <div className="p-3.5 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/50 inline-block mb-1">
              {cardType?.name || 'ID Card'}
            </span>
            <h3
              onClick={() => onView(card)}
              className="text-xs font-bold text-slate-900 truncate hover:text-blue-600 transition-colors cursor-pointer"
              title={card.name}
            >
              {card.name}
            </h3>
            <p className="text-[11px] text-slate-500 truncate">{card.personName}</p>
          </div>

          {/* Action Menu Toggle */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="More actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 bottom-full mb-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-30 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-100"
              >
                <button
                  onClick={() => handleAction(() => onView(card))}
                  className="w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  View & Inspect
                </button>
                <button
                  onClick={() => handleAction(() => onEdit(card))}
                  className="w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                  Edit in Studio
                </button>
                <button
                  onClick={() => handleAction(() => onDuplicate(card))}
                  className="w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  Duplicate
                </button>
                <button
                  onClick={() => handleAction(() => onDownload(card))}
                  className="w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  Download
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={() => handleAction(() => onDelete(card))}
                  className="w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Card
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dates & Quick action buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
          <span className="flex items-center gap-1 text-[10px]">
            <Calendar className="w-3 h-3 text-slate-400" />
            {card.expiryDate ? `Exp: ${card.expiryDate}` : 'No Expiry'}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(card)}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              title="Edit Card"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDownload(card)}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              title="Download Card"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(card)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
              title="Delete Card"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
