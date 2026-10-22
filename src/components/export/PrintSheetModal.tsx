import React, { useRef, useState } from 'react';
import {
  X,
  Printer,
  Download,
  Check,
  Grid,
  FileSpreadsheet,
} from 'lucide-react';
import { CardData } from '../../types/card';
import { CardCanvas } from '../editor/CardCanvas';
import { generatePrintableSheetPdf, SheetOptions } from '../../services/exportService';

interface PrintSheetModalProps {
  cards: CardData[];
  isOpen: boolean;
  onClose: () => void;
}

export const PrintSheetModal: React.FC<PrintSheetModalProps> = ({
  cards,
  isOpen,
  onClose,
}) => {
  const [paperSize, setPaperSize] = useState<'a4' | 'letter'>('a4');
  const [grid, setGrid] = useState<'2x4' | '3x3' | '2x5'>('2x4');
  const [includeCutLines, setIncludeCutLines] = useState<boolean>(true);
  const [marginMm, setMarginMm] = useState<number>(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  if (!isOpen || cards.length === 0) return null;

  // Replicate sample card if only 1 card is passed for preview demonstration
  const displayCards = cards.length === 1 ? Array(8).fill(cards[0]) : cards;

  const handleGenerateSheet = async () => {
    if (!containerRef.current) return;
    setErrorMessage(null);
    try {
      setIsGenerating(true);

      const cardDomElements = Array.from(
        containerRef.current.querySelectorAll('.sheet-card-item')
      ) as HTMLElement[];

      if (cardDomElements.length === 0) return;

      const options: SheetOptions = {
        paperSize,
        grid,
        rows: grid === '3x3' ? 3 : grid === '2x5' ? 5 : 4,
        cols: grid === '3x3' ? 3 : 2,
        marginMm,
        cardGapMm: 4,
        includeCutLines,
        filename: `IDMaker-${grid}-${paperSize.toUpperCase()}-PrintSheet.pdf`,
      };

      await generatePrintableSheetPdf(cardDomElements, displayCards, options);
      setDone(true);
      setTimeout(() => {
        setDone(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Sheet generation error', err);
      setErrorMessage(err?.message || 'Failed to generate print sheet PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Printer className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 font-heading">
                Multi-Card Printable Sheet Studio
              </h3>
              <p className="text-xs text-slate-500">
                Arrange multiple standard CR80 cards onto A4 or US Letter sheets with crop marks.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-100/50">
          {/* Left 4 cols: Configuration Controls */}
          <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4 text-xs text-slate-700">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                {errorMessage}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700">Paper Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaperSize('a4')}
                  className={`p-2 rounded-lg border text-center transition-colors cursor-pointer ${
                    paperSize === 'a4'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  A4 (210 × 297 mm)
                </button>
                <button
                  type="button"
                  onClick={() => setPaperSize('letter')}
                  className={`p-2 rounded-lg border text-center transition-colors cursor-pointer ${
                    paperSize === 'letter'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  US Letter (8.5 × 11 in)
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700">Grid Layout Matrix</label>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <button
                  type="button"
                  onClick={() => setGrid('2x4')}
                  className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                    grid === '2x4'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  2 × 4 (8 Cards)
                </button>
                <button
                  type="button"
                  onClick={() => setGrid('3x3')}
                  className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                    grid === '3x3'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  3 × 3 (9 Cards)
                </button>
                <button
                  type="button"
                  onClick={() => setGrid('2x5')}
                  className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                    grid === '2x5'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  2 × 5 (10 Cards)
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Include Cut Guidelines</span>
                <input
                  type="checkbox"
                  checked={includeCutLines}
                  onChange={(e) => setIncludeCutLines(e.target.checked)}
                  className="accent-blue-600 rounded"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Draws sharp border lines around each card for exact paper cutting.
              </p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-700">Page Margin</span>
                <span className="font-mono text-slate-500">{marginMm} mm</span>
              </div>
              <input
                type="range"
                min="5"
                max="25"
                value={marginMm}
                onChange={(e) => setMarginMm(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Right 8 cols: Live Sheet Mockup Preview */}
          <div className="lg:col-span-8 flex flex-col items-center justify-center">
            <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-md max-w-full overflow-hidden">
              <p className="text-[11px] font-mono text-slate-400 mb-2 text-center">
                Sheet Layout Preview ({paperSize.toUpperCase()} — {grid} Grid)
              </p>
              <div
                ref={containerRef}
                className={`grid gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg ${
                  grid === '3x3' ? 'grid-cols-3' : 'grid-cols-2'
                }`}
              >
                {displayCards.slice(0, grid === '3x3' ? 9 : grid === '2x5' ? 10 : 8).map((c, idx) => (
                  <div
                    key={idx}
                    className="sheet-card-item rounded overflow-hidden border border-slate-300 shadow-2xs bg-white"
                  >
                    <CardCanvas
                      card={c}
                      selectedElementId={null}
                      onSelectElement={() => {}}
                      onUpdateElement={() => {}}
                      readOnly={true}
                      zoomScale={0.24}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleGenerateSheet}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {done ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Generated PDF Sheet!</span>
              </>
            ) : isGenerating ? (
              <span>Rendering Print-Ready PDF...</span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Print-Ready Sheet (PDF)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
