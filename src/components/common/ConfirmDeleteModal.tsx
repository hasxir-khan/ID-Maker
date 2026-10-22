import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { CardData } from '../../types/card';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  card?: CardData | null;
  cardIds?: string[];
  onConfirmDelete: (cardOrIds: CardData | string[]) => Promise<void> | void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  card,
  cardIds,
  onConfirmDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isBatch = !card && cardIds && cardIds.length > 0;
  const count = isBatch ? cardIds.length : 1;

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      setErrorMessage(null);
      if (card) {
        await onConfirmDelete(card);
      } else if (cardIds && cardIds.length > 0) {
        await onConfirmDelete(cardIds);
      }
      setIsDeleting(false);
      onClose();
    } catch (err: any) {
      setIsDeleting(false);
      setErrorMessage(
        err?.message || 'Unable to delete card record. Please try again.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
      >
        {/* Header Icon + Close */}
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title & Body */}
        <div className="space-y-2">
          <h3
            id="delete-modal-title"
            className="text-lg font-bold text-slate-900 font-heading"
          >
            {isBatch ? `Delete ${count} Cards?` : 'Delete Card?'}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {isBatch ? (
              <>
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-900 font-semibold">{count}</strong> selected
                cards from your database?
              </>
            ) : (
              <>
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-900 font-semibold">"{card?.name}"</strong>{' '}
                (<span className="font-mono text-slate-700">{card?.id}</span>)?
              </>
            )}
          </p>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              This action will permanently remove the credential and its associated QR verification record from storage.
            </span>
          </div>
        </div>

        {/* Error message alert if any */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-medium">
            {errorMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-sm shadow-rose-600/20 transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>{isBatch ? `Delete ${count} Cards` : 'Delete Card'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
