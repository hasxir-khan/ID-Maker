import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { CardData, CardElement, ElementType, ValidationResult, normalizeCardElements } from '../../types/card';
import { CARD_TEMPLATES } from '../../data/templates';
import { CardCanvas } from './CardCanvas';
import { EditorToolbar } from './EditorToolbar';
import { EditorElementsPanel } from './EditorElementsPanel';
import { EditorPropertiesPanel } from './EditorPropertiesPanel';
import { ValidationDrawer } from '../validation/ValidationDrawer';
import { ExportModal } from '../export/ExportModal';
import { PrintSheetModal } from '../export/PrintSheetModal';
import { validateCard } from '../../services/validator';
import { storageService } from '../../services/storage';

interface CardEditorProps {
  initialCard: CardData;
  onBack: () => void;
  onSaveSuccess?: (savedCard: CardData) => void;
}

export const CardEditor: React.FC<CardEditorProps> = ({
  initialCard,
  onBack,
  onSaveSuccess,
}) => {
  // Guarantee initial card elements are partitioned into front and back collections
  const initialNormalizedCard = useMemo<CardData>(() => {
    const { elementsFront, elementsBack, elements } = normalizeCardElements(initialCard);
    return {
      ...initialCard,
      elementsFront,
      elementsBack,
      elements,
    };
  }, [initialCard]);

  const [card, setCard] = useState<CardData>(initialNormalizedCard);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [zoomScale, setZoomScale] = useState<number>(
    initialCard.orientation === 'horizontal' ? 1.0 : 0.85
  );
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Check whether the card already exists in database
  const [isExistingCard, setIsExistingCard] = useState<boolean>(() => {
    if (initialCard.ownerId && initialCard.ownerId.trim() !== '') return true;
    return storageService.getCards().some((c) => c.id === initialCard.id);
  });

  // State-driven save status: 'idle' (Unsaved changes), 'saving', 'saved', 'failed'
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>(
    isExistingCard ? 'saved' : 'idle'
  );

  // Modals
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState(false);

  // Undo / Redo history stacks
  const [history, setHistory] = useState<CardData[]>([initialNormalizedCard]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Compute live validation result
  const validation: ValidationResult = validateCard(card);

  // Push state to history with normalized element collections
  const pushHistory = (newCardState: CardData, isFromSave = false) => {
    const { elementsFront, elementsBack, elements } = normalizeCardElements(newCardState);
    const normalized: CardData = {
      ...newCardState,
      elementsFront,
      elementsBack,
      elements,
    };

    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(normalized);
    // Limit stack size to 30
    if (updatedHistory.length > 30) {
      updatedHistory.shift();
    }
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    setCard(normalized);

    // Any manual change transitions save status back to unsaved (idle)
    if (!isFromSave) {
      setSaveStatus('idle');
      setSaveError(null);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setCard(prev);
      setSaveStatus('idle');
      setSaveError(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setCard(next);
      setSaveStatus('idle');
      setSaveError(null);
    }
  };

  const handleSelectElement = (id: string | null) => {
    setSelectedElementId(id);
  };

  const handleUpdateElement = (updatedElement: CardElement) => {
    const targetSide = updatedElement.side || activeSide;
    let nextFront = [...(card.elementsFront || [])];
    let nextBack = [...(card.elementsBack || [])];

    if (targetSide === 'front') {
      nextFront = nextFront.map((el) => (el.id === updatedElement.id ? updatedElement : el));
      nextBack = nextBack.filter((el) => el.id !== updatedElement.id);
    } else {
      nextBack = nextBack.map((el) => (el.id === updatedElement.id ? updatedElement : el));
      nextFront = nextFront.filter((el) => el.id !== updatedElement.id);
    }

    pushHistory({
      ...card,
      elementsFront: nextFront,
      elementsBack: nextBack,
      elements: [...nextFront, ...nextBack],
    });
  };

  const handleAddElement = (type: ElementType, presetOptions: Partial<CardElement> = {}) => {
    const isLandscape = card.orientation === 'horizontal';
    const canvasWidth = isLandscape ? 600 : 378;
    const canvasHeight = isLandscape ? 378 : 600;

    const currentSideCollection = activeSide === 'front' ? card.elementsFront : card.elementsBack;

    const newElement: CardElement = {
      id: `${type}_${Date.now()}`,
      type,
      x: presetOptions.x ?? Math.round(canvasWidth / 2 - 60),
      y: presetOptions.y ?? Math.round(canvasHeight / 2 - 20),
      width: presetOptions.width ?? 120,
      height: presetOptions.height ?? 30,
      rotation: 0,
      zIndex: (currentSideCollection?.length || 0) + 1,
      content: presetOptions.content ?? (type === 'text' ? 'New Text' : ''),
      fieldBinding:
        presetOptions.fieldBinding ??
        (type === 'signature'
          ? activeSide === 'front'
            ? 'studentSignature'
            : 'principalSignature'
          : undefined),
      style: presetOptions.style ?? {},
      side: activeSide,
      ...presetOptions,
    };

    const nextFront = activeSide === 'front' ? [...(card.elementsFront || []), newElement] : [...(card.elementsFront || [])];
    const nextBack = activeSide === 'back' ? [...(card.elementsBack || []), newElement] : [...(card.elementsBack || [])];

    pushHistory({
      ...card,
      elementsFront: nextFront,
      elementsBack: nextBack,
      elements: [...nextFront, ...nextBack],
    });
    setSelectedElementId(newElement.id);
  };

  const handleDeleteElement = (id: string) => {
    const nextFront = (card.elementsFront || []).filter((el) => el.id !== id);
    const nextBack = (card.elementsBack || []).filter((el) => el.id !== id);

    pushHistory({
      ...card,
      elementsFront: nextFront,
      elementsBack: nextBack,
      elements: [...nextFront, ...nextBack],
    });
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  };

  const handleDuplicateElement = (id: string) => {
    const allElements = [...(card.elementsFront || []), ...(card.elementsBack || [])];
    const target = allElements.find((el) => el.id === id);
    if (!target) return;

    const targetSide = target.side || activeSide;
    const currentSideElements = targetSide === 'front' ? card.elementsFront : card.elementsBack;

    const duplicated: CardElement = {
      ...target,
      id: `${target.type}_${Date.now()}`,
      x: target.x + 10,
      y: target.y + 10,
      zIndex: (currentSideElements?.length || 0) + 1,
      side: targetSide,
    };

    const nextFront = targetSide === 'front' ? [...(card.elementsFront || []), duplicated] : [...(card.elementsFront || [])];
    const nextBack = targetSide === 'back' ? [...(card.elementsBack || []), duplicated] : [...(card.elementsBack || [])];

    pushHistory({
      ...card,
      elementsFront: nextFront,
      elementsBack: nextBack,
      elements: [...nextFront, ...nextBack],
    });
    setSelectedElementId(duplicated.id);
  };

  const handleApplyTemplate = (templateId: string) => {
    const tmpl = CARD_TEMPLATES.find((t) => t.id === templateId);
    if (!tmpl) return;

    const front = tmpl.elementsFront.map((el) => ({ ...el, side: 'front' as const }));
    const back = (tmpl.elementsBack || []).map((el) => ({ ...el, side: 'back' as const }));

    const isHorizontal = tmpl.defaultOrientation === 'horizontal';
    const width = isHorizontal ? 85.6 : 53.98;
    const height = isHorizontal ? 53.98 : 85.6;
    const nextDimensions = tmpl.dimensions || {
      width,
      height,
      unit: 'mm' as const,
      preset: 'CR80' as const,
    };

    if (tmpl.defaultOrientation !== card.orientation) {
      setZoomScale(isHorizontal ? 1.0 : 0.85);
    }

    pushHistory({
      ...card,
      templateId,
      orientation: tmpl.defaultOrientation,
      dimensions: nextDimensions,
      elementsFront: front,
      elementsBack: back,
      elements: [...front, ...back],
    });
  };

  const handleUpdateCardSettings = (partial: Partial<CardData>) => {
    pushHistory({ ...card, ...partial });
  };

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Auto-dismiss success notification
  useEffect(() => {
    if (saveSuccessMsg) {
      const timer = setTimeout(() => setSaveSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccessMsg]);

  const handleSave = async () => {
    if (isSaving || saveStatus === 'saving') return;
    setIsSaving(true);
    setSaveStatus('saving');
    setSaveError(null);
    setSaveSuccessMsg(null);
    try {
      const { elementsFront, elementsBack, elements } = normalizeCardElements(card);
      const cardToSave: CardData = {
        ...card,
        elementsFront,
        elementsBack,
        elements,
        studentSignatureUrl: card.studentSignatureUrl,
        principalSignatureUrl: card.principalSignatureUrl,
        updatedAt: new Date().toISOString(),
      };

      const saved = await storageService.saveCard(cardToSave);
      setIsSaving(false);
      setSaveStatus('saved');
      setIsExistingCard(true);
      // Update local history with the clean saved card without clearing the 'saved' state
      pushHistory(saved, true);
      setSaveSuccessMsg('Card saved successfully! Both front and back collections synchronized to Cloud Firestore.');
      if (onSaveSuccess) onSaveSuccess(saved);
    } catch (err: any) {
      setIsSaving(false);
      setSaveStatus('failed');
      console.error('[CardEditor] Failed to save card:', err);
      setSaveError(err?.message || 'Failed to save card. Please check your internet connection and assets.');
    }
  };

  const selectedElement =
    card.elements.find((el) => el.id === selectedElementId) || null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100">
      {/* Top Toolbar */}
      <EditorToolbar
        card={card}
        onBack={onBack}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoomScale={zoomScale}
        onZoomChange={setZoomScale}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        activeSide={activeSide}
        onToggleSide={() => setActiveSide(activeSide === 'front' ? 'back' : 'front')}
        validation={validation}
        onOpenValidation={() => setIsValidationOpen(true)}
        onSave={handleSave}
        onExport={() => setIsExportModalOpen(true)}
        isSaving={isSaving}
        saveStatus={saveStatus}
        isExistingCard={isExistingCard}
      />

      {/* Main Studio Body (3 Columns: Elements Left, Canvas Center, Properties Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Elements & Layers Panel */}
        <EditorElementsPanel
          card={card}
          selectedElementId={selectedElementId}
          onSelectElement={handleSelectElement}
          onAddElement={handleAddElement}
          onUpdateElement={handleUpdateElement}
          onDeleteElement={handleDeleteElement}
          onDuplicateElement={handleDuplicateElement}
          onApplyTemplate={handleApplyTemplate}
          activeSide={activeSide}
        />

        {/* Center Canvas Studio Work Area */}
        <main className="flex-1 bg-slate-200/70 overflow-auto p-8 flex items-center justify-center relative">
          <div ref={canvasContainerRef} className="p-4">
            <CardCanvas
              card={card}
              selectedElementId={selectedElementId}
              onSelectElement={handleSelectElement}
              onUpdateElement={handleUpdateElement}
              readOnly={false}
              activeSide={activeSide}
              zoomScale={zoomScale}
              showGrid={showGrid}
            />
          </div>

          {/* Save Status / Error / Success Banners */}
          {isSaving && (
            <div className="absolute top-4 inset-x-8 max-w-md mx-auto bg-slate-900/90 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs font-semibold z-50 backdrop-blur-sm border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-150">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />
              <div className="flex-1">
                <p>Saving Card to Cloud...</p>
                <p className="text-[11px] font-normal text-slate-300">Optimizing assets & verifying document payload.</p>
              </div>
            </div>
          )}

          {saveError && (
            <div className="absolute top-4 inset-x-8 max-w-lg mx-auto bg-rose-600 text-white px-4 py-3.5 rounded-xl shadow-xl flex items-start gap-3 text-xs font-semibold z-50 animate-in fade-in slide-in-from-top-2 duration-150 border border-rose-500">
              <AlertCircle className="w-4 h-4 text-rose-200 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Save Failed</p>
                <p className="font-normal text-rose-100 mt-0.5 text-[11px] leading-relaxed">{saveError}</p>
              </div>
              <button
                type="button"
                onClick={() => setSaveError(null)}
                className="p-1 hover:bg-rose-700 rounded-lg cursor-pointer text-rose-200 hover:text-white transition-colors"
                title="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {saveSuccessMsg && (
            <div className="absolute top-4 inset-x-8 max-w-md mx-auto bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs font-semibold z-50 animate-in fade-in slide-in-from-top-2 duration-150 border border-emerald-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
              <span className="flex-1 text-[11px]">{saveSuccessMsg}</span>
              <button
                type="button"
                onClick={() => setSaveSuccessMsg(null)}
                className="p-1 hover:bg-emerald-700 rounded-lg cursor-pointer text-emerald-200 hover:text-white transition-colors"
                title="Dismiss message"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Floating quick canvas guide info */}
          <div className="absolute bottom-4 left-6 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-300 text-[11px] font-mono text-slate-600 shadow-2xs">
            CR80: {card.orientation === 'horizontal' ? '600×378 px' : '378×600 px'} •{' '}
            {activeSide.toUpperCase()} SIDE
          </div>
        </main>

        {/* Right Properties Panel */}
        <EditorPropertiesPanel
          card={card}
          selectedElement={selectedElement}
          onUpdateElement={handleUpdateElement}
          onDeleteElement={handleDeleteElement}
          onDuplicateElement={handleDuplicateElement}
          onUpdateCardSettings={handleUpdateCardSettings}
        />
      </div>

      {/* Pre-export Quality Validation Drawer */}
      <ValidationDrawer
        isOpen={isValidationOpen}
        onClose={() => setIsValidationOpen(false)}
        validation={validation}
        onFixIssue={(fieldId, elementId) => {
          if (elementId) {
            setSelectedElementId(elementId);
          }
        }}
      />

      {/* Single Card Export Modal */}
      <ExportModal
        card={card}
        canvasElement={canvasContainerRef.current}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onOpenPrintSheet={(cards) => {
          setIsExportModalOpen(false);
          setIsPrintSheetOpen(true);
        }}
      />

      {/* Multi-card Print Sheet Modal */}
      <PrintSheetModal
        cards={[card]}
        isOpen={isPrintSheetOpen}
        onClose={() => setIsPrintSheetOpen(false)}
      />
    </div>
  );
};
