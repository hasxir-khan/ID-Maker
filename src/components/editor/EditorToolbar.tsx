import React from 'react';
import {
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Grid,
  Eye,
  Save,
  Download,
  ShieldCheck,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { CardData, ValidationResult } from '../../types/card';

interface EditorToolbarProps {
  card: CardData;
  onBack: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoomScale: number;
  onZoomChange: (scale: number) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  activeSide: 'front' | 'back';
  onToggleSide: () => void;
  validation: ValidationResult;
  onOpenValidation: () => void;
  onSave: () => void;
  onExport: () => void;
  isSaving?: boolean;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'failed';
  isExistingCard?: boolean;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  card,
  onBack,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoomScale,
  onZoomChange,
  showGrid,
  onToggleGrid,
  activeSide,
  onToggleSide,
  validation,
  onOpenValidation,
  onSave,
  onExport,
  isSaving,
  saveStatus = 'idle',
  isExistingCard = false,
}) => {
  return (
    <div className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-30 shrink-0 select-none">
      {/* Left: Back & Project Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-200 hidden sm:block" />

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
            {card.id}
          </span>
          <span className="text-xs font-bold text-slate-900 max-w-[180px] sm:max-w-xs truncate">
            {card.name}
          </span>
        </div>
      </div>

      {/* Middle: Canvas Tools (Undo, Redo, Zoom, Grid, Flip) */}
      <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-3.5 h-3.5" />
        </button>

        <div className="h-3.5 w-px bg-slate-200 mx-1" />

        {/* Zoom controls */}
        <button
          onClick={() => onZoomChange(Math.max(0.5, zoomScale - 0.1))}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <span className="text-[11px] font-mono text-slate-600 px-1 min-w-[42px] text-center">
          {Math.round(zoomScale * 100)}%
        </span>

        <button
          onClick={() => onZoomChange(Math.min(2.0, zoomScale + 0.1))}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="h-3.5 w-px bg-slate-200 mx-1" />

        {/* Grid toggle */}
        <button
          onClick={onToggleGrid}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            showGrid ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-600 hover:bg-white'
          }`}
          title="Toggle Canvas Grid Guides"
        >
          <Grid className="w-3.5 h-3.5" />
        </button>

        {/* Flip Side */}
        <button
          onClick={onToggleSide}
          className="px-2 py-1 rounded-lg text-[11px] font-medium text-slate-700 hover:bg-white flex items-center gap-1 transition-colors cursor-pointer"
          title="Flip Front / Back Side"
        >
          <RotateCw className="w-3 h-3 text-slate-500" />
          <span>{activeSide === 'front' ? 'Front' : 'Back'}</span>
        </button>
      </div>

      {/* Right: Validation Status, Save, Export */}
      <div className="flex items-center gap-2">
        {/* Smart Validation Indicator Pill */}
        <button
          onClick={onOpenValidation}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
            validation.isValid
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{validation.isValid ? 'CARD READY' : 'NEEDS ATTENTION'}</span>
          {validation.issues.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center ml-0.5">
              {validation.issues.length}
            </span>
          )}
        </button>

        {/* Save Card / Save Changes / Saved / Saving / Save Failed */}
        <button
          onClick={onSave}
          disabled={isSaving || saveStatus === 'saving'}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60 ${
            saveStatus === 'saved'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
              : saveStatus === 'failed'
              ? 'bg-red-50 text-red-700 border border-red-300 hover:bg-red-100'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}
          title={
            saveStatus === 'saved'
              ? 'Card saved to database'
              : saveStatus === 'failed'
              ? 'Save failed — click to retry'
              : isExistingCard
              ? 'Save Changes'
              : 'Save Card'
          }
        >
          {isSaving || saveStatus === 'saving' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
              <span>Saving...</span>
            </>
          ) : saveStatus === 'saved' ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Saved</span>
            </>
          ) : saveStatus === 'failed' ? (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
              <span>Retry Save</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span>{isExistingCard ? 'Save Changes' : 'Save Card'}</span>
            </>
          )}
        </button>

        {/* Export / Download */}
        <button
          onClick={onExport}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Card</span>
        </button>
      </div>
    </div>
  );
};
