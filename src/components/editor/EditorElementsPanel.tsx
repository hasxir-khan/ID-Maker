import React from 'react';
import {
  Type,
  Image as ImageIcon,
  User,
  QrCode,
  PenTool,
  Square,
  Minus,
  Award,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  Plus,
  Sparkles,
} from 'lucide-react';
import { CardData, CardElement, ElementType } from '../../types/card';
import { CARD_TEMPLATES } from '../../data/templates';

interface EditorElementsPanelProps {
  card: CardData;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onAddElement: (type: ElementType, presetOptions?: Partial<CardElement>) => void;
  onUpdateElement: (updated: CardElement) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onApplyTemplate: (templateId: string) => void;
  activeSide: 'front' | 'back';
}

export const EditorElementsPanel: React.FC<EditorElementsPanelProps> = ({
  card,
  selectedElementId,
  onSelectElement,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onApplyTemplate,
  activeSide,
}) => {
  const [activeTab, setActiveTab] = React.useState<'elements' | 'templates' | 'layers'>('elements');

  const activeSideElements =
    activeSide === 'front'
      ? (card.elementsFront && card.elementsFront.length > 0
          ? card.elementsFront
          : card.elements?.filter((el) => (el.side || 'front') === 'front') || [])
      : (card.elementsBack && card.elementsBack.length > 0
          ? card.elementsBack
          : card.elements?.filter((el) => el.side === 'back') || []);

  const elementsOnActiveSide = [...activeSideElements].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-hidden h-[calc(100vh-3.5rem)]">
      {/* Top Tab Switcher */}
      <div className="grid grid-cols-3 p-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('elements')}
          className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'elements'
              ? 'bg-white text-slate-900 shadow-2xs font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Add Elements
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'templates'
              ? 'bg-white text-slate-900 shadow-2xs font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Templates
        </button>
        <button
          onClick={() => setActiveTab('layers')}
          className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'layers'
              ? 'bg-white text-slate-900 shadow-2xs font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Layers ({elementsOnActiveSide.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {activeTab === 'elements' && (
          <>
            {/* Quick Add Elements Grid */}
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Core Elements
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onAddElement('text', {
                      content: 'Text Heading',
                      style: {
                        fontSize: 18,
                        fontWeight: '700',
                        textColor: '#0f172a',
                      },
                    })
                  }
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all hover:border-slate-300 flex flex-col gap-1.5 cursor-pointer group"
                >
                  <Type className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-800">Heading</span>
                  <span className="text-[10px] text-slate-500">Add title or name</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onAddElement('text', {
                      content: 'Subtext or detail',
                      style: {
                        fontSize: 11,
                        fontWeight: '400',
                        textColor: '#64748b',
                      },
                    })
                  }
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all hover:border-slate-300 flex flex-col gap-1.5 cursor-pointer group"
                >
                  <Type className="w-4 h-4 text-slate-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-800">Body Text</span>
                  <span className="text-[10px] text-slate-500">Add label or note</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onAddElement('photo', {
                      width: 130,
                      height: 160,
                      style: {
                        borderRadius: 8,
                        borderColor: '#cbd5e1',
                        borderWidth: 1,
                      },
                    })
                  }
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all hover:border-slate-300 flex flex-col gap-1.5 cursor-pointer group"
                >
                  <User className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-800">Photo Frame</span>
                  <span className="text-[10px] text-slate-500">Passport picture</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onAddElement('logo', {
                      width: 50,
                      height: 50,
                    })
                  }
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all hover:border-slate-300 flex flex-col gap-1.5 cursor-pointer group"
                >
                  <ImageIcon className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-800">Org Logo</span>
                  <span className="text-[10px] text-slate-500">Institution emblem</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onAddElement('qr', {
                      width: 80,
                      height: 80,
                    })
                  }
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all hover:border-slate-300 flex flex-col gap-1.5 cursor-pointer group"
                >
                  <QrCode className="w-4 h-4 text-slate-900 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-800">QR Code</span>
                  <span className="text-[10px] text-slate-500">Instant verification</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onAddElement('signature', {
                      width: 140,
                      height: 40,
                    })
                  }
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all hover:border-slate-300 flex flex-col gap-1.5 cursor-pointer group"
                >
                  <PenTool className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-800">Signature</span>
                  <span className="text-[10px] text-slate-500">Official sign-off</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onAddElement('badge', {
                      content: 'VIP ACCESS',
                      width: 120,
                      height: 26,
                      style: {
                        backgroundColor: '#2563eb',
                        textColor: '#ffffff',
                        fontSize: 10,
                        fontWeight: '700',
                        borderRadius: 4,
                        textAlign: 'center',
                      },
                    })
                  }
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all hover:border-slate-300 flex flex-col gap-1.5 cursor-pointer group"
                >
                  <Award className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-800">Badge Tag</span>
                  <span className="text-[10px] text-slate-500">Status pill</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onAddElement('shape', {
                      width: 150,
                      height: 80,
                      style: {
                        backgroundColor: '#f1f5f9',
                        borderRadius: 6,
                      },
                    })
                  }
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all hover:border-slate-300 flex flex-col gap-1.5 cursor-pointer group"
                >
                  <Square className="w-4 h-4 text-slate-700 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-800">Shape Box</span>
                  <span className="text-[10px] text-slate-500">Container banner</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onAddElement('line', {
                      width: 300,
                      height: 2,
                      style: {
                        backgroundColor: '#cbd5e1',
                      },
                    })
                  }
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all hover:border-slate-300 flex flex-col gap-1.5 cursor-pointer group"
                >
                  <Minus className="w-4 h-4 text-slate-700 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-800">Divider Line</span>
                  <span className="text-[10px] text-slate-500">Section break</span>
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Switch Base Template
            </p>
            <div className="space-y-2">
              {CARD_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => onApplyTemplate(tmpl.id)}
                  className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    card.templateId === tmpl.id
                      ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`h-3 rounded w-full bg-gradient-to-r ${tmpl.previewGradient} mb-2`}
                  />
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-900">{tmpl.name}</h4>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">
                      {tmpl.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    {tmpl.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'layers' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Layer Hierarchy
              </p>
              <span className="text-[11px] text-slate-500 font-mono">
                {elementsOnActiveSide.length} items
              </span>
            </div>

            <div className="space-y-1.5">
              {elementsOnActiveSide.map((el) => {
                const isSelected = selectedElementId === el.id;
                return (
                  <div
                    key={el.id}
                    onClick={() => onSelectElement(el.id)}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-blue-400 text-blue-900 font-semibold shadow-2xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate max-w-[140px]">
                      <span className="text-[10px] uppercase font-mono px-1 py-0.5 rounded bg-slate-100 text-slate-600">
                        {el.type}
                      </span>
                      <span className="truncate text-xs">
                        {el.content || el.fieldBinding || el.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateElement({ ...el, visible: el.visible === false ? true : false })
                        }
                        className="p-1 text-slate-400 hover:text-slate-600"
                        title={el.visible === false ? 'Show' : 'Hide'}
                      >
                        {el.visible === false ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onUpdateElement({ ...el, locked: !el.locked })}
                        className="p-1 text-slate-400 hover:text-slate-600"
                        title={el.locked ? 'Unlock' : 'Lock'}
                      >
                        {el.locked ? (
                          <Lock className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteElement(el.id)}
                        className="p-1 text-slate-400 hover:text-red-600"
                        title="Delete Element"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
