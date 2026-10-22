import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  RotateCw,
  Layers,
  GraduationCap,
  Building,
  Briefcase,
  HeartPulse,
  Award,
} from 'lucide-react';
import { CARD_TEMPLATES } from '../../data/templates';
import { CardTemplate } from '../../types/card';
import { CARD_TYPES } from '../../data/cardTypes';

interface TemplateSelectorProps {
  onSelectTemplate: (template: CardTemplate) => void;
  onBack: () => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All Templates' },
  { id: 'university', label: 'University & Academic' },
  { id: 'corporate', label: 'Corporate & Tech' },
  { id: 'vertical', label: 'Vertical & Lanyard' },
  { id: 'healthcare', label: 'Healthcare & Medical' },
  { id: 'membership', label: 'VIP & Membership' },
  { id: 'security', label: 'Security & Staff' },
  { id: 'events', label: 'Events & Conferences' },
  { id: 'minimal', label: 'Minimalist' },
];

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelectTemplate,
  onBack,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredTemplates = CARD_TEMPLATES.filter((t) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'vertical') {
      return t.defaultOrientation === 'vertical' || t.category === 'vertical';
    }
    return t.category === activeCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white border border-slate-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
              Pro Catalog
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
              Card Templates Gallery
            </h1>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((tmpl) => (
          <div
            key={tmpl.id}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all overflow-hidden flex flex-col justify-between group"
          >
            {/* Visual Card Banner Header */}
            <div
              className={`p-6 bg-gradient-to-r ${tmpl.previewGradient} text-white flex flex-col justify-between aspect-[1.7/1] relative overflow-hidden`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded border border-white/20">
                  {tmpl.category}
                </span>
                <span className="text-[10px] font-mono text-white/80">
                  {tmpl.defaultOrientation === 'horizontal' ? 'CR80 Landscape' : 'Lanyard Portrait'}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-extrabold font-heading text-white">{tmpl.name}</h3>
                <p className="text-xs text-white/80 line-clamp-1">{tmpl.description}</p>
              </div>
            </div>

            {/* Template Info & Action */}
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{tmpl.elementsFront.length} Default Elements</span>
                <span className="flex items-center gap-1 font-mono text-[11px] text-slate-600">
                  <span
                    style={{ backgroundColor: tmpl.accentColor }}
                    className="w-2.5 h-2.5 rounded-full inline-block"
                  />
                  Accent
                </span>
              </div>

              <button
                type="button"
                onClick={() => onSelectTemplate(tmpl)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Use This Template</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
