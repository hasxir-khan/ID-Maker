import React, { useRef, useState } from 'react';
import {
  X,
  Download,
  Edit3,
  Copy,
  Printer,
  ShieldCheck,
  RotateCw,
  QrCode,
  Share2,
  Check,
} from 'lucide-react';
import { CardData } from '../../types/card';
import { CardCanvas } from '../editor/CardCanvas';
import { downloadCardSingle } from '../../services/exportService';

interface CardPreviewModalProps {
  card: CardData | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (card: CardData) => void;
  onDuplicate: (card: CardData) => void;
  onOpenPrintSheet: (cards: CardData[]) => void;
}

export const CardPreviewModal: React.FC<CardPreviewModalProps> = ({
  card,
  isOpen,
  onClose,
  onEdit,
  onDuplicate,
  onOpenPrintSheet,
}) => {
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [isExporting, setIsExporting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !card) return null;

  const handleDownload = async (format: 'png' | 'pdf') => {
    if (!canvasRef.current) return;
    try {
      setIsExporting(true);
      await downloadCardSingle(canvasRef.current, card, {
        format,
        scale: 3,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyVerifyUrl = () => {
    const url = `${window.location.origin}/#verify/${card.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                {card.id}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                {card.status}
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-900 mt-1 font-heading">
              {card.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Live visual preview */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-slate-100/60 space-y-6">
          {/* Card Canvas Container */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-lg">
            <div ref={canvasRef}>
              <CardCanvas
                card={card}
                selectedElementId={null}
                onSelectElement={() => {}}
                onUpdateElement={() => {}}
                readOnly={true}
                activeSide={activeSide}
              />
            </div>
          </div>

          {/* Quick info toolbar under card */}
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <button
              onClick={() => setActiveSide(activeSide === 'front' ? 'back' : 'front')}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg font-medium shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Flip Card ({activeSide === 'front' ? 'Front Side' : 'Back Side'})</span>
            </button>

            <button
              onClick={handleCopyVerifyUrl}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg font-medium shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copied QR Link!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Verify URL</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDuplicate(card)}
              className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicate</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenPrintSheet([card]);
              }}
              className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sheet</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                onClose();
                onEdit(card);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Open in Studio</span>
            </button>

            <button
              onClick={() => handleDownload('png')}
              disabled={isExporting}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download High-Res PNG</span>
            </button>

            <button
              onClick={() => handleDownload('pdf')}
              disabled={isExporting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
