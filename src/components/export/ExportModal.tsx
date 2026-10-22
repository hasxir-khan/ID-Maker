import React, { useState } from 'react';
import {
  X,
  Download,
  FileText,
  Image as ImageIcon,
  Printer,
  ShieldCheck,
  Check,
  Sparkles,
} from 'lucide-react';
import { CardData } from '../../types/card';
import { downloadCardSingle } from '../../services/exportService';

interface ExportModalProps {
  card: CardData;
  canvasElement: HTMLElement | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPrintSheet: (cards: CardData[]) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  card,
  canvasElement,
  isOpen,
  onClose,
  onOpenPrintSheet,
}) => {
  const [format, setFormat] = useState<'png' | 'jpg' | 'pdf'>('pdf');
  const [resolutionScale, setResolutionScale] = useState<number>(3); // 3x = 300 DPI
  const [bleedMarginMm, setBleedMarginMm] = useState<number>(0);
  const [showCropMarks, setShowCropMarks] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    if (!canvasElement) return;
    setErrorMessage(null);
    try {
      setIsExporting(true);
      await downloadCardSingle(canvasElement, card, {
        format,
        scale: resolutionScale,
        quality: 0.98,
        bleedMarginMm,
        showCropMarks,
      });
      setExportComplete(true);
      setTimeout(() => {
        setExportComplete(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Export failed', err);
      setErrorMessage(err?.message || 'Export failed. Please verify all card assets.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 font-heading">
                Export & Download Card
              </h3>
              <p className="text-xs text-slate-500">
                High-resolution single card download.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Format selection */}
          <div className="space-y-2">
            <label className="block font-semibold text-slate-700">Select File Format</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormat('png')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  format === 'png'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold ring-1 ring-blue-600'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ImageIcon className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                <span>PNG (300 DPI)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('jpg')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  format === 'jpg'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold ring-1 ring-blue-600'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ImageIcon className="w-5 h-5 mx-auto text-slate-600 mb-1" />
                <span>JPG</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  format === 'pdf'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold ring-1 ring-blue-600'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-5 h-5 mx-auto text-red-600 mb-1" />
                <span>Vector PDF</span>
              </button>
            </div>
          </div>

          {/* Resolution quality */}
          <div className="space-y-2">
            <label className="block font-semibold text-slate-700">Print Quality / DPI Scale</label>
            <div className="grid grid-cols-3 gap-2 text-center">
              <button
                type="button"
                onClick={() => setResolutionScale(1)}
                className={`p-2 rounded-lg border cursor-pointer ${
                  resolutionScale === 1
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>1x (Screen)</span>
              </button>
              <button
                type="button"
                onClick={() => setResolutionScale(2)}
                className={`p-2 rounded-lg border cursor-pointer ${
                  resolutionScale === 2
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>2x (Retina)</span>
              </button>
              <button
                type="button"
                onClick={() => setResolutionScale(3)}
                className={`p-2 rounded-lg border cursor-pointer ${
                  resolutionScale === 3
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>3x (Ultra 300 DPI)</span>
              </button>
            </div>
          </div>

          {/* PDF-Specific Professional Print Controls */}
          {format === 'pdf' && (
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-blue-900 text-xs">Print Production Settings</span>
                <span className="text-[10px] font-mono text-blue-600 font-bold bg-blue-100 px-1.5 py-0.5 rounded">
                  CR80 {card.orientation === 'horizontal' ? '85.6 × 53.98 mm' : '53.98 × 85.6 mm'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Bleed Margin</label>
                  <select
                    value={bleedMarginMm}
                    onChange={(e) => setBleedMarginMm(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800"
                  >
                    <option value={0}>0 mm (Exact Trim)</option>
                    <option value={3}>3 mm (Standard Print Bleed)</option>
                    <option value={5}>5 mm (Extended Bleed)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={showCropMarks}
                      onChange={(e) => setShowCropMarks(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[11px] font-medium text-slate-700">Crop / Cut Marks</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Multi-card sheet banner */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-slate-500" />
              <div>
                <p className="font-semibold text-slate-800">Need Multiple Cards on 1 Sheet?</p>
                <p className="text-[11px] text-slate-500">Arrange 3x3 or 2x4 on A4 paper</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPrintSheet([card]);
              }}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-lg shadow-2xs text-[11px] cursor-pointer"
            >
              Print Sheet
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {exportComplete ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Downloaded!</span>
              </>
            ) : isExporting ? (
              <span>Generating {format.toUpperCase()}...</span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download {format.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
