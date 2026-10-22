import React from 'react';
import {
  CardData,
  CardElement,
  CardOrientation,
  CardDimensionUnit,
} from '../../types/card';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Sliders,
  Trash2,
  Copy,
  Lock,
  Unlock,
  Maximize2,
  Layers,
  Sparkles,
  RotateCw,
  Link,
  ShieldCheck,
} from 'lucide-react';
import { CARD_TYPES } from '../../data/cardTypes';
import { getTemplateRequirements } from '../../services/requirementsEngine';

interface EditorPropertiesPanelProps {
  card: CardData;
  selectedElement: CardElement | null;
  onUpdateElement: (updated: CardElement) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onUpdateCardSettings: (partial: Partial<CardData>) => void;
}

const FONTS = [
  'Inter',
  'Plus Jakarta Sans',
  'JetBrains Mono',
  'Arial',
  'Georgia',
  'Trebuchet MS',
];

export const EditorPropertiesPanel: React.FC<EditorPropertiesPanelProps> = ({
  card,
  selectedElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onUpdateCardSettings,
}) => {
  const canvasWidth = card.orientation === 'horizontal' ? 600 : 378;
  const canvasHeight = card.orientation === 'horizontal' ? 378 : 600;

  const currentCardType = CARD_TYPES.find((t) => t.id === card.cardTypeId);

  const templateSchema = getTemplateRequirements(card.templateId);

  // Available field bindings for dynamic variable replacement (from active template schema)
  const schemaBindings = templateSchema.fields.map((f) => ({
    key: f.key,
    label: `${f.label} (${f.side.toUpperCase()})`,
  }));

  const standardFallbacks = [
    { key: 'fullName', label: 'Cardholder Full Name' },
    { key: 'studentId', label: 'Card / ID Number' },
    { key: 'institutionName', label: 'Organization / Issuer' },
    { key: 'jobTitle', label: 'Role / Designation / Grade' },
    { key: 'department', label: 'Department / Unit' },
    { key: 'registrationNo', label: 'Registration / Clearance No' },
    { key: 'fatherName', label: 'Father / Guardian Name' },
    { key: 'bloodGroup', label: 'Blood Group' },
    { key: 'dob', label: 'Date of Birth' },
    { key: 'phone', label: 'Phone / Emergency Contact' },
    { key: 'emergencyName', label: 'Emergency Contact Person' },
    { key: 'email', label: 'Official / Work Email' },
    { key: 'address', label: 'HQ / Campus Address' },
    { key: 'issueDate', label: 'Issue Date' },
    { key: 'expiryDate', label: 'Expiry Date' },
    { key: 'issuedBy', label: 'Issued By Authority' },
    { key: 'studentSignature', label: 'Cardholder / Student Signature (Front)' },
    { key: 'principalSignature', label: 'Principal / Authorized Signature (Back)' },
  ];

  // Merge with uniqueness
  const seenKeys = new Set<string>();
  const mergedBindings = [{ key: '', label: '(No binding — Manual Text)' }];

  schemaBindings.forEach((b) => {
    if (!seenKeys.has(b.key)) {
      seenKeys.add(b.key);
      mergedBindings.push(b);
    }
  });

  standardFallbacks.forEach((b) => {
    if (!seenKeys.has(b.key)) {
      seenKeys.add(b.key);
      mergedBindings.push(b);
    }
  });

  const availableBindings = mergedBindings;

  // Alignment helpers
  const handleAlign = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'center-both') => {
    if (!selectedElement) return;

    let newX = selectedElement.x;
    let newY = selectedElement.y;

    if (type === 'left') newX = 16;
    if (type === 'center') newX = Math.round((canvasWidth - selectedElement.width) / 2);
    if (type === 'right') newX = canvasWidth - selectedElement.width - 16;
    if (type === 'top') newY = 16;
    if (type === 'middle') newY = Math.round((canvasHeight - selectedElement.height) / 2);
    if (type === 'bottom') newY = canvasHeight - selectedElement.height - 16;
    if (type === 'center-both') {
      newX = Math.round((canvasWidth - selectedElement.width) / 2);
      newY = Math.round((canvasHeight - selectedElement.height) / 2);
    }

    onUpdateElement({ ...selectedElement, x: newX, y: newY });
  };

  const handleStyleChange = (key: string, value: any) => {
    if (!selectedElement) return;
    onUpdateElement({
      ...selectedElement,
      style: {
        ...selectedElement.style,
        [key]: value,
      },
    });
  };

  // If no element is selected, display overall Card Settings & Geometry
  if (!selectedElement) {
    return (
      <aside className="w-72 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto p-4 space-y-6 h-[calc(100vh-3.5rem)] text-xs text-slate-700">
        <div className="border-b border-slate-100 pb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
            Card Configuration
          </span>
          <h3 className="font-bold text-sm text-slate-900 font-heading mt-1">
            Canvas & Physical Spec
          </h3>
          <p className="text-[11px] text-slate-500">
            Click any element on the card to edit its properties.
          </p>
        </div>

        {/* Orientation switch */}
        <div className="space-y-2">
          <label className="block font-semibold text-slate-700">Card Orientation</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onUpdateCardSettings({ orientation: 'horizontal' })}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                card.orientation === 'horizontal'
                  ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              Horizontal (CR80)
            </button>
            <button
              type="button"
              onClick={() => onUpdateCardSettings({ orientation: 'vertical' })}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                card.orientation === 'vertical'
                  ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              Vertical (Lanyard)
            </button>
          </div>
        </div>

        {/* Dimensions & Presets */}
        <div className="space-y-3">
          <label className="block font-semibold text-slate-700">Dimensions & Physical Sizing</label>
          
          <div className="grid grid-cols-3 gap-1.5 text-center">
            {['CR80', 'ID-1', 'Custom'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  let width = 85.6;
                  let height = 53.98;
                  if (card.orientation === 'vertical') {
                    width = 53.98;
                    height = 85.6;
                  }
                  onUpdateCardSettings({
                    dimensions: {
                      preset: p as any,
                      width: p === 'Custom' ? card.dimensions.width : width,
                      height: p === 'Custom' ? card.dimensions.height : height,
                      unit: card.dimensions.unit || 'mm',
                    },
                  });
                }}
                className={`p-2 rounded-lg border text-xs cursor-pointer ${
                  card.dimensions.preset === p
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 font-mono text-[11px]">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500 block text-[10px]">Physical Width</span>
                <input
                  type="number"
                  value={card.dimensions.width}
                  onChange={(e) =>
                    onUpdateCardSettings({
                      dimensions: {
                        ...card.dimensions,
                        width: parseFloat(e.target.value) || 85.6,
                      },
                    })
                  }
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">Physical Height</span>
                <input
                  type="number"
                  value={card.dimensions.height}
                  onChange={(e) =>
                    onUpdateCardSettings({
                      dimensions: {
                        ...card.dimensions,
                        height: parseFloat(e.target.value) || 53.98,
                      },
                    })
                  }
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-500 text-[10px]">Dimension Unit:</span>
              <select
                value={card.dimensions.unit}
                onChange={(e) =>
                  onUpdateCardSettings({
                    dimensions: {
                      ...card.dimensions,
                      unit: e.target.value as CardDimensionUnit,
                    },
                  })
                }
                className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-mono cursor-pointer"
              >
                <option value="mm">mm (Millimeters)</option>
                <option value="cm">cm (Centimeters)</option>
                <option value="inches">inches</option>
                <option value="pixels">pixels</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card Lifecycle Dates & Status */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <label className="block font-semibold text-slate-700">Card Status</label>
          <select
            value={card.status}
            onChange={(e) => onUpdateCardSettings({ status: e.target.value as any })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer font-medium"
          >
            <option value="active">Active (Valid Credential)</option>
            <option value="draft">Draft (In Progress)</option>
            <option value="expired">Expired</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* QR Verification Settings */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Public QR Verification</span>
            <input
              type="checkbox"
              checked={card.qrConfig?.enabled ?? true}
              onChange={(e) =>
                onUpdateCardSettings({
                  qrConfig: { ...card.qrConfig, enabled: e.target.checked },
                })
              }
              className="accent-blue-600 rounded cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            When enabled, scanning the card QR redirects to public verification certificate at <span className="font-mono text-slate-700">/#verify/{card.id}</span>.
          </p>
        </div>
      </aside>
    );
  }

  // Element is selected: display rich element properties
  return (
    <aside className="w-72 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto p-4 space-y-5 h-[calc(100vh-3.5rem)] text-xs text-slate-700">
      {/* Header with Quick Actions */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-xs uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/50">
            {selectedElement.type}
          </span>
          <span className="font-bold text-slate-900 truncate max-w-[120px]">
            Properties
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onDuplicateElement(selectedElement.id)}
            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded cursor-pointer"
            title="Duplicate Element"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteElement(selectedElement.id)}
            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
            title="Delete Element"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Dynamic Field Binding Selector (For Text & Badge Elements) */}
      {(selectedElement.type === 'text' || selectedElement.type === 'badge') && (
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-slate-700 font-semibold">
            <Link className="w-3.5 h-3.5 text-blue-600" />
            <span>Dynamic Data Binding</span>
          </div>
          <select
            value={selectedElement.fieldBinding || ''}
            onChange={(e) =>
              onUpdateElement({
                ...selectedElement,
                fieldBinding: e.target.value || undefined,
              })
            }
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 cursor-pointer"
          >
            {availableBindings.map((b) => (
              <option key={b.key} value={b.key}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Signature Role & Binding (For Signature Elements) */}
      {selectedElement.type === 'signature' && (
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-slate-700 font-semibold">
            <Link className="w-3.5 h-3.5 text-blue-600" />
            <span>Signature Role & Binding</span>
          </div>
          <select
            value={
              selectedElement.fieldBinding ||
              (selectedElement.side === 'front' ? 'studentSignature' : 'principalSignature')
            }
            onChange={(e) =>
              onUpdateElement({
                ...selectedElement,
                fieldBinding: e.target.value || undefined,
              })
            }
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 cursor-pointer"
          >
            <option value="studentSignature">Front: Cardholder / Student Signature</option>
            <option value="principalSignature">Back: Principal / Authorized Authority Signature</option>
            <option value="cardholderSignature">Front: Employee / Member Signature</option>
            <option value="authorizedSignature">Back: Authorized Official Signature</option>
          </select>
          <p className="text-[10px] text-slate-400">
            Assigned to independent signature slot. Cardholder and principal signatures remain 100% separate.
          </p>
        </div>
      )}

      {/* Content Text Field */}
      {(selectedElement.type === 'text' || selectedElement.type === 'badge') && (
        <div className="space-y-1.5">
          <label className="block font-semibold text-slate-700">Text Value</label>
          <textarea
            rows={2}
            value={selectedElement.content}
            onChange={(e) => onUpdateElement({ ...selectedElement, content: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
      )}

      {/* Numeric Geometry Controls (X, Y, Width, Height, Rotation) */}
      <div className="space-y-2">
        <label className="block font-semibold text-slate-700">Position & Dimensions</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-slate-400 font-mono">X (px)</span>
            <input
              type="number"
              value={selectedElement.x}
              onChange={(e) =>
                onUpdateElement({ ...selectedElement, x: parseInt(e.target.value, 10) || 0 })
              }
              className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono">Y (px)</span>
            <input
              type="number"
              value={selectedElement.y}
              onChange={(e) =>
                onUpdateElement({ ...selectedElement, y: parseInt(e.target.value, 10) || 0 })
              }
              className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono">Width (px)</span>
            <input
              type="number"
              value={selectedElement.width}
              onChange={(e) =>
                onUpdateElement({
                  ...selectedElement,
                  width: Math.max(5, parseInt(e.target.value, 10) || 10),
                })
              }
              className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono">Height (px)</span>
            <input
              type="number"
              value={selectedElement.height}
              onChange={(e) =>
                onUpdateElement({
                  ...selectedElement,
                  height: Math.max(2, parseInt(e.target.value, 10) || 10),
                })
              }
              className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
            />
          </div>
        </div>

        {/* Rotation Angle */}
        <div className="pt-1">
          <div className="flex justify-between text-[11px] text-slate-600 mb-1">
            <span className="flex items-center gap-1">
              <RotateCw className="w-3 h-3 text-slate-400" />
              <span>Rotation Angle</span>
            </span>
            <span className="font-mono">{selectedElement.rotation || 0}°</span>
          </div>
          <input
            type="range"
            min="-180"
            max="180"
            step="1"
            value={selectedElement.rotation || 0}
            onChange={(e) =>
              onUpdateElement({ ...selectedElement, rotation: parseInt(e.target.value, 10) || 0 })
            }
            className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Alignment Tools */}
      <div className="space-y-1.5 pt-2 border-t border-slate-100">
        <label className="block font-semibold text-slate-700">Canvas Alignment</label>
        <div className="grid grid-cols-4 gap-1">
          <button
            type="button"
            onClick={() => handleAlign('left')}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-center cursor-pointer"
          >
            Left
          </button>
          <button
            type="button"
            onClick={() => handleAlign('center')}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-center cursor-pointer"
          >
            Center
          </button>
          <button
            type="button"
            onClick={() => handleAlign('right')}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-center cursor-pointer"
          >
            Right
          </button>
          <button
            type="button"
            onClick={() => handleAlign('middle')}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-center cursor-pointer"
          >
            Middle
          </button>
        </div>
      </div>

      {/* Typography Controls */}
      {(selectedElement.type === 'text' || selectedElement.type === 'badge') && (
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <label className="block font-semibold text-slate-700">Typography</label>

          <div>
            <span className="text-[10px] text-slate-400">Font Family</span>
            <select
              value={selectedElement.style?.fontFamily || 'Inter'}
              onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs cursor-pointer"
            >
              {FONTS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-400">Font Size (px)</span>
              <input
                type="number"
                value={selectedElement.style?.fontSize || 14}
                onChange={(e) =>
                  handleStyleChange('fontSize', parseInt(e.target.value, 10) || 12)
                }
                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400">Font Weight</span>
              <select
                value={selectedElement.style?.fontWeight || '400'}
                onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
              >
                <option value="300">Light (300)</option>
                <option value="400">Regular (400)</option>
                <option value="500">Medium (500)</option>
                <option value="600">Semibold (600)</option>
                <option value="700">Bold (700)</option>
                <option value="800">Extrabold (800)</option>
              </select>
            </div>
          </div>

          {/* Letter spacing & Line height */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-400">Letter Spacing (px)</span>
              <input
                type="number"
                step="0.5"
                value={selectedElement.style?.letterSpacing || 0}
                onChange={(e) =>
                  handleStyleChange('letterSpacing', parseFloat(e.target.value) || 0)
                }
                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400">Line Height</span>
              <input
                type="number"
                step="0.1"
                value={selectedElement.style?.lineHeight || 1.2}
                onChange={(e) =>
                  handleStyleChange('lineHeight', parseFloat(e.target.value) || 1.2)
                }
                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>

          {/* Text alignment & styling buttons */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => handleStyleChange('textAlign', 'left')}
                className={`p-1.5 rounded cursor-pointer ${
                  selectedElement.style?.textAlign === 'left' || !selectedElement.style?.textAlign
                    ? 'bg-white shadow-2xs font-bold text-slate-900'
                    : 'text-slate-500'
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleStyleChange('textAlign', 'center')}
                className={`p-1.5 rounded cursor-pointer ${
                  selectedElement.style?.textAlign === 'center'
                    ? 'bg-white shadow-2xs font-bold text-slate-900'
                    : 'text-slate-500'
                }`}
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleStyleChange('textAlign', 'right')}
                className={`p-1.5 rounded cursor-pointer ${
                  selectedElement.style?.textAlign === 'right'
                    ? 'bg-white shadow-2xs font-bold text-slate-900'
                    : 'text-slate-500'
                }`}
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                handleStyleChange(
                  'fontStyle',
                  selectedElement.style?.fontStyle === 'italic' ? 'normal' : 'italic'
                )
              }
              className={`p-1.5 rounded-lg border border-slate-200 cursor-pointer ${
                selectedElement.style?.fontStyle === 'italic'
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'bg-white text-slate-600'
              }`}
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Text Color */}
          <div>
            <span className="text-[10px] text-slate-400">Text Color</span>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="color"
                value={selectedElement.style?.textColor || '#0f172a'}
                onChange={(e) => handleStyleChange('textColor', e.target.value)}
                className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={selectedElement.style?.textColor || '#0f172a'}
                onChange={(e) => handleStyleChange('textColor', e.target.value)}
                className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Colors & Appearance (Background, Border, Radius, Opacity) */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <label className="block font-semibold text-slate-700">Appearance & Style</label>

        {/* Background color */}
        <div>
          <span className="text-[10px] text-slate-400">Background Color</span>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="color"
              value={selectedElement.style?.backgroundColor || '#ffffff'}
              onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
              className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0.5"
            />
            <input
              type="text"
              value={selectedElement.style?.backgroundColor || 'transparent'}
              onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
              className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
            />
          </div>
        </div>

        {/* Border controls */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-slate-400">Border Radius (px)</span>
            <input
              type="number"
              value={selectedElement.style?.borderRadius || 0}
              onChange={(e) =>
                handleStyleChange('borderRadius', parseInt(e.target.value, 10) || 0)
              }
              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono"
            />
          </div>

          <div>
            <span className="text-[10px] text-slate-400">Border Width (px)</span>
            <input
              type="number"
              value={selectedElement.style?.borderWidth || 0}
              onChange={(e) =>
                handleStyleChange('borderWidth', parseInt(e.target.value, 10) || 0)
              }
              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono"
            />
          </div>
        </div>

        {/* Opacity slider */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-600 mb-1">
            <span className="text-slate-400 text-[10px]">Element Opacity</span>
            <span className="font-mono">
              {Math.round((selectedElement.style?.opacity ?? 1) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={selectedElement.style?.opacity ?? 1}
            onChange={(e) => handleStyleChange('opacity', parseFloat(e.target.value))}
            className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>

        {/* Z-Index layer priority */}
        <div>
          <span className="text-[10px] text-slate-400">Z-Index (Layer Order)</span>
          <input
            type="number"
            value={selectedElement.zIndex}
            onChange={(e) =>
              onUpdateElement({
                ...selectedElement,
                zIndex: parseInt(e.target.value, 10) || 1,
              })
            }
            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono"
          />
        </div>
      </div>
    </aside>
  );
};
