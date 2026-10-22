import React, { useEffect, useState, useRef, useCallback } from 'react';
import { CardData, CardElement } from '../../types/card';
import { generateCardQrDataUrl } from '../../services/qrService';
import { resolveElementText } from '../../services/fieldResolver';
import { User, QrCode as QrIcon, Image as ImageIcon, Sparkles } from 'lucide-react';

interface CardCanvasProps {
  card: CardData;
  selectedElementId: string | null;
  onSelectElement: (elementId: string | null) => void;
  onUpdateElement: (updatedElement: CardElement) => void;
  readOnly?: boolean;
  activeSide?: 'front' | 'back';
  zoomScale?: number;
  showGrid?: boolean;
}

export const CardCanvas: React.FC<CardCanvasProps> = ({
  card,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  readOnly = false,
  activeSide = 'front',
  zoomScale = 1,
  showGrid = false,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [resizingHandle, setResizingHandle] = useState<string | null>(null);
  const [initialResizeState, setInitialResizeState] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    mouseX: number;
    mouseY: number;
  } | null>(null);

  // Snap guide state
  const [snapGuideX, setSnapGuideX] = useState<number | null>(null);
  const [snapGuideY, setSnapGuideY] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const isLandscape = card.orientation === 'horizontal';
  const width = isLandscape ? 600 : 378;
  const height = isLandscape ? 378 : 600;

  const centerX = width / 2;
  const centerY = height / 2;

  // Generate QR code whenever card ID or verify config changes
  useEffect(() => {
    let isMounted = true;
    generateCardQrDataUrl(card.id, card.qrConfig?.customData).then((url) => {
      if (isMounted) setQrDataUrl(url);
    });
    return () => {
      isMounted = false;
    };
  }, [card.id, card.qrConfig?.customData]);

  // Keyboard controls for fine adjustments
  useEffect(() => {
    if (readOnly || !selectedElementId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT')
      ) {
        return;
      }

      const el = card.elements.find((item) => item.id === selectedElementId);
      if (!el || el.locked) return;

      const step = e.shiftKey ? 10 : 1;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onUpdateElement({ ...el, x: el.x - step });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onUpdateElement({ ...el, x: el.x + step });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        onUpdateElement({ ...el, y: el.y - step });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onUpdateElement({ ...el, y: el.y + step });
      } else if (e.key === 'Escape') {
        onSelectElement(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readOnly, selectedElementId, card.elements, onUpdateElement, onSelectElement]);

  // Global mousemove and mouseup listeners for seamless dragging/resizing across viewport
  useEffect(() => {
    if (!draggingId && !resizingHandle) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      // 1. Dragging movement
      if (draggingId && !readOnly) {
        const el = card.elements.find((item) => item.id === draggingId);
        if (!el) return;

        let newX = Math.round((e.clientX - dragOffset.x) / zoomScale);
        let newY = Math.round((e.clientY - dragOffset.y) / zoomScale);

        // Alignment snapping
        const elementCenterX = newX + el.width / 2;
        const elementCenterY = newY + el.height / 2;

        if (Math.abs(elementCenterX - centerX) < 5) {
          newX = Math.round(centerX - el.width / 2);
          setSnapGuideX(centerX);
        } else {
          setSnapGuideX(null);
        }

        if (Math.abs(elementCenterY - centerY) < 5) {
          newY = Math.round(centerY - el.height / 2);
          setSnapGuideY(centerY);
        } else {
          setSnapGuideY(null);
        }

        // Constrain within bounds
        newX = Math.max(-20, Math.min(width - el.width + 20, newX));
        newY = Math.max(-20, Math.min(height - el.height + 20, newY));

        onUpdateElement({
          ...el,
          x: newX,
          y: newY,
        });
        return;
      }

      // 2. Resizing handle movement
      if (resizingHandle && initialResizeState && selectedElementId && !readOnly) {
        const el = card.elements.find((item) => item.id === selectedElementId);
        if (!el) return;

        const deltaX = Math.round((e.clientX - initialResizeState.mouseX) / zoomScale);
        const deltaY = Math.round((e.clientY - initialResizeState.mouseY) / zoomScale);

        let newX = initialResizeState.x;
        let newY = initialResizeState.y;
        let newWidth = initialResizeState.width;
        let newHeight = initialResizeState.height;

        if (resizingHandle.includes('e')) {
          newWidth = Math.max(15, initialResizeState.width + deltaX);
        }
        if (resizingHandle.includes('s')) {
          newHeight = Math.max(10, initialResizeState.height + deltaY);
        }
        if (resizingHandle.includes('w')) {
          const potentialWidth = initialResizeState.width - deltaX;
          if (potentialWidth > 15) {
            newWidth = potentialWidth;
            newX = initialResizeState.x + deltaX;
          }
        }
        if (resizingHandle.includes('n')) {
          const potentialHeight = initialResizeState.height - deltaY;
          if (potentialHeight > 10) {
            newHeight = potentialHeight;
            newY = initialResizeState.y + deltaY;
          }
        }

        onUpdateElement({
          ...el,
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        });
      }
    };

    const handleGlobalMouseUp = () => {
      setDraggingId(null);
      setResizingHandle(null);
      setInitialResizeState(null);
      setSnapGuideX(null);
      setSnapGuideY(null);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [
    draggingId,
    resizingHandle,
    dragOffset,
    initialResizeState,
    selectedElementId,
    readOnly,
    card.elements,
    zoomScale,
    centerX,
    centerY,
    width,
    height,
    onUpdateElement,
  ]);

  // Evaluate dynamic field bindings using canonical field resolver
  const resolveContent = (element: CardElement): string => {
    return resolveElementText(element, card);
  };

  // Resolve signature URL with strict independence between student/cardholder and principal/authority
  const resolveSignatureUrl = (el: CardElement): string => {
    // 1. If element has explicit manual content
    if (el.content && typeof el.content === 'string' && el.content.trim() !== '') {
      return el.content;
    }

    // 2. Direct fieldBinding matching
    const binding = (el.fieldBinding || '').toLowerCase();
    if (binding) {
      if (
        binding.includes('student') ||
        binding.includes('cardholder') ||
        binding.includes('employee') ||
        binding.includes('fellow')
      ) {
        return (
          card.studentSignatureUrl ||
          card.fieldValues?.['studentSignature'] ||
          card.fieldValues?.['cardholderSignature'] ||
          card.fieldValues?.['employeeSignature'] ||
          ''
        );
      }
      if (
        binding.includes('principal') ||
        binding.includes('authorized') ||
        binding.includes('issuer') ||
        binding.includes('manager') ||
        binding.includes('dean') ||
        binding.includes('officer') ||
        binding.includes('president') ||
        binding.includes('director') ||
        binding.includes('reg')
      ) {
        return (
          card.principalSignatureUrl ||
          card.fieldValues?.['principalSignature'] ||
          card.fieldValues?.['authorizedSignature'] ||
          card.fieldValues?.['issuerSignature'] ||
          ''
        );
      }
      if (el.fieldBinding && card.fieldValues?.[el.fieldBinding]) {
        return card.fieldValues[el.fieldBinding];
      }
    }

    // 3. Fallback based on card side
    if (el.side === 'front') {
      return (
        card.studentSignatureUrl ||
        card.fieldValues?.['studentSignature'] ||
        card.fieldValues?.['cardholderSignature'] ||
        ''
      );
    } else if (el.side === 'back') {
      return (
        card.principalSignatureUrl ||
        card.fieldValues?.['principalSignature'] ||
        card.fieldValues?.['authorizedSignature'] ||
        ''
      );
    }

    // 4. Safe legacy fallback: ONLY if the entire card has exactly ONE signature element total
    if (card.signatureUrl && !card.studentSignatureUrl && !card.principalSignatureUrl) {
      const allSigs = (card.elements || []).filter((e) => e.type === 'signature');
      if (allSigs.length === 1 && allSigs[0].id === el.id) {
        return card.signatureUrl;
      }
    }

    return '';
  };

  const handleMouseDown = (e: React.MouseEvent, el: CardElement) => {
    if (readOnly || el.locked) return;
    e.stopPropagation();
    onSelectElement(el.id);
    setDraggingId(el.id);
    setDragOffset({
      x: e.clientX - el.x * zoomScale,
      y: e.clientY - el.y * zoomScale,
    });
  };

  const handleResizeStart = (e: React.MouseEvent, handle: string, el: CardElement) => {
    if (readOnly || el.locked) return;
    e.stopPropagation();
    setResizingHandle(handle);
    setInitialResizeState({
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
      mouseX: e.clientX,
      mouseY: e.clientY,
    });
  };

  const sideElements =
    activeSide === 'front'
      ? (card.elementsFront && card.elementsFront.length > 0
          ? card.elementsFront
          : card.elements?.filter((el) => (el.side || 'front') === 'front') || [])
      : (card.elementsBack && card.elementsBack.length > 0
          ? card.elementsBack
          : card.elements?.filter((el) => el.side === 'back') || []);

  const visibleElements = sideElements.filter(
    (el) => el.visible !== false
  );

  return (
    <div
      ref={containerRef}
      style={{
        width: `${width * zoomScale}px`,
        height: `${height * zoomScale}px`,
      }}
      className="relative select-none overflow-hidden rounded-2xl shadow-xl transition-all"
      onClick={() => !readOnly && onSelectElement(null)}
    >
      {/* Inner Scaled Canvas Card Box */}
      <div
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transform: `scale(${zoomScale})`,
          transformOrigin: 'top left',
          backgroundColor: '#ffffff',
        }}
        className={`relative w-full h-full border border-slate-300 overflow-hidden ${
          showGrid
            ? 'bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]'
            : 'bg-white'
        }`}
      >
        {/* Visual Snap Guides */}
        {snapGuideX !== null && (
          <div
            style={{ left: `${snapGuideX}px` }}
            className="absolute top-0 bottom-0 w-px bg-blue-500 z-50 pointer-events-none opacity-80"
          />
        )}
        {snapGuideY !== null && (
          <div
            style={{ top: `${snapGuideY}px` }}
            className="absolute left-0 right-0 h-px bg-blue-500 z-50 pointer-events-none opacity-80"
          />
        )}

        {/* Render elements in zIndex order */}
        {visibleElements
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((el) => {
            const isSelected = selectedElementId === el.id && !readOnly;
            const content = resolveContent(el);

            return (
              <div
                key={el.id}
                onMouseDown={(e) => handleMouseDown(e, el)}
                style={{
                  position: 'absolute',
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  width: `${el.width}px`,
                  height: `${el.height}px`,
                  zIndex: el.zIndex,
                  transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                  cursor: readOnly ? 'default' : el.locked ? 'not-allowed' : 'move',
                  opacity: el.style.opacity !== undefined ? el.style.opacity : 1,
                  backgroundColor: el.style.backgroundColor || 'transparent',
                  borderColor: el.style.borderColor || 'transparent',
                  borderWidth: el.style.borderWidth ? `${el.style.borderWidth}px` : undefined,
                  borderStyle: el.style.borderStyle || 'solid',
                  borderRadius: el.style.borderRadius ? `${el.style.borderRadius}px` : undefined,
                }}
                className={`transition-shadow ${
                  isSelected
                    ? 'ring-2 ring-blue-600 ring-offset-1 ring-offset-white'
                    : ''
                }`}
              >
                {/* 1. TEXT ELEMENT */}
                {el.type === 'text' && (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      fontFamily: el.style.fontFamily || 'Inter, sans-serif',
                      fontSize: el.style.fontSize ? `${el.style.fontSize}px` : '12px',
                      fontWeight: el.style.fontWeight || '400',
                      fontStyle: el.style.fontStyle || 'normal',
                      textAlign: el.style.textAlign || 'left',
                      color: el.style.textColor || '#0f172a',
                      letterSpacing: el.style.letterSpacing ? `${el.style.letterSpacing}px` : undefined,
                      lineHeight: el.style.lineHeight || 1.25,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent:
                        el.style.textAlign === 'center'
                          ? 'center'
                          : el.style.textAlign === 'right'
                          ? 'flex-end'
                          : 'flex-start',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      overflow: 'hidden',
                    }}
                  >
                    {content}
                  </div>
                )}

                {/* 2. PHOTO ELEMENT */}
                {el.type === 'photo' && (
                  <div className="w-full h-full overflow-hidden flex items-center justify-center bg-slate-100">
                    {card.photoUrl || el.content ? (
                      <img
                        src={card.photoUrl || el.content}
                        crossOrigin="anonymous"
                        alt="Profile"
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100 p-2 text-center">
                        <User className="w-8 h-8 text-slate-300" />
                        <span className="text-[10px] mt-1 font-semibold">Photo</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. LOGO ELEMENT */}
                {el.type === 'logo' && (
                  <div className="w-full h-full flex items-center justify-center overflow-hidden">
                    {card.logoUrl || el.content ? (
                      <img
                        src={card.logoUrl || el.content}
                        crossOrigin="anonymous"
                        alt="Organization Logo"
                        className="w-full h-full object-contain pointer-events-none"
                      />
                    ) : (
                      <div className="w-full h-full border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 bg-slate-50/50">
                        <ImageIcon className="w-5 h-5 text-slate-300" />
                      </div>
                    )}
                  </div>
                )}

                {/* 4. QR CODE ELEMENT */}
                {el.type === 'qr' && (
                  <div className="w-full h-full bg-white p-1 rounded border border-slate-200 flex items-center justify-center shadow-2xs">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        crossOrigin="anonymous"
                        alt="Security QR Code"
                        className="w-full h-full object-contain pointer-events-none"
                      />
                    ) : (
                      <QrIcon className="w-full h-full text-slate-900" />
                    )}
                  </div>
                )}

                {/* 5. SIGNATURE ELEMENT */}
                {el.type === 'signature' && (() => {
                  const sigSrc = resolveSignatureUrl(el);
                  const isStudentOrCardholder =
                    el.side === 'front' ||
                    Boolean(
                      el.fieldBinding &&
                        (el.fieldBinding.toLowerCase().includes('student') ||
                          el.fieldBinding.toLowerCase().includes('cardholder') ||
                          el.fieldBinding.toLowerCase().includes('employee'))
                    );
                  const lineLabel = isStudentOrCardholder ? 'Signature Line' : 'Authorized Signature Line';
                  const altLabel = isStudentOrCardholder ? 'Cardholder Signature' : 'Authorized Authority Signature';

                  return (
                    <div className="w-full h-full flex items-center justify-center overflow-hidden">
                      {sigSrc ? (
                        <img
                          src={sigSrc}
                          crossOrigin="anonymous"
                          alt={altLabel}
                          className="w-full h-full object-contain pointer-events-none select-none"
                        />
                      ) : (
                        <div className="w-full h-full border-b border-slate-400 flex items-end justify-center pb-0.5 text-[9px] text-slate-400 font-mono select-none">
                          {lineLabel}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 6. SHAPE ELEMENT */}
                {el.type === 'shape' && (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: el.style.backgroundColor || '#2563eb',
                      borderRadius:
                        el.style.shapeType === 'circle'
                          ? '9999px'
                          : el.style.shapeType === 'pill'
                          ? '9999px'
                          : el.style.borderRadius
                          ? `${el.style.borderRadius}px`
                          : '0px',
                    }}
                  />
                )}

                {/* 7. LINE / DIVIDER */}
                {el.type === 'line' && (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: el.style.backgroundColor || '#cbd5e1',
                    }}
                  />
                )}

                {/* 8. BADGE ELEMENT */}
                {el.type === 'badge' && (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: el.style.backgroundColor || '#0f172a',
                      color: el.style.textColor || '#ffffff',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: el.style.fontSize ? `${el.style.fontSize}px` : '10px',
                      fontWeight: '700',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {content || 'VERIFIED'}
                  </div>
                )}

                {/* RESIZE HANDLES (Shown when selected & not locked) */}
                {isSelected && !el.locked && (
                  <>
                    {/* Corner NW */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, 'nw', el)}
                      className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-full cursor-nwse-resize z-50 shadow-sm"
                    />
                    {/* Corner NE */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, 'ne', el)}
                      className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-full cursor-nesw-resize z-50 shadow-sm"
                    />
                    {/* Corner SE */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, 'se', el)}
                      className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-full cursor-nwse-resize z-50 shadow-sm"
                    />
                    {/* Corner SW */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, 'sw', el)}
                      className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-full cursor-nesw-resize z-50 shadow-sm"
                    />
                    {/* Middle E */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, 'e', el)}
                      className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-2.5 bg-blue-600 rounded-xs cursor-ew-resize z-50"
                    />
                    {/* Middle S */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, 's', el)}
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-blue-600 rounded-xs cursor-ns-resize z-50"
                    />
                  </>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};
